const { hasUncaughtExceptionCaptureCallback } = require('process');
const { equal } = require('assert');
const { TestScheduler } = require('jest');

//const { Note } = require('../_controllers/Note')






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