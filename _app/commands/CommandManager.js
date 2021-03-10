module.exports = CommandManager

const Stack = require('../../_util/Stack');

function CommandManager(){
  var self = this;

  this.undo_stack = new Stack();
  this.redo_stack = new Stack();
}

CommandManager.prototype.clearHistory = function(){
  this.undo_stack = new Stack();
  this.redo_stack = new Stack();
}

CommandManager.prototype.executeCmd = function(cmd){
  this.redo_stack = new Stack();
  cmd.execute();
  this.undo_stack.push(cmd);
}

CommandManager.prototype.undo = function(){
  console.log("CommandManager: undo()");
  if(this.undo_stack.isEmpty()){
    return;
  }
  this.undo_stack.top().undo();
  this.redo_stack.push(this.undo_stack.top());
  this.undo_stack.pop();
}

CommandManager.prototype.redo = function(){
  console.log("CommandManager: redo()");
  if(this.redo_stack.isEmpty()){
    return;
  }
  this.redo_stack.top().redo();
  this.undo_stack.push(this.redo_stack.top());
  this.redo_stack.pop();
}