module.exports = NewGraphCmd

const inherits = require('util').inherits;

const Command = require('./Command');

function NewGraphCmd(app){
  Command.call(this, app);
}
inherits(NewGraphCmd, Command);


NewGraphCmd.prototype.saveBackup = function(){
  this.backup = this.app.session.getActiveProject().notes;
}

NewGraphCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.createNewGraph();
}

NewGraphCmd.prototype.undo = function(){
  // - Get current database state here..
  // - Compare backup notes array to the database results
  // - Delete the ones that are not in backup..
}

NewGraphCmd.prototype.redo = function(){
  this.saveBackup();
  this.app.createNewGraph();
}