module.exports = DeleteEdgeFromGraphCmd

const inherits = require('util').inherits;

const Command = require('./Command');


/**
 * Command class wrapping the mechanism of adding notes to a graph with 
 * drag'n'drop.
 * 
 * @param {App} app -- Instance of central App controller
 * @param {Object} params -- Object of parameters needed for executing
 */
function DeleteEdgeFromGraphCmd(app, params){
  Command.call(this, app);

  this.params = params;
}
inherits(DeleteEdgeFromGraphCmd, Command);


DeleteEdgeFromGraphCmd.prototype.saveBackup = function(){
  this.backup = this.app.session.getActiveProject().makeDataBackup();
}

DeleteEdgeFromGraphCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.deleteEdgeInGraph(this.params.selectedEdge);
}

DeleteEdgeFromGraphCmd.prototype.undo = function(){
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

DeleteEdgeFromGraphCmd.prototype.redo = function(){
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