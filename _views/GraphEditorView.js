module.exports = GraphEditorView

const EventEmitterElement = require('../_app/EventEmitterElement')
var inherits = require('util').inherits

var yo = require('yo-yo')

const d3 = require("d3");
var filesaver = require('file-saver')
//const GraphCreator = require('../graph-creator.js')


// TODO add user settings
var consts = {
  defaultTitle: "random variable"
};

function GraphEditorView(target) {
  var self = this
  EventEmitterElement.call(this, target)

  this.globalTimeout = null
  this.SAVE_INTERVAL = 3000   // Save text content every 4s

  this.dirty_bit = false


  
  // var settings = {
  //   appendElSpec: "#content"
  // };

// }
// inherits(GraphEditorView, EventEmitterElement)

/* ============================================================================== */
/*  From here: GraphCreator code                                                  */
/* ============================================================================== */

// define graphcreator object
//function GraphCreator(svg, nodes, edges){

  this.svg = null
  this.nodes = null
  this.edges = null

  this.consts =  {
    selectedClass: "selected",
    connectClass: "connect-node",
    circleGClass: "conceptG",
    graphClass: "graph",
    activeEditId: "active-editing",
    BACKSPACE_KEY: 8,
    DELETE_KEY: 46,
    ENTER_KEY: 13,
    nodeRadius: 50
  }

}
inherits(GraphEditorView, EventEmitterElement)

GraphEditorView.prototype.init = function(svg, nodes, edges){
  var self = this;
  self.idct = 0;

  self.nodes = nodes || [];
  self.edges = edges || [];

  self.state = {
    selectedNode: null,
    selectedEdge: null,
    mouseDownNode: null,
    mouseDownLink: null,
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
    .attr('markerWidth', 3.5)
    .attr('markerHeight', 3.5)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5');

  // define arrow markers for leading arrow
  defs.append('svg:marker')
    .attr('id', 'mark-end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 7)
    .attr('markerWidth', 3.5)
    .attr('markerHeight', 3.5)
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
          return {x: d.x, y: d.y};
        })
        .on("drag", function(args){
          self.state.justDragged = true;
          self.dragmove.call(self, args);
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
          if (!d3.event.sourceEvent.shiftKey) d3.select('body').style("cursor", "move");
        })
        .on("zoomend", function(){
          d3.select('body').style("cursor", "auto");
        });

  svg.call(dragSvg).on("dblclick.zoom", null);

  // listen for resize
  window.onresize = function(){self.updateWindow(svg);};


  /* ====================================================================*/
  /* Not needed here (download, share/upload, delete)
  /* ====================================================================*/
  // handle download data
  /* d3.select("#download-input").on("click", function(){
    var saveEdges = [];
    self.edges.forEach(function(val, i){
      saveEdges.push({source: val.source.id, target: val.target.id});
    });
    var blob = new Blob([window.JSON.stringify({"nodes": self.nodes, "edges": saveEdges})], {type: "text/plain;charset=utf-8"});
    filesaver.saveAs(blob, "mydag.json");
  });


  // handle uploaded data
  d3.select("#upload-input").on("click", function(){
    document.getElementById("hidden-file-upload").click();
  });
  d3.select("#hidden-file-upload").on("change", function(){
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      var uploadFile = this.files[0];
      var filereader = new window.FileReader();

      filereader.onload = function(){
        var txtRes = filereader.result;
        // TODO better error handling
        try{
          var jsonObj = JSON.parse(txtRes);
          self.deleteGraph(true);
          self.nodes = jsonObj.nodes;
          self.setIdCt(jsonObj.nodes.length + 1);
          var newEdges = jsonObj.edges;
          newEdges.forEach(function(e, i){
            newEdges[i] = {source: self.nodes.filter(function(n){return n.id == e.source;})[0],
                        target: self.nodes.filter(function(n){return n.id == e.target;})[0]};
          });
          self.edges = newEdges;
          self.updateGraph();
        }catch(err){
          window.alert("Error parsing uploaded file\nerror message: " + err.message);
          return;
        }
      };
      filereader.readAsText(uploadFile);

    } else {
      alert("Your browser won't let you save this graph -- try upgrading your browser to IE 10+ or Chrome or Firefox.");
    }

  });

  // handle delete graph
  d3.select("#delete-graph").on("click", function(){
    self.deleteGraph(false);
  }); */
}

GraphEditorView.prototype.setIdCt = function(idct){
  this.idct = idct;
};

// GraphEditorView.prototype.consts =  {
//   selectedClass: "selected",
//   connectClass: "connect-node",
//   circleGClass: "conceptG",
//   graphClass: "graph",
//   activeEditId: "active-editing",
//   BACKSPACE_KEY: 8,
//   DELETE_KEY: 46,
//   ENTER_KEY: 13,
//   nodeRadius: 50
// };

// PROTOTYPE FUNCTIONS 

GraphEditorView.prototype.dragmove = function(d) {
  var self = this;
  if (self.state.shiftNodeDrag){
    self.dragLine.attr('d', 'M' + d.x + ',' + d.y + 'L' + d3.mouse(self.svgG.node())[0] + ',' + d3.mouse(this.svgG.node())[1]);
  } else{
    d.x += d3.event.dx;
    d.y +=  d3.event.dy;
    self.updateGraph();
  }
};

// Select all text in element: taken from http://stackoverflow.com/questions/6139107/programatically-select-text-in-a-contenteditable-html-element 
GraphEditorView.prototype.selectElementContents = function(el) {
  var range = document.createRange();
  range.selectNodeContents(el);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
};


// insert svg line breaks: taken from http://stackoverflow.com/questions/13241475/how-do-i-include-newlines-in-labels-in-d3-charts 
GraphEditorView.prototype.insertTitleLinebreaks = function (gEl, title) {
  var words = title.split(/\s+/g),
      nwords = words.length;
  var el = gEl.append("text")
        .attr("text-anchor","middle")
        .attr("dy", "-" + (nwords-1)*7.5);

  for (var i = 0; i < words.length; i++) {
    var tspan = el.append('tspan').text(words[i]);
    if (i > 0)
      tspan.attr('x', 0).attr('dy', '15');
  }
};


// remove edges associated with a node
GraphEditorView.prototype.spliceLinksForNode = function(node) {
  var self = this,
      toSplice = self.edges.filter(function(l) {
    return (l.source === node || l.target === node);
  });
  toSplice.map(function(l) {
    self.edges.splice(self.edges.indexOf(l), 1);
  });
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
    return cd.id === self.state.selectedNode.id;
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
    self.dragLine.classed('hidden', false)
      .attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
    return;
  }
};

// place editable text on node in place of svg text
GraphEditorView.prototype.changeTextOfNode = function(d3node, d){
  var self= this,
      consts = self.consts,
      htmlEl = d3node.node();
  d3node.selectAll("text").remove();
  var nodeBCR = htmlEl.getBoundingClientRect(),
      curScale = nodeBCR.width/consts.nodeRadius,
      placePad  =  5*curScale,
      useHW = curScale > 1 ? nodeBCR.width*0.71 : consts.nodeRadius*1.42;
  // replace with editableconent text
  var d3txt = self.svg.selectAll("foreignObject")
        .data([d])
        .enter()
        .append("foreignObject")
        .attr("x", nodeBCR.left + placePad )
        .attr("y", nodeBCR.top + placePad)
        .attr("height", 2*useHW)
        .attr("width", useHW)
        .append("xhtml:p")
        .attr("id", consts.activeEditId)
        .attr("contentEditable", "true")
        .text(d.title)
        .on("mousedown", function(d){
          d3.event.stopPropagation();
        })
        .on("keydown", function(d){
          d3.event.stopPropagation();
          if (d3.event.keyCode == consts.ENTER_KEY && !d3.event.shiftKey){
            this.blur();
          }
        })
        .on("blur", function(d){
          d.title = this.textContent;
          self.insertTitleLinebreaks(d3node, d.title);
          d3.select(this.parentElement).remove();
        });
  return d3txt;
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
    var newEdge = {source: mouseDownNode, target: d};
    var filtRes = self.paths.filter(function(d){
      if (d.source === newEdge.target && d.target === newEdge.source){
        self.edges.splice(self.edges.indexOf(d), 1);
      }
      return d.source === newEdge.source && d.target === newEdge.target;
    });
    if (!filtRes[0].length){
      self.edges.push(newEdge);
      self.updateGraph();
    }
  } else{
    // we're in the same node
    if (state.justDragged) {
      // dragged, not clicked
      state.justDragged = false;
    } else{
      // clicked, not dragged
      if (d3.event.shiftKey){
        // shift-clicked node: edit text content
        var d3txt = self.changeTextOfNode(d3node, d);
        var txtNode = d3txt.node();
        self.selectElementContents(txtNode);
        txtNode.focus();
      } else{
        if (state.selectedEdge){
          self.removeSelectFromEdge();
        }
        var prevNode = state.selectedNode;

        if (!prevNode || prevNode.id !== d.id){
          self.replaceSelectNode(d3node, d);
        } else{
          self.removeSelectFromNode();
        }
      }
    }
  }
  state.mouseDownNode = null;
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

    // CREATE NEW NOTE
    var xycoords = d3.mouse(self.svgG.node())
    console.log(xycoords)
    var d = {id: self.idct++, title: consts.defaultTitle, x: xycoords[0], y: xycoords[1]}
    self.nodes.push(d);
    self.updateGraph();
    // make title of text immediently editable
    // var d3txt = self.changeTextOfNode(self.circles.filter(function(dval){
    //   return dval.id === d.id;
    // }), d),
    //     txtNode = d3txt.node();
    // self.selectElementContents(txtNode);
    // txtNode.focus();
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
      self.nodes.splice(self.nodes.indexOf(selectedNode), 1);
      self.spliceLinksForNode(selectedNode);
      state.selectedNode = null;
      self.updateGraph();
    } else if (selectedEdge){
      self.edges.splice(self.edges.indexOf(selectedEdge), 1);
      state.selectedEdge = null;
      self.updateGraph();
    }
    break;
  }
};

GraphEditorView.prototype.svgKeyUp = function() {
  this.state.lastKeyDown = -1;
};

// call to propagate changes to graph
GraphEditorView.prototype.updateGraph = function(){

  var self = this
  var consts = self.consts
  var state = self.state

  self.paths = self.paths.data(self.edges, function(d){
    return String(d.source.id) + "+" + String(d.target.id);
  });
  var paths = self.paths;

  // Update existing paths
  paths.style('marker-end', 'url(#end-arrow)')
    .classed(consts.selectedClass, function(d){
      return d === state.selectedEdge;
    })
    .attr("d", function(d){
      return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
    });

  // Add new paths
  paths.enter()
    .append("path")
    .style('marker-end','url(#end-arrow)')
    .classed("link", true)
    .attr("d", function(d){
      return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
    })
    .on("mousedown", function(d){
      self.pathMouseDown.call(self, d3.select(this), d);
      }
    )
    .on("mouseup", function(d){
      state.mouseDownLink = null;
    });

  // Remove old links
  paths.exit().remove();

  console.log("self.nodes:")
  console.log(self.nodes)

  // Update existing nodes
  console.log("self.circles:")
  console.log(self.circles)

  self.circles = self.circles.data(self.nodes, function(d){ return d.id;});
  self.circles.attr("transform", function(d){return "translate(" + d.x + "," + d.y + ")";});

  let html_str = `
    <div id="note-editor" > 
      <div class="note-header">
        <div class="datetime">
          <span id="dt-created">Created: Date here</span>
        </div>
        <div style="background: white" name='note-tags'>
          Tags 
        </div>
      </div>
      <!-- <div id="notepad" class="note-content" contenteditable="true"> -->
        <!-- Alternative HTML: <textarea id="notepad">Note text here</textarea> -->
        <div id="notepad" class="note-content" >Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar,</div>
      <!-- </div> -->
    </div>
`


  // Add new nodes
  var newGs = self.circles.enter()
        //.append("g");
        .append("foreignObject")

  console.log("self.circles after enter():")
  console.log(self.circles)

  newGs.classed(consts.circleGClass, true)
    .attr("width", 320)
    .attr("height", 1)
    .attr("overflow", "visible")
    .attr("transform", function(d){return "translate(" + d.x + "," + d.y + ")";})
    .append("xhtml:div")
      .style("font", "11px 'Verdana'")
      .html(html_str)
    

  // newGs.append("circle")
  //   .attr("r", String(consts.nodeRadius));

  // newGs.each(function(d){
  //   self.insertTitleLinebreaks(d3.select(this), d.title);
  // });

  newGs.each(function(d){
    d3.select(this).select('#note-editor')
    .on("mouseover", function(d){
      if (state.shiftNodeDrag){
        d3.select(this).classed(consts.connectClass, true);
      }
    })
    .on("mouseout", function(d){
      d3.select(this).classed(consts.connectClass, false);
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

GraphEditorView.prototype.updateWindow = function(svg){
  // var docEl = document.documentElement,
  //     bodyEl = document.getElementsByTagName('body')[0];
  // var x = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth;
  // var y = window.innerHeight|| docEl.clientHeight|| bodyEl.clientHeight;
  var style = getComputedStyle(document.getElementById('content'))
  var x = style.width
  var y = style.height
  svg.attr("width", x).attr("height", y);
};

/**
 * (Re)Initialises the GraphEditorView
 * @param {} svg    - The svg the GraphCreator is initialised on
 * @param {*} nodes - Array of nodes
 * @param {*} edges - Array of edges
 */



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