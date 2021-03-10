module.exports = CommandStackAPI

const CommandManager = require('./CommandManager');
const Command = require('./Command');

function CommandStackAPI(){
  this.command_manager = new CommandManager();
}