module.exports = NewEdgeGraphCmd

const inherits = require('util').inherits;

const Command = require('./Command');


/**
 * Command class wrapping the mechanism of adding notes to a graph with 
 * drag'n'drop.
 * 
 * @param {App} app -- Instance of central App controller
 * @param {Object} params -- Object of parameters needed for executing
 */
function NewEdgeGraphCmd(app, params){
  Command.call(this, app);

  this.params = params;
}
inherits(NewEdgeGraphCmd, Command);


NewEdgeGraphCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.createNewEdgeInGraph(this.params.vPair);
}
