module.exports = Vertice

const FileDatabaseManager = require('../_models/FileDatabaseManager')


function Vertice(graph, data = FileDatabaseManager.getEmptyVerticeJSON()) 
{
  var self = this

  // Vertice data
  this.uuid = data.uuid
  this.created = data.created
  this.modified = data.modified
  this.note = data.note
  this.posX = data.posX
  this.posY = data.posY

  this.project = project

  // Load data on creation
  this.loadData()
}

Vertice.prototype.loadData = function(){
  // this.uuid = this.db.getUUID()
  // this.datetime = this.db.getCreated()
  // this.name = this.db.getName()
  // this.tags = this.db.getProjectTags()
  // this.notes = this.loadNotes()
}

Vertice.prototype.saveData = function(){
  
}