module.exports = FileDatabase

const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const { v4: uuidv4 } = require('uuid');

const DateFormatter = require('../_util/DateFormatter');



/**
 * Class interfacing the JSON file database.
 * 
 * NOTE: To see how JSON file is structured see JSON templates in FileDatabaseManager.js
 * 
 */
function FileDatabase(path) {
  var self = this;

  this.path = path;

  this.adapter = new FileSync(this.path);
  this.db = low(this.adapter);
  
  this.db.read();
}

FileDatabase.prototype.read = function(){
  this.db.read();
}

/* ================================================================= */
/* Operations on project data                                        */
/* ================================================================= */

/**
 * Returns the UUID of the project
 */
FileDatabase.prototype.getProjectUUID = function(){
  this.db.read();
  return this.db.get('uuid').value();
}

/**
 * Gets created datetime of DB file
 */
FileDatabase.prototype.getProjectCreated = function(){
  this.db.read();
  return this.db.get('created').value();
}

/**
 * Gets name of the project DB file
 */
FileDatabase.prototype.getProjectName = function(){
  this.db.read();
  return this.db.get('name').value();
}

/**
 * Updates the name of the project (DB file) and its path
 * 
 * @param {string} name 
 */
FileDatabase.prototype.updateDBName = function(name){
  this.db.read();
  this.db.set('name', name).write();
}

/* ================================================================= */
/* Operations on notes data                                          */
/* ================================================================= */

/**
 * Inserts single note into database file
 * Takes single Note JSON as argument
 * 
 * NOTE: insertNotes is enough just pass array with single object 
 * 
 * @param {object} note 
 */
FileDatabase.prototype.insertNote = function(note){
  this.db.read();
  // Check whether note is already in database
  let s = this.db.get('notes').find({uuid: note.uuid}).value();
  // Write note to database if not existing yet..
  if(!s){
    this.db.get('notes').push(note).write();
  }else{
    console.log(note);
    this.db.get('notes')
    .find({uuid: note.uuid})
    .assign({
      modified: Date.now(),
      tags: note.tags,
      text: note.text,
      bg_color: note.bg_color,
      associations: note.associations
    }).write();
  }
}
/**
 * Inserts multiple notes into database file
 * 
 * Takes list of note json objects..
 * 
 * @param {[objects]} data 
 */
FileDatabase.prototype.insertManyNotes = function(data){
  this.db.read();
  for(var i in data){
    // Check whether note is already in database
    let s = this.db.get('notes').find({uuid: data[i].uuid}).value();
    // Write note to database if not existing yet..
    if(!s){
      this.db.get('notes').push(data[i]).write();
    }
  }
}

/**
 * Updates the text of a specific note with UUID
 * 
 * Takes a note JSON object as argument
 * @param {object} note 
 */
FileDatabase.prototype.updateNoteText = function(note){
  this.db.read();
  let s = this.db.get('notes').find({uuid: note.uuid}).value();
  if(s){
    this.db.get('notes')
    .find({uuid: note.uuid})
    .assign({modified: Date.now(), text: note.text})
    .write();
  }
}

/**
 * Updates one or many notes
 * 
 * Paramater is a list of note json objects
 * @param {[notes]} data 
 */
FileDatabase.prototype.updateManyNotes = function(data){
  this.db.read();
  // Either tags or text
  for(i in data){
    this.db.get('notes')
    .find({uuid: data[i].uuid})
    .assign({modified: Date.now(), tags: data[i].tags, text: data[i].text, associations: data[i].associations})
    .write();
  }
}

/**
 * Removes one to many notes
 * 
 * @param {[object]} data 
 */
FileDatabase.prototype.deleteNotes = function(data){
  this.db.read();
  let note = null,
      arr = data.map(function(x){ return { uuid: x.uuid } } );
  for(var i in arr){
    note = this.db.get('notes').find(arr[i]).value();
    if(note !== null){
      note.modified = Date.now();
      this.db.get('trash').get('notes').push(note).write();
    }
    this.db.get('notes').remove(arr[i]).write();
  }
}


/**
 * Selects one or many notes.
 * Takes array of notes data as argument
 * 
 * TODO: Better just array of note_ids
 * 
 * @param {[notes]} data 
 */
FileDatabase.prototype.selectManyNotes = function(data){
  this.db.read();

  let arr = data.map(function(x){ return { uuid: x.uuid } } );
  let res = [];
  for(var i in arr){
    res.push(this.db.get('notes').find(arr[i]).value());
  }
  return res;
}

/**
 * Selects all notes from the DB file
 */
FileDatabase.prototype.selectAllNotes = function(){
  this.db.read();
  return this.db.get('notes').value();
}

/**
 * Returns number of notes in saved in DB file
 */
FileDatabase.prototype.countNotes = function(){
  this.db.read();
  return this.db.get('notes').size().value();
}


/* ================================================================= */
/* Operations on note tag data                                       */
/* ================================================================= */

/**
 * Insert a tag to note.
 * Checks whether note already exists and sets references
 * 
 * @param {string} note_id 
 * @param {string} tag_name 
 */
FileDatabase.prototype.insertNoteTag = function(note_id, tag_name){
  this.db.read();
  
  // Check if tag is already existing in project's tag list
  let s = this.db.get('tags').find({name: tag_name}).value();
  if(s){
    // Check whether the given note id is referenced from this tag
    ss = this.db.get('tags').find({name: tag_name}).get('notes').find({uuid: note_id}).size().value();
    console.log(ss);
    if(ss < 1){
      // Add & increment note references to tag in project's global tag list
      this.db.get('tags')
      .find({name: tag_name})
      .assign({modified: Date.now()})
      .get('notes')
      .push(note_id)
      .write();
    }
    // Update Note
    this.db.get('notes')
    .find({uuid: note_id})
    .assign({modified: Date.now()})
    .get('tags')
    .push(s.uuid)
    .write();

    return this.db.get('tags').find({name: tag_name}).value();
  }else{
    // Create tag and insert
    let tag = {
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: tag_name,
      notes: [
        note_id
      ],
      graphs: []
    };
    // Add & increment note references to tag in project's global tag listread
    this.db.get('tags').push(tag).write();
    // Add tag reference to note
    this.db.get('notes')
    .find({uuid: note_id})
    .assign({modified: Date.now()})
    .get('tags')
    .push(tag.uuid)
    .write();
    
    return tag;
  }
}

/**
 * [!! NOT USED !!]
 * Called when a tag name is updated in a note
 * 
 * @param {string} note_id 
 * @param {string} cur_tag_id 
 * @param {string} new_name 
 */
FileDatabase.prototype.updateNoteTagName = function(note_id, cur_tag_id, new_name){
  this.db.read();
  // Check if the new name is in the project tag list 
  let sample = this.db.get('tags').find({name: new_name}).value();
  if(sample){    // Tag with suggested name already exists..
    this.db.get('tags').find({name: new_name}).get('notes').push(note_id).write();
    this.db.get('tags').find({uuid: cur_tag_id}).get('notes').remove(note_id).write();
  }else{    
    // Create tag with new name add reference
    
    this.db.get('tags').push({
      uuid: uuidv4(), 
      created: Date.now(), 
      modified: Date.now(), 
      name: new_name, 
      notes: [note_id],
      graphs: []
    })
    .write();

    // Remove note reference from prior tag
    var ref_count_old = this.db.get('tags').find({uuid: cur_tag_id}).get('notes').size().value();
    if(ref_count_old > 1){
      this.db.get('tags').find({uuid: cur_tag_id}).assign({modified: Date.now()}).get('notes').remove({uuid: note_id}).write();
    }else{
      // Check whether graphs are referenced
      ref_count_old = this.db.get('tags').find({uuid: cur_tag_id}).get('graphs').size().value();
      if(ref_count_old > 1){
        this.db.get('tags').find({uuid: cur_tag_id}).assign({modified: Date.now()}).get('notes').remove({uuid: note_id}).write();
      }else{
        // No more references
        this.db.get('tags').remove({uuid: old_tag_id}).write();
      }
    }
  }
}

/**
 * Removes tag from a note. If there are no more references to the note
 * the tag will globally deleted.
 * 
 * @param {string} note_id 
 * @param {string} tag_id 
 */
FileDatabase.prototype.removeNoteTag = function(note_id, tag_id){
  this.db.read();
  // Remove tag from tags list in note
  let val = this.db.get('notes')
              .find({uuid: note_id})
              .assign({modified: Date.now()})
              .get('tags')
              .remove(function(x){ return x === tag_id })
              .write();

  // Remove & decrement references in tags list of project
  var ref_count_old = this.db.get('tags').find({uuid: tag_id}).get('notes').size().value();
  // console.log("ref_count_old: " + ref_count_old);
  if(ref_count_old > 1){
    this.db.get('tags')
      .find({uuid: tag_id})
      .assign({modified: Date.now()})
      .get('notes')
      .remove(function(x){ return x === note_id })
      .write();
  }else{
    // Check for graph references
    ref_count_old = this.db.get('tags').find({uuid: tag_id}).get('graphs').size().value();
    if(ref_count_old > 1){
      this.db.get('tags')
      .find({uuid: tag_id})
      .assign({modified: Date.now()})
      .get('notes')
      .remove(function(x){ return x === note_id })
      .write();
    }else{
      this.deleteTagGlobally(tag_id);
    }
  }
}

/**
 * Returns all the tags and their data for a specific note
 * @param {string} note_id 
 */
FileDatabase.prototype.getNoteTags = function(note_id){
  this.db.read();
  // Resolve references to project's tag list
  let tag_pointers = this.db.get('notes').find({uuid: note_id}).get('tags').value();
  // Join data
  let arr = [],
      cur = null,
      tag_ids = tag_pointers.map(function(id){ return { uuid: id } });
  
  for(var i in tag_ids){
    cur = this.db.get('tags').find({ uuid: tag_ids[i].uuid}).value();
    arr.push(cur);
  }
  return arr;
}

/**
 * [!! NOT USED !!]
 * Returns all notes the tag with tag_id points to 
 * 
 * @param {string} tag_id
 */
FileDatabase.prototype.getNotesFromTag = function(tag_id){
  this.db.read();
  let notes = [],
      note_pointers = this.db.get('tags').find({uuid: tag_id}).get('notes').value();
  
  for(var i in note_pointers){
    notes.push(this.db.get('notes').find({uuid: note_pointers[i]}).value());
  }
  return notes;
}

/**
 * Deletes the tag globally from DB file 
 * @param {string} tag_id 
 */
 FileDatabase.prototype.deleteTagGlobally = function(tag_id){
  this.db.read();

  console.log("deleteTagGlobally: ");
  console.log("Tag-ID: " + tag_id);

  this.db.get('tags').remove({uuid: tag_id}).write();
}

/**
 * Deletes tag from project (globally)
 * @param {string} tag_id 
 */
FileDatabase.prototype.deleteTagFromProject = function(tag_id){
  this.db.read();
  // Deleting tags only from notes should be enough...
  // Since it is only removable if it has no references to notes
  this.db.get('tags').remove({uuid: tag_id}).write();
}

/**
 * Returns all tags of the project.
 */
FileDatabase.prototype.getProjectTags = function(){
  this.db.read();
  // Read all the data from project's tag list
  return this.db.get('tags').value();
}

/* ============================================================ */
/**
 * Insert a tag to graph.
 * Checks whether graph already exists and sets references
 * 
 * @param {string} graph_id 
 * @param {string} tag_name 
 */
FileDatabase.prototype.insertGraphTag = function(graph_id, tag_name){
  this.db.read();
  
  // Check if tag is already existing in project's tag list
  let s = this.db.get('tags').find({name: tag_name}).value();
  // console.log(s)
  if(s){
    // Check whether the given graph id is referenced from this tag
    ss = this.db.get('tags').find({name: tag_name}).get('graphs').find({uuid: graph_id}).size().value();
    console.log(ss);
    if(ss < 1){
      // Add & increment note references to tag in project's global tag list
      this.db.get('tags')
      .find({name: tag_name})
      .assign({modified: Date.now()})
      .get('graphs')
      .push(graph_id)
      .write();
    }
    // Update graph here too!!
    this.db.get('graphs')
    .find({uuid: graph_id})
    .assign({modified: Date.now()})
    .get('tags')
    .push(s.uuid)
    .write();

    return this.db.get('tags').find({name: tag_name}).value();
  }else{
    // Create tag and insert
    let tag = {
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: tag_name,
      note: [],
      graphs: [
        graph_id
      ]
    };
    // Add & increment note references to tag in project's global tag listread
    this.db.get('tags').push(tag).write();
    // Add tag reference to note
    this.db.get('graphs')
    .find({uuid: graph_id})
    .assign({modified: Date.now()})
    .get('tags')
    .push(tag.uuid)
    .write();
    
    return tag;
  }
}

/**
 * [!! NOT USED !!]
 * Called when a tag name is updated in a graph
 * 
 * @param {string} graph_id 
 * @param {string} cur_tag_id 
 * @param {string} new_name 
 */
FileDatabase.prototype.updateGraphTagName = function(graph_id, cur_tag_id, new_name){
  this.db.read();
  // Check if the new name is in the project tag list 
  let sample = this.db.get('tags').find({name: new_name}).value();
  if(sample){    // Tag with suggested name already exists..
    this.db.get('tags').find({name: new_name}).get('graphs').push(graph_id).write();
    this.db.get('tags').find({uuid: cur_tag_id}).get('graphs').remove(graph_id).write();
  }else{    
    // Create tag with new name add reference
    
    this.db.get('tags').push({
      uuid: uuidv4(), 
      created: Date.now(), 
      modified: Date.now(), 
      name: new_name, 
      notes: [],
      graphs: [graph_id]
    })
    .write();

    // Remove note reference from prior tag
    var ref_count_old = this.db.get('tags').find({uuid: cur_tag_id}).get('graphs').size().value();
    if(ref_count_old > 1){
      this.db.get('tags').find({uuid: cur_tag_id}).assign({modified: Date.now()}).get('graphs').remove({uuid: graph_id}).write();
    }else{
      // Check whether graphs are referenced
      ref_count_old = this.db.get('tags').find({uuid: cur_tag_id}).get('notes').size().value();
      if(ref_count_old > 1){
        this.db.get('tags').find({uuid: cur_tag_id}).assign({modified: Date.now()}).get('graphs').remove({uuid: graph_id}).write();
      }else{
        // No more references
        this.db.get('tags').remove({uuid: old_tag_id}).write();
      }
    }
  }
}

/**
 * Removes tag from a note. If there are no more references to the note
 * the tag will globally deleted.
 * 
 * @param {string} graph_id 
 * @param {string} tag_id 
 */
FileDatabase.prototype.removeGraphTag = function(graph_id, tag_id){
  this.db.read();
  // Remove tag from tags list in note
  let val = this.db.get('graphs')
              .find({uuid: graph_id})
              .assign({modified: Date.now()})
              .get('tags')
              .remove(function(x){ return x === tag_id })
              .write();

  // Remove & decrement references in tags list of project
  var ref_count_old = this.db.get('tags').find({uuid: tag_id}).get('graphs').size().value();
  // console.log("ref_count_old: " + ref_count_old);
  if(ref_count_old > 1){
    this.db.get('tags')
      .find({uuid: tag_id})
      .assign({modified: Date.now()})
      .get('graphs')
      .remove(function(x){ return x === graph_id })
      .write();
  }else{
    // Check for note references
    ref_count_old = this.db.get('tags').find({uuid: tag_id}).get('notes').size().value();
    if(ref_count_old > 1){
      this.db.get('tags')
      .find({uuid: tag_id})
      .assign({modified: Date.now()})
      .get('graphs')
      .remove(function(x){ return x === graph_id })
      .write();
    }else{
      this.deleteTagGlobally(tag_id);
    }
  }
}

/**
 * Returns all the tags and their data for a specific graph
 * @param {string} graph_id 
 */
FileDatabase.prototype.getGraphTags = function(graph_id){
  this.db.read();
  // Resolve references to project's tag list
  let tag_pointers = this.db.get('graphs').find({uuid: graph_id}).get('tags').value();
  // Join data
  let arr = [],
      cur = null,
      tag_ids = tag_pointers.map(function(id){ return { uuid: id } });
  
  for(var i in tag_ids){
    cur = this.db.get('tags').find({ uuid: tag_ids[i].uuid}).value();
    arr.push(cur);
  }
  return arr;
}

/**
 * [!! NOT USED !!]
 * Returns all graphs the tag with tag_id points to 
 * 
 * @param {string} tag_id
 */
FileDatabase.prototype.getGraphsFromTag = function(tag_id){
  this.db.read();
  let graphs = [],
      graph_pointers = this.db.get('tags').find({uuid: tag_id}).get('graphs').value();
  
  for(var i in graph_pointers){
    graphs.push(this.db.get('graphs').find({uuid: graph_pointers[i]}).value());
  }
  return graphs;
}

/* ================================================================= */
/* Graph data                                                        */
/* ================================================================= */

FileDatabase.prototype.makeGraphTable = function(){
  this.db.read();
  this.db.set('graphs', []).write();
}

FileDatabase.prototype.insertGraph = function(graph){
  this.db.read();
  // NOTE: Check graph JSON so that only references are used

  // Check whether note is already in database
  let s = this.db.get('graphs').find({uuid: graph.uuid}).value();
  // Write note to database if not existing yet..
  if(!s){
    this.db.get('graphs').push(graph).write();
  }
}

FileDatabase.prototype.updateGraphPosition = function(graph_id, position){
  this.db.read();
  this.db.get('graphs').find({uuid: graph_id}).assign({
    position: {
      translate: { x: position.translate.x, y: position.translate.y},
      scale: position.scale
    },
    modified: Date.now(),
  }).write();
}

FileDatabase.prototype.updateGraphDescription = function(graph_id, description){
  this.db.read();
  this.db.get('graphs').find({uuid: graph_id}).assign({
    description: description,
    modified: Date.now()
  }).write();
}

FileDatabase.prototype.selectAllGraphs = function(){
  this.db.read();
  return this.db.get('graphs').value();
}

FileDatabase.prototype.insertVertex = function(graph_id, vertex){
  // Empty database buffer
  this.db.read();

  let s = this.db.get('graphs').find({uuid: graph_id}).get('vertices').find({uuid: vertex.uuid}).value();
  if(!s){ // Not existing, so create..
    this.db.get('graphs')
    .find({uuid: graph_id})
    .assign({ modified: Date.now() })
    .get('vertices')
    .push({
      uuid:     vertex.uuid,
      created:  vertex.created,
      note:     vertex.note.uuid,
      posX:     vertex.posX,
      posY:     vertex.posY
    }).write();
  }else{  // Exists, so update its position..
    this.db.get('graphs')
    .find({uuid: graph_id})
    .assign({ modified: Date.now() })
    .get('vertices')
    .find({uuid: vertex.uuid})
    .assign({
      posX:     vertex.posX,
      posY:     vertex.posY
    }).write();
  }
}

/**
 * Removes one to many graphs
 * 
 * @param {[object]} data 
 */
FileDatabase.prototype.deleteGraphs = function(data){
  this.db.read();

  let graph = null,
      arr = data.map(function(x){ return { uuid: x.uuid } } );
  for(var i in arr){
    graph = this.db.get('graphs').find(arr[i]).value();
    if(graph !== null){
      graph.modified = Date.now();
      this.db.get('trash').get('graphs').push(graph).write();
    }
    this.db.get('graphs').remove(arr[i]).write();
  }
}

FileDatabase.prototype.deleteVertices = function(graph_id, vertices){
  // Empty database buffer
  this.db.read();
  
  let v_ids = vertices.map(function(v){ return { uuid: v.uuid } } );
  for(var i in v_ids){
    this.db.get('graphs').find({uuid: graph_id}).assign({ modified: Date.now() }).get('vertices').remove(v_ids[i]).write();
  }
}

FileDatabase.prototype.selectAllVertices = function(graph_id){
  this.db.read();
  return this.db.get('graphs').find({uuid: graph_id}).get('vertices').value();
}

FileDatabase.prototype.insertEdge = function(graph_id, edge){
  // Empty database buffer
  this.db.read();

  let s = this.db.get('graphs').find({uuid: graph_id}).get('edges').find({uuid: edge.uuid}).value();
  if(!s){
    this.db.get('graphs')
    .find({uuid: graph_id})
    .assign({ modified: Date.now() })
    .get('edges')
    .push({
      uuid: edge.uuid,
      created: edge.created,
      source: edge.source.uuid,
      target: edge.target.uuid
    }).write();
  }
}

FileDatabase.prototype.deleteEdges = function(graph_id, edges){
  // Empty database buffer
  this.db.read();

  let ed_ids = edges.map(function(ed){ return { uuid: ed.uuid } } );
  for(var i in ed_ids){
    this.db.get('graphs').find({uuid: graph_id}).assign({ modified: Date.now() }).get('edges').remove(ed_ids[i]).write();
  }
}

FileDatabase.prototype.selectAllEdges = function(graph_id){
  this.db.read();
  return this.db.get('graphs').find({uuid: graph_id}).get('edges').value();
}

/* ================================================================= */
/* Trash functions                                                   */
/* ================================================================= */

FileDatabase.prototype.emptyNotesTrash = function(delta){
  this.db.read();
  console.log("emptyNotesTrash with delta: " + delta);
  this.db.get('trash').get('notes')
   // mutates the trash.notes array..
  .remove(note => DateFormatter.checkDateDiffDaysPastNow(note.modified, delta))
  .write();
}

FileDatabase.prototype.emptyGraphsTrash = function(delta){
  this.db.read();
  console.log("emptyGraphsTrash with delta: " + delta);
  // Analog to emptyNotesTrash
  this.db.get('trash').get('graphs')
  .remove(graph => DateFormatter.checkDateDiffDaysPastNow(graph.modified, delta))
  .write();
}

/**
 * Brings back notes from trash. (Reverse operation to delete Notes)
 * 
 * NOTE: Removes invalid tag reference. (i.e. references to tags that are
 *       not existing anymore at the point of revival)
 * 
 * @param {object} data -- Array of Note JSON objects
 */
FileDatabase.prototype.reviveNotes = function(data){
  this.db.read();
  
  let i, j, chk,
      zombie = null,
      arr = data.map(function(x){ return { uuid: x.uuid } } );
  for(i in arr){
    zombie = this.db.get('trash.notes').find(arr[i]).value();
    if(zombie !== null){
      // Check whether tag references are still valid, remove the invalid
      for(j in zombie.tags){
        chk = this.db.get('tags').find({uuid: zombie.tags[j].uuid}).value();
        if(!chk){
          zombie.tags.splice(j, 1);
        }
      }
      zombie.modified = Date.now();
      this.db.get('notes').push(zombie).write(); 
    }
    this.db.get('trash.notes').remove(arr[i]).write();
  }
}

/**
 * Brings back graphs from trash. (Reverse operation to delete graphs)
 * 
 * NOTE: Removes invalid note references. (i.e. references to note that are
 *       not existing anymore at the point of revival)
 * 
 * @param {object} data -- Array of graph JSON objects
 */
 FileDatabase.prototype.reviveGraphs = function(data){
  this.db.read();
  
  let i, j, k, chk,
      zombie = null,
      arr = data.map(function(x){ return { uuid: x.uuid } } );
  for(i in arr){
    zombie = this.db.get('trash.graphs').find(arr[i]).value();
    if(zombie !== null){
      // Check whether notes references in vertices are still valid, remove the invalid
      for(j in zombie.vertices){
        chk = this.db.get('notes').find({uuid: zombie.vertices[j].note}).value();
        if(!chk){
          // Delete edges linked to vertex
          for(k in zombie.edges){
            if(zombie.edges[k].source === zombie.vertices[j].uuid
              || zombie.edges[k].target === zombie.vertices[j].uuid){
                zombie.edges.splice(k, 1);
              }
          }
          // Delete vertex
          zombie.vertices.splice(j, 1);
        }
      }
      zombie.modified = Date.now();
      this.db.get('graphs').push(zombie).write(); 
    }
    this.db.get('trash.graphs').remove(arr[i]).write();
  }
}

/**
 * Creates backup of the database file in string format.
 */
FileDatabase.prototype.makeBackup = function(){
  try{
    const data = fs.readFileSync(this.path, 'utf-8');
    return data;
  }catch(err){
    console.error(err);
  }
}

/**
 * Restores the database file to specific backup string.
 * 
 * @param {string} backup -- Backup to set database file to
 */
FileDatabase.prototype.restoreFromBackup = function(backup){
  try{
    fs.writeFileSync(this.path, backup);
  }catch(err){
    console.error(err);
  }
}

/* ================================================================= */
/* Helper functions                                                  */
/* ================================================================= */

FileDatabase.prototype.getPath = function(){
  return this.path;
}

/* ================================================================= */
