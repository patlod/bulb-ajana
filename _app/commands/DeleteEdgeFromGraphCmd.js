module.exports = DeleteEdgeFromGraphCmd

const inherits = require('util').inherits;

const Command = require('./Command');


/**
 * Command class wrapping the mechanism of adding notes to a graph with 
 * drag'n'drop.
 * 
 * @param {App} app -- Instance of central App controller
 * @param {Object} params -- Object of parameters needed for executing
 */
function DeleteEdgeFromGraphCmd(app, params){
  Command.call(this, app);

  this.params = params;
}
inherits(DeleteEdgeFromGraphCmd, Command);


DeleteEdgeFromGraphCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.deleteEdgeInGraph(this.params.selectedEdge);
}
