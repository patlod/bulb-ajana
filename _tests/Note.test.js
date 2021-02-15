const Note = require('../_controllers/note');


beforeAll(() => {  

})

afterAll(() => {
 
})



afterEach(() => {
  // Delete testdata from JSON file

  //cleanUpDBFile()
})

test('compareTo', () => {
  let n1_json = {
    "uuid": "e19ac000-5707-4fb0-ba02-cfdcc11d9bd1",
    "created": 1610755170717,
    "modified": 1610984366275,
    "tags": [
      "19339589-3601-4ff6-8ec2-10b89f24f587",
      "8b908748-d01f-408d-b10a-4d55cdeec16e"
    ],
    "text": "",
    "associations": []
  }
  //let n1 = new Note(null, n1_json)

  let n2_json = {
    "uuid": "e19ac000-5707-4fb0-ba02-cfdcc11d9bd1",
    "created": 1610755170717,
    "modified": 1610984366275,
    "tags": [
      "19339589-3601-4ff6-8ec2-10b89f24f587",
      "8b908748-d01f-408d-b10a-4d55cdeec16e"
    ],
    "text": "",
    "associations": []
  }
  //let n2 = new Note(null, n2_json)

  console.log(JSON.stringify(n1_json) === JSON.stringify(n2_json))

})

test('searchNoteText', () => {
  let note, results, OCCURENCES;

  // 26, 
  OCCURENCES = 5;

  note = new Note(null);
  note.text = "This is dummy text, which dumb. Not saying anything. Of course you would never write such a dumb text but how do you test a text based functionality without a meaningless dumb text that does not say anything for the sake of staying neutral in the interest of all neutral participants. Depending on the perspective 'dumb' is not a neutral word, but in this context it does not reference anything else than the note text which is fine, because it is indeed dumb, thus it says nothing but the truth.";

  results = note.searchNoteText("dumb");

  console.log(results);

  //expect(results.needle).toEqual('dumb');
  expect(results.length).toEqual(OCCURENCES);
})