const fs = require('fs')
const { v4: uuidv4 } = require('uuid');
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const Note = require('../_controllers/note');
const Project = require('../_controllers/Project')


const TEST_DB_PATH = "./_tests/test__Project.json"
const TEST_PRJCT_JSON = {
  uuid: uuidv4(),
  created: Date.now(),
  name: "test__Project.json",    
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

// function cleanUpDBFile(){
//   DB.set('name', 'test.json')
//   .set('tags', [])
//   .set('notes', [])
//   .set('graphs', [])
//   .write()
// }


beforeAll(() => {  
  emptyDBJson()
  ADAPTER = new FileSync(TEST_DB_PATH)
  DB = low(ADAPTER)

  //DB.read()
})

afterAll(() => {
  DB = null
  ADAPTER = null

  fs.unlinkSync(TEST_DB_PATH);
})


test('searchNotes', () => {
  let project, n1, n2, n3, results, OCCURENCES;

  project = new Project(TEST_DB_PATH, null);
  OCCURENCES = 3;

  n1 = new Note(project);
  n1.text = "This is dummy text, which dumb. Not saying anything. Of course you would never write such a dumb text but how do you test a text based functionality without a meaningless dumb text that does not say anything for the sake of staying neutral in the interest of all neutral participants. Depending on the perspective 'dumb' is not a neutral word, but in this context it does not reference anything else than the note text which is fine, because it is indeed dumb, thus it says nothing but the truth.";
  n2 = new Note(project);
  n2.text = "Dumb and more way more then dumb, or smart or dumb or smart or dumb or, 0 or 1, or ...";
  n3 = new Note(project);
  n3.text = "No needle in here..";
  n4 = new Note(project);
  n4.text = "This one is not so dumb...Or is it? I thought it had more content, but after a while of reading it turns out to be just as dumb. It probably took the majority of online content as role model. Shallowness of thought seems to be the underlaying paradigm. Just as with someone who decides to reproduce a simple notes app as portfolio project..";
  project.notes = [n1, n2, n3, n4];

  results = project.searchAllNotes("dumb");

  console.log(results);
  console.log(results.length);

  expect(results.length).toEqual(OCCURENCES);
})