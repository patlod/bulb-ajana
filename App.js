"use strict"

var EventEmitter = require('events').EventEmitter

const inherits = require('util').inherits
const { ipcRenderer } = require('electron')
const app = require('electron').remote.app

const yo = require('yo-yo')
const d3 = require('d3')

// App Peripherals
const ConfigManager = require('./_app/ConfigurationManager')
// const UserPreferences = require('./_models/UserPreferences')
const GlobalData = require('./_models/GlobalData') 

// Controllers
const Session = require('./_controllers/Session.js')
const SplitManager = require('./scripts/split-screen.js')

// Views
const TitlebarView = require('./_views/TitlebarView')
const ProjectListView = require('./_views/ProjectListView')
const NoteListView = require('./_views/NoteListView')
const NoteEditorView = require('./_views/NoteEditorView')
const GraphEditorView = require('./_views/GraphEditorView')
const AppControls = require('./_controllers/AppControls')


inherits(App, EventEmitter)

/**
 * This is the central app controller which references and interacts with all other
 * specialised controllers.
 * 
 * @param {HTMLElement} el 
 */
function App(el){
  var self = this;
  if (!(self instanceof App)) return new App(el)

  /* ===== Controllers ===== */
  self.appConfigManager = new ConfigManager()
  // const APP_DATA_DIR = self.appConfigManager.getAppDataDir()
  // const USER_PREFS_PATH = self.appConfigManager.getUserPreferencesPath()
  const GLOBAL_DATA_PATH = self.appConfigManager.getGlobalDataPath()
  // self.appUserPreferences = new UserPreferences(USER_PREFS_PATH)
  self.appGlobalData = new GlobalData(GLOBAL_DATA_PATH)


  self.session = new Session(self)     // The session stores all the open projects with notes
  self.appControls = new AppControls()



  

  /* ====== Views ====== */
  // All view instance for different parts of the app's UI
  self.views = {
    titlebar: new TitlebarView(self),
    projects: new ProjectListView(self),
    notes: new NoteListView(self),
    editor: new NoteEditorView(self),
    graph: new GraphEditorView(self)
  }


  // --- Menu ---
  // App
  self.appControls.add('default', '*', 'About', () => { console.log("About") }, '')
  self.appControls.addSpacer('default', '*', 'preffers')
  self.appControls.add('default', '*', 'Preferences', () => { console.log("Preferences") }, '')
  self.appControls.addSpacer('default', '*', 'hidders')
  self.appControls.add('default', '*', 'Hide', () => { console.log("Hide") }, 'CmdOrCtrl+H')
  self.appControls.add('default', '*', 'Hide Others', () => { console.log("Hide Others") }, 'Alt+CmdOrCtrl+H')
  self.appControls.add('default', '*', 'Show All', () => { console.log("Show All") }, '')
  self.appControls.addSpacer('default', '*', 'Developers')
  self.appControls.addRole('default', '*', 'reload')
  self.appControls.addRole('default', '*', 'forcereload')
  self.appControls.addRole('default', '*', 'toggledevtools')
  self.appControls.addSpacer('default', '*', 'quitters')
  // self.appControls.add('default', '*', 'Reset', () => { console.log("Reset") }, 'CmdOrCtrl+Backspace')
  self.appControls.add('default', '*', 'Quit', () => { 
    console.log("Quit");
    closeApp();
  }, 'CmdOrCtrl+Q')
  
  // File
  self.appControls.add('default', 'File', 'New Project', () => { console.log("New Project") }, 'CmdOrCtrl+P')
  self.appControls.add('default', 'File', 'New Note', () => { console.log("New Note") }, 'CmdOrCtrl+N')
  self.appControls.addSpacer('default', 'File', 'Open')
  self.appControls.add('default', 'File', 'Open Project...', () => { console.log("Open Project...") }, 'CmdOrCtrl+O')
  self.appControls.add('default', 'File', 'Open Recent...', () => { console.log("Open Recent...") }, '')
  self.appControls.addSpacer('default', 'File', 'Close')
  self.appControls.add('default', 'File', 'Close Project...', () => { console.log("Close Project") }, 'Shift+CmdOrCtrl+P')
  self.appControls.add('default', 'File', 'Close Window...', () => { console.log("Close") }, 'CmdOrCtrl+W')

  // Edit
  self.appControls.addRole('default', 'Edit', 'undo')       // REFACTOR: Requries Custom implementation
  self.appControls.addRole('default', 'Edit', 'redo')       // REFACTOR: Requries Custom implementation
  self.appControls.addSpacer('default', 'Edit', 'Copy&Paste')
  self.appControls.addRole('default', 'Edit', 'cut')
  self.appControls.addRole('default', 'Edit', 'copy')
  self.appControls.addRole('default', 'Edit', 'paste')
  self.appControls.addSpacer('default', 'Edit', 'deleter')
  self.appControls.add('default', 'Edit', 'Delete Selection', () => { console.log("Delete Selected Objects") }, 'CmdOrCtrl+Backspace')
  // self.appControls.addRole('default', 'Edit', 'delete')
  // self.appControls.addRole('default', 'Edit', 'selectall')
  self.appControls.addSpacer('default', 'Edit', 'Find')
  self.appControls.add('default', 'Edit', 'Find in Editor', () => { console.log("Find in Editor") }, 'CmdOrCtrl+F')
  self.appControls.add('default', 'Edit', 'Find in Notes', () => { console.log("Find in Notes") }, 'CmdOrCtrl+Shift+F')
  self.appControls.add('default', 'Edit', 'Find in Graphs', () => { console.log("Find in Graphs") }, 'CmdOrCtrl+Shift+G')

  // View
  self.appControls.add('default', 'View', 'as Note Editor', () => { 
    console.log("View as Note Editor") 
    transToNoteEditor()
  }, 'CmdOrCtrl+Shift+G', 'checkbox', true) 
  self.appControls.add('default', 'View', 'as Graph Editor', () => { 
    console.log("View as Graph Editor", false)
    transToGraphEditor()
  }, 'CmdOrCtrl+G', 'checkbox') 
  self.appControls.addSpacer('default', 'View', 'Sorting')
  self.appControls.add('default', 'View', 'Sort Projects By', () => { console.log("Sort Projects By") }, '') 
  // Submenu necessary here
  self.appControls.add('default', 'View', 'Sort Notes By', () => { console.log("Sort Notes By") }, '')
  // Submenu necessary here
  self.appControls.add('default', 'View', 'Sort Graphs By', () => { console.log("Sort Graphs By") }, '')
  // Submenu necessary here
  self.appControls.addSpacer('default', 'View', 'Zoom')
  self.appControls.add('default', 'View', 'Zoom In', () => { console.log("Zoom In") }, '')
  self.appControls.add('default', 'View', 'Zoom Out', () => { console.log("Zoom Out") }, '')
  self.appControls.add('default', 'View', 'Actual Size', () => { console.log("Actual Size") }, '')
  self.appControls.addSpacer('default', 'View', 'Screen')
  self.appControls.add('default', 'View', 'Full Screen', () => { console.log("Full Screen") }, '')

  // Window
  self.appControls.add('default', 'Window', 'Minimise', () => { console.log("Minimise Window") }, '')
  self.appControls.addSpacer('default', 'Window', 'New Window')
  self.appControls.add('default', 'Window', 'New Window', () => { console.log("New Window") }, '')

  // Graph
  self.appControls.add('default', 'Graph', 'New Graph', () => { console.log("New Graph") }, '')
  self.appControls.add('default', 'Graph', 'Add Selected Notes', () => { console.log("Add Selected Notes...") }, '')
  self.appControls.addSpacer('default', 'Graph', 'orient')
  self.appControls.add('default', 'Graph', 'Refresh Orientation', () => { console.log("Refresh Orientation") }, '')
  self.appControls.addSpacer('default', 'Graph', 'zoomers')
  self.appControls.add('default', 'Graph', 'Zoom In', () => { console.log("Zoom In") }, '')
  self.appControls.add('default', 'Graph', 'Zoom Out', () => { console.log("Zoom Out") }, '')
  self.appControls.addSpacer('default', 'Graph', 'scrollers')
  self.appControls.add('default', 'Graph', 'Scroll North', () => { console.log("Scroll North") }, '')
  self.appControls.add('default', 'Graph', 'Scroll South', () => { console.log("Scroll South") }, '')
  self.appControls.add('default', 'Graph', 'Scroll West', () => { console.log("Scroll West") }, '')
  self.appControls.add('default', 'Graph', 'Scroll East', () => { console.log("Scroll East") }, '')

  self.appControls.commit()
  


 

  

  /* === Initial DOM tree render ================= */
  var tree = self.render()
  console.log(tree)
  el.appendChild(tree)
  /* ============================================= */

  // Initialise the split screen manager object
  self.split_manager = new SplitManager(this)

  /**
   * Inserts script tags 
   * 
   * For initialisation of functionality modules 
   * such as Split.js, Tagify.js and Semantic-UI dropdown 
   * 
   * 
   * BUG: I need to parametrize the scripts otherwise 
   * the split-screen is reinitialised with the default values
   * instead of the values from the beginning.
   */
  function addScripts(to){
    var script_el = document.createElement('script')
    script_el.src = "./scripts/dropdown_semantic_ui.js"
    to.appendChild(script_el)

    /*script_el = document.createElement('script')
    script_el.src = "graph-creator.js"
    target.appendChild(script_el)*/
  }

  addScripts(document.getElementById('layout'))
  

  /**
   * - After the call of this render the UI is completely messed up:
   * - This is because the Tagify, Split.js and dropdowns are initialised in index.html
   *   right after the first creation of the dom.
   *    - When using yo.update() the problem is that the defined dom-tree is swapped.
   *    - This means that the initialisation of the html elements has to be done again.
   */

  function render (lazy_load = false) {
    var newTree = self.render(lazy_load)
    yo.update(tree, newTree)
    // Recreate split screen on new dom tree with sizes from old one
    self.split_manager.recreateFromBuffer()
    // Reinitialise the semantic UI left-menu dropdown
    $('.ui.dropdown').dropdown({
      silent: true
    });

    // Reinitialise the project-thumb dropdowns
    $('.prjct-thmb-dropdown').dropdown({
      silent: true
    });

    // Adjust height of the textarea in NoteEditorView to fit content
    if(!self.session.getGraphMode()){
      self.views.editor.resizeElementByContent($('#notepad')[0])
    }else{
      // Make the #content container of the graph a droppable element for the notes
      $('#content').droppable({
        accept:'.note-thmb-wrap',
        tolerance: 'pointer',
        classes: {
          "ui-droppable-active": "graph-droppable-active",
          "ui-droppable-hover": "graph-droppable-hover"
        },
        over: function(event, ui) {
          $('body').css("cursor", "copy")
        },
        out: function(event, ui) {
          $('body').css("cursor", "no-drop")
        },
        drop: function(event,ui){
          console.log("Dropped note in graph at position...")

          let active_project = self.session.getActiveProject()
          let active_graph = active_project.getActiveGraph()

          let note_id = ui.draggable.find('.note-thmb').attr('data-id')
          // Get note from project
          let note = active_project.getNoteByUUID(note_id)
          console.log(note)

          console.log("calcDropZone coordinates...")
          let coords = self.views.graph.calcRelativeDropZone(ui.position)
          
          if(note !== null){
            console.log("..it exists, so add it...")
            let nV = active_graph.createNewVertexForNote(coords, note)
            if(nV){
              nV.saveData()
              self.views.graph.updateGraph(active_graph)
              render(true)
            }else{
              console.log("Vertex for this note already exists..")
            }
          }
        }
      });
    }
    
  }

  

  /**
   * == Listeners EventEmitter =====================================
   */
  self.on('render', render)

  function transToGraphEditor(){
    let active_p = self.session.getActiveProject();
    self.session.setGraphMode(true)
    render()
  }
  self.on('transToGraphEditor', transToGraphEditor)

  function transToNoteEditor(){
    self.session.setGraphMode(false)
    self.views.graph.takedown()
    render()
  }
  self.on('transToNoteEditor', transToNoteEditor)

  self.on('switchProject', function(project){
    // For currently active project save the content of active note
    // in case it exists..
    self.session.transToProject(project, render)
  })

  self.on('newProject', function(){
    self.session.newProject(render);
  })

  self.on('openProjectDialog', function(){
    self.session.openProjectDialog(render);
  })

  self.on('openRecentProject', function(path){
    self.session.openProjectWithPath(path, render)
  })

  self.on('closeProject', function(project_id){
    console.log("App -- Close Project..")
    self.session.closeProject(project_id, render);
  })

  self.on('deleteProject', function(project_id){
    console.log("App -- Delete Project..")
    self.session.deleteProject(project_id, render)
  })

  self.on('transitionNote', function(project, note, trigger='note-thumb'){
    let active_note = project.getActiveNote()
    // Toggle active project & update UI in case switched to different note
    if(active_note.uuid.localeCompare(note.uuid) === 0){
      return
    }

    if(!project.getGraphMode()){
      self.session.prepProjectForTrans(project)
    }
    
    project.toggleActiveNote(note)

    if(project.getGraphMode() && trigger.localeCompare('note-thumb') === 0){
      console.log("Set selected node here.")
      self.views.graph.updateGraph(project.getActiveGraph())
    }

    render(true)
  })

  self.on('transitionNoteAndEditor', function(project, note){
    console.log("transitionNoteAndEditor")
    let active_note = project.getActiveNote()

    console.log(project.getGraphMode())
    if(project.getGraphMode()){
      project.toggleActiveNote(note)
      project.setGraphMode(false)
      self.views.graph.takedown()
      render()
    }else{
      if(active_note.uuid.localeCompare(note.uuid) === 0){
        return
      }
      self.session.prepProjectForTrans(project)
      project.toggleActiveNote(note)
      render(true)
    }
    
  })

  self.on('createNewNote', function(){
    console.log("App received: CREATE NEW NOTE");
    if(self.session.getActiveProject() === null){
      console.log("App listener createNewNote -- No active project.")
      return 
    }

    let nn = self.session.getActiveProject().createNewNote()
    nn.saveData() // REFACTOR: Maybe better move this in createNewNote()

    //render(true)
    if(self.session.getGraphMode()){
      transToNoteEditor()
      render()
    }else{
      render()
    }
    
  })

  self.on('deleteSelectedNotes', function(){
    console.log("App received: DELETE SELECTED NOTES")
    /**
     * For now: 
     *  - Selection of multiple notes not possible.
     *     - Thus: Only delete the currently active note. 
     *  - Notes are completely deleted
     *     - Better save them in some sort of a trash been, so that they can
     *       be potentially revived.
     */
    if(self.session.getActiveProject() === null){
      console.log("App listener createNewNote -- No active project.")
      return 
    }
    let active_p = self.session.getActiveProject()
    let active_g = active_p.getActiveGraph()
    let active_note = active_p.getActiveNote()
    console.log(active_g)
    if(active_g !== null ){
      active_g.deleteVerticesForNote(active_note)
      //if(active_p.getGraphMode()){
      self.views.graph.updateGraph(active_g)
      //}
    }
    active_p.deleteNote(active_note)

    render()
  })

  
  self.on('updateByEditorContent', function(active_note){
    console.log("App received: LIVE UPDATE TEXT OF NOTE THUMB")
    
    self.views.titlebar.updateCreateNewBtn(el, active_note)
    self.views.notes.updateActiveNoteThumb(el, active_note)
  })

  self.on('toggleEditorDate', function(){
    // Get active note thumb..
    let c_dt = document.getElementById('dt-created')
    let m_dt = document.getElementById('dt-modified')
    c_dt.classList.toggle('hidden')
    m_dt.classList.toggle('hidden')
  })

  self.on('updateNoteColor', function(note, targetColor){
    // Update note thumbnail and write note color to database
    note.bg_color = targetColor
    note.saveData()

    self.views.notes.updateNoteThmbColor(note)
  })

/* ============================================================================== */
/*  Graph Event Listeners                                                         */
/* ============================================================================== */
  self.on('createNewNoteVertexGraph', function(coords){
    console.log('createNewNoteVertexGraph triggered')
    /**
     * For now: New empty note is directly inserted into database
     * Better: Only insert once there is at least one char content.
     */
    let active_project = self.session.getActiveProject()
    let active_graph = active_project.getActiveGraph()

    if( active_project === null || active_graph === null){
      console.log("createNewNoteVertexGraph -- No active project or graph.")
      return 
    }

    // Check whether empty note exists already
    let empty_notes = active_project.getEmptyNotes()
    if(empty_notes === null || empty_notes.length === 1){
      console.log("Still empty note found...")
      return
    }

    let nn = active_project.createNewNote()
    nn.saveData() // REFACTOR: Maybe move to createNewNote()
    
    let nV = active_graph.createNewVertexForNote( coords, nn )
    nV.saveData() // REFACTOR: Maybe move to createNewVertexForNote()
    
    self.views.graph.updateGraph(active_graph)

    render(true)
  })

  self.on('addNotesToGraph', function(coords){ 
    // TODO: 
    console.log("Call addNotesToGraph..")
  })

  self.on('deleteVertexInGraph', function(selectedVertex){
    console.log("deleteVertexInGraph: ")

    let g = self.session.getActiveGraph()
    g.deleteVertex(selectedVertex)

    self.views.graph.removeSelectFromNode();

    self.views.graph.updateGraph(g);
  })

  self.on('createNewEdgeInGraph', function(vPair){
    console.log("createNewEdgeInGraph: ")
    let g = self.session.getActiveGraph()

    var filtRes = g.getEdges().filter(function(d){
      console.log(d)
      if (d.source.compareTo(vPair.target) && d.target.compareTo(vPair.source)){
        g.deleteEdge(d)
      }
      return d.source.compareTo(vPair.source) && d.target.compareTo(vPair.target);
    });

    if (!filtRes.length){
      let nE = g.createNewEdge(vPair.source, vPair.target);
      nE.saveData()

      self.views.graph.updateGraph(g);
    }
  })

  self.on('deleteEdgeInGraph', function(selectedEdge){
    console.log("deleteEdgeInGraph: ")
    let g = self.session.getActiveGraph()
    g.deleteEdge(selectedEdge)

    self.views.graph.removeSelectFromEdge()

    self.views.graph.updateGraph(g);
  })

  self.on('updateVertexPosition', function(){
    // PROBABLY NOT NEEDED.
  })
  

  function closeApp(){
     // TODO: Check for graph or regular view
    
    // Save the text of active note
    let aP = self.session.getActiveProject()
    self.session.prepProjectForTrans(aP)
    
    ipcRenderer.send('closed')
  }
  /**
   * Handlers for IPC
   */
  ipcRenderer.on('saveEdits', (event) => {
   closeApp()
  })

}

/**
 *  
 * @param {Boolean} lazy_load - When the graph mode is active lazy loading 
 * does not reload the full graph with rendering but treats it separate so once
 * it is initialised the graph content will updated by the GraphEditorView.
 * Benefitial when the graph svg deals with a lot of elements..
 */
App.prototype.renderContentArea = function(lazy_load = false){
  var self = this
  if(self.session.getGraphMode()){
    if(lazy_load){
      return document.getElementById('content')
    }

    let content = yo`
      <div id="content" class="graph-active">
      ${self.views.graph.render(self.session.getActiveProject())}
      </div>
    `
    console.log("======== renderContentArea: ===========")
    console.log(content)
    return content

  }else{
    return yo`
    <div id="content">
    ${self.views.editor.render(self.session.getActiveProject())}
    </div>
    `
  }
}

App.prototype.render = function (lazy_load = false) {
  var self = this
  var views = self.views
  //var data = self.data

  //console.log("Active Project: ")
  //console.log(self.session.getActiveProject())

  function scrollNoteList(){
    /**
     * Save the scroll position in the NoteListView class here..
     */
    console.log("Scroll position: " + this.scrollTop)
    self.views.notes.scrollTop = this.scrollTop
  }

  /**
   * Refactor: 
   *  - left-menu-1 could be handed the session instance
   *  - content could be handed the note or graph
   *  
   * - Then the content matches the class hierarchy nicer
   */
  if(lazy_load){
    return  yo`
      <div id="layout">
        ${views.titlebar.render(self.session)}

        <!-- Main content -->
        <div id="main">
      
          <!-- Project Menu -->
          <div id="left-menu-1">
            ${views.projects.render(self.session.getProjects(), self.appGlobalData.getAllRecentProjects())}
          </div>

          <!-- Notes Menu -->
          <div id="left-menu-2" onscroll=${scrollNoteList}>
            ${views.notes.render(self.session.getActiveProject())}
          </div>

          <!-- Content Area -->
          ${self.renderContentArea(lazy_load)}

        </div>

      </div>
    `
  }else{
    return yo`
      <div id="layout">
        ${views.titlebar.render(self.session)}

        <!-- Main content -->
        <div id="main">
      
          <!-- Project Menu -->
          <div id="left-menu-1">
            ${views.projects.render(self.session.getProjects(), self.appGlobalData.getAllRecentProjects())}
          </div>

          <!-- Notes Menu -->
          <div id="left-menu-2" onscroll=${scrollNoteList}>
            ${views.notes.render(self.session.getActiveProject())}
          </div>

          <!-- Content Area -->
          ${self.renderContentArea()}

        </div>

      </div>
    `
  }
  
}


module.exports = window.App = App