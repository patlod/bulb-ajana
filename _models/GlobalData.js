module.exports = GlobalData

const inherits = require('util').inherits;
const fs = require('fs');

const AppStorageManager = require('./AppStorageManager');
const Queue = require('../_util/Queue');


function GlobalData(path){
  var self = this;
  AppStorageManager.call(this, path);

  this.MAX_RECENT_PROJECTS = 6;

  // Attribute Keys
  this.KEY_RECENT_PROJ = 'recentProjects';

  this.recent_projects = new Queue('string', this.MAX_RECENT_PROJECTS);

  this.loadAndFilterZombies();
}
inherits(GlobalData, AppStorageManager)

/**
 * Recent Projects
 */
GlobalData.prototype.loadRecentProjects = function(){
  let els = this.db.get(this.KEY_RECENT_PROJ).value();
  if(els){
    this.recent_projects = new Queue('string', this.MAX_RECENT_PROJECTS, els);
  }
}

GlobalData.prototype.loadAndFilterZombies = function(){
  this.loadRecentProjects();
  let els = this.recent_projects.getAllItems();
  //console.log(els)
  for(var i in els){
    try{
      if(!fs.existsSync(els[i])){
        els.splice(i,1);
      }
    }catch(err){
      console.error(err);
    }
  }

  if(els.length < this.recent_projects.getLength() ){
    this.recent_projects.resetItems(els);
    this.saveRecentProjects();
  }
}


GlobalData.prototype.saveRecentProjects = function(){
  this.db.set('recentProjects', this.recent_projects.getAllItems()).write();
}

GlobalData.prototype.addRecentProject = function(path_str){
  if(typeof path_str !== 'string'){
    console.error("Path must be of type string");
  }

  try{
    if(!fs.existsSync(path_str)){
      console.log("File does not exist at path :" + path_str);
      return;
    }
  }catch(err){
    console.error(err);
  }
  this.recent_projects.addItem(path_str);
  // Save to database
  this.saveRecentProjects();

}

GlobalData.prototype.getAllRecentProjects = function(){
  // Fetch from database
  this.loadAndFilterZombies();
  return this.recent_projects.getAllItems();
}



