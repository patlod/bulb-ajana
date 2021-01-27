module.exports = NoteEditorView

const EventEmitterElement = require('../_app/EventEmitterElement')
var inherits = require('util').inherits

var yo = require('yo-yo')
var Tagify = require('@yaireo/tagify')
var moment = require('moment')


function NoteEditorView(target) {
  var self = this
  EventEmitterElement.call(this, target)

  this.active_note = null

  this.selectionStart = 0;
  this.selectionEnd = 0;

  this.globalTimeout = null
  this.SAVE_INTERVAL = 3000   // Save text content every 4s

  this.tagify = null

  this.dirty_bit = false
}
inherits(NoteEditorView, EventEmitterElement)

/**
 * TODO:
 *  - Input the tags 
 *      - Should be saved to database
 *  - When clicking on text field the dummy text should be deleted
 *  - Text input should go directly to the database i.e. writing directly to JSON file.
 */

/**
 * Formats the string of the date of a note for the note thumbnail
 * 
 * Takes a raw date string e.g. created by Date.now()
 * 
 * @param {Date()} date
 */
NoteEditorView.prototype.formatDate = function(date){
  // Always show date in format as such 8. January 2021 at 14:56
  let m = moment(new Date(date))
  let d_str = m.format("DD. MMMM YYYY")
  let t_str = m.format("HH:MM")
  return d_str + " at " + t_str
}

NoteEditorView.prototype.fetchWhitelist = function(project){
  let p_tag_objs = project.getAllTags()
  let wL = p_tag_objs.map(function(t) { return {value: t.name } })
  return wL
}

NoteEditorView.prototype.addTag = function(e, tagify, note){
  var self = this
  console.log("addTag() - Active Note:")
  console.log(self.active_note)
  // console.log(e)
  // Add tag to list & database
  self.active_note.addTag(e.detail.data.value)

  // Update whitelist of tagify input
  console.log("wL before:")
  console.log(tagify.settings.whitelist)
  let new_wL = this.fetchWhitelist(self.active_note.project)
  // Reset tagify whitelist
  tagify.settings.whitelist.length = 0
  // Update tagify whitelist
  tagify.settings.whitelist.splice(0, new_wL.length, ...new_wL)
  console.log("wL after: ")
  console.log(tagify.settings.whitelist)

  // Trigger update of notes list
  self.send("updateActiveNoteThumb", self.active_note)
}

NoteEditorView.prototype.removeTag = function(e, tagify, note){
  var self = this
  console.log("removeTag() - Active Note:")
  console.log(self.active_note)
  // console.log(e)
  // Remove tag from list & database
  self.active_note.removeTag(e.detail.data.value)

  console.log("wL before:")
  console.log(tagify.settings.whitelist)
  let new_wL = this.fetchWhitelist(self.active_note.project)
  // Reset tagify whitelist
  tagify.settings.whitelist.length = 0
  // Update tagify whitelist
  tagify.settings.whitelist.splice(0, new_wL.length, ...new_wL)
  console.log("wL after: ")
  console.log(tagify.settings.whitelist)
  
  // Trigger update of notes list
  self.send("updateActiveNoteThumb", self.active_note)
}

NoteEditorView.prototype.updateTag = function(e, tagify, note){
  var self = this
  console.log("updateTag() - Active Note:")
  console.log(self.active_note)
  // console.log(e)
  // Update tag in list & database
  self.active_note.updateTag(e.detail.data.value, e.detail.previousData.value)
  
  // Update white list
  console.log("wL before:")
  console.log(tagify.settings.whitelist)
  let new_wL = this.fetchWhitelist(self.active_note.project)
  // Reset tagify whitelist
  tagify.settings.whitelist.length = 0
  // Update tagify whitelist
  tagify.settings.whitelist.splice(0, new_wL.length, ...new_wL)
  console.log("wL after: ")
  console.log(tagify.settings.whitelist)

  // Trigger update of notes list
  self.send("updateActiveNoteThumb", self.active_note)
}

/**
 * Creates a list with the tag values each wrapped in JSON object
 * 
 * Takes array of tags as JSON objects
 * 
 * @param {[{Obj}]} tags 
 */
NoteEditorView.prototype.makeTagifyValues = function(tags){
  return JSON.stringify(tags.map(function(tag){ return { "value": tag.name } })) 
}

NoteEditorView.prototype.resizeElementByContent = function(el){
  if(!el){
    return
  }

  let default_height = 26;
  /*console.log("Input event notepad textarea: " + this.scrollHeight)
  console.log("Normal height: " + getComputedStyle(this).height)
  console.log("normal width: " + getComputedStyle(this).width)*/
  el.style.height = default_height.toString() + "px"
  el.style.height = el.scrollHeight.toString() + "px"
}

/**
 * Resets the editor before new content is loaded.
 */
NoteEditorView.prototype.resetEditorState = function(){
  var self = this

  self.active_note = null

  if(self.tagify !== null){
    self.tagify.destroy()
    self.tagify = null  /* Necessary to avoid null reference error. */
  }

  if (self.globalTimeout !== null) {
    clearTimeout(self.globalTimeout);
  }
}

/**
 * Renders the NoteEditorView for a given project
 * @param {Project} project 
 */
NoteEditorView.prototype.render = function(project){
  var self = this

  // Reset NoteEditorView state
  self.resetEditorState()

  if(!project){ return }

  // Get active note
  self.active_note = project.getActiveNote()
  if(!self.active_note){ return }



  /* ====================================================================== */
  /*  Event Handlers                                                        */
  /* ====================================================================== */

  function inputHandlerNotepad(e){
    self.resizeElementByContent(this)
  }

  function keyupHandlerNotepad(e){
    // Store cursor position..
    self.selectionStart = this.selectionStart
    self.selectionEnd = this.selectionEnd
    // console.log("Keyup, selectionStart: " + this.selectionStart)
    // console.log("Keyup, selectionEnd: " + this.selectionEnd)

    // Remove carriage returns and split at \newlines
    let chk = self.active_note.needThumbUpdate(self.selectionStart, self.selectionEnd)
    if(chk){
      self.send("updateByEditorContent", self.active_note)
    }

    console.log(this.value)

    // Save text to note object
    self.active_note.text = this.value

    // Set dirty bit of note
    if(!self.active_note.isDirty()){ 
      self.active_note.setDirtyBit(true) 
    }

    // Set/Reset timer for writing to database
    if (self.globalTimeout !== null) {
      clearTimeout(self.globalTimeout);
    }
    self.globalTimeout = setTimeout(function() {
      self.globalTimeout = null;  

      // Persist to database
      if(self.active_note){
        self.active_note.saveText( )
        self.active_note.setDirtyBit(false)
        console.log("TIMEOUT: Writing text to database.")
      }

    }, self.SAVE_INTERVAL);  
  
  }

  function clickHandlerNotepad(e){
    // console.log("Click, selectionStart: " + this.selectionStart)
    // console.log("Click, selectionEnd: " + this.selectionEnd)
    self.selectionStart = this.selectionStart
    self.selectionEnd = this.selectionEnd
  }

  function clickHandlerDate(e){
    self.send("toggleEditorDate");
  }

  /* ====================================================================== */
  /* ====================================================================== */

  
  var editor_view = yo`
    <div id="note-editor" >
      <div class="note-header">
        <div class="datetime">
          <span id="dt-created">Created: ${self.formatDate(self.active_note.getCreated())}</span>
          <span id="dt-modified" class="hidden">Modified: ${self.formatDate(self.active_note.getModified())}</span>
          <i class="fas fa-chevron-down" onclick=${clickHandlerDate}></i>
        </div>
        <textarea style="background: white" name='note-tags' placeholder='Tags...'>
          ${self.makeTagifyValues(self.active_note.getTags())}
        </textarea>
      </div>
      <!-- <div id="notepad" class="note-content" contenteditable="true" onkeyup=${keyupHandlerNotepad}> -->
        <!-- Alternative HTML: <textarea id="notepad">Note text here</textarea> -->
        <textarea id="notepad" class="note-content" wrap="soft" 
        oninput=${inputHandlerNotepad} 
        onkeyup=${keyupHandlerNotepad}
        onclick=${clickHandlerNotepad}>${self.active_note.getContent()}</textarea>
      <!-- </div> -->
    </div>
  `


  var input = editor_view.querySelector('textarea[name=note-tags]')
  // Create tagify tag input on textarea
  self.tagify = new Tagify(input, {
    enforceWhitelist : false,
    delimiters       : null,
    whitelist        : this.fetchWhitelist(project),
    callbacks        : {
      "add"    : (e) => { self.addTag(e, self.tagify) },  // TODO: callback when adding a tag
      "remove" : (e) => { self.removeTag(e, self.tagify) }, // TODO: callback when removing a tag
      "edit:updated": (e) => { self.updateTag(e, self.tagify) }
    }
  });

  return editor_view
  
}