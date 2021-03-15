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

Command.prototype.saveBackup = function(){  }

Command.prototype.execute = function(){  }

Command.prototype.undo = function(){  }

Command.prototype.redo = function(){  }