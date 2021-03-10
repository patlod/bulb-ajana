module.exports = NewNoteCmd

const inherits = require('util').inherits;

const Command = require('./Command');

function NewNoteCmd(app){
  Command.call(this, app);
}
inherits(NewNoteCmd, Command);


NewNoteCmd.prototype.saveBackup = function(){

}

NewNoteCmd.prototype.execute = function(){

}

NewNoteCmd.prototype.undo = function(){

}

NewNoteCmd.prototype.redo = function(){

}