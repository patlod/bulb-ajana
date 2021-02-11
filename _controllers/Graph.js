module.exports = Graph

const FileDatabaseManager = require('../_models/FileDatabaseManager')
const Vertex = require('./Vertex')
const Edge = require('./Edge')


function Graph(project, data = FileDatabaseManager.getEmptyGraphJSON()) 
{
  var self = this

  // Graph data
  this.uuid = data.uuid
  this.created = data.created
  // this.modified = data.modified
  this.vertices = data.vertices
  this.edges = data.edges

  this.active = false

  this.project = project

  // Load data on creation
  this.loadData()
}

Graph.prototype.loadData = function(){
  //this.uuid = this.getDB().getGraph
}

Graph.prototype.saveData = function(){
  this.getDB().insertGraph(this.getGraphJSON())
}


Graph.prototype.getVertices = function(){
  return this.vertices
}

/**
 * Creates a new vertex from a note at given coordinates
 * 
 * 
 * @param {JSON} coords - Object with given coordinates x and y
 * @param {Note} note - Note the vertex represents 
 */
Graph.prototype.createNewVertexForNote = function(coords, note){
  var self = this

  // Check whether vertex with note exists already
  let chks = self.vertices.filter( v => v.note !== null && v.note.compareTo(note))
  if(chks.length >= 1){ return }

  let data = FileDatabaseManager.getEmptyVertexJSON()
  data.note = note;
  data.posX = coords.x;
  data.posY = coords.y;

  let nV = new Vertex(this, data)

  self.vertices.unshift(nV);

  return nV
}

/**
 * Deltes vertex associated with note
 * 
 * @param {Note} note 
 */
Graph.prototype.deleteVertex = function(selectedVertex){
  var self = this

  console.log("graph.deleteVertex..")
  
  let v_ids = self.vertices.map(function(v) { return v.uuid; })
  let idx = v_ids.indexOf(selectedVertex.uuid);
  if(idx >= 0){ 
    // false can only happen when inconsistencies exsist.
    self.vertices.splice(idx, 1);
    self.spliceEdgesForVertex(selectedVertex);
    
    // TODO: Delete from database
    console.log("Deleting vertex from database")
    self.getDB().deleteVertices(self.uuid, [selectedVertex.getVertexJSON()])
  }
}

Graph.prototype.deleteVerticesForNote = function(note){
  console.log("deleteVerticesForNote")
  var self = this
  let i,idx
  let chks = self.vertices.filter( v => v.note !== null && v.note.compareTo(note))
  console.log(self.vertices)
  console.log(chks)
  if(chks.length >= 1){
    let del_jsons = []
    
    let v_ids = self.vertices.map(function(v) { return v.uuid; })
    for(i in chks){
      idx = v_ids.indexOf(chks[i].uuid);
      if(idx >= 0){
        self.vertices.splice(idx, 1)
        // Keeping the ids in separate list is very bad it introduces inconsistencies. 
        // If one forgets to delete the id the loop is broken..
        // Better try to check indexOf with the Object.
        v_ids.splice(idx, 1)  
        self.spliceEdgesForVertex(chks[0]);
        
        del_jsons.push(chks[i].getVertexJSON())
      }
    }
    // Delete from database
    console.log("Delete vertices from database..")
    self.getDB().deleteVertices(self.uuid, del_jsons)
  }
}

Graph.prototype.getVertexForNote = function(note){
  let self = this;
  let chks = self.vertices.filter( v => v.note !== null && v.note.compareTo(note))
  if(chks.length > 1) { 
    console.error("Error duplicate vertices found");
    return null;
  }else if(chks.length < 1){ return null; }
  else { return chks[chks.length - 1] }
}

/**
 * Returns all edges of the graph
 */
Graph.prototype.getEdges = function(){
  return this.edges
}

/**
 * Creates a new edge between given vertices
 * 
 * @param {Vertex} source - Source vertex
 * @parma {Vertex} target - Target vertex
 */
Graph.prototype.createNewEdge = function(source, target){
  var self = this

  // TODO: Check whether source & target exist in self.vertices

  let data = FileDatabaseManager.getEmptyEdgeJSON()
  data.source = source
  data.target = target

  let nE = new Edge(this, data)

  self.edges.unshift(nE);

  return nE
}

/**
 * Deletes edge
 */
Graph.prototype.deleteEdge = function(selectedEdge){
  var self = this
  
  let ed_ids = self.edges.map(function(ed) { return ed.uuid; })
  let idx = ed_ids.indexOf(selectedEdge.uuid)
  if(idx >= 0){
    this.edges.splice(idx, 1);

    // Delete from database
    console.log("Delete edge from database")
    self.getDB().deleteEdges(self.uuid, [selectedEdge.getEdgeJSON()])
  }
}

/**
 * Deltes all edges connected to a given vertex.
 * @param {Vertex} vertex 
 */
Graph.prototype.spliceEdgesForVertex = function(vertex) {
  var self = this

  var toSplice = self.edges.filter(function(l) {
    return ( l.source.compareTo(vertex) || l.target.compareTo(vertex) );
  });
  toSplice.map(function(l) {
    self.edges.splice(self.edges.indexOf(l), 1);
  });

  toSplice = toSplice.map(function(ed){ return ed.getEdgeJSON()})

  // Delete from database here
  console.log("Delete edges spliced for deleted vertex")
  self.getDB().deleteEdges(self.uuid, toSplice)
};

Graph.prototype.isActive = function(){
  return this.active
}

Graph.prototype.activate = function(){
  this.active = true
}

Graph.prototype.deactivate = function(){
  this.active = false
}

Graph.prototype.getDB = function(){
  return this.project.db
}


Graph.prototype.getGraphJSON = function(){
  return {
    uuid:       this.uuid,
    created:    this.created,
    vertices:   this.vertices,
    edges:      this.edges
  }
}