module.exports = Session

const { remote } = require('electron');
const { app, dialog } = remote;
const fs = require('fs');

const FileDatabaseManager = require('../_models/FileDatabaseManager');
const { v4: uuidv4 } = require('uuid');

//const Config = require('../config.js')

const App = require('../App.js');
const Project = require('./Project');
const { path } = require('d3');
const GraphEditorView = require('../_views/GraphEditorView');
const { inherits } = require('util');
const EventEmitterElement = require('../_app/EventEmitterElement');


/**
 * Manages the current session
 */
function Session(app) {
  this.self = this;
  EventEmitterElement.call(this, app);

  this.projects = [];
  this.index = 0;
  this.selected_projects = [];

  // this.global_search = null;

  this.app = app;
}
inherits(Session, EventEmitterElement);


/**
 * Returns a list of all the open projects
 * 
 */
Session.prototype.getProjects = function(){
  return this.projects;
}

/**
 * Gets a project by its name
 */
Session.prototype.getProjectByPath = function(path){
  return this.projects.filter(p => ( p.db.path.localeCompare(path) === 0 ) );
}

Session.prototype.getProjectByIndex = function(index){
  return this.projects[index];
}

/**
 * Gets project by its UUID
 * @param {UUID} id 
 */
Session.prototype.getProjectByUUID = function(uuid){
  return this.projects.filter(p => ( p.uuid.localeCompare(uuid) === 0 ));
}

Session.prototype.spliceByUUID = function(uuid){
  for(var i in this.projects){
    if(this.projects[i].uuid.localeCompare(uuid) === 0){
      this.projects.splice(i, 1);
      return;
    }
  }
}

/**
 * Get name of DB file from path
 */
Session.prototype.getDBFileNameFrom = function(path){
  let path_split = path.split("/");
  return path_split[path_split.length - 1];
}

/**
 * Returns the currently active project
 */
Session.prototype.getActiveProject = function(){
  if(this.projects.length === 0) return null;
  for(var i in this.projects){
    console.log(this.projects[i]);
    if(this.projects[i].isActive()) return this.projects[i];
  }
}

/**
 * Activates the handed target project and deactivates the current active project.
 * @param {Project} target 
 */
Session.prototype.toggleActiveProject = function(target = null){
  if(this.projects.length === 0) return null;
  for(var i in this.projects){
    // Did not work with getActiveProject, probably because the return hands back a value..
    if(this.projects[i].isActive()){
      if(this.projects[i].uuid.localeCompare(target.uuid) === 0){
        return;
      }
      // First deactivate all notes
      this.projects[i].resetActiveNote();
      // Then deactivate project
      this.projects[i].deactivate();
    } 
  }
  // Activate new project
  if(target !== null){
    target.activate();
    return target;
  } // else no project will be activated
}

/**
 * Sets note at index in the notes array active
 */
Session.prototype.setActiveProjectAtIndex = function(index){
  return this.toggleActiveProject(this.projects[index]);
}

/**
 * Resets active notes of project to 'NO ACTIVE NOTE'
 */
Session.prototype.resetActiveProject = function(){
  this.toggleActiveProject();
}

/**
 * Returns graph_mode of active project
 * @param {*}  
 */
Session.prototype.getGraphMode = function(){
  let p = this.getActiveProject();
  return (p !== null) ? p.getGraphMode() : false;
}

/**
 * Sets graph_mode of active project
 * @param {*}  
 */
Session.prototype.setGraphMode = function(val){
  let p = this.getActiveProject();
  if(p !== null){
    p.setGraphMode(val);
  }
}

Session.prototype.getActiveGraph = function(){
  return this.getActiveProject().getActiveGraph();
}

/**
 * Prepares a target project for being unfocused or closed
 * 
 * @param {Project} targetProject - The project to be prepared
 */
Session.prototype.prepProjectForTrans = function(project){
  var self = this;

  if(project){
    let active_graph = project.getActiveGraph();
    let active_note = project.getActiveNote();
    let empty_notes = project.getEmptyNotes();
    if(empty_notes.length === 1 && active_note.compareTo(empty_notes[0])){
      project.deleteNotes([active_note]);
      if(active_graph !== null){
        active_graph.deleteVerticesForNote(active_note);
        if(project.getGraphMode()){
          self.app.views.graph.updateGraph(active_graph);
        }
      }
    }else{
      project.prepNoteForTrans(active_note);
    }

    // Clear search
    project.search = null;
    self.app.views.titlebar.clearSearch();
  }
}

Session.prototype.transToProject = function(project, callback){
  var self = this;

  // Prepare currently active project for transition
  let active_project = self.getActiveProject(),
      prior_project_gm = active_project.getGraphMode();

  if(active_project.uuid.localeCompare(project.uuid) !== 0){
    self.prepProjectForTrans(active_project);

    // Due to my design it is enough to just toggle the active projects and 
    // trigger a re-render()
    self.toggleActiveProject(project);
    
    let cur_active_project = self.getActiveProject();
    cur_active_project.setActiveNoteAtIndex(0);
    if(cur_active_project.notes.length > 0){
      cur_active_project.startSelectionWith(cur_active_project.notes[0]);
    }
    
    // if(typeof callback === "function"){
    if(prior_project_gm && cur_active_project.getGraphMode()){
      // For some reason the graph only loads when DOM element is force cleaned.
      self.app.views.graph.forceClearContentDOMEl();
    }
    self.app.render();
    // }
    // Reset the scroll position of NotesListView
    //self.app.views.items.scrollTop = 0
  }else{
    // if(typeof callback === "function"){
    //   callback(true);
    // }
    self.app.render(true);
  }

  
}

Session.prototype.newProject = function(callback){
  var self = this;

  //console.log('Create new project')

  /**
   * showSaveDialogSync will check and alert if file already exists!!!
   */
  let options = {
    title : "Create New Project File", 
    buttonLabel : "Create",
    filters : [
      {name: 'Bulb Project File', extensions: ['json']},
    ]
  };
  var path = dialog.showSaveDialogSync(app.win, options);

  if (!path) { console.log('Nothing to save'); return; }

  console.log("Path to new project: " + path);

  // Get name of DB file
  let file_name = self.getDBFileNameFrom(path);
  let file_name_split = file_name.split(".");
  if(file_name_split.length < 2 || file_name_split[1].localeCompare("json") !== 0){
    // In case the file was not .json file extension
    file_name = file_name_split[0].concat(".json");
    path = path.concat(".json");
  }

  console.log("after .json concat: " + path);

  /**
   *  TODO Refactor: Save project name instead of file name. 
   *        The project name is inputted with input field and on submit
   *        saved at a location on computer.
   */
  let new_prjct_json = FileDatabaseManager.getEmptyProjectJSON();
  new_prjct_json.name = file_name;
 
  // convert JSON object to string
  const json_string = JSON.stringify(new_prjct_json, null, 2);
  
  try{
    fs.writeFileSync(path, json_string);
  }catch(err){
    console.error(err);
  }
    
  let new_project = new Project(path, self);
  self.projects.push(new_project);

  // Prepare currently active project for transition
  let active_project = self.getActiveProject();
  self.prepProjectForTrans(active_project);

  // Toggle active project and Go to prjct
  self.toggleActiveProject(new_project);

  // Save path to 'Recent Projects'
  self.app.appGlobalData.addRecentProject(path);


  // Similar as this from Left App: 
  // left.go.to_page(this.pages.length - 1)

  // if(typeof callback === "function"){
  //   callback();
  // }
  self.app.render();
}

Session.prototype.openProjectWithPath = function(path, callback){
  var self = this;

  let chk = self.getProjectByPath(path);
  let nP = null;
  if(chk.length === 0){ 
    // Create new project
    try{
      nP = new Project(path, self);
      self.projects.push(nP);
    }catch(e){
      if(e instanceof SyntaxError){
        self.app.views.notifications.addNotification(
          self.app.views.notifications.ERROR,
          "Database file has JSON formatting errors. Check and correct them.",
          path);
        self.send("renderLazy");
        
        return;
      }
    }
  }else{
    nP = chk[0];
  }

  // Prepare currently active project for transition
  let active_project = self.getActiveProject();
  self.prepProjectForTrans(active_project);

  // Toggle active project
  self.toggleActiveProject(nP);

  // Save path to 'Recent Projects' or re-order the recent paths list
  self.app.appGlobalData.addRecentProject(path);

  // Trigger re-render
  // if(typeof callback === "function"){
  //   callback();
  // }
  self.app.render();
}

Session.prototype.openProjectDialog = function(callback){
  var self = this;

  console.log('Open Projects');

  let options = {
    title : "Choose Project Files", 
    buttonLabel : "Open Selected",
    filters :[
      {name: 'Bulb Project File', extensions: ['json']},
    ],
    showsTagField: false,
    properties: ['openFile','multiSelections']
  };

  const paths = dialog.showOpenDialogSync(app.win, options);

  console.log(paths);
  if (!paths) { console.log('Nothing to load'); return; }
  
  var first = null;
  for (const idx in paths) {
    console.log(paths[idx]);
    if(self.getProjectByPath(paths[idx]).length > 0){
      continue;
    }
    
    if(first === null){
      first = new Project(paths[idx], self);
      self.projects.push(first);
    }else{
      self.projects.push(new Project(paths[idx], self));
    }

    // Save path to 'Recent Projects'
    self.app.appGlobalData.addRecentProject(paths[idx]);
  }
  
  // Prepare currently active project for transition
  let active_project = self.getActiveProject();
  self.prepProjectForTrans(active_project);

  // Maybe activate only the first one?
  if(first){
    self.toggleActiveProject(first);

    // Trigger re-render
    // if(typeof callback === "function"){
    //   callback();
    // }
    self.app.render();
  }

  //setTimeout(() => { left.navi.next_page(); left.update() }, 200)
}



/**
 * Closes a specific project and removes from project list
 */
Session.prototype.closeProject = function(project_id, callback){
  var self = this;

  console.log("Session -- closeProject - uuid: " + project_id);

  let targets = self.getProjectByUUID(project_id);
  console.log(targets);
  if(targets.length !== 1){
    return;
  }

  // Check whether matching project is active and save the text of 
  // note that is currently active within in it, in case it exists..
  if(targets[0].isActive()){
    // Prepare currently active project for transition
    self.prepProjectForTrans(targets[0]);

    // Set first project in list as new active project
    if(this.projects.length > 0){
      let new_active_p = self.setActiveProjectAtIndex(0);
      if(new_active_p){
        new_active_p.setActiveNoteAtIndex(0);
        if(new_active_p.notes.length > 0){
          new_active_p.startSelectionWith(new_active_p.notes[0]);
        }
      }
      
    }
  }

  // Remove the project
  self.spliceByUUID(targets[0].uuid);
  
  // Rerender UI
  // if(typeof callback === "function"){
  //   callback();
  // }
  self.app.render();
  
}

/**
 * Deletes a specific project. 
 * Opens a message box asking whether user is sure to delete.
 */
Session.prototype.deleteProject = function(project_id, callback){
  var self = this;
  console.log("Session -- deleteProject - uuid: " + project_id);

  let p = self.getProjectByUUID(project_id);
  if(p.length > 1){
    console.log("Duplicate project!!");
    return;
  }

  console.log(p);
  let options = {
    // See place holder 1 in above image
    type : "question",
    buttons: ["Yes", "No"],
    defaultId: 1,
    title: "Delete Project",
    message: "Are you sure you want to delete this project?",
    detail: "WARNING: This will delete permanently from file system.\n\nProject at path: "  + p[0].getPath(), 
    // icon: // Not yet...
    cancelId: 1
  };

  // Trigger electron dialog window here..
  let choice = dialog.showMessageBoxSync(app.win, options);

  console.log("User choice: " + choice);
  if(choice === 1){
    return;
  }

  // Delete the project PERMANENTLY from file system.
  try{
    fs.unlinkSync(p[0].getPath());
  }catch(err){
    console.error(err);
  }

  // Remove project from project array
  for(var i in this.projects){
    if(this.projects[i].uuid.localeCompare(project_id) === 0){

      if(this.projects[i].isActive()){
        // Set first project in list as new active project
        if(this.projects.length > 0){
          this.setActiveProjectAtIndex(0);
          let aP = this.getActiveProject();
          aP.setActiveNoteAtIndex(0);
          if(aP.notes.length > 0){
            aP.startSelectionWith(aP.notes[0]);
          }
        }
      }

      // Remove the project
      this.projects.splice(i, 1);
    }
  }

  // Rerender UI
  // if(typeof callback === "function"){
  //   callback();
  // }
  self.app.render();
}

