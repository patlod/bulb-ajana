module.exports = DeleteSelectedGraphsCmd

const inherits = require('util').inherits;

const Command = require('./Command');


function DeleteSelectedGraphsCmd(app){
  Command.call(this, app);
}
inherits(DeleteSelectedGraphsCmd, Command);


DeleteSelectedGraphsCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.deleteSelectedGraphs();
}
