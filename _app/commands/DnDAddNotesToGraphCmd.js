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


DnDAddNotesToGraphCmd.prototype.saveBackup = function(){
  this.backup = this.app.session.getActiveProject().makeDataBackup();
}

DnDAddNotesToGraphCmd.prototype.execute = function(){
  this.saveBackup();
  self.app.addNotesToGraphDnD(this.params.graph, this.params.notes, this.params.position);
}

DnDAddNotesToGraphCmd.prototype.undo = function(){
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

DnDAddNotesToGraphCmd.prototype.redo = function(){
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