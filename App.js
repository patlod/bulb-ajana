"use strict"

var EventEmitter = require('events').EventEmitter

var inherits = require('util').inherits
const { ipcRenderer } = require('electron')

var yo = require('yo-yo')
var Split = require('split.js')

const d3 = require('d3')

// App Peripherals
const ConfigManager = require('./_app/ConfigurationManager')
// const UserPreferences = require('./_models/UserPreferences')
const GlobalData = require('./_models/GlobalData') 

// Controllers
const Session = require('./_controllers/Session.js')
const SplitManager = require('./scripts/split-screen.js')

// Views
const Titlebar = require('./_views/Titlebar.js')
const ProjectListView = require('./_views/ProjectListView.js')
const NoteListView = require('./_views/NoteListView.js')
const NoteEditorView = require('./_views/NoteEditorView.js')
const GraphEditorView = require('./_views/GraphEditorView.js')

//const GraphCreator = require('./graph-creator')


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

  self.session = new Session(self)     // The session stores all the open projects with notes

  self.appConfigManager = new ConfigManager()
  const APP_DATA_DIR = self.appConfigManager.getAppDataDir()
  const USER_PREFS_PATH = self.appConfigManager.getUserPreferencesPath()
  const GLOBAL_DATA_PATH = self.appConfigManager.getGlobalDataPath()
  // console.log("App: ")
  // console.log(APP_DATA_DIR)
  // console.log(USER_PREFS_PATH)
  // console.log(GLOBAL_DATA_PATH)


  // self.appUserPreferences = new UserPreferences(USER_PREFS_PATH)
  self.appGlobalData = new GlobalData(GLOBAL_DATA_PATH)

  
  // All view instance for different parts of the app's UI
  self.views = {
    titlebar: new Titlebar(self),
    projects: new ProjectListView(self),
    notes: new NoteListView(self),
    editor: new NoteEditorView(self),
    graph: new GraphEditorView(self)
  }

  

  /* === Initial DOM tree render ================= */
  var tree = self.render()
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
    //console.log(newTree)
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
    self.views.editor.resizeElementByContent($('#notepad')[0])

    if(self.session.getGraphMode()){
      // Make the #content container of the graph a droppable element for the notes
      $('#content').droppable({
        accept:'.note-thmb-wrap',
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
            console.log("Dropped note in graph..")
            /**
             * TODO: Add node to graph here..
             * 
             * - At this point it becomes necessary to create a Graph controller which
             *   accesses database etc.
             */
        }
      });
    }
    
  }

  /**
   * == Listeners EventEmitter =====================================
   */
  self.on('render', render)

  self.on('transitionEditor', function(){
    if(!self.session.getGraphMode()){ // Swtich from graph
      self.views.graph.takedown()
    }
    render()
  })

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

  self.on('transitionNote', function(project, note){
    let active_note = project.getActiveNote()
    // Toggle active project & update UI in case switched to different note
    if(active_note.uuid.localeCompare(note.uuid) === 0){
      return
    }

    self.session.prepProjectForTrans(project)

    project.toggleActiveNote(note)
    
    render(true)
    
  })

  self.on('createNewNote', function(){
    console.log("App received: CREATE NEW NOTE");
    /**
     * For now: New empty note is directly inserted into database
     * Better: Only insert once there is at least one char content.
     */
    if(self.session.getActiveProject() === null){
      console.log("App listener createNewNote -- No active project.")
      return 
    }
    let nn = self.session.getActiveProject().createNewNote()
    nn.saveData()
    render()
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
    let p = self.session.getActiveProject()
    p.deleteNote(p.getActiveNote())
    render()
  })

  
  self.on('updateByEditorContent', function(active_note){
    console.log("App received: LIVE UPDATE TEXT OF NOTE THUMB")
    
    self.views.titlebar.updateCreateNewBtn(el, active_note)
    self.views.notes.updateActiveNoteThumb(el, active_note)
    //render()
    // Set scroll height of left-menu-2
    //$("#left-menu-2")[0].scrollTop = self.views.notes.scrollTop
    // Set scroll height of project menu
    //$("#prjct-list-scroll")[0].scrollTop = self.views.projects.scrollTop
    // Set cursor of #notepad
    //$("#notepad")[0].selectionStart = self.views.editor.selectionStart
    //$("#notepad")[0].selectionEnd = self.views.editor.selectionEnd
  })

  self.on('toggleEditorDate', function(){
    // Get active note thumb..
    let c_dt = document.getElementById('dt-created')
    let m_dt = document.getElementById('dt-modified')
    c_dt.classList.toggle('hidden')
    m_dt.classList.toggle('hidden')
  })

  /**
   * Handlers for IPC
   */
  ipcRenderer.on('saveEdits', (event) => {
    // TODO: Check for graph or regular view
    
    // Save the text of active note
    let aP = self.session.getActiveProject()
    self.session.prepProjectForTrans(aP)
    
    ipcRenderer.send('closed')
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

    let content = yo `
      <div id="content" class="graph-active">
      ${self.views.graph.render(self.session.getActiveProject())}
      </div>
    `
    return content

  }else{
    return yo `
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
          ${self.renderContentArea()}
          

        </div>

      </div>
    `

    // 
  }
  
}


module.exports = window.App = App