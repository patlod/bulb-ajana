module.exports = NewGraphCmd

const inherits = require('util').inherits;

const Command = require('./Command');

function NewGraphCmd(app){
  Command.call(this, app);
}
inherits(NewGraphCmd, Command);


NewGraphCmd.prototype.saveBackup = function(){
  this.backup = Array.from(this.app.session.getActiveProject().graphs);
}

NewGraphCmd.prototype.execute = function(){
  this.saveBackup();
  this.app.createNewGraph();
}

NewGraphCmd.prototype.undo = function(){
  var self = this;
  // Compare backup state array to the current state
  let aP = this.app.session.getActiveProject(),
      idxs = this.backup.map(function(g){ return g.uuid}),
      chks = aP.graphs.filter(function(g){ 
        return idxs.indexOf(g.uuid) < 0; 
      });
  if(chks.length === 1){
    // Delete the one that's not in backup..
    aP.deleteGraphs(chks);
    this.app.render(true);
  }
}

NewGraphCmd.prototype.redo = function(){
  this.saveBackup();
  this.app.createNewGraph();
}