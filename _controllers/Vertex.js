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
  this.posX = data.posX
  this.posY = data.posY

  this.graph = graph
}


Vertex.prototype.saveData = function(){
  this.graph.getDB().insertVertex(this.getVertexJSON())
}

Vertex.prototype.getVertexJSON = function(){
  return { 
    uuid: this.uuid,
    created: this.created,
    modified: this.modified,
    note: this.note.getNoteJSON(), 
    posX: this.posX, 
    posY: this.posY
  }
}