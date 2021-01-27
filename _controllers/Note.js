module.exports = Note

const FileDatabaseManager = require('../_models/FileDatabaseManager')

function Note(project, data = FileDatabaseManager.getEmptyNoteJSON()) 
{
  var self = this

  this.uuid = data.uuid
  this.created = data.created
  this.modified = data.modified
  this.tags = data.tags
  this.text = data.text
  this.associations = data.associations

  this.active = false
  this.new_tag_indices = []

  this.dirty_bit = false

  this.project = project
}


/* ======================================================= */ 
/*   Operations on note data                               */
/* ======================================================= */
Note.prototype.saveData = function(){
  // Either insert
  this.getDB().insertNote(this.getNoteJSON())
  // Or update existing..
}

Note.prototype.deleteNote = function(){
  return
}

Note.prototype.saveText = function(){
  this.getDB().read()
  // Persist to database
  this.getDB().updateNoteText(this.getNoteJSON())
  
}

/* ======================================================= */ 
/*   Operations on tags data                               */
/* ======================================================= */

/**
 * NOTE: Duplicates are blocked by the tag input.
 * @param {} tag_value 
 */
Note.prototype.addTag = function(tag_value){

  // Insert to database
  this.getDB().read()
  let tag = this.getDB().insertNoteTag(this.uuid, tag_value)
  // Add tag to tag array 
  this.tags.push(tag)

  // Reload project's tag list
  this.project.loadTags()
}


Note.prototype.removeTag = function(tag_value){
  
  this.getDB().read()
  // Find tag_id and index in tag list from tag_value
  let index = 0
  let tag_id = ""
  for(var i in this.tags){
    if(this.tags[i].name.localeCompare(tag_value) === 0){
      index = i
      tag_id = this.tags[i].uuid
    }
  }
  // Remove from database
  if(tag_id.length == 0){
    console.log("Tag ID can note be found in note object data")
  }
  this.getDB().removeNoteTag(this.uuid, tag_id)
  // Remove tag from tag array
  this.tags.splice(index, 1)
  // Reload project's tag list
  this.project.loadTags()
}

/**
 * 
 * NOTE: Duplicates are blocked by the tag input.
 * @param {*} new_val 
 * @param {*} pre_val 
 */
Note.prototype.updateTag = function(new_val, pre_val){

  this.getDB().read()
  // Insert new tag to database
  let tag = this.getDB().insertNoteTag(this.uuid, new_val)
  // Insert tag into tag list
  this.tags.push(tag)

  // Find tag_id and index in tag list from previous value
  let index = 0
  let pre_tag_id = ""
  for(var i in this.tags){
    if(this.tags[i].name.localeCompare(pre_val) === 0){
      index = i
      pre_tag_id = this.tags[i].uuid
    }
  }
  // Remove new tag to database 
  this.getDB().removeNoteTag(this.uuid, pre_tag_id)
  // Remove old tag from tags list
  this.tags.splice(index, 1)

  // Reload project's tag list
  this.project.loadTags()
}

/**
 * Get list of note tags
 */
Note.prototype.getTags = function(){
  return this.tags
}

/* ======================================================= */
/*  Other                                                  */
/* ======================================================= */

Note.prototype.getDB = function(){
  return this.project.db
}

Note.prototype.isActive = function(){
  return this.active
}

Note.prototype.activate = function(){
  this.active = true
}

Note.prototype.deactivate = function(){
  this.active = false
}

Note.prototype.isEmpty = function(){
  return (this.text.length > 0) ? false : true
}

Note.prototype.isDirty = function(){
  return this.dirty_bit
}

Note.prototype.setDirtyBit = function(val){
  if(val !== true && val !== false){
    console.error("Value for dirty_bit must be boolean")
    return
  }
  this.dirty_bit = val
}

/**
 * Compares this note to anohter note
 * 
 * @param {Note} note
 */
Note.prototype.compareTo = function(note){
  return ( JSON.stringify(this.getNoteJSON()).localeCompare( JSON.stringify(note.getNoteJSON()) ) === 0 )
}

/**
 * Returns date of creation
 * @param {function} callback 
 */
Note.prototype.getCreated = function(){
  return this.created
}

/**
 * Returns date of last modifcation
 * @param {function} callback 
 */
Note.prototype.getModified = function(){
  return this.modified
}


Note.prototype.getTags = function(){
  return this.tags
}

/**
 * Returns array of text split at \newlines
 * Removes carriage returns \r
 */
Note.prototype.splitTextAtNewline = function(){
  return this.text.replace(/\r/g, "").split(/\n/g)
}

/**
 * Returns array with indices of text lines 
 * (lines without text are removed)
 * 
 * Takes array of strings (text paragraphs)
 * 
 * @param {[String]} arr 
 */
Note.prototype.getParagraphIndices = function(arr){
  //let txt_lines = 0
  let indices = []
  // Skip empty lines and calculate the cursor index..
  for(var i in arr){
    if(arr[i].length > 0){
      indices.push(i)
    }

  }
  return indices
}

/**
 * Determines whether an update of the note thumbnail is necessary while 
 * editing text in the editor
 * 
 * Works on this.text
 * 
 * @param {int} selectionStart - Start of text selection
 * @param {int} selectionEnd - End of text selection
 */
Note.prototype.needThumbUpdate = function(selectionStart, selectionEnd){
  let arr = this.splitTextAtNewline()
  console.log(arr)
  if( selectionStart === selectionEnd ){
    if( arr.length === 1 && selectionStart <= 300 ){
      /**
       *  This is quite slow...
       *  I think I should maybe write into the dom element directly..
       *  Maybe create an instance method in NotesListView which can be
       *  called from App to write into the element
       */ 
      return [0]
    }else{
      if(arr.length >= 2){
        let indices = this.getParagraphIndices(arr)
        if(indices.length == 1){
          if(selectionStart <= arr[indices[0]].length){
            return [indices[0]]
          }
        }else if( indices.length >= 2 ){
          let distance = indices[1] - indices[0] - 1
          if( selectionStart <= (arr[indices[0]].length + arr[indices[1]].length + distance + 1)
            && selectionStart <= 300 ){
              return [indices[0], indices[1]]
          }else{
            return null 
          }
        }else{
          return null
        }
      }
    }
  }
  
}

/**
 * For thumbnail: Returns header (first sentence) of the text
 * 
 * NOTE: Analysed Apple Notes app 
 *  - The header shows up to the first 100 chars when first line is continuing further
 *     - The chars from 101 onwards are shown in text preview of thumbnail
 * - Exception is a new line sign which clearly separates the first line from second. 
 *   (Thus header from text body)
 * - In all cases the previews of header and text body are always only as long as the
 *   thumbnail.
 */
Note.prototype.getHeader = function(){
  let arr = this.splitTextAtNewline()
  let txt_is = this.getParagraphIndices(arr)
  if(txt_is.length >= 1){
    if(arr[txt_is[0]].length > 0){
      if(arr[txt_is[0]].length > 150){
        return arr[txt_is[0]].substr(0,150)
      }else{
        return arr[txt_is[0]]
      }
    } else{
      return "New Note"
    }
  }else{
    return "New Note"
  }
}

/**
 * For thumbnail: Returns preview of text truncated with "..."
 */
Note.prototype.getContentPreview = function(){
  let arr = this.splitTextAtNewline()
  let txt_is = this.getParagraphIndices(arr)
  if(txt_is.length >= 1){
    if(arr[txt_is[0]].length > 150){
      return arr[txt_is[0]].substr(151, arr[txt_is[0]].length - 1)
    }else{
      if(txt_is.length == 1){
        return "No additional text"
      }else{
        return arr[txt_is[1]]
      }
    }
  }else{
    return "No additional text"
  }
  //return (this.text.length > 0) ? this.text : "No additional text"
}

/**
 * Returns the complete content of the note
 */
Note.prototype.getContent = function(){
  return this.text
}

/**
 * Returns note as JSON object
 */
Note.prototype.getNoteJSON = function(){
  return { 
    uuid: this.uuid,
    created: this.created,
    modified: this.modified,
    tags: this.tags.map(function(t){ return t.uuid}), 
    text: this.text, 
    associations: this.associations
  }
}

