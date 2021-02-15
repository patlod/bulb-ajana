module.exports = Project

const fs = require('fs')

const FileDatabase = require("../_models/FileDatabase");
const FileDatabaseManager = require('../_models/FileDatabaseManager');
const Graph = require('./Graph');
const Note = require('./note');
const Vertex = require('./Vertex');
const Edge = require('./Edge')



/**
 * Class that represents a notes project.
 * - Objects can only be instantiated with a file at path
 * - Instantiated objects are empty. 
 *    - Data has to be loaded from the database explicitly
 */
function Project(path, session, data = FileDatabaseManager.getEmptyProjectJSON()) {
  /*if(typeof path !== String)
    return null;*/

  var self = this

  // Database interface object
  this.db = new FileDatabase(path)

  // Project data
  this.uuid =     data.uuid
  this.created =  data.created
  this.name = data.name
  this.tags = data.tags
  this.notes = data.notes
  //this.selected_notes = []

  this.active = false

  this.session = session

  this.graph_mode = false   // Default: Graph is off..
  this.graphs = data.graphs

  // Load data on creation
  this.loadData()
  
}

Project.prototype.printSessionProjects = function(){
  //console.log("Access session from project.")
  console.log(this.session.prjcts)
}

/**
 * Method that is called after initialisation to get data from
 * database.
 */
Project.prototype.loadData = function(){
  this.uuid = this.db.getProjectUUID()
  this.datetime = this.db.getProjectCreated()
  this.name = this.db.getProjectName()
  this.tags = this.db.getProjectTags()
  this.notes = this.loadNotes()
  this.graphs = this.loadGraphs()
  // console.log("Project grahps")
  // console.log(this.graphs)
}

/**
 * Fetches global project tags from database
 */
Project.prototype.loadTags = function(){
  //this.db.read()
  this.tags = this.db.getProjectTags()
}



/**
 * Method that is called after initialisation to get data from
 * database.
 */
Project.prototype.saveData = function(){

  // TODO

}

/**
 * Returns the currently active project
 */
Project.prototype.getActiveNote = function(){
  if(this.notes.length === 0) return null;
  for(var i in this.notes){
    if(this.notes[i].isActive()) return this.notes[i]
  }
}

/**
 * Activates the handed target note and deactivates the current active note.
 * 
 * Default: No target is handed, which just disactivates the active note.
 * 
 * @param {Note} target 
 */
Project.prototype.toggleActiveNote = function(target = null){
  if(this.notes.length === 0) return null;
  for(var i in this.notes){
    // Did not work with getActiveProject, probably because the return hands back a value..
    if(this.notes[i].isActive()) this.notes[i].deactivate()
  }
  if(target){
    target.activate()
    return target
  } // else no note will be activated
}

/**
 * Sets note at index in the notes array active
 */
Project.prototype.setActiveNoteAtIndex = function(index){
  return this.toggleActiveNote(this.notes[index])
}

/**
 * Resets active notes of project to 'NO ACTIVE NOTE'
 */
Project.prototype.resetActiveNote = function(){
  this.toggleActiveNote()
}

/**
 * Returns empty note without textual content
 * 
 * ATTENTION: This should only maximally find one empty note
 * if more are stored in project there are inconsistencies as 
 * empty notes should be deleted on regular basis..
 * 
 */
Project.prototype.getEmptyNotes = function(){
  let empties = []
  for(var i in this.notes){
    if(this.notes[i].isEmpty()){
      empties.push(this.notes[i])
    }
  }
  //console.log(empties)
  if(empties.length > 1){
    console.error("ERROR: More than one empty note in project")
    return null
  }
  return empties
}

/**
 * Returns the active graph of this project
 * 
 * NOTE: For now just returns the graph variable that is initialised with only one graph
 *       Later this might become a list with several active graphs similar as projects in sessions.
 */
Project.prototype.getActiveGraph = function(){
  if(this.graphs.length === 0) return null;
  for(var i in this.graphs){
    if(this.graphs[i].isActive()) return this.graphs[i]
  }
}

/**
 * TODO
 */
Project.prototype.toggleActiveGraph = function(target = null){
  if(this.graphs.length === 0) return null;
  for(var i in this.graphs){
    // Did not work with getActiveProject, probably because the return hands back a value..
    if(this.graphs[i].isActive()) this.graphs[i].deactivate()
  }
  if(target){
    target.activate()
    return target
  } // else no note will be activated
}

/**
 * Sets note at index in the notes array active
 */
Project.prototype.setActiveGraphAtIndex = function(index){
  return this.toggleActiveGraph(this.graphs[index])
}

/**
 * Resets active notes of project to 'NO ACTIVE NOTE'
 */
Project.prototype.resetActiveGraph = function(){
  this.toggleActiveGraph()
}

/**
 * Returns the graph of the project
 */
Project.prototype.getGraphMode = function(){
  return this.graph_mode
}

/**
 * Sets the graph of the project
 */
Project.prototype.setGraphMode = function(val){
  this.graph_mode = val
}

/**
 * Loads all the graphs. 
 * It is important that notes where loaded before to reference
 * the same objects!
 */
Project.prototype.loadGraphs = function(){
  var self = this

  // Get notes from database
  let g_query = this.db.selectAllGraphs()
  let graphs = []
  
  if(typeof g_query === "undefined"){
    // Graph table does not exist yet...
    self.db.makeGraphTable()
    graphs.push(new Graph(this))
    self.db.insertGraph(graphs[graphs.length - 1].getGraphJSON())
  }else if(g_query !== null && g_query.length === 0 && self.graphs.length === 0){ 
    // As long as multiple graphs is not possible..and graph is not existing
    // Create new empty graph instance
    graphs.push(new Graph(this))
    // Insert into database
    self.db.insertGraph(graphs[graphs.length - 1].getGraphJSON())
  }else{
    
    // TODO: Maybe check here whether loadNotes has been called already
    //       (algorithm works with references to existing Note objects)

    for(var i in g_query){
      // Create graph instance
      let g = new Graph(this, g_query[i])
      // Get vertices from graph
      let v_query = this.db.selectAllVertices(g_query[i].uuid)
      // Find the right note object that matches reference
      let vertices = [],
          n_obj = null,
          v = null;
      for(var j in v_query){
        n_obj = self.notes.filter(n => n.uuid === v_query[j].note)
        if(n_obj !== null && n_obj.length === 1){
          // Set references to Note instance
          v_query[j].note = n_obj[0]
          // Add to vertices
          v = new Vertex(g, v_query[j])
          vertices.push(v)
        }
      }
      
      // Get edges from graph
      let ed_query = this.db.selectAllEdges(g_query[i].uuid)
      // Find the right vertices that match references
      let edges = [],
        source_obj = null,
        target_obj = null,
        ed = null;
      for(var j in ed_query){
        // Match source and target vertex objects of the list created above
        source_obj = vertices.filter(v => v.uuid === ed_query[j].source)
        target_obj = vertices.filter(v => v.uuid === ed_query[j].target)
        if(source_obj !== null && target_obj !== null 
          && source_obj.length === 1 && target_obj.length === 1){
          // Set references to Note instances
          ed_query[j].source = source_obj[0]
          ed_query[j].target = target_obj[0]
          // Add to edges
          ed = new Edge(g, ed_query[j])
          edges.push(ed)
        }
      }

      // Update graph object and save in graphs list
      g.vertices = vertices
      g.edges = edges
      graphs.push(g)
    }
  }
  graphs.sort(descend_DateCreated)
  if(graphs.length > 0){
    graphs[0].activate()
  }
  return graphs
}

/**
 * Change project name
 * 
 * @param {string} name - Project name without .json file extension
 */
Project.prototype.renameProject = function(name){
  console.log("renameProject():")
  // Save name in project instance
  this.name = name + ".json"
  // Form paths
  let new_path = this.getDir() + this.name
  let old_path = this.getPath()
  // Delete FileDatabase instance on old path
  this.db = null
  // Rename file
  try{
    fs.renameSync(old_path, new_path)
  } catch(err) {
    console.error(err)
  }
  // Create FileDatabase instance on new path
  this.db = new FileDatabase(new_path)
  // Insert name into database
  this.db.updateDBName(this.name)
}

/**
 * Create new note
 */
Project.prototype.createNewNote = function(){
  // Create empty note instance
  let nn = new Note(this, FileDatabaseManager.getEmptyNoteJSON())
  // Store in fleeting storage
  this.notes.unshift(nn)
  // Write to database
  //this.db.insertNote(FileDatabaseManager.getEmptyNoteJSON())
  // Toggle active note 
  this.toggleActiveNote(nn)
  return nn
}

/**
 * Delete either single note or selection of notes
 * 
 *  @param {Note} note 
 */ 
Project.prototype.deleteNote = function(note){
  let note_ids = this.notes.map(function(n) { return n.uuid; })
  let idx = note_ids.indexOf(note.uuid);
  if(idx < 0 ){
    console.log("Project.deleteNote() -- Note with id " + note.uuid + " is not existing.")
    return
  }
  // Remove note from cache array at idx
  this.notes.splice(idx, 1)
  
  // Delete note from database file
  n_arr = []
  n_arr.push(note.getNoteJSON())
  this.db.deleteNotes(n_arr)

  // Toggle active note
  if( idx <= this.notes.length - 1 ){
    this.toggleActiveNote(this.notes[idx])
  }
  if( idx > (this.notes.length - 1 )){
    this.toggleActiveNote(this.notes[idx - 1])
  }
}

/**
 * Fetch all notes
 */
Project.prototype.loadNotes = function(){
  
  // Get notes from database
  let n_query = this.db.selectAllNotes()
  let notes = []
  var t_query = null
  for(var i in n_query){
    // First resolve references to tags
    t_query = this.db.getNoteTags(n_query[i].uuid)
    n_query[i].tags = t_query
    notes.push(new Note(this, n_query[i]))
  }
  notes.sort(descend_DateCreated)
  if(notes.length > 0){
    notes[0].activate()
  }
  return notes
}

/**
 * Returns all Note object of this project
 */
Project.prototype.getAllNotes = function(){
  return this.notes
}

/**
 * Returns note that matches the given UUID string
 * 
 * @param {String} note_id 
 */
Project.prototype.getNoteByUUID = function(note_id){
  var self = this
  
  let chks = self.notes.filter(function(n){ return n.uuid.localeCompare(note_id) === 0})
  if(chks.length === 1){
    return chks[0]
  }
  return null
}

/**
 * 
 * @param {} note 
 */
Project.prototype.getTagByName = function(tag_name){
  return null
}

/**
 * Returns tag that matches the given UUID string
 * @param {} tag_id 
 */
Project.prototype.getTagByUUID = function(tag_id){
  var self = this
  let chks = self.tags.filter(function(t){ t => t.uuid === note_id})
  if(chks.length === 1){
    return chks[0]
  }
  return null
}

/**
 * Adds note to selected notes
 * 
 * Used with cmd+click
 */
Project.prototype.selectNote = function(note){
  return this.selected_notes.push(note)
}

/**
 * Fetch all tags
 */
Project.prototype.getAllTags = function(){
  return this.tags
}

Project.prototype.searchAllNotes = function(needle){
  let results = [],
      cur = null;
  for(var i in this.notes){
    cur = this.notes[i].searchNoteText(needle);
    if(cur.length > 0){
      results.push({
        note: this.notes[i], 
        result: cur
      })
    }
  }
  return results;
}


/**
 * ====== Helper functions =====================================
 */

Project.prototype.getPath = function(){
  return this.db.path
}

Project.prototype.setPath = function(path){
  this.db.path = path
}

Project.prototype.getDir = function(){
  return this.db.path.substring(0,this.db.path.lastIndexOf("/")+1);
}

/**
 * Checks whether file with dupilcate filename exists in same directory.
 * @param {string} fn 
 */
Project.prototype.validFileName = function(fn){
  let path = this.getDir() + fn
  try {
    if (fs.existsSync(path)) {
      return false
    }else{
      return true
    }
  } catch(err) {
    console.error(err)
  }
}

Project.prototype.getName = function(){
  var path_split = this.db.getPath().split('/')
  var file_name_split = path_split[path_split.length - 1].split('.')
  return file_name_split[0]
}

Project.prototype.setName = function(name){
  
}

Project.prototype.countNotes = function(){
  return this.notes.length
}

Project.prototype.isActive = function(){
  return this.active
}

Project.prototype.activate = function(){
  return this.active = true
}

Project.prototype.deactivate = function(){
  return this.active = false
}

/* ============================================================= */
/* Compare functions for the sort function                       */
/* ============================================================= */

/**
 * Note compare function ascending by creation date
 * @param {Note} a 
 * @param {Note} b 
 */
function ascend_DateCreated(a,b){
  // Turn strings into dates, and then subtract them
  // to get a value that is either negative, positive, or zero.
  return new Date(a.created) - new Date(b.created);
}

/**
 * Note compare function ascending by modified date
 * @param {Note} a 
 * @param {Note} b 
 */
function ascend_DateModified(a,b){
  return new Date(a.modified) - new Date(b.modified);
}

/**
 * Note compare function descending by creation date
 * @param {Note} a 
 * @param {Note} b 
 */
function descend_DateCreated(a,b){
  // Turn strings into dates, and then subtract them
  // to get a value that is either negative, positive, or zero.
  return new Date(b.created) - new Date(a.created);
}

/**
 * Note compare function descending by modified date
 * @param {Note} a 
 * @param {Note} b 
 */
function descend_DateModified(a,b){
  return new Date(b.modified) - new Date(a.modified);
}

/**
 * =============================================================
 */