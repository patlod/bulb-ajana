module.exports = Vertex

const FileDatabaseManager = require('../_models/FileDatabaseManager')


function Vertex(graph, data = FileDatabaseManager.getEmptyVertexJSON()) 
{
  var self = this

  // Vertice data
  this.uuid = data.uuid
  this.created = data.created
  this.modified = data.modified
  this.note = data.note
  // Positional coordinates of the vertex (North-West corner of DOMElement)
  this.posX = data.posX
  this.posY = data.posY

  // Dimensions of the UI elmement in the graph (these will not go to database)
  // NOTE: This is normally rather UI data that belongs in the view
  this.width_dom = data.width_dom
  this.height_dom = data.height_dom

  this.graph = graph
}


Vertex.prototype.saveData = function(){
  console.log("Vertex - saveData()")
  // this.graph.getDB().read()
  // this.graph.getDB().insertVertex(this.graph.uuid, this.getVertexJSON())
}

/**
 * Calculates the center coordinates of a vertex which is a rectangular
 * foreignObject filled with HTML note content.
 * 
 * The default origin of the foreignObject is the corner at North-West
 *
 */
Vertex.prototype.calcDOMCenterCoords = function(){
  return {x: this.posX + this.width_dom/2, y: this.posY + this.height_dom/2}
}

Vertex.prototype.getGraph = function(){
  return this.graph
}

/**
 * Compares this note to anohter note
 * 
 * @param {Note} note
 */
Vertex.prototype.compareTo = function(vertex){
  return ( JSON.stringify(this.getVertexJSON()).localeCompare( JSON.stringify(vertex.getVertexJSON()) ) === 0 )
}


Vertex.prototype.getVertexJSON = function(){
  return { 
    uuid:       this.uuid,
    created:    this.created,
    note:       (this.note !== null) ? this.note.getNoteJSON() : null, 
    posX:       this.posX, 
    posY:       this.posY,
    width_dom:  this.width_dom,
    height_dom: this.height_dom

  }
}