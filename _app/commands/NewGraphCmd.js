module.exports = NewGraphCmd

const inherits = require('util').inherits;

const Command = require('./Command');

function NewGraphCmd(app){
  Command.call(this, app);
}
inherits(NewGraphCmd, Command);


NewGraphCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.createNewGraph();
}
