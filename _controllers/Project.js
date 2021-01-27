module.exports = Project

const fs = require('fs')

const FileDatabase = require("../_models/FileDatabase");
const FileDatabaseManager = require('../_models/FileDatabaseManager');
const Note = require('./note');



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
  this.uuid = this.db.getUUID()
  this.datetime = this.db.getCreated()
  this.name = this.db.getName()
  this.tags = this.db.getProjectTags()
  this.notes = this.loadNotes()
}

/**
 * Fetches global project tags from database
 */
Project.prototype.loadTags = function(){
  this.db.read()
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
  this.db.read()
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
  this.db.read()
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
 * 
 * @param {} note 
 */
Project.prototype.getTagByName = function(tag_name){
  return null
}

/**
 * 
 * @param {} note 
 */
Project.prototype.getTagByID = function(tag_id){
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
 * Fetch single note
 */
Project.prototype.searchNote = function(){

}

/**
 * Fetch all tags
 */
Project.prototype.getAllTags = function(){
  return this.tags
}

/**
 * Delete either single note or selection of notes
 */
Project.prototype.addTag = function(){

}

/**
 * Delete either single note or selection of notes
 */
Project.prototype.deleteTag = function(){

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