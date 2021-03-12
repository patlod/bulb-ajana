module.exports = DeleteSelectedNotesCmd

const inherits = require('util').inherits;

const Command = require('./Command');


function DeleteSelectedNotesCmd(app){
  Command.call(this, app);
}
inherits(DeleteSelectedNotesCmd, Command);


DeleteSelectedNotesCmd.prototype.saveBackup = function(){
  this.backup = Array.from(this.app.session.getActiveProject().notes);
}

DeleteSelectedNotesCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.deleteSelectedNotes();
}

DeleteSelectedNotesCmd.prototype.undo = function(){
  var self = this;
  // Compare backup state array to the current state
  let aP = this.app.session.getActiveProject(),
      idxs = aP.notes.map(function(n){ return n.uuid}),
      chks = this.backup.filter(function(n){ 
        return idxs.indexOf(n.uuid) < 0; 
      });
  // Save backup where deleted notes are still missing
  this.saveBackup();
  if(chks.length > 0){
    aP.reviveNotes(chks);
    if(this.app.session.getGraphMode()){
      this.app.views.graph.forceClearContentDOMEl();
    }
    this.app.render();
  }
}

DeleteSelectedNotesCmd.prototype.redo = function(){
  var self = this;
  // Compare backup state array to the current state
  let aP = this.app.session.getActiveProject(),
      idxs = this.backup.map(function(n){ return n.uuid}),
      chks = aP.notes.filter(function(n){ 
        return idxs.indexOf(n.uuid) < 0; 
      });
  this.saveBackup();
  if(chks.length > 0){
    aP.deleteNotes(chks);
    if(this.app.session.getGraphMode()){
      this.app.views.graph.forceClearContentDOMEl();
    }
    this.app.render();
  }
}