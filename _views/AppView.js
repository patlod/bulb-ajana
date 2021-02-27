module.exports = AppView

const EventEmitterElement = require('../_app/EventEmitterElement')
var inherits = require('util').inherits

var yo = require('yo-yo')

function AppView(target, focus_manager){
    var self = this;
    EventEmitterElement.call(this, target);

    this.focus_manager = focus_manager;

    this.ctrlOrCmdKey_active = false;
    this.shiftKey_active = false;
}
inherits(AppView, EventEmitterElement)


AppView.prototype.ctrlOrCmdActive = function(){
  return this.ctrlOrCmdKey_active;
}

AppView.prototype.shiftActive = function(){
  return this.shiftKey_active;
}

AppView.prototype.render = function(){
  var self = this;
  window.addEventListener('keydown', function(e){
    // console.log("event:");
    // console.log(e);
    // console.log("e.key");
    // console.log(e.key);
    // console.log("e.keyCode");
    // console.log(e.keyCode);
    // console.log("e.metaKey");
    // console.log(e.metaKey);
    // console.log("e.shiftKey");
    // console.log(e.shiftKey);
    if(e.key === "Shift"){
      self.shiftKey_active = true;
    }
    if(process.platform === 'darwin' || process.platform === 'linux' ){
      if(e.key === "Meta"){
        self.ctrlOrCmdKey_active = true;
      }
    }else{
      if(process.platform === 'win32'){
        if(e.key === "Control"){
          self.ctrlOrCmdKey_active = true;
        }
      }
    }
    if(e.key === "ArrowUp"){
      e.preventDefault();
      if(self.shiftKey_active){
        self.send('arrowShiftSelectToHead');
      }else{
        self.send('arrowNavigationToHead');
      }
    }else if(e.key === "ArrowDown"){
      e.preventDefault();
      if(self.shiftKey_active){
        self.send('arrowShiftSelectToTail');
      }else{
        self.send('arrowNavigationToTail');
      }
    }else{
      // Nothing
    }
  });

  window.addEventListener('keyup', function(e){
    // console.log("event:");
    // console.log(e);
    // console.log("e.key");
    // console.log(e.key);
    // console.log("e.keyCode");
    // console.log(e.keyCode);
    // console.log("e.metaKey");
    // console.log(e.metaKey);
    // console.log("e.shiftKey");
    // console.log(e.shiftKey);
    if(e.key === "Shift"){
      self.shiftKey_active = false;
    }
    if(process.platform === 'darwin' || process.platform === 'linux' ){
      if(e.key === "Meta"){
        self.ctrlOrCmdKey_active = false;
      }
    }else{
      if(process.platform === 'win32'){
        if(e.key === "Control"){
          self.ctrlOrCmdKey_active = false;
        }
      }
    }
  });
}