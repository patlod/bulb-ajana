module.exports = DeleteSelectedVerticesFromGraphCmd

const inherits = require('util').inherits;

const Command = require('./Command');


function DeleteSelectedVerticesFromGraphCmd(app, params){
  Command.call(this, app, params);
}
inherits(DeleteSelectedVerticesFromGraphCmd, Command);


DeleteSelectedVerticesFromGraphCmd.prototype.execute = function(){
  this.saveBackup();
  // TODO
}
