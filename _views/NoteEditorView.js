module.exports = NoteEditorView

const EventEmitterElement = require('../_app/EventEmitterElement');
var inherits = require('util').inherits;

const yo = require('yo-yo');
const Tagify = require('@yaireo/tagify');
const DateFormatter = require('../_util/DateFormatter');
const UnitConverter = require('../_util/UnitConverter');
const CSSProcessor = require('../_util/CSSProcessor');
const StringFormatter = require('../_util/StringFormatter');
const TextSearchIterator = require('../_util/TextSearchIterator');


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

  this.current_search = null
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
  self.current_search = null;

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
 * Converts the text of a note into format that is used by 'contenteditable'
 * elements.
 * 
 * Format: 
 *  - Each paragraph is wrapped in <div></div>
 *  - New lines are <br/>
 *  
 * Example:
 * "Lorem ipsum,\n\netsum masum.\n"
 * ..translates to..
 * <div>Lorem ipsum,</div>
 * <div><br/></div>
 * <div>etsum masum.</div>
 * 
 * @param {TextSearchIterator} iterator -- Iterator that wraps the result of the text search
 * @param {string} text -- The text that was searched.
 */
NoteEditorView.prototype.makeSearchOverlayContent = function(iterator, case_sensitive = false){
  let i, clip_length = 0, cur_clip, next_idx, offset_idx,
      nStr = iterator.haystack,
      needle = iterator.needle,
      html_str = "", split_html_str;
      
  // Fetch first needle index
  next_idx = iterator.next()
  while(next_idx !== null){

    offset_idx = next_idx - clip_length;
    cur_clip = nStr.substring(0, offset_idx);
    html_str += cur_clip
    html_str += "<span class='needle-marker'>" + nStr.substring(offset_idx, offset_idx + needle.length) + "</span>"
    nStr = nStr.substring(offset_idx + needle.length, nStr.length);
    clip_length += cur_clip.length + needle.length;
    next_idx = iterator.next();
  }
  html_str += nStr;
  
  split_html_str = StringFormatter.splitAtNewLine(html_str);
  for(i in split_html_str){
    if(split_html_str[i].length > 0){
      split_html_str[i] = "<div>" + split_html_str[i] + "</div>";
    }else{
      split_html_str[i] = "<div><br/></div>";
    }
  }
  return split_html_str.join('');
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
    self.selectionStart = this.selectionStart
    self.selectionEnd = this.selectionEnd
  }

  function clickHandlerDate(e){
    self.send("toggleEditorDate");
  }

  function clickNotepadOverlay(e){
    this.classList.add('hidden');
  }

  /* ====================================================================== */
  /* ====================================================================== */

  function keyupLocalSearch(e){
    console.log("keyupLocalSearch");
    // Change visibility of the x-cancel icon
    let search_in_el = document.getElementById('local-search');
    if(self.current_search !== null && self.current_search.needle.length === 0 && this.value.length > 0){
      search_in_el.getElementsByClassName("right-ctrls")[0].classList.remove("hidden");
      
    }
    if(self.current_search !== null && self.current_search.needle.length > 0 && this.value.length === 0){
      search_in_el.getElementsByClassName("right-ctrls")[0].classList.add("hidden");
    }
    
    let search = self.active_note.searchNoteText(this.value)
    self.current_search = new TextSearchIterator(this.value, self.active_note.text, search)
    search_in_el.getElementsByClassName('needle-count')[0].textContent = self.current_search.size();
    // TODO: Update the matches counter in the search field..
    let overlay = document.getElementById('notepad-overlay');
    if(search.length > 0){
      // Fill the notepad overlay with content
      overlay.innerHTML = self.makeSearchOverlayContent(self.current_search);
      // Trigger the textarea overlay
      overlay.classList.remove('hidden');
    }else{
      // Hide textarea overlay
      if(!overlay.classList.contains('hidden')){
        overlay.classList.add('hidden');
      }
        
    }
    
  }

  function clickClearLocalSearch(e){
    console.log("Clear local search, current value: ");
    console.log(self.current_search);
    // Clear search input
    let input = document.getElementById("local-search").getElementsByTagName("input")[0]
    input.value = "";
    input.focus();
    // Clear local search state
    self.current_search = null;
    // Hide textarea overlay
    let overlay = document.getElementById('notepad-overlay');
    if(!overlay.classList.contains('hidden')){
      overlay.innerHTML = '';
      overlay.classList.add('hidden');
    }
    let right_ctrls = input.getElementsByClassName('right-ctrls')[0].classList.contains('hidden')
    if(!right_ctrls){
      right_ctrls.classList.add('hidden');
    }
  }

  function makeLocalSearchField(){
    return yo`
        <div id="local-search" class="hidden">
            <i class="fas fa-search"></i>
            <input class="" type="text" placeholder="Search..." onkeyup=${keyupLocalSearch}>
            <div class="right-ctrls">
              <span class="needle-count hidden"></span>  
              <i class="fas fa-times-circle hidden" onclick=${clickClearLocalSearch}></i>
            </div>
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
        <div id="notepad-overlay" class="hidden" onclick=${clickNotepadOverlay}></div>
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