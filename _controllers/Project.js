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

  var self = this;

  // Database interface object
  this.db = new FileDatabase(path);

  this.DELTA_DAYS_GARBAGE_DISPOSAL = 30;

  // Project data
  this.uuid     = data.uuid;
  this.created  = data.created;
  this.name     = data.name;
  this.tags     = data.tags;
  this.notes    = data.notes;

  this.active = false;

  this.session = session;

  this.search = null;

  this.graph_mode = false;   // Default: Graph is off..
  this.graphs = data.graphs;

  this.item_selection = null;

  // Load data on creation
  this.loadData();
  
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
  console.log("loadData");
  console.log(this.item_selection);
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

Project.prototype.activateNote = function(note){
  note.activate();
  // In case no selection exists set one with the current note
  if(!this.item_selection || this.item_selection.object !== Note){
    this.startSelectionWith(note);
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
    if(this.notes[i].isActive()) this.notes[i].deactivate()
  }
  if(target){
    this.activateNote(target);
    return target
  }else{  // else no note will be activated
    if(this.item_selection){
      this.item_selection = null;
    }
  }
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
 * Returns empty graph without vertices
 * 
 * ATTENTION: This should only maximally find one empty graph
 * if more are stored in project there are inconsistencies as 
 * empty graphs should be deleted on regular basis..
 * 
 */
Project.prototype.getEmptyGraphs = function(){
  let empties = []
  for(var i in this.graphs){
    if(this.graphs[i].isEmpty()){
      empties.push(this.graphs[i])
    }
  }
  //console.log(empties)
  if(empties.length > 1){
    console.error("ERROR: More than one empty graph in project")
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

Project.prototype.activateGraph = function(graph){
  graph.activate();
  // In case no selection exists set one with the current note
  if(!this.item_selection || this.item_selection.object !== Graph){
    this.startSelectionWith(graph);
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
    this.activateGraph(target);
    return target;
  }else{  // else no graph will be activated
    if(this.item_selection){
      this.item_selection = null;
    }
  }
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
    this.activateGraph(graphs[0]);
  }
  return graphs
}

Project.prototype.getGraphByIndex = function(index){
  return this.graphs[index];
}

Project.prototype.getAllGraphs = function(){
  return this.graphs;
}

/**
 * Create new graph
 */
Project.prototype.createNewGraph = function(){
  // Create empty note instance
  let nG = new Graph(this, FileDatabaseManager.getEmptyGraphJSON())
  // Store in fleeting storage
  this.graphs.unshift(nG)
  // Write to database
  //this.db.insertNote(FileDatabaseManager.getEmptyNoteJSON())
  // Toggle active note 
  this.toggleActiveGraph(nG)
  return nG
}

/**
 * Delete either single note or selection of notes
 * 
 *  @param {Graph} graph 
 */ 
Project.prototype.deleteGraph = function(graph){
  let graph_ids = this.graphs.map(function(g) { return g.uuid; })
  let idx = graph_ids.indexOf(graph.uuid);
  if(idx < 0 ){
    console.log("Project.deleteGraph() -- Graph with id " + graph.uuid + " is not existing.")
    return
  }
  // Remove note from cache array at idx
  this.graphs.splice(idx, 1)
  
  // Delete note from database file
  g_arr = []
  g_arr.push(graph.getGraphJSON())
  this.db.deleteGraphs(g_arr)

  // Toggle active note
  if( idx <= this.graphs.length - 1 ){
    this.toggleActiveGraph(this.graphs[idx])
  }
  if( idx > (this.graphs.length - 1 )){
    this.toggleActiveGraph(this.graphs[idx - 1])
  }
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
  this.startSelectionWith(nn);
  return nn
}

/**
 * Delete either single note
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
  // Remove note from instance array at idx
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
    this.activateNote(notes[0]);
  }
  return notes
}

/**
 * 
 */
Project.prototype.prepNoteForTrans = function(note){
  if(note && note.isDirty()){
    note.saveText()
    note.setDirtyBit(false)
    console.log("App - prepProjectForTrans - Writing text to database.")
  }
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

Project.prototype.getNoteByIndex = function(index){
  return this.notes[index];
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


/* ================================================================= */
/* Search functions in project domain                                */
/*                                                                   */
/* ================================================================= */

/**
 * Searches all notes of the project for given string parameter.
 * 
 * Returns an array of objects containing the note which the string was found in
 * and array of the indices in the text where the string could be found.
 * 
 * Format: [ {note: {Note}, results: [{int}, {int},...]}, ... ]
 * 
 * @param {String} needle -- The string to be searched for
 */
Project.prototype.searchAllNotesTexts = function(needle){
  let results = [],
      cur = null;
  for(var i in this.notes){
    cur = this.notes[i].searchNoteText(needle);
    if(cur.length > 0){
      results.push({
        note: this.notes[i], 
        results: cur
      })
    }
  }
  return results;
}

Project.prototype.searchAllNotesTextsAndTags = function(needle){
  let results = [],
      cur_txt_pins = null, cur_tags_pins = null;
  for(var i in this.notes){
    cur_txt_pins = this.notes[i].searchNoteText(needle);
    cur_tags_pins = this.notes[i].searchNoteTags(needle);
    if(cur_txt_pins.length > 0){
      results.push({
        note: this.notes[i], 
        results: cur_txt_pins,
        tags: cur_tags_pins
      })
    }else{
      if(cur_tags_pins.length > 0){
        results.push({
          note: this.notes[i],
          results: cur_txt_pins,
          tags: cur_tags_pins
        })
      }
    }
  }
  return results;
}


/* ================================================================= */
/* Selection functions                                               */
/*                                                                   */
/* ================================================================= */

/**
 * Starts a new item selection with either Note or Graph objects.
 * 
 * NOTE: Does regard whether search is active and accordingly initialises 
 *       shadows array of the search result array. 
 * 
 * @param {Note | Graph} item 
 */
Project.prototype.startSelectionWith = function(item){
  var self = this;
  if(item instanceof Note){
    self.item_selection = {
      object: Note,
      select_pointer: (self.search) ? self.search.notes.map(function(x){ return x.note }).indexOf(item) : self.notes.indexOf(item),
      anchor: (self.search) ? self.search.notes.map(function(x){ return x.note }).indexOf(item) : self.notes.indexOf(item),
      shadows: (self.search) 
            ? self.search.notes.map(function(x){ 
              return x.note 
            })
            .map(function(x){
              if(x === item){
                return true;
              }else{
                return false;
              }
            })
            : self.notes.map(function(x){
              if(x === item){
                return true;
              }else{
                return false;
              }
            })
    }
  }else{
    // TODO: Analogue to notes support the search.
    if(item instanceof Graph){
      self.item_selection = {
        object: Graph,
        select_pointer: self.graphs.indexOf(item),
        anchor: self.graphs.indexOf(item),
        shadows: self.graphs.map(function(x){
          if(x === item){
            return true;
          }else{
            return false;
          }
        })
      }
    }
  }
}

/**
 * Returns the current item selection
 */
Project.prototype.getItemSelection = function(){
  return this.item_selection;
}

Project.prototype.getSelectedNotes = function(){
  var self = this;
  if(!this.item_selection){return;}
  if(this.item_selection.object !== Note){ return; }

  return this.notes.filter(function(n, idx){
    return self.item_selection.shadows[idx];
  });
}
Project.prototype.getSelectedGraphs = function(){
  var self = this;
  if(!this.item_selection){return;}
  if(this.item_selection.object !== Graph){ return; }

  return self.graphs.filter(function(g, idx){
    return self.item_selection.shadows[idx];
  });
}
Project.prototype.getItemsFromSelection = function(){
  if(!this.item_selection){ 
    console.log("No items selected.");
    return;
  }

  switch(this.item_selection.object){
    case Note:
      this.getSelectedNotes();
      break;
    case Graph: 
      this.getSelectedGraphs();
      break;
  }
}

Project.prototype.deleteSelectedNotes = function(){
  var self = this;
  if(!this.item_selection){return;}
  if(this.item_selection.object !== Note){ return; }

  let i, j,
      tbDel_Objs = this.getSelectedNotes(),
      tbDel_JSONs = tbDel_Objs.map(function(n){
        return n.getNoteJSON();
      });

  this.db.deleteNotes(tbDel_JSONs);

  // Delete notes from instance array at idx
  for(i in tbDel_Objs){
    this.notes.splice(this.notes.indexOf(tbDel_Objs[i]), 1);
  }

  // Delete notes from all of the graphs
  for(i in tbDel_Objs){
    for(j in this.graphs){
      this.graphs[j].deleteVerticesForNote(tbDel_Objs[i]);
    }
  }

  // Toggle the active note & Reset item selection
  this.item_selection = null;
  this.setActiveNoteAtIndex(0);
}

Project.prototype.deleteSelectedGraphs = function(){
  if(!this.item_selection){return;}
  if(this.item_selection.object !== Graph){ return; }

  let tbDel = this.getSelectedGraphs();
}
Project.prototype.deleteSelectedItems = function(){
  if(!this.item_selection){ 
    console.log("No items selected.");
    return;
  }

  switch(this.item_selection.object){
    case Note:
      this.deleteSelectedNotes();
      break;
    case Graph: 
      this.deleteSelectedGraphs();
      break;
  }
}
/**
 * Sets the item closest to the list head as active instance (Note or Graph).
 */
Project.prototype.activateSelectionHead = function(){
  if(!this.item_selection){ return; }
  let i = 0;
  switch(this.item_selection.object){
    case Note:
      while(i < this.item_selection.shadows.length){
        if(this.item_selection.shadows[i]){
          break;
        }
        i++;
      }
      if(this.notes.indexOf(this.getActiveNote()) !== i){
        this.toggleActiveNote(this.notes[i]);
      }
      break;

    case Graph:
      while(i < this.item_selection.shadows.length){
        if(this.item_selection.shadows[i]){
          break;
        }
        i++;
      }
      if(this.graphs.indexOf(this.getActiveGraph()) !== i){
        this.toggleActiveGraph(this.graphs[i]);
      }
      break;
  }
}
/**
 * Removes an item at given index from selection
 * 
 * @param {int} target_idx 
 */
Project.prototype.unselectItemInSelection = function(target_idx){
  if(target_idx === undefined){
    console.error("Error: No parameter given.");
    return;
  }
  console.log("Project: unselectItemInSelection");
  // Always unselect the item
  this.item_selection.shadows[target_idx] = false;

  // In the case select_pointer or anchor are affected
  if(target_idx >= 1 && this.item_selection.shadows[target_idx - 1] 
    && target_idx <= this.item_selection.shadows.length - 2 && this.item_selection.shadows[target_idx + 1]){
    // Selected direct neibhors in both directions:
    // Move the anchor towards the half where the select_pointer pointer is placed
    if(this.item_selection.anchor > target_idx){
      this.item_selection.anchor = target_idx - 1;
    }else{
      if(this.item_selection.anchor < target_idx){
        this.item_selection.anchor = target_idx + 1;
      }
    }

  }else if(target_idx >= 1 && this.item_selection.shadows[target_idx - 1] ){
    // Selected direct neighbors in towards head
    if(this.item_selection.anchor === target_idx){
      // Set the anchor to the bordering element
      this.item_selection.anchor = (target_idx - 1);
    }else{
      if(this.item_selection.select_pointer === target_idx){
        // Move the select_pointer to the bordering element
        this.item_selection.select_pointer = (target_idx - 1);
      }
    }

  }else if(target_idx <= this.item_selection.shadows.length - 2 && this.item_selection.shadows[target_idx + 1]){
    // Selected direct neighbors in towards tail
    if(this.item_selection.anchor === target_idx){
      // Set the anchor to the bordering element
      this.item_selection.anchor = (target_idx + 1);
    }else{
      if(this.item_selection.select_pointer === target_idx){
        // Move the select_pointer to the bordering
        this.item_selection.select_pointer = (target_idx + 1);
      }
    }
  }else{
    // No direct neighbors selected
    // In case the element was not the anchor nothing has to be adjusted
    if(this.item_selection.anchor !== target_idx){ return; }

    // Set the references to remaining block closest to the tail of the list
    i = this.item_selection.shadows.length - 1;
    while(i >= 0 && !this.item_selection.shadows[i]){
      i--;
    }
    this.item_selection.select_pointer = i;
    while(i >= 0 && this.item_selection.shadows[i]){
      i--;
    }
    this.item_selection.anchor = i + 1;
  }
}
/**
 * Adds an item at given index to selection
 * 
 * @param {int} target_idx 
 */
Project.prototype.selectItemInSelection = function(target_idx){
  if(target_idx === undefined){
    console.error("Error: No parameter given.");
    return;
  }
  console.log("Project: selectItemInSelection");
  // Always select the target item 
  this.item_selection.shadows[target_idx] = true;

  if(target_idx >= 1 && this.item_selection.shadows[target_idx - 1] 
    && target_idx <= this.item_selection.shadows.length - 2 && this.item_selection.shadows[target_idx + 1]){
    // Direct neibhors selected towards head & tail:
    // Move the anchor towards the half where the select_pointer pointer is placed, select_pointer stays.
    if(this.item_selection.select_pointer > target_idx && this.item_selection.anchor < target_idx){
      this.item_selection.anchor = target_idx + 1;
    }else{
      if(this.item_selection.select_pointer < target_idx && this.item_selection.anchor > target_idx){
        this.item_selection.anchor = target_idx - 1;
      } 
    }

  }else if(target_idx >= 1 && this.item_selection.shadows[target_idx - 1] ){
    // Direct neighbors selected towards head:
    // Set pointer on target element 
    this.item_selection.select_pointer = target_idx;
    // Set anchor on the element that is the furthest away in that direction i.e. inc/dec the index as long as elements are selected
    i = target_idx;
    while(i >= 0 && this.item_selection.shadows[i]){
      --i;
    }
    this.item_selection.anchor = i + 1;
  }else if(target_idx <= this.item_selection.shadows.length - 2 && this.item_selection.shadows[target_idx + 1]){
    // Direct neighbors selected towards tail:
    // Set pointer on target element
    this.item_selection.select_pointer = target_idx;
    // Set the anchor on the element // that is the furthest away in that direction i.e. inc/dec the index as long as elements are selected
    i = target_idx;
    while(i <= this.item_selection.shadows.length - 1 && this.item_selection.shadows[i]){
      ++i;
    }
    this.item_selection.anchor = i - 1;
  }else{
    // No direct neighbors selected:
    // Set the pointer and the anchor to target
    this.item_selection.select_pointer = target_idx;
    this.item_selection.anchor = target_idx;
  }
}

/**
 * Toggles a given note in the current selection.
 * - Either: selected to unselected
 * - Or: unselected to selected
 * @param {Note} note 
 */
Project.prototype.toggleNoteInSelection = function(note){
  if(!note){
    console.error("Error: No parameter given.");
    return;
  }

  console.log("Project: toggleNoteInSelection");
  let count, i,
      target_idx = this.notes.indexOf(note);

  // UNSELECT
  if(this.item_selection.shadows[target_idx]){
    count = this.item_selection.shadows.filter(function(x){ return x }).length
    // Unset, only if it is not the last one selected
    if(count > 1){ 
      this.unselectItemInSelection(target_idx);
    }
    // If this note is the active note make next one
  // SELECT
  }else{
    this.selectItemInSelection(target_idx);

    // If this note is closer to head then active note make this note active
  }
}
Project.prototype.toggleGraphInSelection = function(graph){
  // TODO: Analog to notes
}
/**
 * Called to select or unselect an item in the item list.
 * Used for Cmd+Click on list items.
 * 
 * TODO: Refactor name and maybe move 'select' and 'unselected' blocks into 
 *       two separate methods.
 * 
 * @param {Note | Graph} item 
 */
Project.prototype.toggleItemInSelection = function(item){
  if(!item){
    console.error("Error: No parameter given.");
    return;
  }

  if(!this.item_selection){ // Something must be wrong if an active item exists a selection must exist too.
    console.error("Project has no item selection object");
    return; 
  } 
  if(this.item_selection.object === Note && item instanceof Graph ){ return; }
  if(this.item_selection.object === Graph && item instanceof Note ){ return; }

  switch(this.item_selection.object){
    case Note:
      this.toggleNoteInSelection(item);
      break;
    case Graph:
      this.toggleGraphInSelection(item);
      break;
  }
  
}


Project.prototype.shiftExpandNoteSelection = function(note){
  if(!note){
    console.error("Error: No parameter given.");
    return;
  }

  console.log("Project: shiftExpandNoteSelection");
  // Get the index of the target
  var i,
  target_idx = this.notes.indexOf(note);

  if(target_idx > this.item_selection.anchor){
    console.log("target_idx > this.item_selection.anchor");
    // Select from anchor to target
    for(i = this.item_selection.anchor; i <= target_idx; i++){
      this.item_selection.shadows[i] = true;
    }
    // Adjust the select_pointer
    this.item_selection.select_pointer = target_idx;

    if(this.item_selection.select_pointer < this.item_selection.anchor){
      // Unselect from anchor - 1 to select_pointer
      for(i = this.item_selection.anchor - 1; i >= this.item_selection.select_pointer; i--){
        this.item_selection.shadows[i] = false;
      }
    }else{
      if(target_idx < this.item_selection.select_pointer){
        // Unselect from target_idx + 1 to select_pointer
        for(i = target_idx + 1; i <= this.item_selection.select_pointer; i++){
          this.item_selection.shadows[i] = false;
        }
      }else{
        // Check for direct neighbors fo the target
        // if yes, pointer moves further to tail as long as there are direct neighbors selected
        // else select_pointer to target_idx
        i = target_idx + 1;
        while(i <= this.item_selection.shadows.length - 1 && this.item_selection.shadows[i]){
          i++;
        }
        this.item_selection.select_pointer = i - 1;
      }
    }

  }else if(target_idx < this.item_selection.anchor){
    console.log("target_idx < this.item_selection.anchor");
    // Select from anchor to target
    for(i = this.item_selection.anchor; i >= target_idx; i--){
      this.item_selection.shadows[i] = true;
    }
    // Adjust the select_pointer
    if(this.item_selection.select_pointer > this.item_selection.anchor){
      // Unselect from anchor + 1 to select_pointer
      for(i = this.item_selection.anchor + 1; i <= this.item_selection.select_pointer; i++){
        this.item_selection.shadows[i] = false;
      }
    }else{
      if(target_idx > this.item_selection.select_pointer){
        // Unselect from target_idx - 1 to select_pointer
        for(i = target_idx - 1; i >= this.item_selection.select_pointer; i--){
          this.item_selection.shadows[i] = false;
        }
      }else{
        // Check for direct neighbors of the target
        // if yes, pointer moves further towards head as long as there are direct neighbors selected
        // else select_pointer to target_idx
        i = target_idx - 1;
        while(i >= 0 && this.item_selection.shadows[i]){
          i++;
        }
        this.item_selection.select_pointer = i + 1;
      }
    }
  }else{ // target_idx == anchor
    // Unselect all elements between anchor and select_pointer
    if(this.item_selection.select_pointer > this.item_selection.anchor){
      // Unselect from anchor + 1 to select_pointer
      for(i = this.item_selection.anchor + 1; i <= this.item_selection.select_pointer; i++){
        this.item_selection.shadows[i] = false;
      }
    }else{
      for(i = this.item_selection.anchor - 1; i >= this.item_selection.select_pointer; i--){
        this.item_selection.shadows[i] = false;
      }
    }
    this.item_selection.anchor = target_idx;
    this.item_selection.select_pointer = target_idx;
  }
  
}
Project.prototype.shiftExpandGraphSelection = function(graph){
  // TODO: Analog to notes
}
/**
 * Called to select or unselect several items in the item list.
 * Used for Shift+Click on list items.
 * 
 * TODO: Maybe refactor name
 * 
 * @param {Note | Graph} item 
 */
Project.prototype.shiftExpandItemSelection = function(item){
  if(!item){
    console.error("Error: No parameter given.");
    return;
  }

  console.log("Project: shiftExpandItemSelection");
  switch(this.item_selection.object){
    case Note:
      this.shiftExpandNoteSelection(item);
      break;
    case Graph:
      this.shiftExpandGraphSelection(item);
      break;
  }
}

/**
 * Called to expand an existing selection block into directions towards list head.
 * Used for Shift+ArrowUp command.
 */
Project.prototype.singleShiftSelectTowardsHead = function(){
  console.log("Project.js => expandSelectionToHead");
  if(!this.item_selection){ return; }
  if(this.item_selection.select_pointer === 0){ return; }

  if(this.item_selection.select_pointer < this.item_selection.anchor){
    // Swallow Selected && Select Unselected
    --this.item_selection.select_pointer;
    while(this.item_selection.select_pointer !== 0 && this.item_selection.shadows[this.item_selection.select_pointer]){
      this.item_selection.select_pointer--;
    }
    this.item_selection.shadows[this.item_selection.select_pointer] = true; 
  }else if(this.item_selection.select_pointer > this.item_selection.anchor){
    // Unselect the selected
    if(this.item_selection.shadows[this.item_selection.select_pointer]){
      this.item_selection.shadows[this.item_selection.select_pointer] = false;
      this.item_selection.select_pointer--;
    }
  }else{
    // Select unselected
    --this.item_selection.select_pointer;
    while(this.item_selection.select_pointer !== 0 && this.item_selection.shadows[this.item_selection.select_pointer]){
      this.item_selection.select_pointer--;
    }
    this.item_selection.shadows[this.item_selection.select_pointer] = true;
  }
  console.log(this.item_selection);
}

/**
 * Called to expand an existing selection block into directions towards list tail.
 * Used for Shift+ArrowDown command.
 */
Project.prototype.singleShiftSelectTowardsTail = function(){
  console.log("Project.js => expandSelectionToTail");
  if(!this.item_selection){ return; }
  if(this.item_selection.select_pointer >= this.item_selection.shadows.length - 1){ return; }

  if(this.item_selection.select_pointer < this.item_selection.anchor){
    // Unselect the selected
    if(this.item_selection.shadows[this.item_selection.select_pointer]){
      this.item_selection.shadows[this.item_selection.select_pointer] = false;
      this.item_selection.select_pointer++;
    }
  }else if(this.item_selection.select_pointer > this.item_selection.anchor){
     // Swallow Selected && Select Unselected 
    ++this.item_selection.select_pointer;
    while(this.item_selection.select_pointer !== (this.item_selection.shadows.length - 1) 
    && this.item_selection.shadows[this.item_selection.select_pointer]){
      this.item_selection.select_pointer++;
    }
    this.item_selection.shadows[this.item_selection.select_pointer] = true;
  }else{
    // Select unselected
    ++this.item_selection.select_pointer;
    this.item_selection.shadows[this.item_selection.select_pointer] = true;
  }
  console.log(this.item_selection);
}



/* ================================================================= */
/* Trash functions                                                   */
/*                                                                   */
/* What do we do as sincere and orderly citizens?                    */
/* Exactly...we bring out the trash on a regular basis               */
/* and keep our heads low..                                          */
/* ================================================================= */

/**
 * 
 * Empties the trash (notes & graphs) which have been recently deleted.
 * (Permanent Deletion)
 * 
 * NOTE: The word "recently" here is defined by the INTERVAL_GARBAGE_DISPOSAL
 * variable which compares whether notes are older than INTERVAL_GARBAGE_DISPOSAL time 
 * from now and deletes them.
 * 
 * Default is 30 days.
 * 
 */
Project.prototype.garbageDisposal = function(){
  // Empty notes trash
  this.db.emptyNotesTrash(this.DELTA_DAYS_GARBAGE_DISPOSAL);
  // Empty graph trash
  this.db.emptyGraphsTrash(this.DELTA_DAYS_GARBAGE_DISPOSAL);
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