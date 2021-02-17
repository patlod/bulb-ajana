module.exports = NoteEditorSearch

const TextSearchIterator = require('../_util/TextSearchIterator');
const StringFormatter = require('../_util/StringFormatter');

function NoteEditorSearch(iterator, overlay = null){
  this.iterator = iterator;
  this.overlay_DOMEl = overlay;
  this.current_needle_DOMEl = null;
}

NoteEditorSearch.prototype.showOverlay = function(){
  if(this.overlay_DOMEl.classList.contains('hidden')){
    this.overlay_DOMEl.classList.remove('hidden');
  }
}

NoteEditorSearch.prototype.hideOverlay = function(){
  if(!this.overlay_DOMEl.classList.contains('hidden')){
    this.overlay_DOMEl.classList.add('hidden');
  }
}

NoteEditorSearch.prototype.loadOverlayContent = function(){
  this.overlay_DOMEl.innerHTML = this.makeSearchOverlayContent(this.iterator);
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
NoteEditorSearch.prototype.makeSearchOverlayContent = function(iterator, case_sensitive = false){
  let i, clip_length = 0, cur_clip, sResults, offset_idx,
      nStr = iterator.haystack,
      needle = iterator.needle,
      html_str = "", split_html_str;
      
  // Fetch first needle index
  sResults = iterator.getResults()
  for(i in sResults){
    offset_idx = sResults[i] - clip_length;
    cur_clip = nStr.substring(0, offset_idx);
    html_str += cur_clip
    html_str += "<span id='needle-idx-" + sResults[i] + "' class='needle-marker'>" + nStr.substring(offset_idx, offset_idx + needle.length) + "</span>"
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

NoteEditorSearch.prototype.clearOverlayContent = function(){
  this.overlay_DOMEl.innerHTML = "";
}

NoteEditorSearch.prototype.getPrevNeedleDOMEl = function(){
  if(this.iterator.size() > 0){
    // needle-idx-<id>
    let idx = this.iterator.prev__Ring(),
        id_str = 'needle-idx-' + idx;

    return document.getElementById(id_str);
  }
}

NoteEditorSearch.prototype.getNextNeedleDOMEl = function(){
  if(this.iterator.size() > 0){
    // needle-idx-<id>
    let idx = this.iterator.next__Ring(),
        id_str = 'needle-idx-' + idx;
    
    return document.getElementById(id_str);
  }
}

NoteEditorSearch.prototype.gotoPrevNeedle = function(){
  let prev = this.getPrevNeedleDOMEl();
  if(this.current_needle_DOMEl === null){
    this.current_needle_DOMEl = prev;
  }
  this.concealNeeedleDOMEl(this.current_needle_DOMEl);
  this.current_needle_DOMEl = prev;
  this.illuminateNeedleDOMEl(this.current_needle_DOMEl);
}

NoteEditorSearch.prototype.gotoNextNeedle = function(){
  let next = this.getNextNeedleDOMEl();
  if(this.current_needle_DOMEl === null){
    this.current_needle_DOMEl = next;
  }
  this.concealNeeedleDOMEl(this.current_needle_DOMEl);
  this.current_needle_DOMEl = next;
  this.illuminateNeedleDOMEl(this.current_needle_DOMEl);
}

NoteEditorSearch.prototype.illuminateNeedleDOMEl = function(el){
  if(!this.current_needle_DOMEl.classList.contains('selected')){
    this.current_needle_DOMEl.classList.add('selected');
  }
}

NoteEditorSearch.prototype.concealNeeedleDOMEl = function(el){
  if(this.current_needle_DOMEl.classList.contains('selected')){
    this.current_needle_DOMEl.classList.remove('selected');
  }
}

