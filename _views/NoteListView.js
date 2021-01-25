module.exports = NoteListView

const EventEmitterElement = require('../_app/EventEmitterElement')
var inherits = require('util').inherits

var yo = require('yo-yo')
var moment = require('moment')

function NoteListView(target) {
  var self = this

  EventEmitterElement.call(this, target)

  this.scrollTop = 0;
}
inherits(NoteListView, EventEmitterElement)


/**
 * Formats the string of the date of a note for the note thumbnail
 * 
 * Takes a raw date string e.g. created by Date.now()
 * 
 * @param {Date()} date
 */
NoteListView.prototype.formatDate = function(date){
  let now = moment(new Date())
  let today = moment(now.format("DD-MM-YYYY"), "DD-MM-YYYY")
  let n_date = moment(new Date(date))
  let diff = today.diff(n_date, 'days', true)
  
  if(diff <= 0){
    return n_date.format("HH:MM")
  }else if(diff <= 1){
    return "Yesterday"
  }else if(diff <= 2){
    return n_date.format("dddd")
  }else if(diff <= 3){
    return n_date.format("dddd")
  }else if(diff <= 4){
    return n_date.format("dddd")
  }else if(diff <= 5){
    return n_date.format("dddd")
  }else if(diff <= 6){
    return n_date.format("dddd")
  }else{
    return n_date.format("DD.MM.YY")
  }
}


NoteListView.prototype.tagsHTML = function(note, pureHTML = false){
  // TODO: Limit the amount of tags shown.
  //console.log(note.getTags())
  if(pureHTML){
    let div =  document.createElement("div")
    div.classList = "note-thmb-tags"
    let tags = note.getTags().map(function(tag){
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
      self.send('transitionNote', project, note)
    }

    /* ====================================================================== */
    /* ====================================================================== */

    var className = note.isActive() ? 'active' : ''
    
    return yo`
      <div>
        <div class="note-thmb ${className}" data-id=${note.uuid} onclick=${clickNoteThmb}>
          <div class="flex-wrap">
            <span class="note-thmb-head">${note.getHeader()}</span>
          </div>
          <div class="flex-wrap">
            <span class="note-thmb-datetime">${self.formatDate(note.getCreated())}:</span> <span class="note-thmb-content">${note.getContentPreview()}</span>
          </div>
          <div class="flex-wrap">
            ${self.tagsHTML(note)}
          </div>
        </div>
      </div>
    `
  })

  //console.log("Notes thumbnails..")
  //console.log(notes_thmbs)

  return yo`
    <div>
      ${notes_thmbs}
    </div>
  `  
}