module.exports = Note

const FileDatabaseManager = require('../_models/FileDatabaseManager');
const StringFormatter = require('../_util/StringFormatter');

function Note(project, data = FileDatabaseManager.getEmptyNoteJSON()) 
{
  var self = this;

  this.uuid = data.uuid;
  this.created = data.created;
  this.modified = data.modified;
  this.tags = data.tags;
  this.text = data.text;
  this.bg_color = data.bg_color;
  this.associations = data.associations;

  this.active = false;
  this.new_tag_indices = [];

  this.dirty_bit = false;

  this.project = project;
}


/* ======================================================= */ 
/*   Operations on note data                               */
/* ======================================================= */
Note.prototype.saveData = function(){
  // Either insert
  this.getDB().insertNote(this.getNoteJSON());
  // Or update existing..
}

Note.prototype.saveText = function(){
  // Persist to database
  this.getDB().updateNoteText(this.getNoteJSON());
  
}

/* ======================================================= */ 
/*   Operations on tags data                               */
/* ======================================================= */

/**
 * NOTE: Duplicates are blocked by the tag input.
 * @param {string} tag_value 
 */
Note.prototype.addTag = function(tag_value){
  // Insert to database
  let tag = this.getDB().insertNoteTag(this.uuid, tag_value);
  // Add tag to tag array 
  this.tags.push(tag);

  // Reload project's tag list
  this.project.loadTags();
}

/**
 * Removes tag from tag list in this object.
 * 
 * @param {string} tag_value 
 */
Note.prototype.removeTag = function(tag_value){
  // Find tag_id and index in tag list from tag_value
  let index = 0;
  let tag_id = "";
  for(var i in this.tags){
    if(this.tags[i].name.localeCompare(tag_value) === 0){
      index = i;
      tag_id = this.tags[i].uuid;
    }
  }
  // Remove from database
  if(tag_id.length === 0){
    console.log("Tag ID can note be found in note object data");
  }
  this.getDB().removeNoteTag(this.uuid, tag_id)
  // Remove tag from tag array
  this.tags.splice(index, 1);
  // Reload project's tag list
  this.project.loadTags();
}

/**
 * 
 * NOTE: Duplicates are blocked by the tag input.
 * @param {string} new_val 
 * @param {string} pre_val 
 */
Note.prototype.updateTag = function(new_val, pre_val){
  // Insert new tag to database
  let tag = this.getDB().insertNoteTag(this.uuid, new_val);
  // Insert tag into tag list
  this.tags.push(tag);

  // Find tag_id and index in tag list from previous value
  let index = 0;
  let pre_tag_id = "";
  for(var i in this.tags){
    if(this.tags[i].name.localeCompare(pre_val) === 0){
      index = i;
      pre_tag_id = this.tags[i].uuid;
    }
  }
  // Remove new tag to database 
  this.getDB().removeNoteTag(this.uuid, pre_tag_id);
  // Remove old tag from tags list
  this.tags.splice(index, 1);

  // Reload project's tag list
  this.project.loadTags();
}

/**
 * Get list of note tags
 */
Note.prototype.getTags = function(){
  return this.tags;
}

/**
 * Searches the note text for a specific string and returns an array with indices
 * of the needles in the haystack.
 * 
 * NOTE: Search settings are not implemented. So for now the search will be:
 *    - ignoring case
 *    - wrap around
 *    - "contains" i.e. no matter where in the word.
 * 
 * @param {String} str -- The string to be searched for in the text
 */
Note.prototype.searchNoteText = function(needle){
  return StringFormatter.getIndicesOf(needle, this.text, false);
}

/**
 * Checks whether note tags contain needle string.
 * 
 * Returns array of matching tag objects.
 * 
 * @param {*} needle 
 */
Note.prototype.searchNoteTags = function(needle){
  return this.tags.filter(function(t){ 
    return t.name.toLowerCase() === needle.toLowerCase();
  });
}


/* ======================================================= */
/*  Other                                                  */
/* ======================================================= */

Note.prototype.getDB = function(){
  return this.project.db;
}

Note.prototype.isActive = function(){
  return this.active;
}

Note.prototype.activate = function(){
  this.active = true;
}

Note.prototype.deactivate = function(){
  this.active = false;
}

Note.prototype.isEmpty = function(){
  return (this.text.length > 0) ? false : true;
}

Note.prototype.isDirty = function(){
  return this.dirty_bit;
}

Note.prototype.setDirtyBit = function(val){
  if(val !== true && val !== false){
    console.error("Value for dirty_bit must be boolean");
    return;
  }
  this.dirty_bit = val;
}

/**
 * Compares this note to another note. 
 * 
 * NOTE: This is shallow compare solely content based. Where as deep compare would
 *       compare whether it is same instance..
 * 
 * @param {Note} note
 */
Note.prototype.compareTo = function(note){
  return ( JSON.stringify(this.getNoteJSON()).localeCompare( JSON.stringify(note.getNoteJSON()) ) === 0 );
}

/**
 * Returns date of creation
 * @param {function} callback 
 */
Note.prototype.getCreated = function(){
  return this.created;
}

/**
 * Returns date of last modifcation
 * @param {function} callback 
 */
Note.prototype.getModified = function(){
  return this.modified;
}


Note.prototype.getTags = function(){
  return this.tags;
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
  let arr = StringFormatter.splitAtNewLine(this.text)
  if( selectionStart === selectionEnd ){
    if( arr.length === 1 && selectionStart <= 300 ){
      /**
       *  This is quite slow...
       *  I think I should maybe write into the dom element directly..
       *  Maybe create an instance method in NotesListView which can be
       *  called from App to write into the element
       */ 
      return true; // [0]
    }else{
      if(arr.length >= 2){
        let indices = StringFormatter.getParagraphIndices(arr)
        if(indices.length === 1){
          if(selectionStart >= indices[0] && selectionStart <= indices[0] + 300/*arr[indices[0]].length*/){
            return true; // [indices[0]]
          }
        }else if( indices.length >= 2 ){
          //let distance = indices[1] - indices[0]
          if( (selectionStart >= indices[0] && selectionStart <= indices[0] + 300 )
            || (selectionStart >= indices[1] && selectionStart <= indices[1] + 300) ) {   // arr[indices[0]].length + arr[indices[1]].length + distance
              return true; //[indices[0], indices[1]]
          }else{
            return false; 
          }
        }else{
          if(selectionStart === arr.length-1)
          return true;
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
  let arr = StringFormatter.splitAtNewLine(this.text);
  let txt_is = StringFormatter.getParagraphIndices(arr);
  if(txt_is.length >= 1){
    if(arr[txt_is[0]].length > 0){
      if(arr[txt_is[0]].length > 150){
        return arr[txt_is[0]].substr(0,150);
      }else{
        return arr[txt_is[0]];
      }
    } else{
      return "New Note";
    }
  }else{
    return "New Note";
  }
}

/**
 * For thumbnail: Returns preview of text truncated with "..."
 */
Note.prototype.getContentPreview = function(){
  let arr = StringFormatter.splitAtNewLine(this.text);
  let txt_is = StringFormatter.getParagraphIndices(arr);
  if(txt_is.length >= 1){
    if(arr[txt_is[0]].length > 150){
      return arr[txt_is[0]].substr(151, arr[txt_is[0]].length - 1);
    }else{
      if(txt_is.length == 1){
        return "No additional text";
      }else{
        return arr[txt_is[1]];
      }
    }
  }else{
    return "No additional text";
  }
  //return (this.text.length > 0) ? this.text : "No additional text"
}

/**
 * Returns the complete content of the note
 */
Note.prototype.getContent = function(){
  return this.text;
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
    bg_color: this.bg_color,
    associations: this.associations
  };
}

