module.exports = ProjectListView

const EventEmitterElement = require('../_app/EventEmitterElement');
var inherits = require('util').inherits;
const remote = require('electron').remote;
const Menu = require('electron').remote.Menu;
var yo = require('yo-yo');


function ProjectListView(target, focus_manager) {
    var self = this;
    EventEmitterElement.call(this, target);

    this.scrollTop = 0;

    this.focus_manager = focus_manager;
    this.selected_items = null;
}
inherits(ProjectListView, EventEmitterElement)


ProjectListView.prototype.createPrjctThmbDropdown = function(){
  var self = this;
  /**
   * Event handler functions
   */
  function clickRenameProject(e){
    console.log("Click handler - RENAME");
    let p_thumb = $(this).parent().parent().parent().parent()[0];
    let nInput = p_thumb.getElementsByClassName('prjct-name-input')[0];
    let nSpan = p_thumb.getElementsByClassName('prjct-thmb-name')[0];
    nSpan.classList.toggle('hidden');
    nInput.classList.toggle('hidden');
    nInput.focus();
    nInput.select();
  }

  function clickCloseProject(e){
    // Hide the dropdown (jQuery)
    let dd_el = $(this).parent().parent();
    dd_el.dropdown('destroy');
    
    // Get the project id
    let project_id = dd_el.parent().parent().attr('data-id');
    // Send closeProject event to App
    self.send('closeProject', project_id);
  }

  function clickDeleteProject(e){
    console.log("Click handler - DELETE");
    let dd_el = $(this).parent().parent();
    dd_el.dropdown('destroy');
    let project_id = dd_el.parent().parent().attr('data-id');
    self.send('deleteProject', project_id);
  }

  var prjct_thmb_dp = yo`
    <div class="prjct-thmb-dropdown ui dropdown floated right btn-options">
      <i class="fas fa-ellipsis-h"></i>
      <div class="menu">
        <div class="item" onclick=${clickRenameProject}>
          <span class="description">ctrl + r</span>
          Rename
        </div>
        <div class="item" onclick=${clickCloseProject}>Close</div>
        <div class="item" onclick=${clickDeleteProject}>
          <i class="trash icon"></i>
          Delete Project
        </div>
        <!--
        <div class="divider"></div>
        <div class="item">
          <i class="dropdown icon"></i>
          Sort Project by
          <div class="menu">
            <div class="item">Sort premise</div>
          </div>
        </div>
        <div class="divider"></div>
        
        <div class="item">Make a copy</div>
        <div class="item">Open Folder</div> -->
      </div>
    </div>  
  `;
  
  return prjct_thmb_dp;
}

ProjectListView.prototype.createLeftMenuDropdown = function(recents){
  var self = this;
  
  /**
   * Event Handlers
   */
  function clickOpenProjectDialog(e){
    self.send('openProjectDialog');
  }

  function clickNewProject(e){
    self.send('newProject');
  }

  function clickOpenRecentProject(e){
    let path = this.getAttribute('data-path');
    self.send('openRecentProject', path);
  }

  function mapRecentProjects(arr){
    return arr.map(function(path){
      let path_split = path.split("/")
      let project_name = path_split[path_split.length-1].split(".")[0]
      return yo`
        <div class="item" data-path="${path}" onclick=${clickOpenRecentProject}>
          <!-- <div class="ui red empty circular label"></div> -->
          ${project_name}
        </div>
        `;
    });
  }

  var left_menu_dp = yo`
    <div id="left-menu-dropdown" class="ui dropdown floated">
      <i class="fas fa-ellipsis-v"></i>

      <div class="menu">
        <div class="item" onclick=${clickOpenProjectDialog} >Open Projects</div>
        <div class="item" onclick=${clickNewProject}>New Project</div>
        <!--
        <div class="item">
          <i class="dropdown icon"></i>
          Sort by
          <div class="menu">
            <div class="item">Date Created (Default)</div>
            <div class="item">Date Edited</div>
            <div class="item">Title</div>
          </div>
        </div>
        -->
        <div class="divider"></div>
        <div class="header">
          Recent Projects
        </div>
        <div class="scrolling menu" >
          ${mapRecentProjects(recents)}
        </div>
      </div>          
    </div>
  `;

  return left_menu_dp;
}

/**
 * NOTE: For production purposes this would probably have to be revisited
 * 
 * @param {string} str 
 */
ProjectListView.prototype.sanitizeString = function(str){
  str = str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"");
  return str.trim();
}

ProjectListView.prototype.render = function(projects, recents){
  var self = this;
  
  var project_thmbs = projects.map(function(project){

    /* ====================================================================== */
    /*  Event Handlers - Project Thumbnail                                    */
    /* ====================================================================== */

    function clickPrjctThmb(e){
      if(e.target !== this && (e.target.classList.contains('fa-ellipsis-h')
          || e.target.classList.contains("item"))){
        return;
      }
      // Send event to core App
      console.log("clickPrjctThmb -> transitionProject");
      self.focus_manager.setFocusObject(self.focus_manager.PROJECT_LIST);
      self.send('transitionProject', project);
    }

    function contextMenuPrjctThmb(e){
      let template = [
        {
        label: 'Rename Project',
        click: () => {
          console.log("Context-Menu - Rename Project clicked on element:")
          let nInput = this.getElementsByClassName('prjct-name-input')[0],
              nSpan = this.getElementsByClassName('prjct-thmb-name')[0];
          nSpan.classList.toggle('hidden');
          nInput.classList.toggle('hidden');
          nInput.focus();
          nInput.select();
        }
      },
      {
        label: 'Delete Project',
        click: () => {
          console.log("Context-Menu - Delete Project clicked on element:")
          let dd_el = $(this).parent().parent();
          dd_el.dropdown('destroy');
          let project_id = $(this).attr('data-id');
          self.send('deleteProject', project_id);
          
        }
      },
      { type: 'separator'},
      {
        label: 'Close Project',
        click: () => {
          console.log("Context-Menu - Close Project clicked on element:")
          // Hide the dropdown (jQuery)
          let dd_el = $(this).parent().parent();
          dd_el.dropdown('destroy');
          
          // Get the project id
          let project_id = $(this).attr('data-id');
          // Send closeProject event to App
          self.send('closeProject', project_id);
        }
      },
      { type: 'separator'},
      {
        label: 'New Project',
        click: () => {
          console.log("Context-Menu - New Project clicked on element:")
          self.send('newProject');
        }
      }];
      const menu = Menu.buildFromTemplate(template);
      menu.popup(remote.getCurrentWindow());
    }

    function blurHandlerInput(e){
      // Check whether input is .hidden 
      // (i.e. event was already treated by keyup handler)
      if(this.classList.contains('hidden')){
        return;
      }

      console.log("Name input blur handler treating event.");
      let input_str = self.sanitizeString(this.value);
      if(input_str.length < 1 || !project.validFileName(input_str)){
        if(!this.classList.contains('alert')){
          this.classList.add('alert');
        }
        // Refocus the input field.
        this.focus();
        this.select();
      }else{
        if (input_str.length >= 1 && project.validFileName(input_str)){
          if(this.classList.contains('alert')){
            this.classList.remove('alert');
          }
          // Rename project
          project.renameProject(input_str);
          console.log("renamed project....");
          // Remove input field.
          let p_thumb = $(this).parent()[0];
          let nInput = p_thumb.getElementsByClassName('prjct-name-input')[0];
          let nSpan = p_thumb.getElementsByClassName('prjct-thmb-name')[0];
          // Set name in the span
          nSpan.textContent = input_str;
          nSpan.classList.toggle('hidden');
          nInput.classList.toggle('hidden');
        }
      }
    }

    function keyupHandlerInput(e){
      console.log("Name input keyup handler.");
      let input_str = self.sanitizeString(this.value);
      if(input_str.length < 1 || !project.validFileName(input_str)){
        if(!this.classList.contains('alert')){
          this.classList.add('alert');
        }
      }else{
        if (input_str.length >= 1 && project.validFileName(input_str)){
          if(this.classList.contains('alert')){
            this.classList.remove('alert');
          }
          if(e.keyCode === 13){
            // Rename project
            project.renameProject(input_str);
            console.log("renamed project....");
            // Remove input field.
            let p_thumb = $(this).parent()[0];
            let nInput = p_thumb.getElementsByClassName('prjct-name-input')[0];
            let nSpan = p_thumb.getElementsByClassName('prjct-thmb-name')[0];
            // Set name in the span
            nSpan.textContent = input_str;
            nSpan.classList.toggle('hidden');
            nInput.classList.toggle('hidden');
          }
        }
      }
    }

    /* ====================================================================== */
    /* ====================================================================== */
    
    
    var className = project.isActive() ? 'selected' : '';
    var project_thumb = yo`
      <div class="prjct-thmb ${className}" data-id="${project.uuid}"
      onclick="${clickPrjctThmb}"
      oncontextmenu="${contextMenuPrjctThmb}">
        <!-- <div class="fw-prjct-thmb-name"> -->
          <input class="prjct-name-input hidden" type="text" value="${project.getName()}" onblur=${blurHandlerInput} onkeyup=${keyupHandlerInput}>
          <span class="prjct-thmb-name">${project.getName()}</span>
        <!-- </div> -->
        <div class="prjct-thmb-ctrls">
          <!-- <div id="dummy-dropdown"></div> -->
          <!-- Dropdown --> 
          ${self.createPrjctThmbDropdown()}
          <span class="prjct-thmb-digit">${project.countNotes()}</span>
        </div>
      </div>
    `;

    return project_thumb;
  })

  
  function clickProjectList(e){
    self.focus_manager.setFocusObject(self.focus_manager.PROJECT_LIST);
  }

  function clickPrjctAdd(e){
    // Trigger file prompt
    // Scroll down to the bottom of the projct list
    console.log('Send newProject event');
    self.send('newProject');
  }

  function scrollProjectList(e){
    // Save the scroll position of project list
    self.scrollTop = this.scrollTop;
  }

  var list =  yo`
      <div class="sortable" onclick=${clickProjectList}>
        <div id="prjct-list-head">
          <span>Projects</span>
        </div>

        <!-- List of project thumbs -->
        <div id="prjct-list-scroll" onscroll=${scrollProjectList}>

          ${project_thmbs}

        </div>
      
        <!-- Project control panel -->
        <div id="left-menu-1-ctrls">
          <span class="btn-add" onclick=${clickPrjctAdd}><i class="fas fa-plus"></i></span>
          <!-- <span class="btn-options"><i class="fas fa-ellipsis-v"></i></span> -->
          
          <!-- Dropdown -->
          ${self.createLeftMenuDropdown(recents)}

        </div>
      </div>
    `;

    return list;
}

ProjectListView.prototype.scrollToBottom = function (force) {
  if (!force && !this.shouldAutoScroll) return;
  var projectList = document.getElementById('prjct-list-scroll');
  if (projectList) projectList.scrollTop = projectList.scrollHeight;
}