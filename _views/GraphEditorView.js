module.exports = GraphEditorView

const EventEmitterElement = require('../_app/EventEmitterElement');
var inherits = require('util').inherits;
const remote = require('electron').remote;
const Menu = require('electron').remote.Menu;

const yo = require('yo-yo');
const d3 = require("d3");
const Tagify = require('@yaireo/tagify');

const DateFormatter = require('../_util/DateFormatter');
const UIAssistant = require('../_util/UIAssistant');


/**
 * GraphEditorView class that handles everything considering the 
 * Graph Creator.
 * 
 * @param {DOMElement} target - The DOM element of the UI for EventEmitter
 */
function GraphEditorView(target, focus_manager) {
  var self = this;
  EventEmitterElement.call(this, target);

  this.app = target;

  this.focus_manager = focus_manager;

  this.RENDER_TIMEOUT = 50;
  this.dragTimeout = null;
  this.POSITION_SAVE_INTERVAL = 2000;   // Save repositioning the vertices every 3s
  this.zoomTimeout = null;
  this.ZOOM_TIMER_INTERVAL = 500;
  this.descriptionTimeout = null;
  this.DESCRIPTION_TIMER_INTERVAL = 1000;

  this.openSidemenu = false;
  this.descInputSelectionStart = 0;
  this.descInputSelectionEnd = 0;

  // this.dirty_bit = false
  this.dirty_vertices = [];

  // Graph object which is currently rendered
  this.graph = null;
  // Grahpic related variables
  this.svg = null;
  this.paths = null;
  this.circles = null;
  
  this.consts =  {
    selectedClass: "selected",
    connectClass: "connect-node",
    nodeClass: "noteForeignObj",
    graphClass: "graph",
    activeEditId: "active-editing",
    BACKSPACE_KEY: 8,
    DELETE_KEY: 46,
    ENTER_KEY: 13,
    nodeRadius: 50
  };
}
inherits(GraphEditorView, EventEmitterElement)


/**
 * (Re)Initialises the GraphEditorView
 * 
 * @param {DOMElement} svg    - The svg the GraphCreator is initialised on
 * @param {[Vertex]} nodes - Array of nodes
 * @param {[Edge]} edges - Array of edges
 */

GraphEditorView.prototype.init = function(svg){
  var self = this;

  console.log("GraphEditorView init()...");
  
  if (self.dragTimeout !== null) {
    clearTimeout(self.dragTimeout);
  }
  if (self.zoomTimeout !== null){
    clearTimeout(self.zoomTimeout);
  }

  self.paths = null;
  self.circles = null;

  self.state = {
    selectedNode: null,
    selectedEdge: null,
    mouseDownNode: null,
    //mouseDownD3Node: null,
    mouseDownLink: null,
    //mouseDownD3Link: null,
    justDragged: false,
    justScaleTransGraph: false,
    lastKeyDown: -1,
    shiftNodeDrag: false,
    selectedText: null,
    vertexContextMenu: false,
    dragInitiated: false,
    zoomInitiated: false,
  };

  // define arrow markers for graph links
  var defs = svg.append('svg:defs');
  defs.append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', "32")
    .attr('markerWidth', 2)     // 3.5
    .attr('markerHeight', 2)    // 3.5
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5');

  // define arrow markers for leading arrow
  defs.append('svg:marker')
    .attr('id', 'mark-end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 7)
    .attr('markerWidth', 2)     // 3.5
    .attr('markerHeight', 2)    // 3.5
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5');

  self.svg = svg;
  self.svgG = svg.append("g")
        .classed(self.consts.graphClass, true);
  var svgG = self.svgG;

  // displayed when dragging between nodes
  self.dragLine = svgG.append('svg:path')
        .attr('class', 'link dragline hidden')
        .attr('d', 'M0,0L0,0')
        // .style('marker-end', 'url(#mark-end-arrow)');

  self.center = svgG.append('svg:path')
        .attr('class', 'graph-center')
        .attr('d', 'M-15,0 L15,0 M0,-15 L0,15 Z')
        .attr('stroke', '#666666')
        .attr('stroke-width', '1');

  // svg nodes and edges
  self.paths = svgG.append("g").selectAll("g");
  self.circles = svgG.append("g").selectAll("g");

  // Drag behaviour for the vertices
  self.drag = d3.behavior.drag()
        .origin(function(d){
            console.log("ORIGIN: ");
            console.log(d);
            return {x: d.posX, y: d.posY}; // self.calcNodeCenter(d3.select(this), d)
        })
        .on("dragstart", function(d){
          if(d3.event.sourceEvent.button === 0){
            self.state.dragInitiated = true;

            if (!d3.event.sourceEvent.shiftKey) d3.select(this).style("cursor", "grab");
          }
        })
        .on("drag", function(d){
          if(self.state.dragInitiated){
            console.log("DRAG");
            self.state.justDragged = true;
            self.dragmove.call(self, d);
          }
        })
        .on("dragend", function(d) {
          if(d3.event.sourceEvent.button === 0){
            console.log("DRAGEND:");
            console.log(d);

            self.state.dragInitiated = false;

            // todo check if edge-mode is selected

            if(self.dirty_vertices.indexOf(d) < 0){
              self.dirty_vertices.push(d);
            }
            
            // Set/Reset timer for writing to database
            if (self.dragTimeout !== null) {
              clearTimeout(self.dragTimeout);
            }
            self.dragTimeout = setTimeout(function() {
              self.dragTimeout = null;  

              console.log("TIMEOUT: Writing dirty vertices to database.")
              for(var i in self.dirty_vertices){
                console.log(self.dirty_vertices[i]);
                self.dirty_vertices[i].saveData();
              }
              
              self.dirty_vertices = [];
              
            }, self.POSITION_SAVE_INTERVAL);

            d3.select(this).style("cursor", "auto");
          }
        });

  // listen for key events
  d3.select(window).on("keydown", function(){
    self.svgKeyDown.call(self);
  })
  .on("keyup", function(){
    self.svgKeyUp.call(self);
  });
  svg.on("mousedown", function(d){self.svgMouseDown.call(self, d);});
  svg.on("mouseup", function(d){self.svgMouseUp.call(self, d);});
  svg.on("contextmenu", function(d){
    d3.event.stopImmediatePropagation();
    let xycoords = d3.mouse(self.svgG.node()),
        coords = {x: xycoords[0], y: xycoords[1]};
    
    self.showSvgContextMenu.call(self, d3.select(this), d, coords);
  });

  // Listen for drag and zoom behavior on the svg
  self.dragSvg = d3.behavior.zoom()
        .on("zoom", function(){
          // if(self.state.zoomInitiated){
            console.log("ZOOM");
            if (d3.event.sourceEvent.shiftKey){
              // TODO  the internal d3 state is still changing
              return false;
            }else{
              // if(d3.event.sourceEvent.metaKey || d3.event.sourceEvent.ctrlKey){
                self.zoomed.call(self);
              // }
            }
            return true;
          // }
        })
        .on("zoomstart", function(){
          console.log("zoomstart called..")
          // if(d3.event.sourceEvent.type === "wheel" || d3.event.sourceEvent.button === 0){
            console.log("ZOOMSTART");
            self.state.zoomInitiated = true;

            var ael = d3.select("#" + self.consts.activeEditId).node();
            if (ael){
              ael.blur();
            }
            if (!d3.event.sourceEvent.shiftKey) d3.select('#graph-editor').style("cursor", "move");
          // }
        })
        .on("zoomend", function(){
          console.log(d3.event.sourceEvent)
          // if(!d3.event.sourceEvent || d3.event.sourceEvent.button === 0){
            console.log("ZOOMEND");
            self.state.zoomInitiated = false;
            d3.select('#graph-editor').style("cursor", "auto");
          // }
        });

  svg.call(self.dragSvg).on("dblclick.zoom", null);

  // listen for resize
  window.onresize = function(){ self.updateWindow(); };
}

/**
 * Called when GraphEditor is unfocused 
 *  e.g. switching to note editor
 */
GraphEditorView.prototype.takedown = function(){
  d3.select(window)
  .on("keydown", null)
  .on("keyup", null)
  .on("resize", null);
}

// PROTOTYPE FUNCTIONS 
GraphEditorView.prototype.dragmove = function(d) {
  var self = this;

  if (self.state.shiftNodeDrag){
    // Create & drag edge
    let midCoords = d.calcDOMCenterCoords();
    self.dragLine.attr('d', 'M' + midCoords.x  + ',' + midCoords.y + 'L' + d3.mouse(self.svgG.node())[0] + ',' + d3.mouse(this.svgG.node())[1]);
  } else{ 
    // or move the node
    d.posX += d3.event.dx;
    d.posY +=  d3.event.dy;

    self.updateGraph(d.getGraph());
  }
};

GraphEditorView.prototype.replaceSelectEdge = function(d3Path, edgeData){
  var self = this;
  d3Path.classed(self.consts.selectedClass, true);
  if (self.state.selectedEdge){
    self.removeSelectFromEdge();
  }
  self.state.selectedEdge = edgeData;
};

GraphEditorView.prototype.replaceSelectNode = function(d3Node, nodeData){
  var self = this;
  d3Node.classed(this.consts.selectedClass, true);
  if (self.state.selectedNode){
    self.removeSelectFromNode();
  }
  self.state.selectedNode = nodeData;
};

GraphEditorView.prototype.replaceSelectNodeExternal = function(vertex){
  var self = this;
  let d3node = self.getD3NodeByVertex(vertex);
  self.replaceSelectNode(d3node, vertex);
}

GraphEditorView.prototype.removeSelectFromNode = function(){
  var self = this;
  if(!self.state.selectedNode){ return; }
  self.circles.filter(function(cd){
    return cd.uuid === self.state.selectedNode.uuid;
  }).classed(self.consts.selectedClass, false);
  self.state.selectedNode = null;
};

GraphEditorView.prototype.removeSelectFromEdge = function(){
  var self = this;
  self.paths.filter(function(cd){
    return cd === self.state.selectedEdge;
  }).classed(self.consts.selectedClass, false);
  self.state.selectedEdge = null;
};

GraphEditorView.prototype.pathMouseDown = function(d3path, d){
  if(d3.event.button !== 0){ return; }
  var self = this,
      state = self.state;
  d3.event.stopPropagation();
  state.mouseDownLink = d;

  if (state.selectedNode){
    self.removeSelectFromNode();
  }

  var prevEdge = state.selectedEdge;
  if (!prevEdge || prevEdge !== d){
    self.replaceSelectEdge(d3path, d);
  } else{
    self.removeSelectFromEdge();
  }
};

// mousedown on node
GraphEditorView.prototype.circleMouseDown = function(d3node, d){
  if(d3.event.button !== 0){ return; }
  var self = this,
      state = self.state;
  d3.event.stopPropagation();
  state.mouseDownNode = d;

  if (d3.event.shiftKey){
    state.shiftNodeDrag = d3.event.shiftKey;
    // reposition dragged directed edge
    let midCoords = d.calcDOMCenterCoords(d);
    self.dragLine.classed('hidden', false)
      .attr('d', 'M' + midCoords.x + ',' + midCoords.y + 'L' + midCoords.x + ',' + midCoords.y );
    return;
  }
};

// mouseup on nodes
GraphEditorView.prototype.circleMouseUp = function(d3node, d){
  if(d3.event.button !== 0){ return; }
  var self = this,
      state = self.state,
      consts = self.consts;

  // reset the states
  state.shiftNodeDrag = false;
  d3node.classed(consts.connectClass, false);

  var mouseDownNode = state.mouseDownNode;

  if (!mouseDownNode) return;

  self.dragLine.classed("hidden", true);

  if (mouseDownNode !== d){
    // we're in a different node: create new edge for mousedown edge and add to graph
    var vPair = { source: mouseDownNode, target: d };
    self.send('createNewEdgeInGraph', vPair);
  } else{
    // we're in the same node
    if (state.justDragged) {
      // dragged, not clicked
      state.justDragged = false;
    } else{
      // clicked, not dragged
      if (d3.event.shiftKey){
        // Nothing
      } else{
        if (state.selectedEdge){
          self.removeSelectFromEdge();
        }
        var prevNode = state.selectedNode;

        if (!prevNode || prevNode.uuid !== d.uuid){
          self.replaceSelectNode(d3node, d);
          self.send('transitionNote', d.note.project, d.note, 'graph-node');
        } else{
          self.removeSelectFromNode();
        }
      }
    }
  }
  state.mouseDownNode = null;
  // state.mouseDownD3Node = null;
  return;

}; // end of circles mouseup

// mousedown on main svg
GraphEditorView.prototype.svgMouseDown = function(){
  var stop = d3.event.button || d3.event.ctrlKey || d3.event.metaKey;
  if (stop) d3.event.stopImmediatePropagation();

  this.state.graphMouseDown = true;
};

GraphEditorView.prototype.mousePositionSVG = function(){
  var self = this;

  var xycoords = d3.mouse(self.svgG.node());
  console.log("Mouse Posisch in Svg: ");
  console.log(xycoords);
}

// mouseup on main svg
GraphEditorView.prototype.svgMouseUp = function(){
  var self = this,
      state = self.state;
  if (state.justScaleTransGraph) {
    // dragged not clicked
    state.justScaleTransGraph = false;
  }else if(self.state.vertexContextMenu){
    self.state.vertexContextMenu = false;
    d3.event.stopImmediatePropagation();
  }else if (state.graphMouseDown && d3.event.shiftKey){ 
    // clicked not dragged from svg

    // CREATE NEW NOTE/VERTEX
    var xycoords = d3.mouse(self.svgG.node());
    console.log("Create new vertex: ");
    console.log(xycoords);
    var coords = {x: xycoords[0], y: xycoords[1]};

    self.send('createNewNoteVertexGraph', coords);

  } else if (state.shiftNodeDrag){
    // dragged from node
    state.shiftNodeDrag = false;
    self.dragLine.classed("hidden", true);
  }
  state.graphMouseDown = false;
};

// keydown on main svg
GraphEditorView.prototype.svgKeyDown = function() {
  var self = this,
      state = self.state,
      consts = self.consts;
  // make sure repeated key presses don't register for each keydown
  if(state.lastKeyDown !== -1) return;

  state.lastKeyDown = d3.event.keyCode;
  var selectedNode = state.selectedNode,
      selectedEdge = state.selectedEdge;

  switch(d3.event.keyCode) {
  case consts.DELETE_KEY:
    d3.event.preventDefault();
  case consts.BACKSPACE_KEY:
    if ( this.focus_manager.getFocusObject() === this.focus_manager.GRAPH_EDITOR
      && selectedNode){
      // Remove from dirty vertices to not get written to database again.
      let v_ids = self.dirty_vertices.map(function(v) { return v.uuid; });
      let idx = v_ids.indexOf(selectedNode.uuid);
      console.log(v_ids);
      console.log(idx);
      if(idx >= 0){
        console.log("Remove deleted vertex from dirty vertices list");
        self.dirty_vertices.splice(idx, 1);
      }
      console.log("After removing from dirty vertices");
      console.log(self.dirty_vertices);
      self.send('deleteVertexInGraph', selectedNode);
    } else if (selectedEdge){
      self.send('deleteEdgeInGraph', selectedEdge);
    }
    break;
  }
};

GraphEditorView.prototype.svgKeyUp = function() {
  this.state.lastKeyDown = -1;
};

GraphEditorView.prototype.makeTagsHTMLString = function(tags){
  if(tags.length === 0){ return ''; }
  let tags_html_str = `<div class="graph-note-tags">`;
  tags.map(function(tag){
    tags_html_str += `<span>${tag.name}</span>`;
  })
  tags_html_str += `</div>`;
  return tags_html_str;
}

GraphEditorView.prototype.applyProjectSearch = function(search){
  var self = this;
  self.circles.each(function(d){
    let gnNode = d3.select(this).select('.graph-note').node();
    if(search === null){
      gnNode.classList.remove("blurred");
    }else{
      let chk = search.notes.filter(function(x){
        return x.note.compareTo(d.note);
      })
      if(chk.length === 0){
        gnNode.classList.add("blurred");
      }else{
        gnNode.classList.remove("blurred");
      }
    }
  })
}

GraphEditorView.prototype.showSvgContextMenu = function(d3node, d, coords){
  var self = this;
  let template = [
    {
      label: 'Create New Note',
      click: () => {
        console.log("Context-Menu - Create New Note Vertex:");
        self.send('createNewNoteVertexGraph', coords);
      }
    },
    { type: 'separator'}
  ];
  let menu = Menu.buildFromTemplate(template);
  menu.popup(remote.getCurrentWindow());
}

GraphEditorView.prototype.showEdgeContextMenu = function(d3node, d){
  var self = this;
  let template = [
    {
      label: 'Delete Edge',
      click: () => {
        console.log("Context-Menu - 'Delete Edge' clicked on element:")
        self.send('deleteEdgeInGraph', d);
      }
    },
  ];
  let menu = Menu.buildFromTemplate(template);
  menu.popup(remote.getCurrentWindow());
}

GraphEditorView.prototype.showVertexContextMenu = function(d3node, d){
  var self = this;

  self.state.vertexContextMenu = true;
  let template = [
    {
      label: 'Open Note Editor',
      click: () => {
        console.log("Context-Menu - Open Note Editor clicked on element:")
        self.send('transitionNoteAndEditor', d.note.project, d.note);
      }
    },
    { type: 'separator'},
    {
      label: 'Create New Link',
      click: () => {
        console.log("Context-Menu - Create New Link clicked on element:")
        self.send('createNewNoteLinkedVertexGraph', d);
      }
    },
    { type: 'separator'},
    {
      label: 'Delete from Graph',
      click: () => {
        console.log("Context-Menu - Delete from Graph clicked on element:")
        self.send('deleteVertexInGraph', d);
      }
    },

  ];
  let menu = Menu.buildFromTemplate(template);
  menu.popup(remote.getCurrentWindow());
  console.log("showVertexContextMenu");
}

// Call to propagate changes to graph
GraphEditorView.prototype.updateGraph = function(graph = null){
  var self = this;
  
  if(!self.graph){
    console.error("GraphEditorView: Graph variable not set.");
    return;
  }

  // console.log(self.graph);
  let active_project = self.graph.project;
  let active_note = active_project.getActiveNote();

  // Update existing nodes 
  // Should happen before edges as the width and height attributes are set dynamically on depending on the content.
  // Associate vertex data in the graph controller with the UI elements
  self.circles = self.circles.data(self.graph.vertices, function(d){ return d.uuid;});

  self.circles.attr("transform", function(d){return "translate(" + d.posX + "," + d.posY + ")";});

  // Add new nodes
  var newGs = self.circles.enter()
        .append("foreignObject");

  newGs.classed(self.consts.nodeClass, true)
    .attr("width", 427)    // "80%"
    .attr("height", 1)     
    .attr("overflow", "visible")
    .attr("transform", function(d){return "translate(" + d.posX + "," + d.posY + ")";})
    .append("xhtml:div")
      .attr('class', 'graph-note')
      .attr('width', 427);
      
  newGs.each(function(d){
    let foreignObj = d3.select(this),
        graph_note_html = foreignObj.select('.graph-note');

    // Set background color of graph-note
    graph_note_html.style("background", d.note.bg_color);
    
    // Create content and insert..
    let html_str = `
      <div class="graph-note-header">
        <div class="datetime">
          <span id="dt-created">Created: ${DateFormatter.formatDateEditor(d.note.created)}</span>
        </div>
          ${self.makeTagsHTMLString(d.note.getTags())}
      </div>
      <div class="graph-note-content" >
        ${d.note.getContent()}
      </div>
    `;
    graph_note_html.html(html_str);

    let gnNode = graph_note_html.node();
    // Associate vertex' UI dimensions with its data
    if(!d.width_dom || d.width_dom === 0){
      d.width_dom = gnNode.offsetWidth;
    }
    if(!d.height_dom || d.height_dom === 0){
      d.height_dom = gnNode.offsetHeight;
    }
    
    // Adjust the height to content
    foreignObj.attr("width", d.width_dom).attr("height", d.height_dom)
    .on("mouseover", function(d){
      if (self.state.shiftNodeDrag){
        d3.select(this).classed(self.consts.connectClass, true);
      }
    })
    .on("mouseout", function(d){
      d3.select(this).classed(self.consts.connectClass, false);
    })
    .on("mousedown", function(d){
      self.circleMouseDown.call(self, d3.select(this), d);
    })
    .on("mouseup", function(d){
      self.circleMouseUp.call(self, d3.select(this), d);
    }).on("contextmenu", function(d){
      d3.event.stopImmediatePropagation();
      self.showVertexContextMenu.call(self, d3.select(this), d);
    })
    .call(self.drag);
  });

  // Remove old nodes
  self.circles.exit().remove();

  // Select vertex associated with active note if existing.
  let vertex = self.graph.getVertexForNote(active_note);
  if(vertex){
    // Set selectedNode in GraphEditor
    self.replaceSelectNodeExternal(vertex);
  }

  // Associate edges data in the graph controller with the UI elements
  self.paths = self.paths.data(self.graph.edges, function(d){
    return String(d.source.uuid) + "+" + String(d.target.uuid);
  });
  var paths = self.paths;

  // Update existing paths
  paths.classed(self.consts.selectedClass, function(d){
      // TODO: User proper compare
      return d === self.state.selectedEdge;
    })// .style('marker-end', 'url(#end-arrow)')
    .attr("d", function(d){
      // TODO: Refactor the to use Wrapper
      let source_midCoords = d.source.calcDOMCenterCoords();
      let target_midCoords = d.target.calcDOMCenterCoords();
      return "M" + source_midCoords.x + "," + source_midCoords.y + "L" + target_midCoords.x + "," + target_midCoords.y;
    });

  // Add new paths
  paths.enter()
    .append("path")
    // .style('marker-end','url(#end-arrow)')
    .classed("link", true)
    .attr("d", function(d){
      // console.log(d)
      let source_midCoords = d.source.calcDOMCenterCoords();
      let target_midCoords = d.target.calcDOMCenterCoords();
      
      return "M" + source_midCoords.x + "," + source_midCoords.y + "L" + target_midCoords.x + "," + target_midCoords.y;
    })
    .on("mousedown", function(d){
      self.pathMouseDown.call(self, d3.select(this), d);
      }
    )
    .on("mouseup", function(d){
      self.state.mouseDownLink = null;
    })
    .on("contextmenu", function(d){
      d3.event.stopImmediatePropagation();
      self.showEdgeContextMenu.call(self, d3.select(this), d);
    });

  // Remove old links
  paths.exit().remove();

  self.setGraphPosition(
    self.graph.position.translate.x,
    self.graph.position.translate.y,
    self.graph.position.scale
    );
  
  self.applyProjectSearch(active_project.search);
};

GraphEditorView.prototype.zoomed = function(){
  let self = this;
  this.state.justScaleTransGraph = true;
  let d3_translate = d3.event.translate,
      d3_scale = d3.event.scale;
  let trans_setting = "translate(" + d3_translate + ") ";
  if(d3_scale < 0.015){
    self.dragSvg.scale(0.015);
    trans_setting += "scale(0.015)";
  }else if(d3_scale > 5){
    self.dragSvg.scale(5);
    trans_setting += "scale(5)";
  }else{
    trans_setting += "scale(" + d3_scale + ")";
  }
  // Set graph to d3 transformation values
  d3.select("." + this.consts.graphClass)
    .attr("transform", trans_setting);

  // Set/Reset timer for writing graph position database
  if (self.zoomTimeout !== null) {
    clearTimeout(self.zoomTimeout);
  }
  self.zoomTimeout = setTimeout(function() {
    self.zoomTimeout = null;  

    // Set data in controller and database
    self.graph.position = {
      translate: {
        x: d3_translate[0],
        y: d3_translate[1]
      },
      scale: d3_scale
    }
    self.graph.savePosition();

  }, self.ZOOM_TIMER_INTERVAL);  
};

GraphEditorView.prototype.updateWindow = function(){
  var self = this;

  var style = getComputedStyle(document.getElementById('content'));
  var x = style.width;
  var y = style.height;
  self.svg.attr("width", x).attr("height", y);
};

/**
 * Get d3 selection of UI element associated with given vertex
 *
 * @param {Vertex} vertex - The vertex for which the UI element is fetched.
 */
GraphEditorView.prototype.getD3NodeByVertex = function(vertex){
  let self = this;
  let el = null;
  self.circles.each(function(d){
    if(d.uuid.localeCompare(vertex.uuid) === 0){
      el = d3.select(this);
    }
  })
  return el;
}

/**
 * Calculates the position at which a vertex will be placed in the svg
 * on drag'n'drop.
 * Coordinates relative to the graph <g> element origin.
 * 
 * NOTE: This is a hack, because mouse position can not be fetched without click event.
 * 
 * @param {Object} drop_pos -- Drop position coordinates of draggable object relative 
 *                             to the body element. 
 */
GraphEditorView.prototype.calcRelativeDropZone = function(drop_pos){
  let self = this;

  let measures_svg = self.svg.node().getBoundingClientRect(),
      zoomTransX = self.dragSvg.translate()[0],
      zoomTransY = self.dragSvg.translate()[1],
      scale = self.dragSvg.scale();
  

  let x_svg = drop_pos.left - measures_svg.left;
  let y_svg = drop_pos.top - measures_svg.top;

  return {
    x: (x_svg - zoomTransX) / scale, 
    y: (y_svg - zoomTransY) / scale
  }
}

GraphEditorView.prototype.resetZoom = function(){
    var self = this;

    let bounds_svg = self.svg.node().getBoundingClientRect(),
        bounds_vertices = self.graph.getVerticesBoundingBox();

    let scaleWidth = bounds_svg.width / bounds_vertices.width,
        scaleHeight = bounds_svg.height / (bounds_vertices.height === 0) ? 1.0 : bounds_vertices.height,
        SCALE_MARGIN = 0.1;

    //let rescale = (scaleWidth < scaleHeight) ? scaleWidth - SCALE_MARGIN : scaleHeight - SCALE_MARGIN;
    let rescale = (scaleWidth < scaleHeight) ? scaleHeight : scaleWidth;

    // let marginX = (bounds_svg.width - bounds_vertices.width * rescale) / 2,
    //     marginY = (bounds_svg.height - bounds_vertices.height * rescale) / 2;

    let transX = -bounds_vertices.startX * rescale,
        transY = -bounds_vertices.startY * rescale;
    // let transX = (-bounds_vertices.startX < 0) ? -bounds_vertices.startX * rescale + marginX : -bounds_vertices.startX * rescale - marginX,
    //     transY = (-bounds_vertices.startY < 0) ? -bounds_vertices.startY * rescale - marginY : -bounds_vertices.startY * rescale + marginY;    
    self.setGraphPosition(transX, transY, rescale);
    // Update the controllers
    self.graph.position = {
      translate: {
        x: transX,
        y: transY
      },
      scale: rescale
    }
    self.graph.savePosition();
}

GraphEditorView.prototype.setGraphPosition = function(transX, transY, scale){
  var self = this;
  d3.select("." + self.consts.graphClass).attr("transform", "translate(" + transX + "," + transY + ") scale(" + scale + ")");
  self.dragSvg.translate([ transX, transY ]).scale(scale);
}

GraphEditorView.prototype.forceClearContentDOMEl = function(){
  document.getElementById("content").innerHTML = "";
}

/* ============================================================================== */
/* ============================================================================== */


/**
 * Returns a (white)list of key-value pairs of global project tags
 * @param {Project} project 
 */
GraphEditorView.prototype.fetchWhitelist = function(project){
  let p_tag_objs = project.getAllTags();
  let wL = p_tag_objs.map(function(t) { return { value: t.name }; });
  return wL;
}


GraphEditorView.prototype.addTag = function(e, tagify){
  var self = this;
  // Add tag to list & database
  self.graph.addTag(e.detail.data.value);
  // Update whitelist of tagify input
  let new_wL = this.fetchWhitelist(self.graph.project);
  // Reset tagify whitelist
  tagify.settings.whitelist.length = 0;
  // Update tagify whitelist
  tagify.settings.whitelist.splice(0, new_wL.length, ...new_wL);
  // Trigger update of graph list
  self.send("updateByGraphEditorContent", self.graph);
}


GraphEditorView.prototype.removeTag = function(e, tagify){
  var self = this;
  // Remove tag from list & database
  self.graph.removeTag(e.detail.data.value);
  let new_wL = this.fetchWhitelist(self.graph.project);
  // Reset tagify whitelist
  tagify.settings.whitelist.length = 0;
  // Update tagify whitelist
  tagify.settings.whitelist.splice(0, new_wL.length, ...new_wL);
  // Trigger update of notes list
  self.send("updateByGraphEditorContent", self.graph);
}


GraphEditorView.prototype.updateTag = function(e, tagify){
  var self = this;
  // Update tag in list & database
  self.graph.updateTag(e.detail.data.value, e.detail.previousData.value);
  // Update white list
  let new_wL = this.fetchWhitelist(self.graph.project);
  // Reset tagify whitelist
  tagify.settings.whitelist.length = 0;
  // Update tagify whitelist
  tagify.settings.whitelist.splice(0, new_wL.length, ...new_wL);
  // Trigger update of notes list
  self.send("updateByGraphEditorContent", self.graph);
}

/**
 * Creates a list with the tag values each wrapped in JSON object
 * 
 * Takes array of tags as JSON objects
 * 
 * @param {[{Obj}]} tags 
 */
GraphEditorView.prototype.makeTagifyValues = function(tags){
  if(!tags){ return; }
  return JSON.stringify(tags.map(function(tag){ return { "value": tag.name } }));
}

GraphEditorView.prototype.toggleRightSideMenu = function(){
  let self = this;
  let el = document.getElementById('right-side-menu'),
        overlay = document.getElementById('graph-shade-overlay');
  
  if(el.classList.contains('hidden')){
    el.classList.remove('hidden');
    overlay.classList.remove('hidden');
    self.openSidemenu = true;
    el.getElementsByTagName('textarea')[0].focus();
  }else{
    el.classList.add('hidden');
    overlay.classList.add('hidden');
    self.openSidemenu = false;
  }
}

/**
 * Renders the GraphEditorView for a given graph
 * @param {Graph} graph 
 */
GraphEditorView.prototype.render = function(project){
  var self = this;

  // Reset GraphEditorView state
  // self.resetEditorState()

  //if(!session){ return }
  
  function clickGraphEditor(e){
    self.focus_manager.setFocusObject(self.focus_manager.GRAPH_EDITOR);
  }

  function clickResetZoom(e){
    self.resetZoom();
  }

  function clickGraphShadowOverlay(e){
    self.toggleRightSideMenu();
  }

  var style = getComputedStyle(document.getElementById('content')),
      width = style.width,
      height = style.height;

  var hiddenClass = (self.openSidemenu) ? '' : 'hidden';
  var graph_view = yo`
    <div id="graph-editor" onclick=${clickGraphEditor}>
      <div id="graph-shade-overlay" class="shadow-overlay ${hiddenClass}" onclick=${clickGraphShadowOverlay}></div>
      <svg xmlns="http://www.w3.org/2000/svg" ></svg>
    
      <div id="toolbox">
        <span onclick=${clickResetZoom}>
          <i class="fas fa-compress-arrows-alt"></i>
        </span>
      </div>
    </div>
  `;
  
  let elem = graph_view.getElementsByTagName('svg')[0];
  var svg = d3.select(elem)
    .attr("width", width)
    .attr("height", height);
    console.log(elem);

  self.graph = project.getActiveGraph();
  
  self.init(svg);

  // Timer necessary so that rendering in updateGraph happens correctly.
  setTimeout(function() {
    self.updateGraph()
  }, this.RENDER_TIMEOUT);

  return graph_view;
}

GraphEditorView.prototype.renderRightSideMenu = function(){
  let self = this;

  function clickRightMenu(e){
    self.focus_manager.setFocusObject(self.focus_manager.RIGHT_MENU);
  }
  function clickRightMenuToggle(e){
    console.log("clickRightMenuToggle");
    
    self.toggleRightSideMenu();
  }
  function clickDescriptionTextarea(e){
    self.descInputSelectionStart = this.selectionStart;
    self.descInputSelectionEnd = this.selectionEnd;
  }
  function inputDescriptionTextarea(e){
    UIAssistant.resizeElementByContent(this);
  }
  function keyupDescriptionTextarea(e){
    // Store cursor position..
    self.descInputSelectionStart = this.selectionStart;
    self.descInputSelectionEnd = this.selectionEnd;

    // Save text to graph object
    self.graph.description = this.value;

    // Remove carriage returns and split at \newlines
    let chk = self.graph.needThumbUpdate(self.descInputSelectionStart,
      self.descInputSelectionEnd);
    if(chk){
      console.log("WOULD UPDATE GRAPH THUMBNAIL");
      self.send('updateByGraphEditorContent', self.graph);
    }

    if(self.descriptionTimeout !== null){
      clearTimeout(self.descriptionTimeout);
    }
    self.descriptionTimeout = setTimeout(function(){
      self.descriptionTimeout = null;

      // Persist to database
      if(self.graph){
        self.graph.saveDescription();
        console.log("TIMEOUT: Write graph description to database.");
      }
    }, self.DESCRIPTION_TIMER_INTERVAL);
  }
  
  var hiddenClass = (self.openSidemenu) ? '' : 'hidden'; 

  let menu = yo`<div id="right-side-menu" class="${hiddenClass}" onclick=${clickRightMenu}>
        <div id="right-menu-toggle" onclick=${clickRightMenuToggle}><i class="fas fa-chevron-right"></i></div>
        <div id="right-menu-content" class="side-menu-content">
          <span>Graph Description</span>
          <textarea id="graph-description" wrap="soft" 
          placeholder="Title & description..."
          onclick=${clickDescriptionTextarea}
          oninput=${inputDescriptionTextarea}
          onkeyup=${keyupDescriptionTextarea}>${self.graph.getContent()}</textarea>

          <textarea style="background: white" name='note-tags' placeholder='Tags...'>
          ${self.makeTagifyValues(self.graph.getTags())}
          </textarea> 
        </div>
      </div>`;

  /**
   * Initialise tagify input on the UI fragment.
   */
  var input = menu.querySelector('textarea[name=note-tags]');
  // Create tagify tag input on textarea
  self.tagify = new Tagify(input, {
    pattern          : /^[a-zA-ZäöüÄÖÜß0-9\-_]{0,40}$/,
    enforceWhitelist : false,
    maxTags          : 12,
    delimiters       : ",",
    whitelist        : this.fetchWhitelist(self.graph.project),
    callbacks        : {
      "add"    : (e) => { self.addTag(e, self.tagify) },
      "remove" : (e) => { self.removeTag(e, self.tagify) },
      "edit:updated": (e) => { self.updateTag(e, self.tagify) }
    }
  });

  return menu;
}