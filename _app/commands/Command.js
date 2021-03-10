const CommandHistory = require("./CommandHistory");

module.exports = CommandHistory

function Command(app, exec_cb, undo_cb){
  var self = this;

  this.app = app;

  this.cb__execute = exec_cb;
  this.cb__undo = undo_cb;
}

Command.prototype.execute = function(){

}

Command.prototype.undo = function(){
  
}