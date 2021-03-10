module.exports = DeleteSelectedGraphsCmd

const inherits = require('util').inherits;

const Command = require('./Command');


function DeleteSelectedGraphsCmd(app){
  Command.call(this, app);
}
inherits(DeleteSelectedGraphCmd, Command);


DeleteSelectedGraphsCmd.prototype.saveBackup = function(){
  this.backup = this.app.session.getActiveProject().notes;
}

DeleteSelectedGraphCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.deleteSelectedGraphs();
}

DeleteSelectedGraphsCmd.prototype.undo = function(){

}

DeleteSelectedGraphsCmd.prototype.redo = function(){

}