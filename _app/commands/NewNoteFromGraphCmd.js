module.exports = NewNoteFromGraphCmd

const inherits = require('util').inherits;

const Command = require('./Command');


/**
 * Command class wrapping the mechanism of adding notes to a graph with 
 * drag'n'drop.
 * 
 * @param {App} app -- Instance of central App controller
 * @param {Object} params -- Object of parameters needed for executing
 */
function NewNoteFromGraphCmd(app, params){
  Command.call(this, app);

  this.params = params;
}
inherits(NewNoteFromGraphCmd, Command);


NewNoteFromGraphCmd.prototype.execute = function(){
  this.saveBackup();
  self.app.createNewNoteVertexGraph(this.params.coords);
}
