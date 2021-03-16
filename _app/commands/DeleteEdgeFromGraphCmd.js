module.exports = DeleteEdgeFromGraphCmd

const inherits = require('util').inherits;

const Command = require('./Command');


function DeleteEdgeFromGraphCmd(app, params){
  Command.call(this, app, params);
}
inherits(DeleteEdgeFromGraphCmd, Command);


DeleteEdgeFromGraphCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.deleteEdgeInGraph(this.params.selectedEdge);
}
