const CommandManager = require("./CommandManager");

module.exports = Command


/**
 * 
 * Command class serves more or less as template or abstract class
 * for the actual commands, so that the core structure of the commands
 * is implemented at a central place.
 * 
 * @param {App} app -- Instance of the central App controller
 */
function Command(app){
  var self = this;

  this.app = app;
  this.backup = null
}

Command.prototype.saveBackup = function(){ 
  this.backup = this.app.session.getActiveProject().makeDataBackup();
}

Command.prototype.execute = function(){  }

Command.prototype.undo = function(){
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

Command.prototype.redo = function(){ 
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