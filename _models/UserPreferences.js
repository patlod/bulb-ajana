module.exports = UserPreferences

const AppStorageManager = require('./AppStorageManager')
const inherits = require('util').inherits



function UserPreferences(path){
  var self = this;
  AppStorageManager.call(this, path);
}
inherits(UserPreferences, AppStorageManager)


UserPreferences.prototype.createNewProperty = function(key, value){
  // TODO: Insert (key, value) pair into database
}