const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const FileDatabaseManager = require('../_models/FileDatabaseManager');
const GlobalData = require('../_models/GlobalData');

const TEST_DIR = "./_tests/";
const TEST_DB_PATH = "./_tests/test__GlobalData.json";
const TEST_PRJCT_JSON = FileDatabaseManager.getEmptyStorageJSON();


var ADAPTER = null;
var DB = null;


function emptyDBJson(){
  const json_string = JSON.stringify(TEST_PRJCT_JSON, null, 2);
  fs.writeFileSync(TEST_DB_PATH, json_string)
}

function createDummyProjectFiles(amount){
  if(amount > 26){
    return
  }

  var ascend = []
  for(var i = 0; i < amount; i++){
    ascend.push(i.toString())
  }

  for(var j in ascend){
    ascend[j] = TEST_DIR + "test_project_" + ascend[j] + ".json"
    let content_str = JSON.stringify(FileDatabaseManager.getEmptyProjectJSON(), null, 2)

    try{
      fs.writeFileSync(ascend[j], content_str)
    }catch(err){
      console.log(err)
    }
  }
  return ascend
}

function deleteDummyProjectFiles(path_array){
  try{
    for(var i in path_array){
      if(typeof path_array[i] !== 'string'){
        return 
      }
      fs.unlinkSync(path_array[i])
    }
  }catch(err){
    console.log(err)
  }
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

test('PROVISORY__Test_Essential_Functions', () => {
  let gD = new GlobalData(TEST_DB_PATH)

  // Dummy Project Paths
  let dPP = createDummyProjectFiles(6)
  console.log(dPP)
  gD.db.set(gD.KEY_RECENT_PROJ, []).write()
  gD.db.get(gD.KEY_RECENT_PROJ).push(...dPP).write()
  

  // TEST: getAllRecentProjects() & loadRecentProjects()
  //console.log(gD.getAllRecentProjects())
  expect(gD.getAllRecentProjects().length).toEqual(6)

  let rec_prjct_paths = gD.db.get(gD.KEY_RECENT_PROJ).value()
  expect(rec_prjct_paths.length).toEqual(dPP.length)

  // addRecentProject(path_str) & saveRecentProjects()
  let p_zzz_path = TEST_DIR + 'test_project_ZZZ.json'
  try{
    fs.writeFileSync(p_zzz_path, 
      JSON.stringify(FileDatabaseManager.getEmptyProjectJSON(), null, 2))
  }catch(err){
    console.log(err)
  }
  gD.addRecentProject(p_zzz_path)

  rec_prjct_paths = gD.db.get(gD.KEY_RECENT_PROJ).value()
  expect(rec_prjct_paths.length).toEqual(6)
  console.log(rec_prjct_paths[0])
  expect(rec_prjct_paths[0]).not.toEqual(dPP[0])

  // loadAndFilterZombies()
  // Delete two files first

  for(var i = 0; i < 2; i++){
    console.log(dPP[i])
    gD.db.get('recentProjects').remove(function(x){ return x === dPP[i] }).write()
  }
  
  // getAllRecentProjects & loadAndFilterZombies()
  let r_prjcts = gD.getAllRecentProjects()
  expect(r_prjcts.length).toEqual(4)

  // TEST: addRecentProject and the queue mechanism 
  // regarding max capacity and order
  const more_files = [
    TEST_DIR + 'test_project_YYY.json',
    TEST_DIR + 'test_project_XXX.json',
    TEST_DIR + 'test_project_WWW.json'
  ]
  for(var i in more_files){
    fs.writeFileSync(more_files[i], 
      JSON.stringify(FileDatabaseManager.getEmptyProjectJSON(), null, 2))
  }
  for(var i in more_files){
    gD.addRecentProject(more_files[i])
  }

  r_prjcts = gD.getAllRecentProjects()
  expect(r_prjcts.length).toEqual(6)

  expect(r_prjcts[0]).not.toEqual(dPP[0])
  let chk = gD.db.get(gD.KEY_RECENT_PROJ).value()
  expect(chk.length).toEqual(r_prjcts.length)
  
  // TEST: addRecentProject() inserts existing paths at the beginning of queue
  expect(r_prjcts[0]).not.toEqual(p_zzz_path)
  gD.addRecentProject(p_zzz_path)
  expect(r_prjcts[0]).toEqual(p_zzz_path)

})

test('loadRecentProjects', () => {

  // deleteDummyProjectFiles(dPP)

  expect(1).toEqual(1)
  
})

test('saveRecentProjects', () => {
  
  expect(1).toEqual(1)
  
})

test('addRecentProject', () => {
  
  expect(1).toEqual(1)
  
})

test('getAllRecentProjects', () => {
  
  expect(1).toEqual(1)
  
})

test('loadAndFilterZombies', () => {
  
  expect(1).toEqual(1)
  
})