module.exports = ConfigurationManager

const app = require('electron').remote.app

// Filenames of app storage database files
const FN_USER_PREFERENCES = "user-preferences.json"
const FN_GLOBAl_DATA = "global-data.json"

function ConfigurationManager(){
  var self = this

  /**
   * Returns the directory where app data is stored depending on the platform.
   * - Windows:   %APPDATA%   
   * - Linux:     $XDG_CONFIG_HOME or ~/.config
   * - Darwin:    ~/Library/Application Support
   */
  this.getAppDataDir = function(){
    return app.getPath('appData')
  }

  this.getUserPreferencesPath = function(){
    switch(process.platform) {
      case 'darwin': {
        return this.getAppDataDir() + "/" + app.getName() + "/" + FN_USER_PREFERENCES;
      }/*
      case 'win32': {
        return path.join(process.env.APPDATA, ...);
      }
      case 'linux': {
        return path.join(process.env.HOME, ...);
      }*/
    }
    
  }

  this.getGlobalDataPath = function(){
    switch(process.platform) {
      case 'darwin': {
        return this.getAppDataDir() + "/" + app.getName() + "/" + FN_GLOBAl_DATA
      }/*
      case 'win32': {
        return path.join(process.env.APPDATA, ...);
      }
      case 'linux': {
        return path.join(process.env.HOME, ...);
      }*/
    }
    
  }
}