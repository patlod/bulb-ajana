module.exports = TitlebarView

const EventEmitterElement = require('../_app/EventEmitterElement')
var inherits = require('util').inherits

var yo = require('yo-yo')

function TitlebarView(target){
    var self = this

    EventEmitterElement.call(this, target)

    this.current_search = "";
}
inherits(TitlebarView, EventEmitterElement)

TitlebarView.prototype.updateCreateNewBtn = function(dom_el, active_note){
    // let create_new_btn = dom_el.getElementsByClassName('')[0]
    let btn = docment.getElementById('new-note-btn')
    if(active_note.getContent().length === 0){
        btn.disabled = true
        if(!btn.classList.contains("disabled")){
            btn.classList.add("disabled")
        }
    }else{
        btn.disabled = false
        if(btn.classList.contains("disabled")){
            btn.classList.remove("disabled")
        }
    }
}

TitlebarView.prototype.render = function (session) {
    var self = this
    
    function clickGraphEditor(){
        if(session.getGraphMode()){ return }
        //updateEditorToggle(this)
        self.send('transToGraphEditor')
    }
    function clickDefaultEditor(){
        if(!session.getGraphMode()){ return }
        //updateEditorToggle(this)
        self.send('transToNoteEditor')
    }

    function clickCreateNewNote(e){
        self.send('createNewNote')
    }

    function makeCreateNewBtn(project){
        if(!project){
            return
        }
        let eN = project.getEmptyNotes()
        if( eN === null){
            console.error("ERROR inconsistencies in notes")
            
            // DELETE EMPTY NOTES
            project.session.prepProjectForTrans(project)
        }
        if(eN.length === 0){ 
            // No empty note: Return normal button
            return yo`    
            <button id="new-note-btn" class="tb-btn" onclick=${clickCreateNewNote}><i class="far fa-edit"></i></button>
            `
        }else{
            if(eN.length === 1){
                // Has empty note: Return disabled button
                return yo`
                <button id="new-note-btn" class="tb-btn disabled" onclick=${clickCreateNewNote} disabled><i class="far fa-edit"></i></button>
                `
            }
        }
    }

    function clickDeleteSelectedNotes(e){
        self.send('deleteSelectedNotes')
    }

    function makeDeleteButton(project){
        if(!project){
            return
        }else{
            return yo`
                <button class="tb-btn" onclick=${clickDeleteSelectedNotes}><i class="fas fa-trash-alt"></i></button>
            `
        }
    }

    function keyupGlobalSearch(e){
        console.log("keyupGlobalSearch");
        // Change visibility of clear button
        if(self.current_search.length === 0 && this.value.length > 0){
            this.parentNode.getElementsByClassName("fa-times-circle")[0].classList.remove("hidden");
        }
        if(self.current_search.length > 0 && this.value.length === 0){
            this.parentNode.getElementsByClassName("fa-times-circle")[0].classList.add("hidden");
        }
        self.current_search = this.value;
      
        self.send("updateGlobalSearch", this.value);
    }

    function clickClearSearch(e){
        console.log("clickClearSearch");
        console.log("Reset search, current value: ");
        console.log(self.current_search);
        // Clear search input
        document.getElementById("global-search").getElementsByTagName("input")[0].value = "";
        // Clear local search state
        self.current_search = "";
        // Clear the search data in the controller/model structures
        self.send("clearGlobalSearch")
    }

    function makeSearchField(project){
        if(!project){
            return
        }else{
            return yo`
                <div id="global-search">
                    <i class="fas fa-search"></i>
                    <input class="" type="text" placeholder="Search..." onkeyup=${keyupGlobalSearch}>
                    ${function(){
                        if(self.current_search.length > 0){
                            return yo`<i class="fas fa-times-circle" onclick=${clickClearSearch}></i>`;
                        }else{
                            return yo`<i class="fas fa-times-circle hidden" onclick=${clickClearSearch}></i>`;
                        }
                    }()}
                </div>
            `
        }
    }

    function makeEditorToggle(project){
        if(!project) { return null }
        else if(project.getGraphMode()){
            return yo`<div class="tb-toggle-btn">
                <button id="tb-list-btn" class="tb-btn" onclick=${clickDefaultEditor}><i class="fas fa-list"></i></button>
                <button id="tb-graph-btn" class="tb-btn active" onclick=${clickGraphEditor}><i class="fas fa-project-diagram"></i></button>
            </div>
            `
        }else{
            return yo`<div class="tb-toggle-btn">
                <button id="tb-list-btn" class="tb-btn active" onclick=${clickDefaultEditor}><i class="fas fa-list"></i></button>
                <button id="tb-graph-btn" class="tb-btn" onclick=${clickGraphEditor}><i class="fas fa-project-diagram"></i></button>
            </div>
            `
        }
    }

    return yo`
      <header id="titlebar"><div id="drag-region">
        <div id="tb-prjct-tools">
            
        </div>
        <div id="tb-notes-tools">
            ${makeDeleteButton(session.getActiveProject())}
            ${makeCreateNewBtn(session.getActiveProject())}
        </div>
        <div id="tb-content-tools">
            <div class="toggle-btn-wrap">
                ${makeEditorToggle(session.getActiveProject())}
            </div> 

            ${makeSearchField(session.getActiveProject())}
            
        </div>
        </div> 
    </header>
    `
}

