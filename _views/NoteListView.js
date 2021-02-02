module.exports = NoteListView

const EventEmitterElement = require('../_app/EventEmitterElement')
var inherits = require('util').inherits

const yo = require('yo-yo')
const DateFormatter = require('../_util/DateFormatter')

function NoteListView(target) {
  var self = this

  EventEmitterElement.call(this, target)

  this.scrollTop = 0;
}
inherits(NoteListView, EventEmitterElement)


NoteListView.prototype.tagsHTML = function(note, pureHTML = false){
  // TODO: Limit the amount of tags shown.
  //console.log(note.getTags())
  if(pureHTML){
    let div =  document.createElement("div")
    div.classList = "note-thmb-tags"
    note.getTags().map(function(tag){
      let span = document.createElement("span")
      span.textContent = tag.name
      div.appendChild(span)
    })
    return div
  }else{
    let tags = note.getTags().map(function(tag){
      return yo` 
      <span>${tag.name} </span>
      `
    })
  
    return yo`
      <div class="note-thmb-tags">     
        ${tags}
      </div>
    `
  }
}


NoteListView.prototype.updateActiveNoteThumb = function(dom_el, active_note){
  var self = this

  // Get active note thumb..
  let active_note_thmb = dom_el.getElementsByClassName('note-thmb active')[0]
  //console.log(dom_el.getElementsByClassName('note-thmb active'))
  // ..update data.
  active_note_thmb.getElementsByClassName('note-thmb-head')[0].textContent = active_note.getHeader()
  active_note_thmb.getElementsByClassName('note-thmb-content')[0].textContent = active_note.getContentPreview()
  active_note_thmb.getElementsByClassName('note-thmb-tags')[0].replaceWith(self.tagsHTML(active_note, true))
}

NoteListView.prototype.updateNoteThmbColor = function(note){
  let target = document.getElementsByClassName('note-thmb active')[0]
  let c = target.getElementsByClassName('color-pickr-circle-thmb')[0]

  c.style.backgroundColor = note.bg_color
}

/**
 * TODO:
 *  - Click on a note thumb should mark the thumb and open the note
 *  - When note is marked pressing cmd-backspace should delete the note (move to trash)
 *  - 
 */


/**
 * Renders the UI for the Notes list with yo-yo.
 * 
 * @param {Project} project - Should be the currently active project
 */
NoteListView.prototype.render = function(project){
  var self = this
  
  if(!project){ return }

  // Could also check whether project is active here...

  // Get project notes
  let notes = project.getAllNotes()

  var notes_thmbs = notes.map(function(note){
    
    /* ====================================================================== */
    /*  Event Handlers - Note Thumbnail                                       */
    /* ====================================================================== */

    function clickNoteThmb(e){
      if(!project.getGraphMode()){
        self.send('transitionNote', project, note)
      }
      
    }

    function dblclickNoteThmb(e){
      console.log("Double click on..")
      console.log(this)
      if(project.getGraphMode()){
        // Project in graph mode so switch to NoteEditor and then focus on note
        self.send('transitionNoteAndEditor', project, note)
      }else{  // Same as single click
        self.send('transitionNote', project, note)
      }
    }
    /* ====================================================================== */
    /* ====================================================================== */

    var className = (note.isActive() && !project.getGraphMode()) ? 'active' : ''
    
    let note_thumb = yo`
      <div class="note-thmb-wrap">
        <div class="note-thmb ${className}" data-id=${note.uuid} onclick=${clickNoteThmb} ondblclick=${dblclickNoteThmb}>
          <div class="flex-wrap">
          <span class="color-pickr-circle-thmb" style="background-color: ${note.bg_color}"></span><span class="note-thmb-head">${note.getHeader()}</span>
          </div>
          <div class="flex-wrap">
            <span class="note-thmb-datetime">${DateFormatter.formatDateNoteThmb(note.getCreated())}:</span> <span class="note-thmb-content">${note.getContentPreview()}</span>
          </div>
          <div class="flex-wrap">
            ${self.tagsHTML(note)}
          </div>
        </div>
      </div>
    `
  
    // Make note-thumbs draggable elements
    $(note_thumb).draggable({
      start: function(event,ui){
        $('body').css("cursor", "no-drop")
       },
       stop: function(event,ui){
        $('body').css("cursor", "initial");
       },
      revert: true, 
      helper: function(e,ui){
        //$($.parseHTML('<p style="background: pink">Copy!</p>'))
        let clone = $(this).clone()
        clone.children('.note-thmb').css({"background": "#f7f7f7", "border-bottom": "none"})
        return clone
      }, 
      cursorAt: { left: 2, top: 2},
      appendTo: '#layout',
      distance: 20
    })

    return note_thumb
  })


  return yo`
    <div>
      ${notes_thmbs}
    </div>
  `  
}