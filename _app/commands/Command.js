const CommandManager = require("./CommandManager");

module.exports = Command


/**
 * 
 * @param {App} app -- Instance of the central App controller
 * @param {*} exec_cb - Callback for executing the command
 * @param {*} undo_cb - Callback for undoing the command
 * @param {*} redo_cb - Callback for redoing the command
 */
function Command(app){
  var self = this;

  this.app = app;
  this.backup = null
}

Command.prototype.saveBackup = function(){  }

Command.prototype.execute = function(){  }

Command.prototype.undo = function(){  }

Command.prototype.redo = function(){  }