module.exports = NewNoteFromGraphCmd

const inherits = require('util').inherits;

const Command = require('./Command');


function NewNoteFromGraphCmd(app, params){
  Command.call(this, app, params);
}
inherits(NewNoteFromGraphCmd, Command);


NewNoteFromGraphCmd.prototype.execute = function(){
  this.saveBackup();
  self.app.createNewNoteVertexGraph(this.params.coords);
}
