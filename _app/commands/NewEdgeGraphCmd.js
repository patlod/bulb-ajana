module.exports = NewEdgeGraphCmd

const inherits = require('util').inherits;

const Command = require('./Command');


function NewEdgeGraphCmd(app, params){
  Command.call(this, app, params);
}
inherits(NewEdgeGraphCmd, Command);


NewEdgeGraphCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.createNewEdgeInGraph(this.params.vPair);
}
