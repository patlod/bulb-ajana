module.exports = ProjectListView

const EventEmitterElement = require('../_app/EventEmitterElement')
var inherits = require('util').inherits

var yo = require('yo-yo')



function ProjectListView(target) {
    var self = this
    EventEmitterElement.call(this, target)

    this.scrollTop = 0;
}
inherits(ProjectListView, EventEmitterElement)




/**
 * TODO:
 *  - Create new project from '+' button and dropdown
 *      - The event name input should be submitted when pressing enter or clicking somewhere else
 *      - Writing directly to JSON file.
 * - Implement all the functions from the dropdown:
 *    - Dropdown 1:
 *      - Rename project
 *      - Close project
 *      - Sort the notes of the project 
 *      - Delete project
 *      - Make a copy
 *      - Open the folder in finder
 *    - Dropdown 2:
 *      - New project
 *      - Sort project list
 *      - List recent projects
 */

ProjectListView.prototype.createPrjctThmbDropdown = function(){
  var self = this
  /**
   * TODO: Define event handler functions
   */
  function clickRenameProject(e){
    console.log("Click handler - RENAME")
    let p_thumb = $(this).parent().parent().parent().parent()[0]
    let nInput = p_thumb.getElementsByClassName('prjct-name-input')[0]
    let nSpan = p_thumb.getElementsByClassName('prjct-thmb-name')[0]
    nSpan.classList.toggle('hidden')
    nInput.classList.toggle('hidden')
    nInput.focus()
    nInput.select()
  }

  function clickCloseProject(e){
    // Hide the dropdown (jQuery)
    let dd_el = $(this).parent().parent()
    dd_el.dropdown('destroy')
    
    // Get the project id
    let project_id = dd_el.parent().parent().attr('data-id')
    // Send closeProject event to App
    self.send('closeProject', project_id)
  }

  function clickDeleteProject(e){
    console.log("Click handler - DELETE")
    let dd_el = $(this).parent().parent()
    dd_el.dropdown('destroy')
    let project_id = dd_el.parent().parent().attr('data-id')
    self.send('deleteProject', project_id)
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
  `
  
  return prjct_thmb_dp
}

ProjectListView.prototype.createLeftMenuDropdown = function(recents){
  var self = this
  
  /**
   * Event h
   */
  function clickOpenProjectDialog(e){
    self.send('openProjectDialog')
  }

  function clickNewProject(e){
    self.send('newProject')
  }

  function clickOpenRecentProject(e){
    let path = this.getAttribute('data-path')
    self.send('openRecentProject', path)
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
      `
    })
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
        <!-- 
        <div class="item">
          <i class="dropdown icon"></i>
          Recent Projects
          <div class="menu">
            <div class="item">Project A</div>
            <div class="item">Project B</div>
            <div class="item">Project C</div>
          </div>
        </div>
        --> 
      </div>          
    </div>
    
  `
  // <div class="item" data-value="important">
  //           <div class="ui red empty circular label"></div>
  //           Important
  //         </div>
  //         <div class="item" data-value="announcement">
  //           <div class="ui blue empty circular label"></div>
  //           Announcement
  //         </div>
  //         <div class="item" data-value="cannotfix">
  //           <div class="ui black empty circular label"></div>
  //             Cannot Fix
  //         </div>
  //         <div class="item" data-value="news">
  //           <div class="ui purple empty circular label"></div>
  //           News
  //         </div>
  //         <div class="item" data-value="enhancement">
  //           <div class="ui orange empty circular label"></div>
  //           Enhancement
  //         </div>
  //         <div class="item" data-value="off-topic">
  //           <div class="ui yellow empty circular label"></div>
  //           Off Topic
  //         </div>
  //         <div class="item" data-value="interesting">
  //           <div class="ui pink empty circular label"></div>
  //           Interesting
  //         </div>
  //         <div class="item" data-value="discussion">
  //           <div class="ui green empty circular label"></div>
  //           Discussion
  //         </div>
  return left_menu_dp
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
      //console.log(e.target)
      if(e.target !== this && (e.target.classList.contains('fa-ellipsis-h')
          || e.target.classList.contains("item"))){
        return
      }
      // if(e.target !== this){ 
      //   return
      // }
      // Send event to core App
      console.log("clickPrjctThmb -> switchProject")
    
      self.send('switchProject', project)      
    }

    function blurHandlerInput(e){
      // Check whether input is .hidden 
      // (i.e. event was already treated by keyup handler)
      if(this.classList.contains('hidden')){
        return
      }

      console.log("Name input blur handler treating event.")
      let input_str = self.sanitizeString(this.value)
      if(input_str.length < 1 || !project.validFileName(input_str)){
        if(!this.classList.contains('alert')){
          this.classList.add('alert')
        }
        // Refocus the input field.
        this.focus()
        this.select()
      }else{
        if (input_str.length >= 1 && project.validFileName(input_str)){
          if(this.classList.contains('alert')){
            this.classList.remove('alert')
          }
          
          // Rename project
          project.renameProject(input_str)
          console.log("renamed project....")
          // Remove input field.
          let p_thumb = $(this).parent()[0]
          let nInput = p_thumb.getElementsByClassName('prjct-name-input')[0]
          let nSpan = p_thumb.getElementsByClassName('prjct-thmb-name')[0]
          // Set name in the span
          nSpan.textContent = input_str
          nSpan.classList.toggle('hidden')
          nInput.classList.toggle('hidden')
        
        }
      }
    }

    function keyupHandlerInput(e){
      console.log("Name input keyup handler.")
      let input_str = self.sanitizeString(this.value)
      if(input_str.length < 1 || !project.validFileName(input_str)){
        if(!this.classList.contains('alert')){
          this.classList.add('alert')
        }
      }else{
        if (input_str.length >= 1 && project.validFileName(input_str)){
          if(this.classList.contains('alert')){
            this.classList.remove('alert')
          }
        
          if(e.keyCode === 13){
            // Rename project
            project.renameProject(input_str)
            console.log("renamed project....")
            // Remove input field.
            let p_thumb = $(this).parent()[0]
            let nInput = p_thumb.getElementsByClassName('prjct-name-input')[0]
            let nSpan = p_thumb.getElementsByClassName('prjct-thmb-name')[0]
            // Set name in the span
            nSpan.textContent = input_str
            nSpan.classList.toggle('hidden')
            nInput.classList.toggle('hidden')
          }
        }
      }
    } 

    /* ====================================================================== */
    /* ====================================================================== */
    
    
    var className = project.isActive() ? 'active' : ''

    return yo`
      <div class="prjct-thmb ${className}" onclick="${clickPrjctThmb}" data-id="${project.uuid}">
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
    `
  })

  //console.log("Project thumbnails..")
  //console.log(project_thmbs)

  function clickPrjctAdd(){
    // Trigger file prompt
    // Scroll down to the bottom of the projct list
    console.log('Send newProject event')
    self.send('newProject')
  }

  function scrollProjectList(e){
    // Save the scroll position of project list
    self.scrollTop = this.scrollTop
  }

  return yo`
    <div>
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
  `
}

/*
<div id="dummy-dp" class="ui dropdown floated" style="float: right;">
          <i class="fas fa-ellipsis-v"></i>

          <div class="menu">
            <div class="item"  >Open Projects</div>
            <div class="item" >New Project</div>
            
            <div class="divider"></div>
            <div class="header">
              Recent Projects
            </div>
            <div class="scrolling menu" >
              <div class="item" data-value="important">
                <div class="ui red empty circular label"></div>
                Important
              </div>
            </div>
            
          </div>          
        </div>
        */

ProjectListView.prototype.scrollToBottom = function (force) {
  if (!force && !this.shouldAutoScroll) return
  var projectList = document.getElementById('prjct-list-scroll')
  if (projectList) projectList.scrollTop = projectList.scrollHeight
}