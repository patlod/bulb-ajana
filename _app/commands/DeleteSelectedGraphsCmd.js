module.exports = DeleteSelectedGraphsCmd

const inherits = require('util').inherits;

const Command = require('./Command');


function DeleteSelectedGraphsCmd(app){
  Command.call(this, app);
}
inherits(DeleteSelectedGraphsCmd, Command);


DeleteSelectedGraphsCmd.prototype.saveBackup = function(){
  this.backup = Array.from(this.app.session.getActiveProject().graphs);
}

DeleteSelectedGraphsCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.deleteSelectedGraphs();
}

DeleteSelectedGraphsCmd.prototype.undo = function(){
  var self = this;
  // Compare backup state array to the current state
  // let aP = this.app.session.getActiveProject(),
  //     idxs = aP.graphs.map(function(g){ return g.uuid}),
  //     chks = this.backup.filter(function(g){ 
  //       return idxs.indexOf(g.uuid) < 0; 
  //     });
  let aP = this.app.session.getActiveProject(),
      tmp_backup = this.backup;
  // Save backup where deleted notes are still missing
  this.saveBackup();
  // if(chks.length > 0){
  //   aP.reviveGraphs(chks);
  //   if(this.app.session.getGraphMode()){
  //     this.app.views.graph.forceClearContentDOMEl();
  //   }
  //   this.app.render();
  // }
  aP.restoreDataBackup(tmp_backup);
  if(this.app.session.getGraphMode()){
    this.app.views.graph.forceClearContentDOMEl();
  }
  this.app.render();
}

DeleteSelectedGraphsCmd.prototype.redo = function(){
  var self = this;
  // Compare backup state array to the current state
  // let aP = this.app.session.getActiveProject(),
  //     idxs = this.backup.map(function(g){ return g.uuid}),
  //     chks = aP.graphs.filter(function(g){ 
  //       return idxs.indexOf(g.uuid) < 0; 
  //     });
  let aP = this.app.session.getActiveProject(),
      tmp_backup = this.backup;
  this.saveBackup();
  // if(chks.length > 0){
  //   aP.deleteGraphs(chks);
  //   if(this.app.session.getGraphMode()){
  //     this.app.views.graph.forceClearContentDOMEl();
  //   }
  //   this.app.render();
  // }
  aP.restoreDataBackup(tmp_backup);
  if(this.app.session.getGraphMode()){
    this.app.views.graph.forceClearContentDOMEl();
  }
  this.app.render();
}