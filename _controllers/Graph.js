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
  let chks = self.vertices.filter( v => v.note.compareTo(note))
  if(chks.length > 1){ return }

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

  self.vertices.splice(self.vertices.indexOf(selectedVertex), 1);
  self.spliceEdgesForVertex(selectedVertex);

  // TODO: Delete from database
  //self.getDB().deleteVertex(selectedVertex.getVertexJSON())
}

Graph.prototype.deleteVertexForNote = function(note){
  var self = this

  let chks = self.vertices.filter( v => v.note !== null && v.note.compareTo(note))
  if(chks.length === 1){
    console.log(self.vertices)
    self.vertices.splice(self.vertices.indexOf(chks[0]), 1)
    self.spliceEdgesForVertex(chks[0]);
    console.log(self.vertices)
  }

  // TODO: Delete from database
  //self.getDB().deleteVertex(chks[0].getVertexJSON())
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

  this.edges.splice(this.edges.indexOf(selectedEdge), 1);

  // TODO: Delete from database
  //self.getDB().deleteEdge(selectedEdge.getEdgeJSON())
}


Graph.prototype.spliceEdgesForVertex = function(vertex) {
  var self = this

  var toSplice = self.edges.filter(function(l) {
    // TODO: Refactor compare here ==> Maybe compare function in the Vertex class
    return (l.source === node || l.target === node);
  });
  toSplice.map(function(l) {
    self.edges.splice(self.edges.indexOf(l), 1);
  });

  // TODO: Delete from database here
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