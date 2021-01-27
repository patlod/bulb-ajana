module.exports = Edge

const FileDatabaseManager = require('../_models/FileDatabaseManager')


function Edge(graph, data = FileDatabaseManager.getEmptyEdgeJSON()) 
{
  var self = this

  // Edge data
  this.uuid = data.uuid
  this.created = data.created
  // this.modified = 0
  this.source = data.source
  this.target = data.target

  this.graph = graph

}


Edge.prototype.saveData = function(){
  this.graph.getDB().insertEdge(this.getEdgeJSON())
}

Edge.prototype.getEdgeJSON = function(){
  return { 
    uuid: this.uuid,
    created: this.created,
    //modified: this.modified,
    source: this.source.getVertexJSON(),
    target: this.target.getVertexJSON(), 
    
  }
}