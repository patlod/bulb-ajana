module.exports = AppStorageManager

const fs = require('fs');

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const { v4: uuidv4 } = require('uuid');
const FileDatabaseManager = require('./FileDatabaseManager');
const { fstat } = require('fs');


function AppStorageManager(path) {
  var self = this;

  this.path = path;

  try{
    if(!fs.existsSync(this.path)){
      let nF = FileDatabaseManager.getEmptyStorageJSON();
      fs.writeFileSync(this.path, JSON.stringify(nF, null, 2));
    }
  }catch(err) {
    console.error(err);
  }

  this.adapter = new FileSync(this.path);
  this.db = low(this.adapter);
  
  this.db.read();
}

AppStorageManager.prototype.read = function(){
  this.db.read();
}

/* ================================================================= */
/* Operations on project data                                        */
/* ================================================================= */

/**
 * Returns the UUID of the project
 */
AppStorageManager.prototype.getUUID = function(){
  return this.db.get('uuid').value();
}

/**
 * Gets created datetime of DB file
 */
AppStorageManager.prototype.getCreated = function(){
  return this.db.get('created').value();
}

/**
 * Gets name of the project DB file
 */
AppStorageManager.prototype.getName = function(){
  return this.db.get('name').value();
}

/**
 * Updates the name of the project (DB file) and its path
 * @param {string} name 
 */
AppStorageManager.prototype.updateDBName = function(name){
  this.db.set('name', name).write();
}


/* ================================================================= */
/* Helper functions                                                  */
/* ================================================================= */

AppStorageManager.prototype.getPath = function(){
  return this.path;
}

/* ================================================================= */
