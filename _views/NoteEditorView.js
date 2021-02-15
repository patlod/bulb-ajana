module.exports = NoteEditorView

const EventEmitterElement = require('../_app/EventEmitterElement')
var inherits = require('util').inherits

const yo = require('yo-yo')
const Tagify = require('@yaireo/tagify')
const DateFormatter = require('../_util/DateFormatter')
const UnitConverter = require('../_util/UnitConverter')
const CSSProcessor = require('../_util/CSSProcessor')


function NoteEditorView(target) {
  var self = this
  EventEmitterElement.call(this, target)

  this.active_note = null

  this.selectionStart = 0;
  this.selectionEnd = 0;

  this.globalTimeout = null
  this.SAVE_INTERVAL = 3000   // Save text content every 3s

  this.tagify = null

  this.dirty_bit = false

  this.currentNeedle = ""
}
inherits(NoteEditorView, EventEmitterElement)

/**
 * Returns a (white)list of key-value pairs of global project tags
 * @param {Project} project 
 */
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

  self.active_note = null;
  self.currentNeedle = "";

  if(self.tagify !== null){
    self.tagify.destroy();
    self.tagify = null;  /* Necessary to avoid null reference error. */
  }

  if (self.globalTimeout !== null) {
    clearTimeout(self.globalTimeout);
  }
}

NoteEditorView.prototype.toggleLocalSearch = function(){
  let el = document.getElementById('local-search')
  if(el){
    if(el.classList.contains('hidden')){
      el.classList.remove('hidden');
      el.getElementsByTagName('input')[0].focus();
    }else{
      el.getElementsByTagName('input')[0].focus();
    }
  }
}

/**
 * Converts the text of a note into format that is used by contenteditable.
 */
NoteEditorView.prototype.convertNoteTextContenteditable = function(){
  // TODO
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
    
    console.log(this.value)

    // Save text to note object
    self.active_note.text = this.value;
    // document.getElementById('notepad-overlay').textContent = this.value;

    // Remove carriage returns and split at \newlines
    let chk = self.active_note.needThumbUpdate(self.selectionStart, self.selectionEnd)
    if(chk){
      self.send("updateByEditorContent", self.active_note)
    }

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

  function keyupLocalSearch(e){
    console.log("keyupLocalSearch");
    // - Change visibility of the x-cancel icon
    if(self.currentNeedle.length === 0 && this.value.length > 0){
      document.getElementById('local-search')
        .getElementsByClassName("fa-times-circle")[0].classList.remove("hidden");
    }
    if(self.currentNeedle.length > 0 && this.value.length === 0){
        document.getElementById('local-search')
          .getElementsByClassName("fa-times-circle")[0].classList.add("hidden");
    }
    self.currentNeedle = this.value;
    console.log(self.active_note.searchNoteText(this.value));
  }

  function clickClearLocalSearch(e){
    console.log("Clear local search, current value: ");
    console.log(self.currentNeedle);
    // Clear search input
    let input = document.getElementById("local-search").getElementsByTagName("input")[0]
    input.value = "";
    input.focus();
    // Clear local search state
    self.currentNeedle = "";
    // Clear the search data in the controller/model structures
    self.send("clearLocalSearch")
  }

  function makeLocalSearchField(){
    return yo`
        <div id="local-search" class="hidden">
            <i class="fas fa-search"></i>
            <input class="" type="text" placeholder="Search..." onkeyup=${keyupLocalSearch}>
            <span id="counter"></span>
            <i class="fas fa-times-circle hidden" onclick=${clickClearLocalSearch}></i>
        </div>
    `
  }

  function makeColorPaletteDropdown(active_note){
    if(!project){
        return
    }else{
      if(!project.getGraphMode()){

          let colorCollection = CSSProcessor.getNoteBackgroundColors()

          function clickColorDPItem(e){
            let style = window.getComputedStyle(this.getElementsByTagName('span')[0])
            let color_str = UnitConverter.rgbToHex( style.getPropertyValue('background-color') )
            
            // let targetColor = colorCollection.filter(function(x){
            //   return x.color.localeCompare(color_str) === 0
            // })

            // Set background of the note-editor
            document.getElementsByClassName('note-content-wrap')[0].style.backgroundColor = color_str

            
            self.send('updateNoteColor', active_note, color_str)
          }

          let items_html = []
          let el = null
          colorCollection.map(function(x, idx){
            if(active_note.bg_color.localeCompare(x.color) === 0){
              el = yo` 
              <div class="item active" onclick=${clickColorDPItem}>
                  <span class="color-pickr-circle ${x.selector.substring(1)}"></span>
              </div>
            ` 
            }else{
              el = yo` 
              <div class="item" onclick=${clickColorDPItem}>
                  <span class="color-pickr-circle ${x.selector.substring(1)}"></span>
              </div>
            ` 
            }
            
              items_html.push(el)
              if((idx + 1) % 5 === 0){
                  items_html.push(yo`<div class="divider"></div>`)
              }
              
          })
          
            
          return yo`
          <div id="note-color-dp" class="ui floated dropdown">
              <i class="fas fa-palette"></i>
              <i class="dropdown icon"></i>
              
              <div class="menu">
                  <div class="header">
                      <i class="fas fa-paint-roller"></i>
                      Note Color
                  </div>
                  <div class="menu scrolling">
                      ${items_html}
                  </div>
              </div>
          </div>
          `
        }
      }
    }


  
  var editor_view = yo`
    <div id="note-editor" >
      <div class="note-header">
        <div class="datetime">
          <span id="dt-created">Created: ${DateFormatter.formatDateEditor(self.active_note.getCreated())}</span>
          <span id="dt-modified" class="hidden">Modified: ${DateFormatter.formatDateEditor(self.active_note.getModified())}</span>
          <i class="fas fa-chevron-down" onclick=${clickHandlerDate}></i>
        </div>
        <textarea style="background: white" name='note-tags' placeholder='Tags...'>
          ${self.makeTagifyValues(self.active_note.getTags())}
        </textarea>
      </div>
      <div class="note-content-wrap" style="background-color: ${project.getActiveNote().bg_color}">
        <div class="note-content-ctrls">
          ${makeLocalSearchField()}
          ${makeColorPaletteDropdown(project.getActiveNote())}
        </div>
        <textarea id="notepad" class="note-content" wrap="soft" 
        oninput=${inputHandlerNotepad} 
        onkeyup=${keyupHandlerNotepad}
        onclick=${clickHandlerNotepad}>${self.active_note.getContent()}</textarea>
        <div id="notepad-overlay" style="font-family: Verdana, Geneva; font-size: 10px" >
          <div><span style="box-shadow: 0px 0px 0px 1px #000">Did</span> I create other note I didn't notice?</div>
          <div><br/></div>
          <div>This is now supposed to be longer note.</div>
          <div><br/></div>
          <div><br/></div>
          <div>I need more text to test the scroll for the plane that will handle the highlighting of words..</div>
          <div><br/></div>
          <div>This is necessary to</div>
          
        </div>
      </div>
      
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