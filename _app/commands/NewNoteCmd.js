module.exports = NewNoteCmd

const inherits = require('util').inherits;

const Command = require('./Command');

function NewNoteCmd(app){
  Command.call(this, app);
}
inherits(NewNoteCmd, Command);


NewNoteCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.createNewNote();
}
