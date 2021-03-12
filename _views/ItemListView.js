module.exports = ItemListView

const EventEmitterElement = require('../_app/EventEmitterElement');
var inherits = require('util').inherits;

const remote = require('electron').remote;
const Menu = require('electron').remote.Menu;
// const MenuItem = require('electron').remote.MenuItem;
const Note = require('../_controllers/Note');
const Graph = require('../_controllers/Graph');


const yo = require('yo-yo');
const DateFormatter = require('../_util/DateFormatter');

function ItemListView(target, focus_manager) {
  var self = this;
  EventEmitterElement.call(this, target);
  this.app = target;

  this.scrollTop = 0;

  this.objectOfDisplay = Note; // or Graph

  this.focus_manager = focus_manager;
}
inherits(ItemListView, EventEmitterElement)


ItemListView.prototype.tagsHTML = function(item, pureHTML = false){
  // TODO: Limit the amount of tags shown.
  if(pureHTML){
    let div =  document.createElement("div");
    div.classList = "item-thmb-tags";
    item.getTags().map(function(tag){
      let span = document.createElement("span")
      span.textContent = tag.name
      div.appendChild(span)
    });
    return div;
  }else{
    let tags = item.getTags().map(function(tag){
      return yo` 
      <span>${tag.name} </span>
      `;
    })
  
    return yo`
      <div class="item-thmb-tags">     
        ${tags}
      </div>
    `;
  }
}

ItemListView.prototype.updateActiveNoteThumb = function(dom_el, active_note){
  var self = this;

  // Get active note thumb..
  let active_note_thmb = dom_el.getElementsByClassName('item-thmb selected')[0];
  //console.log(dom_el.getElementsByClassName('item-thmb selected'))
  // ..update data.
  active_note_thmb.getElementsByClassName('item-thmb-head')[0].textContent = active_note.getHeader();
  active_note_thmb.getElementsByClassName('item-thmb-content')[0].textContent = active_note.getContentPreview();
  active_note_thmb.getElementsByClassName('item-thmb-tags')[0].replaceWith(self.tagsHTML(active_note, true));
}

ItemListView.prototype.updateActiveGraphThumb = function(dom_el, active_graph){
  var self = this;
  if(self.objectOfDisplay === Note){ return; }
  // Get active graph thumb..
  let active_graph_thmb = dom_el.getElementsByClassName('item-thmb selected')[0];
  //console.log(dom_el.getElementsByClassName('item-thmb selected'))
  // ..update data.
  active_graph_thmb.getElementsByClassName('item-thmb-head')[0].textContent = active_graph.getHeader();
  let nThmb_content = active_graph_thmb.getElementsByClassName('item-thmb-content');
  nThmb_content[0].textContent = active_graph.getContentPreview();
  nThmb_content[1].textContent = active_graph.getNumberOfNotes() + "Notes linked";
  active_graph_thmb.getElementsByClassName('item-thmb-tags')[0].replaceWith(self.tagsHTML(active_graph, true));
}

ItemListView.prototype.updateActiveGraphNoteCount = function(dom_el, active_graph){
  var self = this;
  if(self.objectOfDisplay === Note){ return; }

  // Get active graph thumb..
  let active_graph_thmb = dom_el.getElementsByClassName('item-thmb selected')[0],
      nThmb_content = active_graph_thmb.getElementsByClassName('item-thmb-content');
  
  console.log(nThmb_content);
  
  nThmb_content[1].textContent = active_graph.getNumberOfNotes() + "Notes linked";
}

ItemListView.prototype.updateNoteThmbColor = function(note){
  let target = document.getElementsByClassName('item-thmb selected')[0];
      c = target.getElementsByClassName('color-pickr-circle-thmb')[0];

  c.style.backgroundColor = note.bg_color;
}

ItemListView.prototype.showContextMenuFromTemplate = function(template){
  let menu = Menu.buildFromTemplate(template);
  menu.popup(remote.getCurrentWindow());
}

/**
 * Renders the UI for the Notes list with yo-yo.
 * 
 * @param {Project} project - Should be the currently active project
 */
ItemListView.prototype.render = function(project){
  var self = this;
  
  if(!project){ return; }

  // Could also check whether project is active here...
  var thumbs, notes, graphs, item_selection;
  if(self.objectOfDisplay === Note){

    // Get project notes
    if(project.search === null){
      notes = project.getAllNotes();
    }else{
      notes = project.search.notes.map(function(x){
        return x.note;
      });

      let chk = notes.filter(function(x){
        return x.compareTo(project.getActiveNote());
      })
      if(notes.length > 0 && chk.length === 0){
        project.toggleActiveNote(notes[0]);
      }
    }

    item_selection = project.getItemSelection();
    // if(item_selection.object !== Note){ console.error() }

    thumbs = notes.map(function(note){
      
      /* ====================================================================== */
      /*  Event Handlers - Note Item Thumbnail                                       */
      /* ====================================================================== */

      function clickItemThmb(e){
        self.focus_manager.setFocusObject(self.focus_manager.ITEM_LIST);
        if(app.views.app.ctrlOrCmdKey_active){
          self.send('toggleItemInSelection', note);
        }else if(app.views.app.shiftKey_active){
          self.send('shiftClickItemSelection', note);
        }else{
          console.log(project);
          console.log(note);
          self.send('transitionNote', project, note);
        }
      }

      function dblclickItemThmb(e){
        console.log("Double click on..");
        if(project.getGraphMode()){
          // Project in graph mode so switch to NoteEditor and then focus on note
          self.send('transitionNoteAndEditor', project, note);
        }else{  // Same as single click
          self.send('transitionNote', project, note);
        }
      }

      function rightclickItemThmb(e){
        self.send('transitionNoteContextMenu', project, note);
      }
      /* ====================================================================== */
      /* ====================================================================== */

      //var className = (note.isActive()) ? 'selected' : ''
      var className = (item_selection.shadows[notes.indexOf(note)]) ? 'selected' : '';
      
      let note_thumb = yo`
        <div class="item-thmb-wrap">
          <div class="item-thmb ${className}" data-object="note" data-id=${note.uuid} 
            onclick=${clickItemThmb} 
            ondblclick=${dblclickItemThmb}
            oncontextmenu=${rightclickItemThmb}>

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
      `;
    
      // Make item-thumbs draggable elements
      $(note_thumb).draggable({
        start: function(event,ui){
          $('body').css("cursor", "no-drop");
        },
        stop: function(event,ui){
          $('body').css("cursor", "initial");
        },
        revert: true, 
        helper: function(e,ui){
          //$($.parseHTML('<p style="background: pink">Copy!</p>'))
          let $clone = $(this).clone();
          $clone.children('.item-thmb').css({"background": "#f7f7f7", "border-bottom": "none"});
          
          let selection_size = project.getItemsFromSelection().length;
          if(selection_size > 1){
            var counter = {
              id: "draggable-counter",
            };
            var $span = $("<span>", counter);
            $span.html(selection_size.toString());
            $clone.append($span);
          }
          return $clone;
        }, 
        cursorAt: { left: 2, top: 2},
        appendTo: '#layout',
        distance: 20
      });

      return note_thumb;
    })

  }else{

    graphs = project.getAllGraphs();
    item_selection = project.getItemSelection();
    // if(item_selection.object !== Graph){ console.error(); }

    thumbs = graphs.map(function(graph){
      /* ====================================================================== */
      /*  Event Handlers - Graph Item Thumbnail                                       */
      /* ====================================================================== */

      function clickItemThmb(e){
        self.focus_manager.setFocusObject(self.focus_manager.ITEM_LIST);
        if(app.views.app.ctrlOrCmdKey_active){
          self.send('toggleItemInSelection', graph);
        }else if(app.views.app.shiftKey_active){
          self.send('shiftClickItemSelection', graph);
        }else{
          console.log(project);
          console.log(graph);
          self.send('transitionGraph', project, graph);
        }
        
      }

      function dblclickItemThmb(e){
        console.log("Double click on..");
        if(project.getGraphMode()){
          // Project in graph mode so switch to NoteEditor and then focus on note
          self.send('transitionGraph', project, graph);
        }else{  // Same as single click
          self.send('transitionGraphAndEditor', project, graph);
        }
      }

      function rightClickGraphThmb(e){
        self.send('transitionGraphContextMenu', project, graph);
      }

      /* ====================================================================== */
      /* ====================================================================== */

      // var className = (graph.isActive()) ? 'selected' : '';
      var className = (item_selection.shadows[graphs.indexOf(graph)]) ? 'selected' : '';
      
      let graph_thumb = yo`
        <div class="item-thmb-wrap">
          <div class="item-thmb ${className}" data-object="graph" data-id=${graph.uuid} 
            onclick=${clickItemThmb} 
            ondblclick=${dblclickItemThmb}
            oncontextmenu=${rightClickGraphThmb}>
            <div class="flex-wrap">
            <span class="item-thmb-head">${graph.getHeader()}</span>
            </div>
            <div class="flex-wrap">
              <span class="item-thmb-datetime">${DateFormatter.formatDateItemThmb(graph.getCreated())}:</span> <span class="item-thmb-content">${graph.getContentPreview()}</span>
            </div>
            <div class="flex-wrap">
              <span class="item-thmb-content">${graph.getNumberOfNotes()} Notes linked</span>
            </div>
            <div class="flex-wrap">
              ${self.tagsHTML(graph)}
            </div>
          </div>
        </div>
      `;
      return graph_thumb;
    })
  }

  function clickItemList(){
    self.focus_manager.setFocusObject(self.focus_manager.ITEM_LIST);
  }

  function scrollList(){
    // Save the scroll position in this instance
    console.log("Scroll position: " + this.scrollTop);
    self.scrollTop = this.scrollTop;
  }

  function clickSelectNotesList(){
    console.log("clickSelectNotesList");
    self.objectOfDisplay = Note;
    self.send('switchItemList', self.objectOfDisplay);
  }
  
  function clickSelectGraphsList(){
    console.log("clickSelectGraphsList");
    self.objectOfDisplay = Graph;
    self.send('switchItemList', self.objectOfDisplay);
  }
  
  function clickRecentlyDeletedList(){
    console.log("clickRecentlyDeletedList");
  }

  let notes_list = yo`
    <div onclick=${clickItemList}>
      ${function(){
        if(self.objectOfDisplay === Note){
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
        if(self.objectOfDisplay === Note && project.search !== null){
          return yo`
          <div id="item-list-head">
            <span class="item-thmb-head">Found ${notes.length} results</span> 
          </div>
          `
        }
      }()}
      ${function(){
        if(self.objectOfDisplay === Note && project.search !== null){
          return yo`<div id="item-list-scroll" class="search-active" onscroll=${scrollList}>
                      ${thumbs}
                    </div>`;
        }else{
          return yo`<div id="item-list-scroll" onscroll=${scrollList}>
            ${thumbs}
          </div>`;
        }
        
      }()}
      <!-- 
      <div id="item-list-ctrls-bottom">
        <span class="active" onclick=${clickRecentlyDeletedList}>Recently Deleted</span>
      </div>
      --> 
      </div>`;
  return notes_list;
  
}