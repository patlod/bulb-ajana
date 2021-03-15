module.exports = NewNoteCmd

const inherits = require('util').inherits;

const Command = require('./Command');

function NewNoteCmd(app){
  Command.call(this, app);
}
inherits(NewNoteCmd, Command);


NewNoteCmd.prototype.saveBackup = function(){
  this.backup = this.app.session.getActiveProject().makeDataBackup();
}

NewNoteCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.createNewNote();
}

NewNoteCmd.prototype.undo = function(){
  var self = this,
      aP = this.app.session.getActiveProject(),
      tmp_backup = this.backup;
  this.saveBackup();
  aP.restoreDataBackup(tmp_backup);
  if(this.app.session.getGraphMode()){
    this.app.views.graph.forceClearContentDOMEl();
  }
  this.app.render();
}

NewNoteCmd.prototype.redo = function(){
  var self = this,
      aP = this.app.session.getActiveProject(),
      tmp_backup = this.backup;
  this.saveBackup();
  aP.restoreDataBackup(tmp_backup);
  if(this.app.session.getGraphMode()){
    this.app.views.graph.forceClearContentDOMEl();
  }
  this.app.render();
}