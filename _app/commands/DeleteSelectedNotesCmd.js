module.exports = DeleteSelectedNotesCmd

const inherits = require('util').inherits;

const Command = require('./Command');


function DeleteSelectedNotesCmd(app){
  Command.call(this, app);
}
inherits(DeleteSelectedNotesCmd, Command);


DeleteSelectedNotesCmd.prototype.saveBackup = function(){
  this.backup = this.app.session.getActiveProject().notes;
}

DeleteSelectedNotesCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.deleteSelectedNotes();
}

DeleteSelectedNotesCmd.prototype.undo = function(){
  this.saveBackup();
  // - Get current database state here..
  // - Compare backup notes array to the database results
  // - Delete the ones that are not in backup..
}

DeleteSelectedNotesCmd.prototype.redo = function(){
  this.saveBackup();
  // - Compare database state and backup state
  // - Delete the diff
}