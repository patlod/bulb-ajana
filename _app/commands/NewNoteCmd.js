module.exports = NewNoteCmd

const inherits = require('util').inherits;

const Command = require('./Command');

function NewNoteCmd(app){
  Command.call(this, app);
}
inherits(NewNoteCmd, Command);


NewNoteCmd.prototype.saveBackup = function(){
  this.backup = Array.from(this.app.session.getActiveProject().notes);
}

NewNoteCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.createNewNote();
}

NewNoteCmd.prototype.undo = function(){
  var self = this;
  // Compare backup state array to the current state
  let aP = this.app.session.getActiveProject(),
      idxs = this.backup.map(function(n){ return n.uuid}),
      chks = aP.notes.filter(function(n){ 
        return idxs.indexOf(n.uuid) < 0; 
      });

  console.log(chks);
  if(chks.length === 1){
    // - Delete the one that's not in backup..
    aP.deleteNotes(chks);
    this.app.render(true);
  }
}

NewNoteCmd.prototype.redo = function(){
  this.saveBackup();
  this.app.createNewNote();
}