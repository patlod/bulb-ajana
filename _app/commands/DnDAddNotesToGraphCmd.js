module.exports = DnDAddNotesToGraphCmd

const inherits = require('util').inherits;

const Command = require('./Command');


/**
 * Command class wrapping the mechanism of adding notes to a graph with 
 * drag'n'drop.
 * 
 * @param {App} app -- Instance of central App controller
 * @param {Object} params -- Object of parameters needed for executing
 */
function DnDAddNotesToGraphCmd(app, params){
  Command.call(this, app);

  this.params = params;
}
inherits(DnDAddNotesToGraphCmd, Command);


DnDAddNotesToGraphCmd.prototype.execute = function(){
  this.saveBackup();
  self.app.addNotesToGraphDnD(this.params.graph, this.params.notes, this.params.position);
}
