module.exports = ItemListView

const EventEmitterElement = require('../_app/EventEmitterElement')
var inherits = require('util').inherits

const remote = require('electron').remote;
const Menu = require('electron').remote.Menu;
// const MenuItem = require('electron').remote.MenuItem;


const yo = require('yo-yo')
const DateFormatter = require('../_util/DateFormatter')

function ItemListView(target) {
  var self = this

  EventEmitterElement.call(this, target)

  this.scrollTop = 0;

  this.objectOfDisplay = "note"; // or "graph"

}
inherits(ItemListView, EventEmitterElement)


ItemListView.prototype.tagsHTML = function(note, pureHTML = false){
  // TODO: Limit the amount of tags shown.
  //console.log(note.getTags())
  if(pureHTML){
    let div =  document.createElement("div")
    div.classList = "item-thmb-tags"
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
      <div class="item-thmb-tags">     
        ${tags}
      </div>
    `
  }
}


ItemListView.prototype.updateActiveNoteThumb = function(dom_el, active_note){
  var self = this;

  // Get active note thumb..
  let active_note_thmb = dom_el.getElementsByClassName('item-thmb active')[0]
  //console.log(dom_el.getElementsByClassName('item-thmb active'))
  // ..update data.
  active_note_thmb.getElementsByClassName('item-thmb-head')[0].textContent = active_note.getHeader()
  active_note_thmb.getElementsByClassName('item-thmb-content')[0].textContent = active_note.getContentPreview()
  active_note_thmb.getElementsByClassName('item-thmb-tags')[0].replaceWith(self.tagsHTML(active_note, true))
}

ItemListView.prototype.updateActiveGraphThumb = function(dom_el, active_graph){
  var self = this;
  if(self.objectOfDisplay === "note"){ return; }
  // Get active graph thumb..
  let active_graph_thmb = dom_el.getElementsByClassName('item-thmb active')[0]
  //console.log(dom_el.getElementsByClassName('item-thmb active'))
  // ..update data.
  active_graph_thmb.getElementsByClassName('item-thmb-head')[0].textContent = active_graph.getHeader();
  let nThmb_content = active_graph_thmb.getElementsByClassName('item-thmb-content')
  nThmb_content[0].textContent = active_graph.getContentPreview();
  nThmb_content[1].textContent = active_graph.getNumberOfNotes() + "Notes linked";
}

ItemListView.prototype.updateActiveGraphNoteCount = function(dom_el, active_graph){
  var self = this;
  if(self.objectOfDisplay === "note"){ return; }

  // Get active graph thumb..
  let active_graph_thmb = dom_el.getElementsByClassName('item-thmb active')[0],
      nThmb_content = active_graph_thmb.getElementsByClassName('item-thmb-content');
  
  console.log(nThmb_content);
  
  nThmb_content[1].textContent = active_graph.getNumberOfNotes() + "Notes linked";
}

ItemListView.prototype.updateNoteThmbColor = function(note){
  let target = document.getElementsByClassName('item-thmb active')[0]
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
ItemListView.prototype.render = function(project){
  var self = this
  
  if(!project){ return }

  // Could also check whether project is active here...
  var thumbs, notes;
  if(self.objectOfDisplay === "note"){

    // Get project notes
    if(project.search === null){
      notes = project.getAllNotes();
    }else{
      notes = project.search.notes.map(function(x){
        return x.note;
      });

      let chk = notes.filter(function(x){
        return x.compareTo(project.getActiveNote())
      })
      if(notes.length > 0 && chk.length === 0){
        project.toggleActiveNote(notes[0]);
      }
      
    }
    

    thumbs = notes.map(function(note){
      
      /* ====================================================================== */
      /*  Event Handlers - Note Thumbnail                                       */
      /* ====================================================================== */

      function clickNoteThmb(e){
        self.send('transitionNote', project, note)
      }

      function dblclickNoteThmb(e){
        console.log("Double click on..")
        if(project.getGraphMode()){
          // Project in graph mode so switch to NoteEditor and then focus on note
          self.send('transitionNoteAndEditor', project, note)
        }else{  // Same as single click
          self.send('transitionNote', project, note)
        }
      }

      function oncontextmenuClickNoteThmb(e){
        $(this).attr('data-id')
        const template = [
          {
            label: 'Delete',
            click: () => {
              console.log("Context-Menu - Delete clicked on element:")
              console.log(item_id)
            }
          },
          { type: 'separator'},
          {
            label: 'New Note',
            click: () => {
              console.log("Context-Menu - New Note clicked on element:")
              console.log(item_id)
            }
          }
        ]
        const menu = Menu.buildFromTemplate(template);
        menu.popup(remote.getCurrentWindow())
      }
      /* ====================================================================== */
      /* ====================================================================== */

      var className = (note.isActive()) ? 'active' : ''
      
      let note_thumb = yo`
        <div class="item-thmb-wrap">
          <div class="item-thmb ${className}" data-object="note" data-id=${note.uuid} 
            onclick=${clickNoteThmb} 
            ondblclick=${dblclickNoteThmb}
            oncontextmenu=${oncontextmenuClickNoteThmb}>

            <div class="flex-wrap">
            <span class="color-pickr-circle-thmb" style="background-color: ${note.bg_color}"></span><span class="item-thmb-head">${note.getHeader()}</span>
            </div>
            <div class="flex-wrap">
              <span class="item-thmb-datetime">${DateFormatter.formatDateItemThmb(note.getCreated())}:</span> <span class="item-thmb-content">${note.getContentPreview()}</span>
            </div>
            <div class="flex-wrap">
              ${self.tagsHTML(note)}
            </div>
          </div>
        </div>
      `
    
      // Make item-thumbs draggable elements
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
          clone.children('.item-thmb').css({"background": "#f7f7f7", "border-bottom": "none"})
          return clone
        }, 
        cursorAt: { left: 2, top: 2},
        appendTo: '#layout',
        distance: 20
      })

      return note_thumb
    })

  }else{
    let graphs = project.getAllGraphs();

    thumbs = graphs.map(function(graph){
      /* ====================================================================== */
      /*  Event Handlers - Note Thumbnail                                       */
      /* ====================================================================== */

      function clickNoteThmb(e){
        self.send('transitionGraph', project, graph)
      }

      function dblclickNoteThmb(e){
        console.log("Double click on..")
        if(project.getGraphMode()){
          // Project in graph mode so switch to NoteEditor and then focus on note
          self.send('transitionGraph', project, graph)
        }else{  // Same as single click
          self.send('transitionGraphAndEditor', project, graph)
          
        }
      }

      /* ====================================================================== */
      /* ====================================================================== */

      var className = (graph.isActive()) ? 'active' : ''
      
      let graph_thumb = yo`
        <div class="item-thmb-wrap">
          <div class="item-thmb ${className}" data-object="graph" data-id=${graph.uuid} onclick=${clickNoteThmb} ondblclick=${dblclickNoteThmb}>
            <div class="flex-wrap">
            <span class="item-thmb-head">${graph.getHeader()}</span>
            </div>
            <div class="flex-wrap">
              <span class="item-thmb-datetime">${DateFormatter.formatDateItemThmb(graph.getCreated())}:</span> <span class="item-thmb-content">${graph.getContentPreview()}</span>
            </div>
            <div class="flex-wrap">
              <span class="item-thmb-content">${graph.getNumberOfNotes()} Notes linked</span>
            </div>
          </div>
        </div>
      `
      return graph_thumb
    })
  }


  // <div class="item-thmb-ctrls">
  //   <div class="item-thmb-dropdown ui dropdown floated right btn-options">
  //     <i class="fas fa-ellipsis-h"></i>
  //     <div class="menu">
  //       <div class="item" >
  //         <span class="description">ctrl + r</span>
  //         Rename
  //       </div>
  //       <div class="item" >Close</div>
  //       <div class="item" >
  //         <i class="trash icon"></i>
  //         Delete Project
  //       </div>
  //     </div>
  //   </div>  
  // </div>

  function scrollList(){
    /**
     * Save the scroll position in the ItemListView class here..
     */
    console.log("Scroll position: " + this.scrollTop);
    self.scrollTop = this.scrollTop;
  }

  function clickSelectNotesList(){
    console.log("clickSelectNotesList")
    self.objectOfDisplay = "note";
    self.send('renderLazy');
  }
  
  function clickSelectGraphsList(){
    console.log("clickSelectGraphsList");
    self.objectOfDisplay = "graph";
    self.send('renderLazy');
  }
  
  let notes_list = yo`
    <div>
      ${function(){
        if(self.objectOfDisplay === "note"){
          return yo`<div id="item-list-ctrls-top">
              <span class="active" onclick=${clickSelectNotesList}>Notes</span><span onclick=${clickSelectGraphsList}>Graphs</span>
            </div>`
        }else{
          return yo`<div id="item-list-ctrls-top">
              <span onclick=${clickSelectNotesList}>Notes</span><span class="active" onclick=${clickSelectGraphsList}>Graphs</span>
            </div>`
        }
      }()}
      
      ${function(){
        if(self.objectOfDisplay === "note" && project.search !== null){
          return yo`
          <div id="item-list-head">
            <span class="item-thmb-head">Found ${notes.length} results</span> 
          </div>
          `
        }
      }()}
      ${function(){
        if(self.objectOfDisplay === "note" && project.search !== null){
          return yo`<div id="item-list-scroll" class="search-active" onscroll=${scrollList}>
                      ${thumbs}
                    </div>`;
        }else{
          return yo`<div id="item-list-scroll" onscroll=${scrollList}>
            ${thumbs}
          </div>`;
        }
        
      }()}
      </div>`  
  return notes_list;
  
}