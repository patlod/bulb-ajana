"use strict";

var EventEmitter = require('events').EventEmitter;

const inherits = require('util').inherits;
const { ipcRenderer } = require('electron');
const remote = require('electron').remote;
const Menu = require('electron').remote.Menu;
const MenuItem = require('electron').remote.MenuItem;

const yo = require('yo-yo');
// const d3 = require('d3')

// App Core
const ConfigManager = require('./_app/ConfigurationManager');
const GlobalData = require('./_models/GlobalData');

// Commandss
const CommandManager = require('./_app/commands/CommandManager');
const Command = require('./_app/commands/Command');
const NewNoteCmd = require('./_app/commands/NewNoteCmd');
const DeleteSelectedNotesCmd = require('./_app/commands/DeleteSelectedNotesCmd');
const NewGraphCmd = require('./_app/commands/NewGraphCmd');
const DeleteSelectedGraphsCmd = require('./_app/commands/DeleteSelectedGraphsCmd');
const DnDAddNotesToGraphCmd = require('./_app/commands/DnDAddNotesToGraphCmd');
const AddSelectedNotesToGraphCmd = require('./_app/commands/AddSelectedNotesToGraphCmd');
const NewNoteFromGraphCmd = require('./_app/commands/NewNoteFromGraphCmd');
const DeleteVertexFromGraphCmd = require('./_app/commands/DeleteVertexFromGraphCmd');
const NewEdgeGraphCmd = require('./_app/commands/NewEdgeGraphCmd');
const DeleteEdgeFromGraphCmd = require('./_app/commands/DeleteEdgeFromGraphCmd');

// Controllers
const Session = require('./_controllers/Session.js');
const SplitManager = require('./scripts/split-screen.js');
const Note = require('./_controllers/Note');
const Graph = require('./_controllers/Graph');

// Views
const FocusManager = require('./_views/FocusManager');
const AppView = require('./_views/AppView');
const NotificationView = require('./_views/NotificationView');
const TitlebarView = require('./_views/TitlebarView');
const ProjectListView = require('./_views/ProjectListView');
const ItemListView = require('./_views/ItemListView');
const NoteEditorView = require('./_views/NoteEditorView');
const GraphEditorView = require('./_views/GraphEditorView');
const AppControls = require('./_controllers/AppControls');

// Utils
const UIAssistant = require('./_util/UIAssistant');

inherits(App, EventEmitter);

/**
 * This is the central app controller which references and interacts with all other
 * specialised controllers.
 * 
 * @param {HTMLElement} el 
 */
function App(el){
  var self = this;
  if (!(self instanceof App)) return new App(el);

  self.el = el;

  /* ===== Controllers ===== */
  self.appConfigManager = new ConfigManager();
  // const APP_DATA_DIR = self.appConfigManager.getAppDataDir()
  // const USER_PREFS_PATH = self.appConfigManager.getUserPreferencesPath()
  const GLOBAL_DATA_PATH = self.appConfigManager.getGlobalDataPath();
  // self.appUserPreferences = new UserPreferences(USER_PREFS_PATH)
  self.appGlobalData = new GlobalData(GLOBAL_DATA_PATH);

  self.commandManager = new CommandManager(self);

  self.session = new Session(self);     // The session stores all the open projects with notes
  self.appControls = new AppControls();


  self.focusManager = new FocusManager.constructor(self);
  self.focusManager.setFocusObject(self.focusManager.PROJECT_LIST);
  /* ====== Views ====== */
  // All view instance for different parts of the app's UI
  self.views = {
    app: new AppView(self, self.focusManager),
    notifications: new NotificationView(self, self.focusManager),
    titlebar: new TitlebarView(self, self.focusManager),
    projects: new ProjectListView(self, self.focusManager),
    items: new ItemListView(self, self.focusManager),
    editor: new NoteEditorView(self, self.focusManager),
    graph: new GraphEditorView(self, self.focusManager)
  };

  // --- Menu ---
  // App
  // self.appControls.add('default', '*', 'About', () => { 
  //   console.log("About");
  //   // Case 1 - Project will be open source and public on Github: open href in browser to github repo
  //   // Case 2 - Projec closed source: Show an electron about page like in other apps (e.g. VSCode, Typora, ...)
  // }, '');
  // self.appControls.addSpacer('default', '*', 'preffers');
  // self.appControls.add('default', '*', 'Preferences', () => { console.log("Preferences"); }, '');
  // self.appControls.addSpacer('default', '*', 'hidders');
  // self.appControls.add('default', '*', 'Hide', () => { console.log("Hide") }, 'CmdOrCtrl+H');
  // self.appControls.add('default', '*', 'Hide Others', () => { console.log("Hide Others") }, 'Alt+CmdOrCtrl+H');
  // self.appControls.add('default', '*', 'Show All', () => { console.log("Show All") }, '');
  self.appControls.addSpacer('default', '*', 'Developers');
  self.appControls.addRole('default', '*', 'reload');
  self.appControls.addRole('default', '*', 'forcereload');
  self.appControls.addRole('default', '*', 'toggledevtools');
  self.appControls.addSpacer('default', '*', 'quitters');
  // self.appControls.add('default', '*', 'Reset', () => { console.log("Reset") }, 'CmdOrCtrl+Backspace')
  self.appControls.add('default', '*', 'Quit', () => { 
    console.log("Quit");
    closeApp();
  }, 'CmdOrCtrl+Q');
  
  // File
  self.appControls.add('default', 'File', 'New Project', () => { 
    self.session.newProject(render);
  }, 'CmdOrCtrl+P');
  self.appControls.add('default', 'File', 'New Note', () => { 
    if(!self.session.getActiveProject()){ 
      console.log("No project selected as active.");
      return; 
    }
    let cmd = null;
    switch(self.views.items.objectOfDisplay){
      case Note:
        cmd = new NewNoteCmd(self);
        self.commandManager.executeCmd(cmd);
        // self.createNewNote();
        break;
      case Graph:
        cmd = new NewGraphCmd(self);
        self.commandManager.executeCmd(cmd);
        // self.createNewGraph();
        break;
    }
  }, 'CmdOrCtrl+N');
  self.appControls.addSpacer('default', 'File', 'Open')
  self.appControls.add('default', 'File', 'Open Project...', () => { 
    openProjectDialog();
   }, 'CmdOrCtrl+O');
  
  let recents = self.appGlobalData.getAllRecentProjects(); 
  for(var i in recents){
    const path = recents[i]
    self.appControls.addSub('default', 'File', 'Open Recent Project...', path, () => {
      openRecentProject(path);
    }, '');
  }
  self.appControls.addSpacer('default', 'File', 'Close');
  self.appControls.add('default', 'File', 'Close Project...', () => { 
    self.session.closeProject(self.session.getActiveProject().uuid, self.render);
   }, 'Shift+CmdOrCtrl+P');
  // self.appControls.add('default', 'File', 'Close Window...', () => { console.log("Close") }, 'CmdOrCtrl+W');

  // Edit
  self.appControls.add('default', 'Edit', 'Undo', (menuItem, BrowserWindow, event) => {
    self.commandManager.undo();
  }, 'CmdOrCtrl+Z');      
  self.appControls.add('default', 'Edit', 'Redo', () => {
    self.commandManager.redo();
  }, 'CmdOrCtrl+Shift+Z');
  self.appControls.addSpacer('default', 'Edit', 'Copy&Paste');
  self.appControls.addRole('default', 'Edit', 'cut');
  self.appControls.addRole('default', 'Edit', 'copy');
  self.appControls.addRole('default', 'Edit', 'paste');
  self.appControls.addSpacer('default', 'Edit', 'delete');
  self.appControls.add('default', 'Edit', 'Delete Selected Items', () => { 
    if(self.views.items.objectOfDisplay === Note){
      let cmd = new DeleteSelectedNotesCmd(self);
      self.commandManager.executeCmd(cmd);
      // self.deleteSelectedNotes();
    }else{
      let cmd = new DeleteSelectedGraphsCmd(self);
      self.commandManager.executeCmd(cmd);
      // self.deleteSelectedGraphs();
    }
  }, 'CmdOrCtrl+Backspace');
  // self.appControls.addRole('default', 'Edit', 'delete')
  // self.appControls.addRole('default', 'Edit', 'selectall')
  self.appControls.addSpacer('default', 'Edit', 'Find');
  self.appControls.add('default', 'Edit', 'Find in Editor', () => { 
    console.log("Find in Editor");
    if(!self.session.getGraphMode()){
      self.views.editor.toggleLocalSearch();
    } 
  }, 'CmdOrCtrl+F');
  self.appControls.add('default', 'Edit', 'Find in Project', () => { 
    self.views.titlebar.setFocusOnSearch();
  }, 'CmdOrCtrl+Shift+F');
  // self.appControls.add('default', 'Edit', 'Find in Graphs', () => { console.log("Find in Graphs") }, 'CmdOrCtrl+Shift+G');

  // View
  self.appControls.add('default', 'View', 'as Note Editor', () => { 
    console.log("View as Note Editor") 
    transToNoteEditor()
  }, 'CmdOrCtrl+Shift+G', 'radio', true);
  self.appControls.add('default', 'View', 'as Graph Editor', () => { 
    console.log("View as Graph Editor", false);
    transToGraphEditor()
  }, 'CmdOrCtrl+G', 'radio');
  // self.appControls.addSpacer('default', 'View', 'Sorting');
  // self.appControls.add('default', 'View', 'Sort Projects By', () => { console.log("Sort Projects By") }, '');
  // // Submenu necessary here
  // self.appControls.add('default', 'View', 'Sort Notes By', () => { console.log("Sort Notes By") }, '');
  // // Submenu necessary here
  // self.appControls.add('default', 'View', 'Sort Graphs By', () => { console.log("Sort Graphs By") }, '');
  // // Submenu necessary here
  // self.appControls.addSpacer('default', 'View', 'Zoom');
  // self.appControls.add('default', 'View', 'Zoom In', () => { console.log("Zoom In") }, '');
  // self.appControls.add('default', 'View', 'Zoom Out', () => { console.log("Zoom Out") }, '');
  // self.appControls.add('default', 'View', 'Actual Size', () => { console.log("Actual Size") }, '');
  // self.appControls.addSpacer('default', 'View', 'Screen');
  // self.appControls.add('default', 'View', 'Full Screen', () => { console.log("Full Screen") }, '');

  // Window
  self.appControls.add('default', 'Window', 'Minimise', () => { 
    console.log("Minimise Window");
    try{
      remote.BrowserWindow.getFocusedWindow().minimize();
    }catch(error){
      console.error("Minimise Command: No window focused currently.");
    }
  }, 'CmdOrCtrl+M');
  // self.appControls.addSpacer('default', 'Window', 'New Window');
  // self.appControls.add('default', 'Window', 'New Window', () => { console.log("New Window") }, '');

  // Graph
  self.appControls.add('default', 'Graph', 'New Graph', () => { 
    if(!self.session.getActiveProject()){ 
      console.log("No project selected as active.");
      return; 
    }
    // Set item list object of display & transition to graph list
    self.views.items.objectOfDisplay = Graph;
    switchItemList(self.views.items.objectOfDisplay);
    // Create new graph (checks whether empty one already exists..)
    let cmd = new NewGraphCmd(self);
    self.commandManager.executeCmd(cmd);
    // self.createNewGraph();
   }, '');
  self.appControls.add('default', 'Graph', 'Add Selected Notes', () => { 
    let cmd = new AddSelectedNotesToGraphCmd(self);
    self.commandManager.executeCmd(cmd);
  }, '');
  self.appControls.addSpacer('default', 'Graph', 'orient');
  self.appControls.add('default', 'Graph', 'Refresh Orientation', () => { 
    if(self.session.getGraphMode()){
      self.views.graph.resetZoom();
    }
  }, '');
  // self.appControls.addSpacer('default', 'Graph', 'zoomers');
  // self.appControls.add('default', 'Graph', 'Zoom In', () => { console.log("Zoom In") }, '');
  // self.appControls.add('default', 'Graph', 'Zoom Out', () => { console.log("Zoom Out") }, '');
  // self.appControls.addSpacer('default', 'Graph', 'scrollers');
  // self.appControls.add('default', 'Graph', 'Scroll North', () => { console.log("Scroll North") }, '');
  // self.appControls.add('default', 'Graph', 'Scroll South', () => { console.log("Scroll South") }, '');
  // self.appControls.add('default', 'Graph', 'Scroll West', () => { console.log("Scroll West") }, '');
  // self.appControls.add('default', 'Graph', 'Scroll East', () => { console.log("Scroll East") }, '');

  self.appControls.commit();

  

  /* === Initial DOM tree render ================= */
  this.tree = this.renderMain();
  console.log(this.tree);
  el.appendChild(this.tree);
  // Render the AppView separately
  self.views.app.render();
  /* ============================================= */

  // Initialise the split screen manager object
  self.split_manager = new SplitManager(this);


  /**
   * Inserts script tags 
   */
  function addScripts(to){
    var script_el = document.createElement('script');
    script_el.src = "./scripts/dropdown_semantic_ui.js";
    to.appendChild(script_el);
  }
  addScripts(document.getElementById('layout'));

  /**
   * == Listeners EventEmitter =====================================
   */
  self.on('render', function(){
    // if(self.session.getGraphMode()){
    //   self.views.graph.forceClearContentDOMEl();
    // }
    this.render();
  });

  self.on('renderLazy', function(){
    this.render(true);
  });

  self.on('arrowNavigationToHead', function(){
    console.log("App.js => arrowNavigationToHead");
    let self = this, idx, active_project, active_item;
    switch(self.focusManager.getFocusObject()){
      case self.focusManager.PROJECT_LIST:
        console.log("focusManager.PROJECT_LIST");
        // Toggle the active project to one the selection is currently pointing
        active_project = self.session.getActiveProject();
        idx = self.session.projects.indexOf(active_project);
        if(idx >= 1){
          transitionToProject(self.session.getProjectByIndex(idx - 1));
        }

        break;

      case self.focusManager.ITEM_LIST:
        console.log("focusManager.ITEM_LIST");
        // Toggle the active item the selection is currently pointing
        active_project = self.session.getActiveProject();

        if(self.views.items.objectOfDisplay === Note){
          active_item = active_project.getActiveNote();
          // Check whether search is active..
          if(active_project.search !== null){
            idx = active_project.getNoteIndex(active_item);
          }else{
            idx = active_project.getNoteIndex(active_item);
          }
        }else{
          if(self.views.items.objectOfDisplay === Graph){
            active_item = active_project.getActiveGraph();
            idx = active_project.graphs.indexOf(active_item);
            // Search is not implemented for graphs yet..
          }
        }

        if(self.views.items.objectOfDisplay === Note){
            if(active_project.search !== null){
              if(active_project.search.notes.length > 1 && idx >= 1){
                transitionNote(active_project, active_project.getNoteByIndex(idx - 1));
              }
            }else{
              if(active_project.notes.length > 1 && idx >= 1){
                transitionNote(active_project, active_project.getNoteByIndex(idx - 1));
              }
            }
        }else{
          if(self.views.items.objectOfDisplay === Graph){
            if(active_project.graphs.length > 1 && idx >= 1){
              transitionGraph(active_project, active_project.getGraphByIndex(idx - 1));
            }
          }
        }
        // Render the views
        if(self.session.getGraphMode()){
          self.views.graph.forceClearContentDOMEl();
        }
        self.render();
        break;
    }
  });

  self.on('arrowNavigationToTail', function(){
    console.log("App.js => arrowNavigationToTail");
    let self = this, idx, active_project, active_item, premise;
    switch(self.focusManager.getFocusObject()){
      case self.focusManager.PROJECT_LIST:
        console.log("focusManager.PROJECT_LIST");
        // Toggle the active project to one the selection is currently pointing
        active_project = self.session.getActiveProject()
        idx = self.session.projects.indexOf(active_project);
        if(idx <= self.session.projects.length - 2){
          transitionToProject(self.session.getProjectByIndex(idx + 1));
        }
        break;

      case self.focusManager.ITEM_LIST:
        console.log("focusManager.ITEM_LIST");
        // Toggle the active item the selection is currently pointing
        active_project = self.session.getActiveProject();

        if(self.views.items.objectOfDisplay === Note){
          active_item = active_project.getActiveNote();
          if(active_project.search !== null){
            idx = active_project.getNoteIndex(active_item);
          }else{
            idx = active_project.getNoteIndex(active_item);
          }
        }else{
          if(self.views.items.objectOfDisplay === Graph){
            active_item = active_project.getActiveGraph();
            idx = active_project.graphs.indexOf(active_item);
          }
        }

        if(self.views.items.objectOfDisplay === Note){
          if(active_project.search !== null){
            if(active_project.search.notes.length > 1 && idx <= active_project.search.notes.length - 2){
              transitionNote(active_project, active_project.getNoteByIndex(idx + 1));
            }
          }else{
            if(active_project.notes.length > 1 && idx <= active_project.notes.length - 2){
              transitionNote(active_project, active_project.getNoteByIndex(idx + 1));
            }
          }
        }else{
          if(self.views.items.objectOfDisplay === Graph){
            if(active_project.graphs.length > 1 && idx <= active_project.graphs.length - 2){
              transitionGraph(active_project, active_project.getGraphByIndex(idx + 1));
            }
          }
        }
        // Render the views
        if(self.session.getGraphMode()){
          self.views.graph.forceClearContentDOMEl();
        }
        self.render();
        break;
    }
  });

  self.on('arrowShiftSelectToHead', function(){
    var self = this;
    console.log("App.js => arrowShiftSelectToHead");
    switch(self.focusManager.getFocusObject()){
      case self.focusManager.ITEM_LIST:
        let active_project = self.session.getActiveProject();
        active_project.singleShiftSelectTowardsHead();
        active_project.activateSelectionHead();
        // Render the views
        if(self.session.getGraphMode()){
          self.views.graph.forceClearContentDOMEl();
        }
        self.render();
        
        break;
    }
  });

  self.on('arrowShiftSelectToTail', function(){
    console.log("App.js => arrowShiftSelectToTail");
    switch(self.focusManager.getFocusObject()){
      case self.focusManager.ITEM_LIST:
        let active_project = self.session.getActiveProject();
        active_project.singleShiftSelectTowardsTail();
        active_project.activateSelectionHead();
        // Render the views
        if(self.session.getGraphMode()){
          self.views.graph.forceClearContentDOMEl();
        }
        self.render();

        break;
    }
  });

  self.on('shiftClickItemSelection', function(item){
    var self = this;
    console.log("App.js => shiftClickItemSelection");
    let active_project = self.session.getActiveProject();
    active_project.shiftExpandItemSelection(item);
    active_project.activateSelectionHead();

    console.log("Current item selection");
    console.log(active_project.item_selection);

    // Render the views
    if(self.session.getGraphMode()){
      self.views.graph.forceClearContentDOMEl();
    }
    self.render();
  });

  self.on('toggleItemInSelection', function(item){
    var self = this;
    console.log("App.js => toggleItemInSelection");
    let active_project = self.session.getActiveProject();
    active_project.toggleItemInSelection(item);
    active_project.activateSelectionHead();

    console.log("Current item selection");
    console.log(active_project.item_selection);

    // Render the views
    if(self.session.getGraphMode()){
      self.views.graph.forceClearContentDOMEl();
    }
    self.render();
  });

  function transToGraphEditor(){
    let active_p = self.session.getActiveProject();
    if(!active_p.getGraphMode()){
      self.session.setGraphMode(true);
      self.render();
    }
  }
  self.on('transToGraphEditor', transToGraphEditor);

  function transToNoteEditor(){
    let active_p = self.session.getActiveProject();
    if(active_p.getGraphMode()){
      self.session.setGraphMode(false);
      self.views.graph.takedown();
      self.render();
    }
  }
  self.on('transToNoteEditor', transToNoteEditor);

  function transitionToProject(project){
    // For currently active project save the content of active note
    // in case it exists..
    self.session.transToProject(project, self.render);
  }
  self.on('transitionProject', function(project){
    transitionToProject(project);
  });

  self.on('newProject', function(){
    self.session.newProject(self.render);
  });

  function openProjectDialog(){
    self.session.openProjectDialog(self.render);
    // Empty trash of the opened if necessary
    self.session.getActiveProject().garbageDisposal();
  }
  self.on('openProjectDialog', function(){
    openProjectDialog();
  });

  function openRecentProject(path){
    const render = self.render;
    self.session.openProjectWithPath(path, render);

    // Empty trash of the opened if necessary
    let aP = self.session.getActiveProject();
    if(aP){
      aP.garbageDisposal();
    }
  }
  self.on('openRecentProject', function(path){
    openRecentProject(path);
  });

  self.on('closeProject', function(project_id){
    console.log("App -- Close Project..");
    self.session.closeProject(project_id, self.render);
  });

  self.on('deleteProject', function(project_id){
    var self = this;
    console.log("App -- Delete Project..");
    self.session.deleteProject(project_id, self.render);
  });

  this.switchItemList = function(objectOfDisplay){
    let self = this,
        active_project = self.session.getActiveProject();
    switch(objectOfDisplay){
      case Note:
        active_project.startSelectionWith(active_project.getActiveNote());
        break;
      case Graph:
        active_project.startSelectionWith(active_project.getActiveGraph());
        break;
    }
    self.render(true);
  }
  self.on('switchItemList', function(objectOfDisplay){
    self.switchItemList(objectOfDisplay);
  });

  function transitionNote(project, note, trigger='item-thumb'){
    let active_note = project.getActiveNote();
    if(!active_note || active_note === undefined){
      console.error("Error: No active note set.");
      return;
    }
    console.log(active_note);
    // Toggle active project & update UI in case switched to different note
    if(active_note.uuid.localeCompare(note.uuid) !== 0){

      if(!project.getGraphMode()){
        project.prepNoteForTrans(project.getActiveNote());
      }
      
      project.toggleActiveNote(note);
      project.startSelectionWith(note);
      console.log(project.getItemSelection());

      if(project.getGraphMode() && trigger.localeCompare('item-thumb') === 0){
        // Update the graph to highlight the new active note
        self.views.graph.updateGraph(/*project.getActiveGraph()*/);
      }
    }else{
      project.startSelectionWith(active_note);
    }
    self.render(true);
  }

  self.on('transitionNote', function(project, note, trigger='item-thumb'){
    transitionNote(project, note, trigger);
  });

  self.on('transitionNoteAndEditor', function(project, note){
    console.log("transitionNoteAndEditor");
    let self = this,
        active_note = project.getActiveNote();
    if(!active_note || active_note === undefined){
      console.error("Error: No active note set.");
      return;
    }

    // console.log(project.getGraphMode())
    if(project.getGraphMode()){
      project.toggleActiveNote(note);
      project.startSelectionWith(note);
      project.setGraphMode(false);
      self.views.graph.takedown();
      self.render();
    }else{
      if(active_note.uuid.localeCompare(note.uuid) === 0){
        return;
      }
      self.session.prepProjectForTrans(project);
      project.toggleActiveNote(note);
      project.startSelectionWith(note);
      self.render(true);
    }
    
  });

  
  self.on('transitionNoteContextMenu', function(project, note){
    console.log("transitionNoteContextMenu");
    if(project.getItemsFromSelection().indexOf(note) < 0){
      transitionNote(project, note);
    }

    const template = [
      {
        label: 'Show in Graph',
        click: () => {
          console.log("Context-Menu - New Note clicked on element:");
          transToGraphEditor();
        }
      },
      { type: 'separator' },
      {
        label: 'Delete',
        click: () => {
          console.log("Context-Menu - Delete clicked on element:");
          let cmd = new DeleteSelectedNotesCmd(self);
          self.commandManager.executeCmd(cmd);
          // self.deleteSelectedNotes();
        }
      },
      { type: 'separator' },
      {
        label: 'New Note',
        click: () => {
          console.log("Context-Menu - New Note clicked on element:");
          let cmd = new NewNoteCmd(self);
          self.commandManager.executeCmd(cmd);
          // self.createNewNote();
        }
      }
    ];

    self.views.items.showContextMenuFromTemplate(template);
  });

  this.createNewNote = function(){
    var self = this;
    if(self.session.getActiveProject() === null){
      console.log("App listener createNewNote -- No active project.");
      return;
    }

    let nn = self.session.getActiveProject().createNewNote();
    nn.saveData(); // REFACTOR: Maybe better move this in createNewNote()

    if(self.session.getGraphMode()){
      transToNoteEditor();
      self.render();
    }else{
      self.render();
    }
    
    self.views.editor.focusNotepad();
  }

  self.on('createNewNote', function(){
    console.log("App received: CREATE NEW NOTE");
    if(!self.session.getActiveProject()){ 
      console.log("No project selected as active.");
      return; 
    }
    let cmd = new NewNoteCmd(self);
    self.commandManager.executeCmd(cmd);
    // self.createNewNote();
  });

  self.on('DEPRECATED -- deleteSelectedNotes', function(){
    console.log("App received: DELETE SELECTED NOTES");
    if(self.session.getActiveProject() === null){
      console.log("App listener createNewNote -- No active project.");
      return;
    }
    let i, self = this,
        active_project = self.session.getActiveProject(),
        active_note = active_project.getActiveNote(),
        // active_graph = active_project.getActiveGraph(),
        all_graphs = active_project.getAllGraphs();
    
    // Delete the note from all graphs here
    for(i in all_graphs){
      all_graphs[i].deleteVerticesForNote(active_note);
      // if(all_graphs[i].uuid.localeCompare(active_graph.uuid) === 0 
      //     && self.views.graph.graph !== null){
      //   self.views.graph.updateGraph(active_graph)
      // }
    }
    active_project.deleteNotes([active_note]);

    self.views.graph.forceClearContentDOMEl();
    self.render();
  });

  this.deleteSelectedNotes = function(){
    if(self.session.getActiveProject() === null){
      console.log("App listener createNewNote -- No active project.");
      return;
    }
    
    let active_project = self.session.getActiveProject();
    // TODO: Check whether active graph contained one of the deleted notes
    //       then only if app is in graph mode render() the graph area.
    active_project.deleteSelectedItems();

    self.views.graph.forceClearContentDOMEl();
    self.render();
  }

  self.on('deleteSelectedNotes', function(){
    console.log("App received: DELETE SELECTED NOTES");
    let cmd = new DeleteSelectedNotesCmd(self);
    self.commandManager.executeCmd(cmd);
    // self.deleteSelectedNotes();
  });

  
  self.on('updateByNoteEditorContent', function(active_note){
    console.log("App received: LIVE UPDATE TEXT OF NOTE THUMB");
    
    self.views.titlebar.updateCreateNewBtn(el, active_note);
    self.views.items.updateActiveNoteThumb(el, active_note);
  });

  self.on('toggleEditorDate', function(){
    // Get active note thumb..
    let c_dt = document.getElementById('dt-created');
    let m_dt = document.getElementById('dt-modified');
    c_dt.classList.toggle('hidden');
    m_dt.classList.toggle('hidden');
  });

  self.on('updateNoteColor', function(note, targetColor){
    // Update note thumbnail and write note color to database
    note.bg_color = targetColor;
    note.saveData();

    self.views.items.updateNoteThmbColor(note);
  });

  self.on('updateGlobalSearch', function(needle){
    let self = this,
        active_project = self.session.getActiveProject();
    active_project.search = {
      needle: needle,
      notes: self.session.getActiveProject().searchAllNotesTextsAndTags(needle)
    };
    // Reset the note selection
    active_project.startSelectionWith(active_project.getActiveNote());
    console.log(active_project.search);
    console.log(active_project.getGraphMode())
    if(active_project.getGraphMode()){
      self.render(true);
      self.views.graph.updateGraph();
    }else{
      self.render();
    }
    
  });
  self.on('clearGlobalSearch', function(){
    // Clear the search state in the active project.
    let self = this,
        active_project = self.session.getActiveProject(),
        active_note = active_project.getActiveNote();

    // Delete/Clear the project search
    active_project.search = null;
    // Reset the note selection
    active_project.startSelectionWith(active_note);
    if(active_project.getGraphMode()){
      self.render(true);
      self.views.graph.updateGraph();
    }else{
      self.render();
    }
  });

/* ============================================================================== */
/*  Graph Event Listeners                                                         */
/* ============================================================================== */
  self.on('updateByGraphEditorContent', function(active_graph){
    console.log("App received: LIVE UPDATE TEXT OF NOTE THUMB");
    
    // self.views.titlebar.updateCreateNewBtn(el, active_graph);
    self.views.items.updateActiveGraphThumb(el, active_graph);
  });

  this.createNewNoteVertexGraph = function(coords){
        /**
     * For now: New empty note is directly inserted into database
     * Better: Only insert once there is at least one char content.
     */
    let self = this,
        active_project = self.session.getActiveProject(),
        active_graph = active_project.getActiveGraph();
 
    if( active_project === null || active_graph === null){
      console.log("createNewNoteVertexGraph -- No active project or graph.");
      return;
    }
 
    // Check whether empty note exists already
    let empty_notes = active_project.getEmptyNotes();
    if(empty_notes === null || empty_notes.length === 1){
      console.log("Still empty note found...");
      return;
    }
 
    let nn = active_project.createNewNote();
    nn.saveData(); // REFACTOR: Maybe move to createNewNote()
    
    let nV = active_graph.createNewVertexForNote( coords, nn );
    nV.saveData(); // REFACTOR: Maybe move to createNewVertexForNote()

    // Update the create new graph button
    self.views.titlebar.updateCreateNewBtn(el, active_graph);
    self.views.items.updateActiveGraphNoteCount(el, active_graph);
    
    self.views.graph.updateGraph(active_graph);

    self.render(true);
  }

  self.on('createNewNoteVertexGraph', function(coords){
    console.log('createNewNoteVertexGraph triggered');
    let params = { coords: coords };
    let cmd = new NewNoteFromGraphCmd(self, params);
    self.commandManager.executeCmd(cmd);
  });

  this.deleteVertexInGraph = function(selectedVertex){
    console.log("deleteVertexInGraph: ");

    let g = self.session.getActiveGraph();
    g.deleteVertex(selectedVertex);

    self.views.graph.removeSelectFromNode();

    // Update the create new graph button
    self.views.titlebar.updateCreateNewBtn(el, g);
    self.views.items.updateActiveGraphNoteCount(el, g);

    self.views.graph.updateGraph(g);
  }

  self.on('deleteVertexInGraph', function(selectedVertex){
    let params = { selectedVertex: selectedVertex };
    let cmd = new DeleteVertexFromGraphCmd(self, params);
    self.commandManager.executeCmd(cmd);
  });

  this.createNewEdgeInGraph = function(vPair){
    console.log("createNewEdgeInGraph: ");
    let g = self.session.getActiveGraph();

    var filtRes = g.getEdges().filter(function(d){
      console.log(d);
      if (d.source.compareTo(vPair.target) && d.target.compareTo(vPair.source)){
        g.deleteEdge(d);
      }
      return d.source.compareTo(vPair.source) && d.target.compareTo(vPair.target);
    });

    if (!filtRes.length){
      let nE = g.createNewEdge(vPair.source, vPair.target);
      nE.saveData();

      self.views.graph.updateGraph(g);
    }
  }

  self.on('createNewEdgeInGraph', function(vPair){
    let params = { vPair: vPair };
    let cmd = new NewEdgeGraphCmd(self, params);
    self.commandManager.executeCmd(cmd);
  });

  this.deleteEdgeInGraph = function(selectedEdge){
    console.log("deleteEdgeInGraph: ");
    let g = self.session.getActiveGraph();
    g.deleteEdge(selectedEdge);

    self.views.graph.removeSelectFromEdge();

    self.views.graph.updateGraph(g);
  }

  self.on('deleteEdgeInGraph', function(selectedEdge){
    let params = { selectedEdge: selectedEdge };
    let cmd = new DeleteEdgeFromGraphCmd(self, params);
    self.commandManager.executeCmd(cmd);
  });

  self.on('createNewNoteLinkedVertexGraph', function(sourceVertex){
    console.log('createNewNoteLinkedVertexGraph -> TODO!');

    /**
     * For now: New empty note is directly inserted into database
     * Better: Only insert once there is at least one char content.
     */
    let self = this, 
        active_project = self.session.getActiveProject(),
        active_graph = active_project.getActiveGraph();

    if( active_project === null || active_graph === null){
      console.log("createNewNoteVertexGraph -- No active project or graph.");
      return;
    }

    // Check whether empty note exists already
    let empty_notes = active_project.getEmptyNotes();
    if(empty_notes === null || empty_notes.length === 1){
      console.log("Still empty note found...");
      return;
    }

    let nn = active_project.createNewNote();
    nn.saveData(); // REFACTOR: Maybe move to createNewNote()
    
    // TODO: Calculate coordinates here regarding the width and height
    //       of the sourceVertex and additional space in-between the vertices so 
    //       that edge is visible..
    let coords = {
      x: (sourceVertex.posX + sourceVertex.width_dom + 50),
      y: (sourceVertex.posY + sourceVertex.height_dom + 50)
    };
    let nV = active_graph.createNewVertexForNote( coords, nn );
    nV.saveData(); // REFACTOR: Maybe move to createNewVertexForNote()

    // Create vertex pair here and execute code of createNewEdgeInGraph
    let vPair = {source: sourceVertex, target: nV},
        filtRes = active_graph.getEdges().filter(function(d){
          console.log(d);
          if (d.source.compareTo(vPair.target) && d.target.compareTo(vPair.source)){
            active_graph.deleteEdge(d);
          }
          return d.source.compareTo(vPair.source) && d.target.compareTo(vPair.target);
       });

    if (!filtRes.length){
      let nE = active_graph.createNewEdge(vPair.source, vPair.target);
      nE.saveData();
    }

    // Update the create new graph button
    self.views.titlebar.updateCreateNewBtn(el, active_graph);
    self.views.items.updateActiveGraphNoteCount(el, active_graph);
    
    self.views.graph.updateGraph(active_graph);

    self.render(true);
  });

  function transitionGraph(project, graph, trigger='item-thumb'){
    // TODO: 
    //   - In case graph is empty delte it in prepProjectForTrans
    //   - Save the description text in case timer is not finsihed.
    // if(!project.getGraphMode()){
    //   self.session.prepProjectForTrans(project)
    // }
    let active_graph = project.getActiveGraph();
    if(!active_graph || active_graph === undefined){
      console.error("Error: No active graph set.");
      return;
    }
    // Toggle active project & update UI in case switched to different note
    if(active_graph.uuid.localeCompare(graph.uuid) !== 0){
      project.toggleActiveGraph(graph);
      project.startSelectionWith(graph);
      console.log(project.getItemSelection());

      if(project.getGraphMode() && trigger.localeCompare('item-thumb') === 0){
        self.views.graph.forceClearContentDOMEl();
      }
      self.render();
    }else{
      project.startSelectionWith(active_graph);
      self.render(true);
    }
  }

  self.on('transitionGraph', function(project, graph, trigger='item-thumb'){
    console.log('transitionGraph');
    transitionGraph(project, graph, trigger);
  });

  self.on('transitionGraphAndEditor', function(project, graph){
    console.log('transitionGraphAndEditor');

    let self = this,
        active_graph = project.getActiveGraph();
    if(!active_graph || active_graph === undefined){
      console.error("Error: No active graph set.");
      return;
    }

    if(!project.getGraphMode()){
      project.toggleActiveGraph(graph);
      project.setGraphMode(true);
      self.render();
    }else{
      if(active_graph.uuid.localeCompare(graph.uuid) === 0){
        return;
      }

      // TODO: Save changes in graph or delete if empty
      //self.session.prepProjectForTrans(project)

      project.toggleActiveGraph(graph);
      project.startSelectionWith(graph);
      self.views.graph.forceClearContentDOMEl();
      self.render();
    }
  });

  self.on('transitionGraphContextMenu', function(project, graph){
    console.log("transitionGraphContextMenu");
    if(project.getItemsFromSelection().indexOf(graph) < 0){
      transitionGraph(project, graph);
    }
    const template = [
      {
        label: 'Delete',
        click: () => {
          console.log("Context-Menu - Delete clicked on element:");
          let cmd = new DeleteSelectedGraphsCmd(self);
          self.commandManager.executeCmd(cmd);
          // self.deleteSelectedGraphs();
        }
      },
      { type: 'separator'},
      {
        label: 'New Graph',
        click: () => {
          console.log("Context-Menu - New Graph clicked on element:");
          let cmd = new NewGraphCmd(self);
          self.commandManager.executeCmd(cmd);
          // self.createNewGraph();
        }
      }
    ];
    self.views.items.showContextMenuFromTemplate(template);
  });

  this.createNewGraph = function(){
    if(self.session.getActiveProject() === null){
      console.log("App listener createNewNote -- No active project.");
      return;
    }

    let nG = self.session.getActiveProject().createNewGraph();
    nG.saveData(); // REFACTOR: Maybe better move this in createNewNote()

    if(self.session.getGraphMode()){
      self.views.graph.forceClearContentDOMEl();
    }else{
      // Not in graph mode so transition to..
      self.session.setGraphMode(true);
    }
    self.render();
  }

  self.on('createNewGraph', function(){
    console.log("App.js: createNewGraph");
    if(!self.session.getActiveProject()){ 
      console.log("No project selected as active.");
      return; 
    }
    let cmd = new NewGraphCmd(self);
    self.commandManager.executeCmd(cmd);
    // self.createNewGraph();
  });

  self.on('DEPRECATED -- deleteSelectedGraphs', function(){
    console.log("App.js: deleteSelectedGraphs");
    var self = this;
    /**
     * For now: 
     *  - Selection of multiple graphs not possible.
     *     - Thus: Only delete the currently active graph. 
     *  - The deleted graph is moved to trash been for defined period of time
     */
    if(self.session.getActiveProject() === null){
      console.log("App listener createNewNote -- No active project.");
      return;
    }
    let active_p = self.session.getActiveProject();
    let active_g = active_p.getActiveGraph();
    console.log(active_g);
    if(active_g !== null ){
      active_p.deleteGraphs([active_g]);
    }

    if(active_p.getGraphMode()){
      self.views.graph.forceClearContentDOMEl();
    }
    self.render();
  });
  
  this.deleteSelectedGraphs = function(){
    console.log("App received: DELETE SELECTED NOTES");
    if(self.session.getActiveProject() === null){
      console.log("App listener createNewNote -- No active project.");
      return;
    }
    
    let active_project = self.session.getActiveProject();
    active_project.deleteSelectedItems();

    self.views.graph.forceClearContentDOMEl();
    self.render();
  }

  self.on('deleteSelectedGraphs', function(){
    console.log("App.js: deleteSelectedGraphs");
    let cmd = new DeleteSelectedGraphsCmd(self);
    self.commandManager.executeCmd(cmd);
    // self.deleteSelectedGraphs();    
  });


  self.on('updateByGraphEditorContent', function(active_graph){
    console.log("App received: LIVE UPDATE TEXT OF NOTE THUMB");
    
    // self.views.titlebar.updateCreateNewBtn(el, active_note)
    if(self.views.items.objectOfDisplay === Graph){
      self.views.items.updateActiveGraphThumb(el, active_graph);
    }
  });

  

  function closeApp(){
     // TODO: Check for graph or regular view
    
    // Save the text of active note
    let aP = self.session.getActiveProject();
    self.session.prepProjectForTrans(aP);
    
    ipcRenderer.send('closed');
  }
  /**
   * Handlers for IPC
   */
  ipcRenderer.on('saveEdits', (event) => {
   closeApp();
  });
}

App.prototype.addSelectedNotesToGraph = function(){
  let self = this,
      i = 0, nV = null, box_offset = 500,
      active_project = self.session.getActiveProject(),
      selected_notes = active_project.getItemsFromSelection(),
      active_graph = active_project.getActiveGraph(),
      bounding_box = active_graph.getVerticesBoundingBox(),
      newVertices = [],
      coords = {
        x: bounding_box.startX + bounding_box.width + box_offset,
        y: bounding_box.startY + bounding_box.height/2
      };

  console.log("..note selection exists, so add it...");
  for(i in selected_notes){
    nV = active_graph.createNewVertexForNote(coords, selected_notes[i]);
    coords.x = coords.x + 100;
    coords.y = coords.y + 100;
    if(nV){
      nV.saveData();
      newVertices.push(nV);
    }else{
      self.views.notifications.addNotification(
        self.views.notifications.INFO,
        "Note already has vertex in selected graph."
      );
      self.render(true);
    }
  }
  if(active_project.getGraphMode() && newVertices.length > 0){
    console.log(newVertices.length + " notes added to graph..");
    self.views.graph.updateGraph(active_graph);
    // Update the create new graph button
    self.views.titlebar.updateCreateNewBtn(self.el, active_graph);
    self.render(true);
  }
}

App.prototype.addNotesToGraphDnD = function(graph, notes, position){
  console.log("calcDropZone coordinates...")
  let self = this,
      i = 0, nV = null,
      coords = self.views.graph.calcRelativeDropZone(position),
      newVertices = [];
  if(notes.length > 0){
    console.log("..note selection exists, so add it...");
    for(i in notes){
      nV = graph.createNewVertexForNote(coords, notes[i]);
      coords.x = coords.x + 10;
      coords.y = coords.y + 10;
      if(nV){
        nV.saveData();
        newVertices.push(nV);
      }else{
        self.views.notifications.addNotification(
          self.views.notifications.INFO,
          "Note already has vertex in selected graph."
        );
        self.render(true);
      }
    }
    if(newVertices.length > 0){
      console.log(newVertices.length + " notes added to graph..");
      self.views.graph.updateGraph(graph);
      // Update the create new graph button
      self.views.titlebar.updateCreateNewBtn(self.el, graph);
      self.render(true);
    }
  }
}

/**
 * Creates the UI element for the content area. 
 * 
 * @param {Boolean} lazy_load - When the graph mode is active lazy loading 
 * does not reload the full graph with rendering but treats it separate so once
 * it is initialised the graph content will updated by the GraphEditorView.
 * Benefitial when the graph svg deals with a lot of elements..
 */
App.prototype.renderContentArea = function(lazy_load = false){
  var self = this;
  if(self.session.getGraphMode()){
    if(lazy_load){
      return document.getElementById('content');
    }

    let content = yo`
      <div id="content" class="graph-active">
      ${self.views.graph.render(self.session.getActiveProject())}
      ${self.renderRightSideMenu()}
      </div>
    `;
    console.log("======== renderContentArea: ===========");
    console.log(content);
    return content;

  }else{
    return yo`
    <div id="content">
    ${self.views.editor.render(self.session.getActiveProject())}
    </div>
    `;
  }
}

App.prototype.renderRightSideMenu = function(lazy_load = false){
  var self = this;
  if(!self.session.getGraphMode()){
    return;
  }
  return self.views.graph.renderRightSideMenu();
}

App.prototype.renderMain = function (lazy_load = false) {
  var self = this;
  var views = self.views;

  // console.log("Active Project: ")
  // console.log(self.session.getActiveProject())

  /**
   * Refactor: 
   *  - left-menu-1 could be handed the session instance
   *  - content could be handed the note or graph
   *  
   * - Then the content matches the class hierarchy nicer
   */
  let focusClassPrjcts = (self.focusManager.getFocusObject() === self.focusManager.PROJECT_LIST) ? 'focused' : '';
  let focusClassItems = (self.focusManager.getFocusObject() === self.focusManager.ITEM_LIST) ? 'focused' : '';
  if(lazy_load){
    return  yo`
      <div id="layout">
        ${views.titlebar.render(self.session)}

        <!-- Main content -->
        <div id="main">
      
          <!-- Project Menu -->
          <div id="left-menu-1" class="${focusClassPrjcts}">
            ${views.projects.render(self.session.getProjects(), self.appGlobalData.getAllRecentProjects())}
          </div>

          <!-- Notes Menu -->
          <div id="left-menu-2" class="${focusClassItems}">
            ${views.items.render(self.session.getActiveProject())}
          </div>

          <!-- Content Area -->
          ${self.renderContentArea(lazy_load)}

          ${self.views.notifications.render()}
        </div>
        
      </div>
    `;
  }else{
    return yo`
      <div id="layout">
        ${views.titlebar.render(self.session)}

        <!-- Main content -->
        <div id="main">
      
          <!-- Project Menu -->
          <div id="left-menu-1" class="${focusClassPrjcts}">
            ${views.projects.render(self.session.getProjects(), self.appGlobalData.getAllRecentProjects())}
          </div>

          <!-- Notes Menu -->
          <div id="left-menu-2" class="${focusClassItems}">
            ${views.items.render(self.session.getActiveProject())}
          </div>

          <!-- Content Area -->
          ${self.renderContentArea()}

          <!-- Message Toast Panel -->
          ${self.views.notifications.render()}          
        </div>
        
      </div>
    `;
  }
  
}

App.prototype.render = function(lazy_load = false) {
  // console.log(this.commandManager);
  
  var self = this,
      newTree = this.renderMain(lazy_load);
  yo.update(this.tree, newTree);

  // Recreate split screen on new dom tree with sizes from old one
  self.split_manager.recreateFromBuffer();

  // Reinitialise the semantic UI left-menu dropdown
  $('.ui.dropdown').dropdown({
    silent: true
  });

  // Reinitialise the project-thumb dropdowns
  $('.prjct-thmb-dropdown').dropdown({
    silent: true
  });

  if(!self.session.getGraphMode()){
    // Adjust height of the textarea in NoteEditorView to fit content
    UIAssistant.resizeElementByContent($('#notepad')[0]);
  }else{
    // Adjust height of the textarea in right-side-menu to fit content
    UIAssistant.resizeElementByContent($('#graph-description')[0]);
    // Make the #content container of the graph a droppable element for the notes
    $('#content').droppable({
      accept:'.item-thmb-wrap',
      tolerance: 'pointer',
      classes: {
        "ui-droppable-active": "graph-droppable-active",
        "ui-droppable-hover": "graph-droppable-hover"
      },
      over: function(event, ui) {
        $('body').css("cursor", "copy");
      },
      out: function(event, ui) {
        $('body').css("cursor", "no-drop");
      },
      drop: function(event,ui){
        console.log("Dropped note in graph at position...");

        let $item_thmb = ui.draggable.find('.item-thmb'),
            data_object = $item_thmb.attr('data-object'),
            item_id = null;

        // For now dropping graphs into graphs is not supported..
        if(data_object !== "note"){ return; }
        item_id = $item_thmb.attr('data-id');

        // Pack this in a method

        let active_project = self.session.getActiveProject(),
            active_graph = active_project.getActiveGraph(),
            selected_notes = active_project.getItemsFromSelection(),
            note = active_project.getNoteByUUID(item_id),
            drag_notes = [];
        
        if(!note){
          console.error("Note associated with UI element could not be found.");
          return;
        }
        // Selected thumb was dragged => Drags all selected thumbs.
        if(selected_notes.indexOf(note) >= 0){
          drag_notes = selected_notes;
        }else{  // Unselected note thumb was dragged
          drag_notes.push(note);
        }

        const params = {
              graph: active_graph,
              notes: drag_notes,
              position: ui.position
            };
        let cmd = new DnDAddNotesToGraphCmd(self, params);
        self.commandManager.executeCmd(cmd);
        
      }
    });
  }
}



module.exports = window.App = App