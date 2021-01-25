const { v4: uuidv4 } = require('uuid')

var FileDatabaseManager = {
  getEmptyProjectJSON: function () {
    let empty_project = {
      uuid:       uuidv4(),
      created:    Date.now(),
      name:       "",    
      tags:       [],
      notes:      []   
    }
    return empty_project
  },
  getEmptyNoteJSON: function(){
    let empty_note = { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "", 
      associations: []
    }
    return empty_note
  },
  getEmptyTagJSON: function(){
    let empty_tag = { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "",
      notes: [], 
    }
    return empty_tag
  },
  getEmptyStorageJSON: function(){
    let empty_storage = {
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: ""
    }
    return empty_storage
  }
}

module.exports = FileDatabaseManager