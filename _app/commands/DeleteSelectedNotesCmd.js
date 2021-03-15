module.exports = DeleteSelectedNotesCmd

const inherits = require('util').inherits;

const Command = require('./Command');


function DeleteSelectedNotesCmd(app){
  Command.call(this, app);
}
inherits(DeleteSelectedNotesCmd, Command);


DeleteSelectedNotesCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.deleteSelectedNotes();
}
