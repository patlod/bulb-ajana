module.exports = DnDAddNotesToGraphCmd

const inherits = require('util').inherits;

const Command = require('./Command');


function DnDAddNotesToGraphCmd(app, params){
  Command.call(this, app, params);
}
inherits(DnDAddNotesToGraphCmd, Command);


DnDAddNotesToGraphCmd.prototype.execute = function(){
  this.saveBackup();
  self.app.addNotesToGraphDnD(this.params.graph, this.params.notes, this.params.position);
}
