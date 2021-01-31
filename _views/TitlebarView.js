module.exports = TitlebarView

const EventEmitterElement = require('../_app/EventEmitterElement')
var inherits = require('util').inherits

var yo = require('yo-yo')

function TitlebarView(target){
    var self = this

    EventEmitterElement.call(this, target)
}
inherits(TitlebarView, EventEmitterElement)

/**
 * TODO:
 *  - Create new note button and delete note button 
 *      - ONLY WHEN PROJECT IS SELECTED
 *          - Disactivate the buttons when no project is selected.
 *  - Search
 *      - ONLY WHEN ONE OR MORE PROJECTS ARE OPENED
 *  - Toggle List|Graph
 *      - ONLY WHEN A PROJECT IS SELECTED
 */


TitlebarView.prototype.updateCreateNewBtn = function(dom_el, active_note){
    // let create_new_btn = dom_el.getElementsByClassName('')[0]
    let btn = document.getElementById('new-note-btn')
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
    /**
     * TODO: Define event handler functions here and embedded them in html string
     */
    function clickGraphEditor(){
        if(session.getGraphMode()){ return }
        self.send('transToGraphEditor')
    }
    function clickDefaultEditor(){
        if(!session.getGraphMode()){ return }
        self.send('transToNoteEditor')
    }

    function clickCreateNewNote(e){
        self.send('createNewNote')
    }

    function clickDeleteSelectedNotes(e){
        self.send('deleteSelectedNotes')
    }

    function triggerSearch(e){
        // TODO...
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

    function makeDeleteButton(project){
        if(!project){
            return
        }else{
            return yo`
                <button class="tb-btn" onclick=${clickDeleteSelectedNotes}><i class="fas fa-trash-alt"></i></button>
            `
        }
    }

    function makeSearchField(project){
        if(!project){
            return
        }else{
            return yo`
                <div id="search">
                    <i class="fas fa-search"></i>
                    <input class="" type="text" placeholder="Search...">
                </div>
            `
        }
    }

    function makeColorPaletteDropdown(project){
        if(!project){
            return
        }else{
            if(!project.getGraphMode()){

                let rules, rule, i, j, key;
                let lessRules = [],
                    targetSheet = null;

                for(i = 0; i < document.styleSheets.length; i++){ 
                    let sHref = document.styleSheets[i].href.split("/")
                    if(sHref[sHref.length - 1] === "main.css"){
                        targetSheet = document.styleSheets[i]
                    }
                }
                if(targetSheet !== null){
                    rules = targetSheet.cssRules;
                    for (j = 0; j < rules.length; j++) {
                        rule = rules[j];
                        if (rules[j].selectorText.indexOf('postit-bg-') !== -1) {
                            key = rules[j].selectorText// /postit-bg-(.*)/.exec(rules[j].selectorText)[1];
                            //lessRules[key] = rule.style['background'];
                            lessRules.push(key)
                        }
                    }
                }

                let items_html = []
                let el = null
                lessRules.map(function(x, idx){
                    el = yo` 
                        <div class="item">
                            <span class="color-pickr-circle ${x.substring(1)}"></span>
                        </div>
                    `
                    items_html.push(el)
                    if((idx + 1) % 5 === 0){
                        items_html.push(yo`<div class="divider"></div>`)
                    }
                    
                })
                
                 
                return yo`
                <div id="note-color-dp" class="ui floated dropdown">
                    <i class="fas fa-palette"></i>
                    <i class="dropdown icon"></i>
                    
                    <div class="menu">
                        <div class="header">
                            <i class="fas fa-paint-roller"></i>
                            Note Color
                        </div>
                        <div class="menu scrolling">
                            ${items_html}
                        </div>
                    </div>
                </div>
                `
            }
        }
    }


    return yo`
      <header id="titlebar"><div id="drag-region">
        <div id="tb-prjct-tools">
            <div class="tb-toggle-btn">
            <button id="tb-list-btn" class="tb-btn" onclick=${clickDefaultEditor}><i class="fas fa-list"></i></button>
            <button id="tb-graph-btn" class="tb-btn" onclick=${clickGraphEditor}><i class="fas fa-project-diagram"></i></button>
            </div>
        </div>
        <div id="tb-notes-tools">
            ${makeDeleteButton(session.getActiveProject())}
            ${makeCreateNewBtn(session.getActiveProject())}
        </div>
        <div id="tb-content-tools">
            
            ${makeSearchField(session.getActiveProject())}
            ${makeColorPaletteDropdown(session.getActiveProject())}
        </div>
        </div> 
    </header>
    `
}
