module.exports = DeleteNotesCmd

const inherits = require('util').inherits;

const Command = require('./Command');


function DeleteNotesCmd(app){
  Command.call(this, app);
}
inherits(DeleteNotesCmd, Command);


DeleteNotesCmd.prototype.saveBackup = function(){
  
}

DeleteNotesCmd.prototype.execute = function(){

}

DeleteNotesCmd.prototype.undo = function(){

}

DeleteNotesCmd.prototype.redo = function(){

}