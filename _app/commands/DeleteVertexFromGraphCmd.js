module.exports = DeleteVertexFromGraphCmd

const inherits = require('util').inherits;

const Command = require('./Command');



function DeleteVertexFromGraphCmd(app, params){
  Command.call(this, app, params);
}
inherits(DeleteVertexFromGraphCmd, Command);


DeleteVertexFromGraphCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.deleteVertexInGraph(this.params.selectedVertex);
}
