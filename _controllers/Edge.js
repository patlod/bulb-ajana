module.exports = Edge

const FileDatabaseManager = require('../_models/FileDatabaseManager');


function Edge(graph, data = FileDatabaseManager.getEmptyEdgeJSON()) 
{
  var self = this;

  // Edge data
  this.uuid = data.uuid;
  this.created = data.created;
  this.source = data.source;
  this.target = data.target;

  this.graph = graph;
}


Edge.prototype.saveData = function(){
  this.graph.getDB().insertEdge(this.graph.uuid, this.getEdgeJSON());
}

Edge.prototype.getGraph = function(){
  return this.graph;
}

/**
 * Compares this object to another object
 * 
 * @param {Edge} edge
 */
Edge.prototype.compareTo = function(edge){
  return ( JSON.stringify(this.getEdgeJSON()).localeCompare( JSON.stringify(edge.getEdgeJSON()) ) === 0 );
}

Edge.prototype.getEdgeJSON = function(){
  return { 
    uuid: this.uuid,
    created: this.created,
    source: (this.source !== null) ? this.source.getVertexJSON() : null,
    target: (this.target !== null) ? this.target.getVertexJSON() : null,
  };
}