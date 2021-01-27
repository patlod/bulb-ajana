module.exports = Graph

const FileDatabaseManager = require('../_models/FileDatabaseManager')


function Graph(project, data = FileDatabaseManager.getEmptyGraphJSON()) 
{
  var self = this

  // Graph data
  this.uuid = data.uuid
  this.created = data.created
  // this.modified = data.modified
  this.vertices = data.vertices
  this.edges = data.edges

  // this.active = false

  this.project = project

  // Load data on creation
  this.loadData()
}

Graph.prototype.loadData = function(){
  // this.uuid = this.db.getUUID()
  // this.datetime = this.db.getCreated()
  // this.name = this.db.getName()
  // this.tags = this.db.getProjectTags()
  // this.notes = this.loadNotes()
}

Graph.prototype.saveData = function(){
  
}
