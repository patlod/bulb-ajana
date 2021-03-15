module.exports = DeleteVertexFromGraphCmd

const inherits = require('util').inherits;

const Command = require('./Command');


/**
 * Command class wrapping the mechanism of adding notes to a graph with 
 * drag'n'drop.
 * 
 * @param {App} app -- Instance of central App controller
 * @param {Object} params -- Object of parameters needed for executing
 */
function DeleteVertexFromGraphCmd(app, params){
  Command.call(this, app);

  this.params = params;
}
inherits(DeleteVertexFromGraphCmd, Command);


DeleteVertexFromGraphCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.deleteVertexInGraph(this.params.selectedVertex);
}
