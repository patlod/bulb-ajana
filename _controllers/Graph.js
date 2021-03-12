module.exports = Graph


const FileDatabaseManager = require('../_models/FileDatabaseManager');
const StringFormatter = require('../_util/StringFormatter');
const Vertex = require('./Vertex');
const Edge = require('./Edge');


function Graph(project, data = FileDatabaseManager.getEmptyGraphJSON()) 
{
  var self = this;

  // Graph data
  this.uuid = data.uuid;
  this.created = data.created;
  this.modified = data.modified;
  this.description = data.description;
  this.position = data.position;
  this.vertices = data.vertices;
  this.edges = data.edges;

  this.active = false;

  this.project = project;

  // Load data on creation
  this.loadData();
}

Graph.prototype.loadData = function(){
  //this.uuid = this.getDB().getGraph
}

Graph.prototype.saveData = function(){
  console.log("Graph - saveData");
  this.getDB().insertGraph(this.getGraphJSON());
}

Graph.prototype.savePosition = function(){
  console.log("Graph - savePosition");
  this.getDB().updateGraphPosition(this.uuid, this.position);
}

Graph.prototype.saveDescription = function(){
  console.log("Graph - saveDescription");
  this.getDB().updateGraphDescription(this.uuid, this.description);
}

Graph.prototype.getVertices = function(){
  return this.vertices;
}

/**
 * Creates a new vertex from a note at given coordinates
 * 
 * 
 * @param {JSON} coords - Object with given coordinates x and y
 * @param {Note} note - Note the vertex represents 
 */
Graph.prototype.createNewVertexForNote = function(coords, note){
  var self = this;

  // Check whether vertex with note exists already
  let chks = self.vertices.filter( v => v.note !== null && v.note.compareTo(note));
  if(chks.length >= 1){ return; }

  let data = FileDatabaseManager.getEmptyVertexJSON();
  data.note = note;
  data.posX = coords.x;
  data.posY = coords.y;

  let nV = new Vertex(this, data);

  self.vertices.unshift(nV);

  return nV;
}

/**
 * Deltes vertex associated with note
 * 
 * @param {Note} note 
 */
Graph.prototype.deleteVertex = function(selectedVertex){
  var self = this;

  console.log("graph.deleteVertex..");
  
  let v_ids = self.vertices.map(function(v) { return v.uuid; })
  let idx = v_ids.indexOf(selectedVertex.uuid);
  if(idx >= 0){ 
    // false can only happen when inconsistencies exsist.
    self.vertices.splice(idx, 1);
    self.spliceEdgesForVertex(selectedVertex);
    
    // TODO: Delete from database
    console.log("Deleting vertex from database");
    self.getDB().deleteVertices(self.uuid, [selectedVertex.getVertexJSON()]);
  }
}

Graph.prototype.deleteVerticesForNote = function(note){
  console.log("deleteVerticesForNote");
  var self = this;
  let i,idx;
  let chks = self.vertices.filter( v => v.note !== null && v.note.compareTo(note));
  console.log(self.vertices);
  console.log(chks);
  if(chks.length >= 1){
    let del_jsons = [];
    
    let v_ids = self.vertices.map(function(v) { return v.uuid; });
    for(i in chks){
      idx = v_ids.indexOf(chks[i].uuid);
      if(idx >= 0){
        self.vertices.splice(idx, 1);
        // Keeping the ids in separate list is very bad it introduces inconsistencies. 
        // If one forgets to delete the id the loop is broken..
        // Better try to check indexOf with the Object.
        v_ids.splice(idx, 1);
        self.spliceEdgesForVertex(chks[0]);
        
        del_jsons.push(chks[i].getVertexJSON());
      }
    }
    // Delete from database
    console.log("Delete vertices from database..");
    self.getDB().deleteVertices(self.uuid, del_jsons);
  }
}

Graph.prototype.getVertexForNote = function(note){
  let self = this;
  let chks = self.vertices.filter( v => v.note !== null && v.note.compareTo(note));
  if(chks.length > 1) { 
    console.error("Error duplicate vertices found");
    return null;
  }else if(chks.length < 1){ return null; }
  else { return chks[chks.length - 1]; }
}

/**
 * Returns all edges of the graph
 */
Graph.prototype.getEdges = function(){
  return this.edges;
}

/**
 * Creates a new edge between given vertices
 * 
 * @param {Vertex} source - Source vertex
 * @parma {Vertex} target - Target vertex
 */
Graph.prototype.createNewEdge = function(source, target){
  var self = this;

  // TODO: Check whether source & target exist in self.vertices

  let data = FileDatabaseManager.getEmptyEdgeJSON();
  data.source = source;
  data.target = target;

  let nE = new Edge(this, data);

  self.edges.unshift(nE);

  return nE;
}

/**
 * Deletes edge
 */
Graph.prototype.deleteEdge = function(selectedEdge){
  var self = this;
  
  let ed_ids = self.edges.map(function(ed) { return ed.uuid; });
  let idx = ed_ids.indexOf(selectedEdge.uuid);
  if(idx >= 0){
    this.edges.splice(idx, 1);

    // Delete from database
    console.log("Delete edge from database");
    self.getDB().deleteEdges(self.uuid, [selectedEdge.getEdgeJSON()]);
  }
}

/**
 * Deltes all edges connected to a given vertex.
 * @param {Vertex} vertex 
 */
Graph.prototype.spliceEdgesForVertex = function(vertex) {
  var self = this;

  var toSplice = self.edges.filter(function(l) {
    return ( l.source.compareTo(vertex) || l.target.compareTo(vertex) );
  });
  toSplice.map(function(l) {
    self.edges.splice(self.edges.indexOf(l), 1);
  });

  toSplice = toSplice.map(function(ed){ return ed.getEdgeJSON(); })

  // Delete from database here
  console.log("Delete edges spliced for deleted vertex");
  self.getDB().deleteEdges(self.uuid, toSplice);
};

Graph.prototype.isActive = function(){
  return this.active;
}

Graph.prototype.activate = function(){
  this.active = true;
}

Graph.prototype.deactivate = function(){
  this.active = false;
}

Graph.prototype.isEmpty = function(){
  return (this.vertices.length > 0) ? false : true;
}

Graph.prototype.getDB = function(){
  return this.project.db;
}

/**
 * Calculates largest rectangle that wraps around all vertices.
 *
 * Returns the rectangle as tuple of start point and end point. 
 */
Graph.prototype.getVerticesBoundingBox = function(){
  var self = this;
  if(self.vertices.length === 0){ return; }

  let north = self.vertices[0].posY,
      south = self.vertices[0].posY, 
      east = self.vertices[0].posX, 
      west = self.vertices[0].posX,
      dNorthSouth = 0,
      dWestEast = 0;
  for(var i in self.vertices){
    if(self.vertices[i].posY < north){ north = self.vertices[i].posY; }
    if(self.vertices[i].posY > south){ south = self.vertices[i].posY; }
    if(self.vertices[i].posX < west){ west = self.vertices[i].posX; }
    if(self.vertices[i].posX > east){ east = self.vertices[i].posX; }
  }

  if( ( north < 0 && south > 0 )
    || ( north > 0 && south < 0 ) ){ 
    dNorthSouth = Math.abs(north) + Math.abs(south);
  }else{
    dNorthSouth = Math.abs(north - south);
  }
  if( (west < 0 && south > 0) 
    || (west > 0 && south < 0 ) ){
    dWestEast = Math.abs(west) + Math.abs(east);
  }else{
    dWestEast = Math.abs(west - east);
  }

  return {
    startX: west,   // Rect start point
    startY: north,   
    endX: east,     // Rect end point
    endY: south,
    width: dWestEast,     // Dimensions
    height: dNorthSouth,
  };
}

/**
 * Returns date of creation
 * @param {function} callback 
 */
Graph.prototype.getCreated = function(){
  return this.created;
}

/**
 * Determines whether an update of the note thumbnail is necessary while 
 * editing text in the editor
 * 
 * Works on this.text
 * 
 * @param {int} selectionStart - Start of text selection
 * @param {int} selectionEnd - End of text selection
 */
Graph.prototype.needThumbUpdate = function(selectionStart, selectionEnd){
  let arr = StringFormatter.splitAtNewLine(this.description);
  if( selectionStart === selectionEnd ){
    if( arr.length === 1 && selectionStart <= 300 ){
      /**
       *  This is quite slow...
       *  I think I should maybe write into the dom element directly..
       *  Maybe create an instance method in NotesListView which can be
       *  called from App to write into the element
       */ 
      return true; // [0]
    }else{
      if(arr.length >= 2){
        let indices = StringFormatter.getParagraphIndices(arr);
        if(indices.length === 1){
          if(selectionStart >= indices[0] && selectionStart <= indices[0] + 300/*arr[indices[0]].length*/){
            return true; // [indices[0]]
          }
        }else if( indices.length >= 2 ){
          //let distance = indices[1] - indices[0]
          if( (selectionStart >= indices[0] && selectionStart <= indices[0] + 300 )
            || (selectionStart >= indices[1] && selectionStart <= indices[1] + 300) ) {   // arr[indices[0]].length + arr[indices[1]].length + distance
              return true; //[indices[0], indices[1]]
          }else{
            return false; 
          }
        }else{
          if(selectionStart === arr.length-1)
          return true;
        }
      }
    }
  }
  
}

/**
 * For thumbnail: Returns header (first sentence) of the text
 * up until the first \newline.
 */
Graph.prototype.getHeader = function(){
  let arr = StringFormatter.splitAtNewLine(this.description);
  let txt_is = StringFormatter.getParagraphIndices(arr);
  if(txt_is.length >= 1){
    if(arr[txt_is[0]].length > 0){
      if(arr[txt_is[0]].length > 150){
        return arr[txt_is[0]].substr(0,150);
      }else{
        return arr[txt_is[0]];
      }
    } else{
      return "New Graph";
    }
  }else{
    return "New Graph";
  }
}

/**
 * For thumbnail: Returns preview of text truncated with "..."
 */
Graph.prototype.getContentPreview = function(){
  let arr = StringFormatter.splitAtNewLine(this.description);
  let txt_is = StringFormatter.getParagraphIndices(arr);
  if(txt_is.length >= 1){
    if(arr[txt_is[0]].length > 150){
      return arr[txt_is[0]].substr(151, arr[txt_is[0]].length - 1);
    }else{
      if(txt_is.length == 1){
        return "No additional text";
      }else{
        return arr[txt_is[1]];
      }
    }
  }else{
    return "No additional text";
  }
  //return (this.text.length > 0) ? this.text : "No additional text"
}

/**
 * Returns the complete description of the graph
 */
Graph.prototype.getContent = function(){
  return this.description;
}

Graph.prototype.getNumberOfNotes = function(){
  let notes = [];
  for(var i in this.vertices){
    if(notes.indexOf(this.vertices[i].note.uuid) < 0){
      notes.push(this.vertices[i].note.uuid);
    }
  }
  return notes.length;
}

/**
 * Compares this graph to another oner. 
 * 
 * NOTE: This is shallow compare solely content based. Where as deep compare would
 *       compare whether it is same instance..
 * 
 * @param {Graph} graph
 */
 Graph.prototype.compareTo = function(graph){
  return ( JSON.stringify(this.getGraphJSON()).localeCompare( JSON.stringify(graph.getGraphJSON()) ) === 0 );
}


Graph.prototype.getGraphJSON = function(){
  return {
    uuid:         this.uuid,
    created:      this.created,
    modified:     this.modified,
    description:  this.description,
    position:     this.position,
    vertices:     this.vertices.map(function(v){ return v.getVertexJSON()}),
    edges:        this.edges.map(function(ed){ return ed.getEdgeJSON()})
  };
}