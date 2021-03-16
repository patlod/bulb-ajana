module.exports = AddSelectedNotesToGraphCmd

const inherits = require('util').inherits;

const Command = require('./Command');


function AddSelectedNotesToGraphCmd(app, params){
  Command.call(this, app, params);
}
inherits(AddSelectedNotesToGraphCmd, Command);


AddSelectedNotesToGraphCmd.prototype.saveBackup = function(){
  this.backup = this.app.session.getActiveProject().makeDataBackup();
}

AddSelectedNotesToGraphCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.addSelectedNotesToGraph();
}

AddSelectedNotesToGraphCmd.prototype.undo = function(){
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

AddSelectedNotesToGraphCmd.prototype.redo = function(){
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