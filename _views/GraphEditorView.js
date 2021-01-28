module.exports = GraphEditorView

const EventEmitterElement = require('../_app/EventEmitterElement')
var inherits = require('util').inherits

var yo = require('yo-yo')

const d3 = require("d3");


/**
 * GraphEditorView class that handles everything considering the 
 * Graph Creator.
 * 
 * @param {DOMElement} target - The DOM element of the UI for EventEmitter
 */
function GraphEditorView(target) {
  var self = this
  EventEmitterElement.call(this, target)

  this.globalTimeout = null
  this.SAVE_INTERVAL = 3000   // Save text content every 4s

  this.dirty_bit = false

  // Graph related variables
  this.svg = null
  this.paths = null
  this.circles = null
  

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
  }

}
inherits(GraphEditorView, EventEmitterElement)


/**
 * (Re)Initialises the GraphEditorView
 * @param {} svg    - The svg the GraphCreator is initialised on
 * @param {*} nodes - Array of nodes
 * @param {*} edges - Array of edges
 */

GraphEditorView.prototype.init = function(svg, nodes, edges){
  var self = this;
  //self.idct = 0;


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
    selectedText: null
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
        .style('marker-end', 'url(#mark-end-arrow)');

  // svg nodes and edges
  self.paths = svgG.append("g").selectAll("g");
  self.circles = svgG.append("g").selectAll("foreignObject");

  self.drag = d3.behavior.drag()
        .origin(function(d){
          console.log("drag: ")
          console.log(d)
          return {x: d.posX, y: d.posY}; // self.calcNodeCenter(d3.select(this), d)
        })
        .on("drag", function(d){
          self.state.justDragged = true;
          self.dragmove.call(self, d);
        })
        .on("dragend", function() {
          // todo check if edge-mode is selected
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

  // listen for dragging
  var dragSvg = d3.behavior.zoom()
        .on("zoom", function(){
          if (d3.event.sourceEvent.shiftKey){
            // TODO  the internal d3 state is still changing
            return false;
          } else{
            self.zoomed.call(self);
          }
          return true;
        })
        .on("zoomstart", function(){
          var ael = d3.select("#" + self.consts.activeEditId).node();
          if (ael){
            ael.blur();
          }
          if (!d3.event.sourceEvent.shiftKey) d3.select('#graph-editor').style("cursor", "move");
        })
        .on("zoomend", function(){
          d3.select('#graph-editor').style("cursor", "auto");
        });

  svg.call(dragSvg).on("dblclick.zoom", null);

  // listen for resize
  // document.getElementById('#content')
  window.onresize = function(){self.updateWindow();};

}

/**
 * Called when GraphEditor is unfocused 
 *  e.g. switching to note editor
 */
GraphEditorView.prototype.takedown = function(){
  d3.select(window)
  .on("keydown", null)
  .on("keyup", null)
  .on("resize", null)
}

// PROTOTYPE FUNCTIONS 

GraphEditorView.prototype.dragmove = function(d) {
  var self = this;

  if (self.state.shiftNodeDrag){
    // Create & drag edge
    let midCoords = d.calcNodeCenter()
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

GraphEditorView.prototype.removeSelectFromNode = function(){
  var self = this;
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
  var self = this,
      state = self.state;
  d3.event.stopPropagation();
  state.mouseDownNode = d;


  if (d3.event.shiftKey){
    state.shiftNodeDrag = d3.event.shiftKey;
    // reposition dragged directed edge
    let midCoords = self.calcNodeCenter(d)
    self.dragLine.classed('hidden', false)
      .attr('d', 'M' + midCoords.x + ',' + midCoords.y + 'L' + midCoords.x + ',' + midCoords.y );
    return;
  }
};

// mouseup on nodes
GraphEditorView.prototype.circleMouseUp = function(d3node, d){
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
    var vPair = {source: mouseDownNode, target: d}
    self.send('createNewEdgeInGraph', vPair)
  } else{
    // we're in the same node
    if (state.justDragged) {
      // dragged, not clicked
      state.justDragged = false;
    } else{
      // clicked, not dragged
      if (d3.event.shiftKey){
        // shift-clicked node: edit text content
        // var d3txt = self.changeTextOfNode(d3node, d);
        // var txtNode = d3txt.node();
        // self.selectElementContents(txtNode);
        // txtNode.focus();
      } else{
        if (state.selectedEdge){
          self.removeSelectFromEdge();
        }
        var prevNode = state.selectedNode;

        if (!prevNode || prevNode.uuid !== d.uuid){
          self.replaceSelectNode(d3node, d);
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
  this.state.graphMouseDown = true;
};

// mouseup on main svg
GraphEditorView.prototype.svgMouseUp = function(){
  var self = this,
      state = self.state;
  if (state.justScaleTransGraph) {
    // dragged not clicked
    state.justScaleTransGraph = false;
  } else if (state.graphMouseDown && d3.event.shiftKey){ 
    // clicked not dragged from svg

    // CREATE NEW NOTE/VERTEX
    var xycoords = d3.mouse(self.svgG.node())
    console.log(xycoords)
    var coords = {x: xycoords[0], y: xycoords[1]}

    self.send('createNewNoteVertexGraph', coords)
    
   
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
  case consts.BACKSPACE_KEY:
  case consts.DELETE_KEY:

    d3.event.preventDefault();
    if (selectedNode){
      self.send('deleteVertexInGraph', selectedNode)
    } else if (selectedEdge){
      self.send('deleteEdgeInGraph', selectedEdge)
    }
    break;
  }
};

GraphEditorView.prototype.svgKeyUp = function() {
  this.state.lastKeyDown = -1;
};

// Call to propagate changes to graph
GraphEditorView.prototype.updateGraph = function(graphController){
  var self = this
  
  // console.log("====> Edges:")
  // console.log(self.edges)
  // console.log("====> Nodes:")
  // console.log(self.nodes)

  // Associate edges data in the graph controller with the UI elements
  self.paths = self.paths.data(graphController.edges, function(d){
    return String(d.source.uuid) + "+" + String(d.target.uuid);
  });
  var paths = self.paths;

  // Update existing paths
  paths.style('marker-end', 'url(#end-arrow)')
    .classed(self.consts.selectedClass, function(d){
      // TODO: User proper compare
      return d === self.state.selectedEdge;
    })
    .attr("d", function(d){
      // TODO: Refactor the to use Wrapper
      let source_midCoords = d.source.calcNodeCenter()
      let target_midCoords = d.target.calcNodeCenter()
      return "M" + source_midCoords.x + "," + source_midCoords.y + "L" + target_midCoords.x + "," + target_midCoords.y;
    });

  // Add new paths
  paths.enter()
    .append("path")
    .style('marker-end','url(#end-arrow)')
    .classed("link", true)
    .attr("d", function(d){
      let source_midCoords = d.source.calcNodeCenter()
      let target_midCoords = d.target.calcNodeCenter()
      return "M" + source_midCoords.x + "," + source_midCoords.y + "L" + target_midCoords.x + "," + target_midCoords.y;
    })
    .on("mousedown", function(d){
      self.pathMouseDown.call(self, d3.select(this), d);
      }
    )
    .on("mouseup", function(d){
      self.state.mouseDownLink = null;
    });

  // Remove old links
  paths.exit().remove();

  // Update existing nodes
  // Prepare vertex wrappers
  
  // Associate edges data in the graph controller with the UI elements
  self.circles = self.circles.data(graphController.vertices, function(d){ return d.uuid;});
  
  self.circles.attr("transform", function(d){return "translate(" + d.posX + "," + d.posY + ")";});

  let html_str = `
    <div class="graph-note-header">
      <div class="datetime">
        <span id="dt-created">Created: Date here</span>
      </div>
      <div class="graph-note-tags">
        <span>Tags</span><span>Tags</span><span>Tags</span><span>Tags</span><span>Tags</span><span>Tags</span><span>Tags</span><span>Tags</span><span>Tags</span><span>Tags</span><span>Tags</span><span>Tags</span><span>Tags</span><span>Tags</span><span>Tags</span><span>Tags</span><span>Tags</span><span>Tags</span>
      </div>
    </div>
    <div class="graph-note-content" >
    Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar,
    Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar,
      Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar,
      Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar,
      Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar,
      Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar,
      Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar,
    </div>
  `

  // Add new nodes
  var newGs = self.circles.enter()
        //.append("g");
        .append("foreignObject")

  newGs.classed(self.consts.nodeClass, true)
    .attr("width", 427)    // "80%"
    .attr("height", 1)     
    .attr("overflow", "visible")
    .attr("transform", function(d){return "translate(" + d.posX + "," + d.posY + ")";})
    .append("xhtml:div")
      .attr('class', 'graph-note')
      .html(html_str)

  newGs.each(function(d){
    let foreignObj = d3.select(this)
    let gNote = foreignObj.select('.graph-note').node()
    // console.log("offsetSizes:")
    // console.log(gNote.offsetWidth)
    // console.log(gNote.offsetHeight)
    // console.log("clientSizes:")
    // console.log(gNote.clientWidth)
    // console.log(gNote.clientHeight)

    console.log("newGs.each")
    console.log(d)
    
    // Associate vertex' UI dimensions with its data
    d.width_dom = gNote.offsetWidth
    d.height_dom = gNote.offsetHeight
  
    console.log("newGs.each")
    console.log(d)

    // Adjust the height to content
    foreignObj.attr("height", gNote.offsetHeight)
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
    })
    .call(self.drag);
  })

  // Remove old nodes
  self.circles.exit().remove();
};

GraphEditorView.prototype.zoomed = function(){
  this.state.justScaleTransGraph = true;
  d3.select("." + this.consts.graphClass)
    .attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
};

GraphEditorView.prototype.updateWindow = function(){
  var self = this

  var style = getComputedStyle(document.getElementById('content'))
  var x = style.width
  var y = style.height
  self.svg.attr("width", x).attr("height", y);
};





/* ============================================================================== */
/* ============================================================================== */


/**
 * Resets the editor before new content is loaded.
 */
GraphEditorView.prototype.resetEditorState = function(){
  var self = this

  self.active_note = null

  if (self.globalTimeout !== null) {
    clearTimeout(self.globalTimeout);
  }
}

/**
 * Renders the GraphEditorView for a given project
 * @param {Project} project 
 */
GraphEditorView.prototype.render = function(session){
  var self = this

  // Reset GraphEditorView state
  // self.resetEditorState()

  //if(!session){ return }


  /* ====================================================================== */
  /*  Event Handlers                                                        */
  /* ====================================================================== */

  

  /* ====================================================================== */
  /* ====================================================================== */

  // var docEl = document.documentElement
  // var bodyEl = document.getElementsByTagName('body')[0]

  // var width = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth
  // var height =  window.innerHeight|| docEl.clientHeight|| bodyEl.clientHeight

  var style = getComputedStyle(document.getElementById('content'))
  var width = style.width
  var height = style.height

  // TODO: Normally these are fetched from session.getActiveProject().getActiveGraph()
  var nodes = []
  var edges = []

  var graph_view = yo`
    <div id="graph-editor" >
    <svg xmlns="http://www.w3.org/2000/svg" ></svg> 
    </div>
  `
  // <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"></svg>
  
  let elem = graph_view.getElementsByTagName('svg')[0]
  var svg = d3.select(elem)
    .attr("width", width)
    .attr("height", height);
    console.log(elem)

  this.init(svg, nodes, edges)
  

  return graph_view
  
}

