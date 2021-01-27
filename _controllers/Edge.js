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

  // Load data on creation
  this.loadData()
}

Edge.prototype.loadData = function(){
  // this.uuid = this.db.getUUID()
  // this.datetime = this.db.getCreated()
  // this.name = this.db.getName()
  // this.tags = this.db.getProjectTags()
  // this.notes = this.loadNotes()
}

Edge.prototype.saveData = function(){
  
}