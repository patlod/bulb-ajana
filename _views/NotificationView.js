module.exports = NotificationView;

const EventEmitterElement = require('../_app/EventEmitterElement');
const inherits = require('util').inherits;

const yo = require('yo-yo');

function NotificationView(target, focus_manager) {
  var self = this;
  EventEmitterElement.call(this, target);
  this.app = target;


}
inherits(NotificationView, EventEmitterElement);


/**
 * Returns the HTML format for the notification
 * 
 * Types of notifications
 */
NotificationView.prototype.makeNotificationTemplate = function(){
  // TODO
  // - Depending on the condition (warning, info, etc. similar as with electron popups) 
  //   adjust the background color or used symbols
  // - Maybe also format content differently according to conditions.
}


NotificationView.prototype.showMessage = function(message){
  // TODO
  // Show at fixed position.
  // Question how to show multiple notifications just like in VSCode..
}

NotificationView.prototype.hideMessage = function(message){
  // TODO
}


NotificationView.prototype.render = function(){
  // <i class="fas fa-times"></i>
  return yo`
    <div class="notification-list">
      <div class="notification">
        <span class="close"><i class="fas fa-times"></i></span>
        <div class="content">
          <div class="row">
            <div class="col-1">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="col-2">
              <span class="msg">Warning message here..</span>
              <span class="src">path/to/somewhere</span>
            </div>
          </div>    
        </div>
        <div class="ctrls">
          <span class="btn">No</span>
          <span class="btn">Yes</span>
        </div>
      </div>

      <div class="notification">
        <span class="close"><i class="fas fa-times"></i></span>
        <div class="content">
          <div class="row">
            <div class="col-1">
              <i class="fas fa-times-circle"></i>
            </div>
            <div class="col-2">
              <span class="msg">Error message here.. </span>
              <span class="src">path/to/somewhere</span>
            </div>
          </div>    
        </div>
        <div class="ctrls">
          <span class="btn">No</span>
          <span class="btn">Yes</span>
        </div>
      </div>
      
      <div class="notification">
        <span class="close"><i class="fas fa-times"></i></span>
        <div class="content">
          <div class="row">
            <div class="col-1">
              <i class="fas fa-info-circle"></i>
            </div>
            <div class="col-2">
              <span class="msg">Info message here..jsdk sjd asf afasd sadfa lsdjk lkdsjlk lkdsjkl fdslkj fjfjfk ldfjj</span>
              <span class="src">path/to/somewhere</span>
            </div>
          </div>    
        </div>
        <div class="ctrls">
          <span class="btn">No</span>
          <span class="btn">Yes</span>
        </div>
      </div>

    </div>
  `;
}