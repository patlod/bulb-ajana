const fs = require('fs')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const FileDatabase = require('../_models/FileDatabase');
//const FileDatabaseManager = require('../_models/FileDatabaseManager')

const { v4: uuidv4 } = require('uuid');
const { hasUncaughtExceptionCaptureCallback } = require('process');
const { equal } = require('assert');

const TEST_DB_PATH = "./_tests/test__FileDatabase.json"
const TEST_PRJCT_JSON = {
  uuid: uuidv4(),
  created: Date.now(),
  name: "test__FileDatabase.json",    
  tags: [],
  notes: [],
  graphs: []
}

var ADAPTER = null
var DB = null


function emptyDBJson(){
  const json_string = JSON.stringify(TEST_PRJCT_JSON, null, 2);

  fs.writeFileSync(TEST_DB_PATH, json_string)
}

function cleanUpDBFile(){
  DB.set('name', 'test.json')
  .set('tags', [])
  .set('notes', [])
  .set('graphs', [])
  .write()
}


beforeAll(() => {  
  emptyDBJson()
  ADAPTER = new FileSync(TEST_DB_PATH)
  DB = low(ADAPTER)

  //DB.read()
})

afterAll(() => {
  // deleteDBJson()
  //cleanUpDBFile()
  DB = null
  ADAPTER = null

  // try {
  //   fs.unlinkSync(TEST_DB_PATH)
  //   //file removed
  // } catch(err) {
  //   console.error(err)
  // }
})

afterEach(() => {
  // Delete testdata from JSON file

  //cleanUpDBFile()
})


/*
test('insertNote', () => {
  let fdb = new FileDatabase(TEST_DB_PATH)

  const payload = { 
    uuid: uuidv4(), 
    created: Date.now(),
    modified: Date.now(),
    tags: [], 
    text: "", 
    associations: []
  }

  fdb.insertNote(payload)
  
  let val = fdb.db.get('notes').value()
  expect(val[0]).toEqual(payload)
  expect(val.length).toEqual(1)

})


test('insertManyNotes', () => {
  let fdb = new FileDatabase(TEST_DB_PATH)

  const payload = [
    { 
      uuid: uuidv4(), 
      created: Date.now(),
      tags: [], 
      text: "Test note text 1", 
      associations: []
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      tags: [], 
      text: "Test note text 2", 
      associations: []
    },
  ]

  fdb.insertManyNotes(payload)
  

  let val = fdb.db.get('notes').value()
  expect(val).toEqual(payload)
  expect(val.length).toEqual(2)

})

test('updateManyNotes', () => {
  let fdb = new FileDatabase(TEST_DB_PATH)

  const dummies = [
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Test note text 1", 
      associations: []
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Test note text 2", 
      associations: []
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Test note text 3", 
      associations: []
    },
    { 
      uuid: uuidv4(), 
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Test note text 4", 
      associations: []
    }
  ]

  const payload = [
    { 
      uuid: dummies[1].uuid,
      created: dummies[1].created,
      modified: dummies[1].modified,
      tags: [], 
      text: "Note 2 -- UPDATED TEXT", 
      associations: []
    },
    { 
      uuid: dummies[2].uuid,
      created: dummies[2].created,
      modified: dummies[2].modified,
      tags: [], 
      text: "Note 3 -- UPDATED TEXT", 
      associations: []
    }
  ]

  fdb.db.get("notes").push(...dummies).write()

  fdb.updateManyNotes(payload)

  let val = fdb.db.get('notes').value()
  expect(val.length).toEqual(4)
  let val2 = fdb.db.get('notes').find({uuid: payload[0].uuid}).value()
  expect(val2.created).toEqual(payload[0].created)
  expect(val2.modified).toBeGreaterThanOrEqual(payload[0].modified)
  expect(val2.tags).toEqual(payload[0].tags)
  expect(val2.text).toEqual(payload[0].text)
  expect(val2.associations).toEqual(payload[0].associations)
  let val3 = fdb.db.get('notes').find({uuid: payload[1].uuid}).value()
  expect(val3.created).toEqual(payload[1].created)
  expect(val3.modified).toBeGreaterThanOrEqual(payload[1].modified)
  expect(val3.tags).toEqual(payload[1].tags)
  expect(val3.text).toEqual(payload[1].text)
  expect(val3.associations).toEqual(payload[1].associations)

})

test('deleteNotes', () => {
  let fdb = new FileDatabase(TEST_DB_PATH)

  const dummies = [
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Test note text 1", 
      associations: []
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Test note text 2", 
      associations: []
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Test note text 3", 
      associations: []
    }
  ]

  const payload = [
    { 
      uuid:           dummies[1].uuid,
      created:      dummies[1].created,
      modified:     dummies[1].modified, 
      tags:         [], 
      text:         "Test note text 2", 
      associations: []
    }
  ]

  fdb.db.get("notes").push(...dummies).write()

  fdb.deleteNotes(payload)

  let val = fdb.db.get('notes').value()
  expect(val.length).toEqual(2)
  expect(val[0].uuid).toEqual(dummies[0].uuid)
  expect(val[1].uuid).toEqual(dummies[2].uuid)

})


test('selectManyNotes', () => {
  let fdb = new FileDatabase(TEST_DB_PATH)

  const dummies = [
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Test note text 1", 
      associations: []
    },
    { 
      uuid: uuidv4(), 
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Test note text 2", 
      associations: []
    },
    { 
      uuid: uuidv4(), 
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Test note text 3", 
      associations: []
    },
    { 
      uuid: uuidv4(), 
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Test note text 4", 
      associations: []
    }
  ]

  const payload = [
    dummies[1],
    dummies[2]
  ]

  fdb.db.get("notes").push(...dummies).write()

  let val1 = fdb.selectManyNotes(payload)
  expect(val1.length).toEqual(2)
  let ids_arr = val1.map(function(x){ return x.uuid })
  expect(ids_arr.indexOf(payload[0].uuid)).toBeGreaterThanOrEqual(0)
  expect(ids_arr.indexOf(payload[1].uuid)).toBeGreaterThanOrEqual(0)

})


test('selectAllNotes', () => {
  let fdb = new FileDatabase(TEST_DB_PATH)

  const payload = [
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(), 
      tags: [], 
      text: "Test note text 1", 
      associations: []
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Test note text 2", 
      associations: []
    }
  ]

  fdb.db.get("notes").push(...payload).write()

  let val = fdb.selectAllNotes()
  expect(val).toEqual(payload)
  expect(val.length).toEqual(2)

})


test('countNotes', () => {
  let fdb = new FileDatabase(TEST_DB_PATH)

  const dummies = [
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Test note text 1", 
      associations: []
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(), 
      tags: [], 
      text: "Test note text 2", 
      associations: []
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(), 
      tags: [], 
      text: "Test note text 3", 
      associations: []
    }
  ]

  // Insert dummies
  fdb.db.get("notes").push(...dummies).write()

  let val = fdb.countNotes()
  expect(val).toEqual(3)

})


test('insertNoteTag', () => {
  let fdb = new FileDatabase(TEST_DB_PATH)

  const dummy_notes = [
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Dummy note 1 text", 
      associations: []
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Dummy note 2 text", 
      associations: []
    }
  ]

  const dummy_tag = { 
    uuid: uuidv4(),
    created: Date.now(),
    modified: Date.now(),
    name: "Dummy Tag",
    notes: [], 
  }

  // First note
  fdb.db.get("notes").push(...dummy_notes).write()

  fdb.insertNoteTag(dummy_notes[0].uuid, dummy_tag.name)

  let val = fdb.db.get('tags').value()
  expect(val.length).toEqual(1)
  expect(val[0].name).toEqual(dummy_tag.name)
  expect(val[0].notes.length).toEqual(1)
  expect(val[0].notes[0]).toEqual(dummy_notes[0].uuid)

  // Insert same tag for different note
  fdb.insertNoteTag(dummy_notes[1].uuid, dummy_tag.name)
  // Still one tag but two references
  expect(val.length).toEqual(1)
  expect(val[0].notes.length).toEqual(2)
})


test('upateNoteTagName', () => { 
  expect(true).toEqual(true)
})

test('deleteTags', () => {
  let fdb = new FileDatabase(TEST_DB_PATH)

  const dummy_tags = [
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "Dummy Tag 1",
      notes: [], 
    },
    {
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "Dummy Tag 2",
      notes: [], 
    },
    {
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "Dummy Tag 3",
      notes: [], 
    },
    {
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "Dummy Tag 4",
      notes: [], 
    }
  ]

  fdb.db.get("tags").push(...dummy_tags).write()

  let kills = dummy_tags.slice(1,3)
  for(var i in kills){
    fdb.deleteTagGlobally(kills[i].uuid)
  }

  let val = fdb.db.get("tags").size().value()
  expect(val).toEqual(2)
})

test('removeNoteTag', () => {
  let fdb = new FileDatabase(TEST_DB_PATH)

  const dummy_tags = [
    {
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "Tag 1: Single Note Refs",
      notes: [], 
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "Tag 2: Multiple Note Refs",
      notes: [], 
    }
  ]

  const dummy_notes = [
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Dummy note 1 text", 
      associations: []
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Dummy note 2 text", 
      associations: []
    }
  ]

  // Set references in the dummy json
  // First tag has only one note pointers
  dummy_tags[0].notes.push(dummy_notes[0].uuid)
  dummy_notes[0].tags.push(dummy_tags[0].uuid)
  // Second tag has multiple note pointers
  dummy_tags[1].notes.push(dummy_notes[0].uuid)
  dummy_notes[0].tags.push(dummy_tags[1].uuid)
  dummy_tags[1].notes.push(dummy_notes[1].uuid)
  dummy_notes[1].tags.push(dummy_tags[1].uuid)

  // Prep DB with dummies
  fdb.db.get('tags').push(...dummy_tags).write()
  fdb.db.get('notes').push(...dummy_notes).write()

  // Remove tag 0 from note 0
  fdb.removeNoteTag(dummy_notes[0].uuid, dummy_tags[0].uuid)

  // The tag with one reference should be fully deleted
  let val_arr = fdb.db.get('tags').value()
  expect(val_arr.length).toEqual(1)

  val_err = fdb.db.get('notes').find({uuid: dummy_notes[0].uuid}).get('tags').value()
  expect(val_err.length).toEqual(1)

  // Remove tag 1 from note 0 or 1
  fdb.removeNoteTag(dummy_notes[0].uuid, dummy_tags[1].uuid)

  // Tag 1 should still be in DB with one reference to other note
  val_arr = fdb.db.get('tags').value()
  expect(val_arr.length).toEqual(1)
  expect(val_arr[0].notes.length).toEqual(1)

  val_arr = fdb.db.get('notes').find({uuid: dummy_notes[0].uuid}).get('tags').size().value()
  expect(val_arr).toEqual(0)
})

test('deleteTagFromPoject', () => { 
  let fdb = new FileDatabase(TEST_DB_PATH)

  const dummy_tags = [
    {
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "Tag 1: Single Note Refs",
      notes: [], 
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "Tag 2: Multiple Note Refs",
      notes: [], 
    }
  ]

  fdb.db.get('tags').push(...dummy_tags).write()

  fdb.deleteTagFromProject(dummy_tags[0].uuid)
  let val = fdb.db.get('tags').value()
  expect(val.length).toEqual(1)
  fdb.deleteTagFromProject(dummy_tags[1].uuid)
  val = fdb.db.get('tags').value()
  expect(val.length).toEqual(0)
})

test('getNoteTags', () => { 
  let fdb = new FileDatabase(TEST_DB_PATH)

  const dummy_tags = [
    {
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "Tag 1",
      notes: [], 
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "Tag 2",
      notes: [], 
    },
    {
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "Tag 3",
      notes: [], 
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "Tag 4",
      notes: [], 
    }
  ]

  const dummy_notes = [
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Dummy note 1 text", 
      associations: []
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Dummy note 2 text", 
      associations: []
    }
  ]

  //dummy_tags[1].uuid = dummy_tags[0].uuid

  // Set references in dummy json
  // First note
  dummy_notes[0].tags.push(dummy_tags[0].uuid)
  dummy_notes[0].tags.push(dummy_tags[1].uuid)
  dummy_notes[0].tags.push(dummy_tags[2].uuid)
  dummy_tags[0].notes.push(dummy_notes[0].uuid)
  dummy_tags[1].notes.push(dummy_notes[0].uuid)
  dummy_tags[2].notes.push(dummy_notes[0].uuid)
  // Second note
  dummy_notes[1].tags.push(dummy_tags[3].uuid)
  dummy_tags[3].notes.push(dummy_notes[1].uuid)

  fdb.db.get('tags').push(...dummy_tags).write()
  fdb.db.get('notes').push(...dummy_notes).write()

  let val_arr = fdb.getNoteTags(dummy_notes[0].uuid)
  expect(val_arr.length).toEqual(3)
  val_arr = fdb.getNoteTags(dummy_notes[1].uuid)
  expect(val_arr.length).toEqual(1)
})

test('getNotesFromTag', () => {
  let fdb = new FileDatabase(TEST_DB_PATH)

  const dummy_tags = [
    {
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "Tag 1",
      notes: [], 
    }
  ]

  const dummy_notes = [
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Dummy note 1", 
      associations: []
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Dummy note 2", 
      associations: []
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Dummy note 3", 
      associations: []
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Dummy note 4", 
      associations: []
    }
  ]

  dummy_tags[0].notes.push(dummy_notes[0].uuid)
  dummy_tags[0].notes.push(dummy_notes[1].uuid)
  dummy_tags[0].notes.push(dummy_notes[2].uuid)
  dummy_tags[0].notes.push(dummy_notes[3].uuid)

  fdb.db.get('tags').push(...dummy_tags).write()
  fdb.db.get('notes').push(...dummy_notes).write()

  let val_arr = fdb.getNotesFromTag(dummy_tags[0].uuid)
  expect(val_arr.length).toEqual(4)
  expect(val_arr.map(function(x){return x.uuid}).indexOf(dummy_notes[2].uuid)).toBeGreaterThan(0)
})

test('getProjectTags', () => {
  let fdb = new FileDatabase(TEST_DB_PATH)

  const dummy_tags = [
    {
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "Tag 1",
      notes: [], 
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "Tag 2",
      notes: [], 
    },
    {
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "Tag 3",
      notes: [], 
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "Tag 4",
      notes: [], 
    }
  ]

  fdb.db.get('tags').push(...dummy_tags).write()

  let val_arr = fdb.getProjectTags()
  expect(val_arr.length).toEqual(4)

 })


test('getPath', () => {
  let fdb = new FileDatabase(TEST_DB_PATH)
  let path = fdb.getPath()
  expect(path).toEqual(TEST_DB_PATH)
 })*/


/*
test('weirdBugInsertNote', () => {
  let fdb = new FileDatabase(TEST_DB_PATH)

  const payload = { 
    uuid: uuidv4(), 
    created: Date.now(),
    modified: Date.now(),
    tags: [], 
    text: "", 
    associations: []
  }

  const dummy_tags = [
    {
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "Tag 1: Single Note Refs",
      notes: [], 
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      name: "Tag 2: Multiple Note Refs",
      notes: [], 
    }
  ]

  const dummy_notes = [
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Dummy note 1 text", 
      associations: []
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Dummy note 2 text", 
      associations: []
    }
  ]

  // Set references in the dummy json
  // First tag has only one note pointers
  dummy_tags[0].notes.push(dummy_notes[0].uuid)
  dummy_notes[0].tags.push(dummy_tags[0].uuid)
  // Second tag has multiple note pointers
  dummy_tags[1].notes.push(dummy_notes[0].uuid)
  dummy_notes[0].tags.push(dummy_tags[1].uuid)
  dummy_tags[1].notes.push(dummy_notes[1].uuid)
  dummy_notes[1].tags.push(dummy_tags[1].uuid)

  // Prep DB with dummies
  fdb.db.get('tags').push(...dummy_tags).write()
  fdb.db.get('notes').push(...dummy_notes).write()

  fdb.insertNote(payload)


})*/

test('selectAllVertices', () => {
  let fdb = new FileDatabase(TEST_DB_PATH)

  
  const dummy_notes = [
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Dummy note 1", 
      associations: []
    },
    { 
      uuid: uuidv4(),
      created: Date.now(),
      modified: Date.now(),
      tags: [], 
      text: "Dummy note 2", 
      associations: []
    }
  ]
  const dummy_vertices = [
    { 
      uuid:       uuidv4(), 
      created:    Date.now(),
      note:       dummy_notes[0].uuid, 
      posX:       0, 
      poxY:       0
    },
    { 
      uuid:       uuidv4(), 
      created:    Date.now(),
      note:       dummy_notes[1].uuid, 
      posX:       0, 
      poxY:       0
    }
  ]

  const dummy_edges = [
    {
      uuid:       uuidv4(),
      created:    Date.now(),
      source:     dummy_vertices[0].uuid,
      target:     dummy_vertices[1].uuid,
    }
  ]

  const dummy_graph = {
    uuid:       uuidv4(),
    created:    Date.now(),
    vertices:   [dummy_vertices[0], dummy_vertices[1]],
    edges:      [dummy_edges[0]]
  }


  // Prep DB with dummies
  fdb.db.get('graphs').push(dummy_graph).write()
  
  let v_query = fdb.selectAllVertices(dummy_graph.uuid)
  console.log(v_query)

  let ed_query = fdb.selectAllEdges(dummy_graph.uuid)
  console.log(ed_query)

})



// test('Dynamically push attributes to JSON', () => {
//   let fdb = new FileDatabase(TEST_DB_PATH)

//   fdb.db.set('MOESE', ['feucht']).write()
//   console.log("BLÖÖÖÖÖÖD")

//   //fdb.db.get("tags").push(...dummy_tags).write()
//   expect(1).toEqual(1)
  
// })

// test('createDummyDBFile', () => {
//   let fdb = new FileDatabase(TEST_DB_PATH)

//   const dummy_tags = [
//     {
//       uuid: uuidv4(),
//       created: Date.now(),
//       modified: Date.now(),
//       name: "Tag 1: Single Note Refs",
//       notes: [], 
//     },
//     { 
//       uuid: uuidv4(),
//       created: Date.now(),
//       modified: Date.now(),
//       name: "Tag 2: Multiple Note Refs",
//       notes: [], 
//     }
//   ]

//   const dummy_notes = [
//     { 
//       uuid: uuidv4(),
//       created: Date.now(),
//       modified: Date.now(),
//       tags: [], 
//       text: "Dummy note 1 text", 
//       associations: []
//     },
//     { 
//       uuid: uuidv4(),
//       created: Date.now(),
//       modified: Date.now(),
//       tags: [], 
//       text: "Dummy note 2 text", 
//       associations: []
//     }
//   ]

//   // Set references in the dummy json
//   // First tag has only one note pointers
//   dummy_tags[0].notes.push(dummy_notes[0].uuid)
//   dummy_notes[0].tags.push(dummy_tags[0].uuid)
//   // Second tag has multiple note pointers
//   dummy_tags[1].notes.push(dummy_notes[0].uuid)
//   dummy_notes[0].tags.push(dummy_tags[1].uuid)
//   dummy_tags[1].notes.push(dummy_notes[1].uuid)
//   dummy_notes[1].tags.push(dummy_tags[1].uuid)

//   // Prep DB with dummies
//   fdb.db.get('tags').push(...dummy_tags).write()
//   fdb.db.get('notes').push(...dummy_notes).write()
//  })