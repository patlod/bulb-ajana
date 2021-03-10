module.exports = NewNoteCmd

const inherits = require('util').inherits;

const Command = require('./Command');

function NewNoteCmd(app){
  Command.call(this, app);
}
inherits(NewNoteCmd, Command);


NewNoteCmd.prototype.saveBackup = function(){
  this.backup = this.app.session.getActiveProject().notes;
}

NewNoteCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.createNewNote();
}

NewNoteCmd.prototype.undo = function(){
  var self = this;
  
  // Compare backup state array to the current state
  let aP = this.app.session.getActiveProject(),
      chks = aP.notes.filter(function(x){ return self.backup.indexOf(x) < 0; });
  console.log(chks);
  console.log(aP.notes);
  console.log(this.backup);
  if(chks.length === 1){
    // - Delete the one that are not in backup..
    aP.deleteNote(chks[0]);
    this.app.render(true);
  }
}

NewNoteCmd.prototype.redo = function(){
  this.saveBackup();
  this.app.createNewNote();
}