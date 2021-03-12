module.exports = NoteEditorView

const EventEmitterElement = require('../_app/EventEmitterElement');
const inherits = require('util').inherits;

const yo = require('yo-yo');
const Tagify = require('@yaireo/tagify');
const UIAssistant = require('../_util/UIAssistant');
const DateFormatter = require('../_util/DateFormatter');
const UnitConverter = require('../_util/UnitConverter');
const CSSProcessor = require('../_util/CSSProcessor');
const StringFormatter = require('../_util/StringFormatter');
const TextSearchIterator = require('../_util/TextSearchIterator');


function NoteEditorView(target, focus_manager) {
  var self = this;
  EventEmitterElement.call(this, target);

  this.app = target;

  this.focus_manager = focus_manager;

  this.active_note = null;

  this.selectionStart = 0;
  this.selectionEnd = 0;

  this.globalTimeout = null;
  this.SAVE_INTERVAL = 3000;   // Save text content every 3s

  this.tagify = null;

  this.dirty_bit = false;

  this.search = null;
  // this.iterator = iterator;
  this.overlay_DOMEl = null;
  this.current_needle_DOMEl = null;
}
inherits(NoteEditorView, EventEmitterElement);

/**
 * Returns a (white)list of key-value pairs of global project tags
 * @param {Project} project 
 */
NoteEditorView.prototype.fetchWhitelist = function(project){
  let p_tag_objs = project.getAllTags();
  let wL = p_tag_objs.map(function(t) { return { value: t.name }; });
  return wL;
}

NoteEditorView.prototype.addTag = function(e, tagify){
  var self = this;

  // Add tag to list & database
  self.active_note.addTag(e.detail.data.value);

  // Update whitelist of tagify input
  let new_wL = this.fetchWhitelist(self.active_note.project);
  // Reset tagify whitelist
  tagify.settings.whitelist.length = 0;
  // Update tagify whitelist
  tagify.settings.whitelist.splice(0, new_wL.length, ...new_wL);

  // Trigger update of notes list
  self.send("updateByNoteEditorContent", self.active_note);
}

NoteEditorView.prototype.removeTag = function(e, tagify){
  var self = this;
  console.log("removeTag() - Active Note:");
  console.log(self.active_note);
  // console.log(e)
  // Remove tag from list & database
  self.active_note.removeTag(e.detail.data.value);

  let new_wL = this.fetchWhitelist(self.active_note.project);
  // Reset tagify whitelist
  tagify.settings.whitelist.length = 0;
  // Update tagify whitelist
  tagify.settings.whitelist.splice(0, new_wL.length, ...new_wL);
  
  // Trigger update of notes list
  self.send("updateByNoteEditorContent", self.active_note);
}

NoteEditorView.prototype.updateTag = function(e, tagify){
  var self = this;

  // Update tag in list & database
  self.active_note.updateTag(e.detail.data.value, e.detail.previousData.value);
  
  // Update white list
  let new_wL = this.fetchWhitelist(self.active_note.project);
  // Reset tagify whitelist
  tagify.settings.whitelist.length = 0;
  // Update tagify whitelist
  tagify.settings.whitelist.splice(0, new_wL.length, ...new_wL);

  // Trigger update of notes list
  self.send("updateByNoteEditorContent", self.active_note);
}

/**
 * Creates a list with the tag values each wrapped in JSON object
 * 
 * Takes array of tags as JSON objects
 * 
 * @param {[{Obj}]} tags 
 */
NoteEditorView.prototype.makeTagifyValues = function(tags){
  return JSON.stringify(tags.map(function(tag){ return { "value": tag.name } }));
}

NoteEditorView.prototype.focusNotepad = function(){
  document.getElementById('notepad').focus();
}
/**
 * Functions related to note editor local search.
 */

NoteEditorView.prototype.isSearch = function(){
  return this.search !== null;
}
NoteEditorView.prototype.initNotepadOverlay = function(){
  this.overlay_DOMEl = document.getElementById('notepad-overlay');
}
NoteEditorView.prototype.showNotepadOverlay = function(){
  if(this.overlay_DOMEl === null){ this.initNotepadOverlay(); }
  if(this.overlay_DOMEl.classList.contains('hidden')){
    this.overlay_DOMEl.classList.remove('hidden');
  }
}

NoteEditorView.prototype.hideNotepadOverlay = function(){
  if(this.overlay_DOMEl === null){ this.initNotepadOverlay(); }
  if(!this.overlay_DOMEl.classList.contains('hidden')){
    this.overlay_DOMEl.classList.add('hidden');
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
NoteEditorView.prototype.makeNotepadOverlayContent = function(haystack, needle, needle_pos, case_sensitive = false){
  let i, clip_length = 0, cur_clip, sResults, offset_idx,
      nStr = haystack,
      html_str = "", split_html_str;
      
  // Fetch first needle index
  sResults = needle_pos;
  for(i in sResults){
    offset_idx = sResults[i] - clip_length;
    cur_clip = nStr.substring(0, offset_idx);
    html_str += cur_clip;
    html_str += "<span id='needle-idx-" + sResults[i] + "' class='needle-marker'>" + nStr.substring(offset_idx, offset_idx + needle.length) + "</span>";
    nStr = nStr.substring(offset_idx + needle.length, nStr.length);
    clip_length += cur_clip.length + needle.length;
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

NoteEditorView.prototype.clearNotepadOverlay = function(){
  this.overlay_DOMEl.innerHTML = "";
}

NoteEditorView.prototype.getPrevNeedleDOMEl = function(){
  if(this.search.size() > 0){
    // needle-idx-<id>
    let idx = this.search.prev__Ring(),
        id_str = 'needle-idx-' + idx;

    return document.getElementById(id_str);
  }
}

NoteEditorView.prototype.getNextNeedleDOMEl = function(){
  if(this.search.size() > 0){
    // needle-idx-<id>
    let idx = this.search.next__Ring(),
        id_str = 'needle-idx-' + idx;
    
    return document.getElementById(id_str);
  }
}

NoteEditorView.prototype.gotoPrevNeedle = function(){
  let prev = this.getPrevNeedleDOMEl();
  if(this.current_needle_DOMEl === null){
    this.current_needle_DOMEl = prev;
  }
  this.concealNeeedleDOMEl(this.current_needle_DOMEl);
  this.current_needle_DOMEl = prev;
  this.illuminateNeedleDOMEl(this.current_needle_DOMEl);
}

NoteEditorView.prototype.gotoNextNeedle = function(){
  let next = this.getNextNeedleDOMEl();
  if(this.current_needle_DOMEl === null){
    this.current_needle_DOMEl = next;
  }
  this.concealNeeedleDOMEl(this.current_needle_DOMEl);
  this.current_needle_DOMEl = next;
  this.illuminateNeedleDOMEl(this.current_needle_DOMEl);
}

NoteEditorView.prototype.illuminateNeedleDOMEl = function(el){
  if(!this.current_needle_DOMEl.classList.contains('selected')){
    this.current_needle_DOMEl.classList.add('selected');
  }
}

NoteEditorView.prototype.concealNeeedleDOMEl = function(el){
  if(this.current_needle_DOMEl.classList.contains('selected')){
    this.current_needle_DOMEl.classList.remove('selected');
  }
}

NoteEditorView.prototype.resetSearch = function(){
  this.search = null;
  this.overlay_DOMEl = null;
  this.current_needle_DOMEl = null;
}

NoteEditorView.prototype.toggleLocalSearch = function(){
  let el = document.getElementById('local-search');
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
 * Resets the editor before new content is loaded.
 */
NoteEditorView.prototype.resetEditorState = function(){
  var self = this;

  self.active_note = null;

  if(self.tagify !== null){
    self.tagify.destroy();
    self.tagify = null;  /* Necessary to avoid null reference error. */
  }

  if (self.globalTimeout !== null) {
    clearTimeout(self.globalTimeout);
  }

  this.resetSearch();
}

/**
 * Renders the NoteEditorView for a given project
 * @param {Project} project 
 */
NoteEditorView.prototype.render = function(project){
  var self = this;

  // Reset NoteEditorView state
  self.resetEditorState();

  if(!project){ return; }

  // Get active note
  self.active_note = project.getActiveNote();
  if(!self.active_note){ return; }



  /* ====================================================================== */
  /*  Event Handlers                                                        */
  /* ====================================================================== */
  function clickNoteEditor(e){
    self.focus_manager.setFocusObject(self.focus_manager.NOTE_EDITOR);
  }

  function inputHandlerNotepad(e){
    UIAssistant.resizeElementByContent(this);
  }

  function keyupHandlerNotepad(e){
    // Store cursor position..
    self.selectionStart = this.selectionStart;
    self.selectionEnd = this.selectionEnd;
    
    console.log(this.value);

    // Save text to note object
    self.active_note.text = this.value;

    // Remove carriage returns and split at \newlines
    let chk = self.active_note.needThumbUpdate(self.selectionStart, self.selectionEnd);
    if(chk){
      self.send("updateByNoteEditorContent", self.active_note);
    }

    // Set dirty bit of note
    if(!self.active_note.isDirty()){ 
      self.active_note.setDirtyBit(true);
    }

    // Set/Reset timer for writing to database
    if (self.globalTimeout !== null) {
      clearTimeout(self.globalTimeout);
    }
    self.globalTimeout = setTimeout(function() {
      self.globalTimeout = null;  

      // Persist to database
      if(self.active_note){
        self.active_note.saveText( );
        self.active_note.setDirtyBit(false);
        console.log("TIMEOUT: Writing text to database.");
      }

    }, self.SAVE_INTERVAL);  
  
  }

  function clickHandlerNotepad(e){
    self.selectionStart = this.selectionStart;
    self.selectionEnd = this.selectionEnd;
  }

  function clickHandlerDate(e){
    self.send("toggleEditorDate");
  }

  function clickNotepadOverlay(e){
    this.classList.add('hidden');
  }

  /* ====================================================================== */
  /* ====================================================================== */
  function focusLocalSearch(){
    if(self.search !== null){
      self.showNotepadOverlay();
    }
  }
  function keyupLocalSearch(e){
    console.log("keyupLocalSearch");
    // Change visibility of the x-cancel icon
    if(e.key === "Enter" && this.value.length > 0){
      this.select();
      if(self.app.views.app.shiftKey_active){
        clickSearchPrev();
      }else{
        clickSearchNext();
      }
      return;
    }
    if(e.key === "Shift"){
      return;
    }
    let search_in_el = document.getElementById('local-search');
    if(self.search !== null && self.search.needle.length === 0 && this.value.length > 0){
      search_in_el.getElementsByClassName("right-ctrls")[0].classList.remove("hidden");
      
    }
    if(self.search !== null && self.search.needle.length > 0 && this.value.length === 0){
      search_in_el.getElementsByClassName("right-ctrls")[0].classList.add("hidden");
    }
    
    let needles = self.active_note.searchNoteText(this.value);
    self.search = new TextSearchIterator(this.value, self.active_note.text, needles);
    self.initNotepadOverlay();

    // Update the needle counter..
    search_in_el.getElementsByClassName('needle-count')[0].textContent = self.search.size();
    if(needles.length > 0){
      // Fill the notepad overlay with content
      self.overlay_DOMEl.innerHTML = self.makeNotepadOverlayContent(
        self.search.haystack, 
        self.search.needle, 
        self.search.results);
      // Trigger the textarea overlay
      self.showNotepadOverlay();
      self.gotoNextNeedle();
    }else{
      // Hide textarea overlay
      self.hideNotepadOverlay(); 
    }
    
  }

  function clickClearLocalSearch(e){
    console.log("Clear local search, current value: ");
    console.log(self.search);
    // Clear search input
    let input = document.getElementById("local-search").getElementsByTagName("input")[0];
    input.value = "";
    input.focus();

    // Clear local search state
    self.clearNotepadOverlay();
    self.hideNotepadOverlay();

    self.search = null;
    
    let right_ctrls = this.parentNode; 
    if(right_ctrls && !right_ctrls.classList.contains('hidden')){
      right_ctrls.classList.add('hidden');
    }
  }

  function clickSearchPrev(){
    console.log("clickSearchPrev");
    if(self.search !== null){
      self.gotoPrevNeedle();
    }
  }

  function clickSearchNext(){
    console.log("clickSearchNext");
    if(self.search !== null){
      self.gotoNextNeedle();
    }
  }

  function makeLocalSearchField(){
    return yo`
        <div id="local-search" class="hidden">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Search..." value="" onkeyup=${keyupLocalSearch} onfocus=${focusLocalSearch}>
            <div class="right-ctrls">
              <span id="loc-search-prev" onclick=${clickSearchPrev}><i class="fas fa-chevron-left"></i></span>
              <span id="loc-search-next" onclick=${clickSearchNext}><i class="fas fa-chevron-right"></i></span>
              <span class="needle-count hidden"></span>  
              <i class="fas fa-times-circle hidden" onclick=${clickClearLocalSearch}></i>
            </div>
        </div>
    `;
  }

  function makeColorPaletteDropdown(active_note){
    if(!project){
        return;
    }else{
      if(!project.getGraphMode()){

        let colorCollection = CSSProcessor.getNoteBackgroundColors();

        function clickColorDPItem(e){
          let style = window.getComputedStyle(this.getElementsByTagName('span')[0]);
          let color_str = UnitConverter.rgbToHex( style.getPropertyValue('background-color') );
          
          // let targetColor = colorCollection.filter(function(x){
          //   return x.color.localeCompare(color_str) === 0
          // })

          // Set background of the note-editor
          document.getElementsByClassName('note-content-wrap')[0].style.backgroundColor = color_str;

          
          self.send('updateNoteColor', active_note, color_str);
        }

        let items_html = [];
        let el = null;
        colorCollection.map(function(x, idx){
          if(active_note.bg_color.localeCompare(x.color) === 0){
            el = yo` 
              <div class="item active" onclick=${clickColorDPItem}>
                  <span class="color-pickr-circle ${x.selector.substring(1)}"></span>
              </div>
            `;
          }else{
            el = yo` 
              <div class="item" onclick=${clickColorDPItem}>
                  <span class="color-pickr-circle ${x.selector.substring(1)}"></span>
              </div>
            `;
          }
          
          items_html.push(el);
          if((idx + 1) % 5 === 0){
              items_html.push(yo`<div class="divider"></div>`);
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
          `;
      }
    }
  }

  let project_search = self.active_note.project.search;
  if(project_search !== null && project_search.notes.length === 0){
    return null;
  }

  var editor_view = yo`
    <div id="note-editor" onclick=${clickNoteEditor}>
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
        ${function(){ 
            if(project_search !== null){
              return yo`<div id="notepad-overlay" class="overlay" onclick=${clickNotepadOverlay}></div>`;
            }else{
              return yo`<div id="notepad-overlay" class="overlay hidden" onclick=${clickNotepadOverlay}></div>`;
            }
          }()}
        
      </div>
    </div>
    `;
  /**
   * HACK because html strings are not really processable with yo-yo
   * 
   * Once again this proofs how limiting yo-yo framework is..
   */
  if(project_search !== null){
    let chk = project_search.notes.filter(function(x){ 
      return x.note.compareTo(self.active_note);
    });
    if(chk.length === 1){
      let overlay = editor_view.getElementsByClassName('overlay')[0]
      overlay.innerHTML = self.makeNotepadOverlayContent(
        chk[0].note.text, 
        project_search.needle, 
        chk[0].results
        );
    }
  }
  
  
  /**
   * Initialise tagify input on the UI fragment.
   */
  var input = editor_view.querySelector('textarea[name=note-tags]');
  // Create tagify tag input on textarea
  self.tagify = new Tagify(input, {
    pattern          : /^[a-zA-ZäöüÄÖÜß0-9\-_]{0,40}$/,
    enforceWhitelist : false,
    maxTags          : 12,
    delimiters       : ",",
    whitelist        : this.fetchWhitelist(project),
    callbacks        : {
      "add"    : (e) => { self.addTag(e, self.tagify) },  // TODO: callback when adding a tag
      "remove" : (e) => { self.removeTag(e, self.tagify) }, // TODO: callback when removing a tag
      "edit:updated": (e) => { self.updateTag(e, self.tagify) }
    }
  });

  if(project_search !== null && project_search.notes.length === 0){
    return null;
  }else{
    return editor_view;
  }
  
  
}