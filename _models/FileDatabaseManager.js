const { v4: uuidv4 } = require('uuid')

var FileDatabaseManager = {
  getEmptyProjectJSON: function () {
    let empty_project = {
      uuid:       uuidv4(),
      created:    Date.now(),
      name:       "",    
      tags:       [],
      notes:      [],
      graphs:     []
    }
    return empty_project
  },
  getEmptyNoteJSON: function(){
    let empty_note = { 
      uuid:         uuidv4(),
      created:      Date.now(),
      modified:     Date.now(),
      tags:         [], 
      text:         "", 
      associations: []
    }
    return empty_note
  },
  getEmptyTagJSON: function(){
    let empty_tag = { 
      uuid:         uuidv4(),
      created:      Date.now(),
      modified:     Date.now(),
      name:         "",
      notes:        [], 
    }
    return empty_tag
  },
  getEmptyStorageJSON: function(){
    let empty_storage = {
      uuid:       uuidv4(),
      created:    Date.now(),
      modified:   Date.now(),
      name:       ""
    }
    return empty_storage
  },
  getEmptyGraphJSON: function(){
    let empty_graph = {
      uuid:       uuidv4(),
      created:    Date.now(),
      modified:   Date.now(),
      vertices:   [],
      edges:      []
    }
    return empty_graph
  },
  getEmptyVertexJSON: function(){
    let empty_vertex = {
      uuid:      uuidv4(),
      created:   Date.now(),
      modified:  Date.now(),
      note:      null,
      posX:      0,
      posY:      0,
    }
    return empty_vertex
  },
  getEmptyEdgeJSON: function(){
    let empty_edge = {
      uuid:       uuidv4(),
      created:    Date.now(),
      source:     null,
      target:     null,
    }
    return empty_edge
  }
}

module.exports = FileDatabaseManager