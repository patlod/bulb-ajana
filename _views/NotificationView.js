module.exports = NotificationView;

const EventEmitterElement = require('../_app/EventEmitterElement');
const inherits = require('util').inherits;

const yo = require('yo-yo');
const { v4: uuidv4 } = require('uuid')

function NotificationView(target, focus_manager) {
  var self = this;
  EventEmitterElement.call(this, target);
  this.app = target;

  this.INFO = 0;
  this.WARNING = 1;
  this.ERROR = 2;

  /* 
   * Holds objects like:
   * {
   *   uuid: uuid,
   *   type: { this.INFO | this.WARNING | this.ERROR },
   *   msg: "Message here..",
   *   src: "path/to/origin",
   *   action_btns: [
   *      {
   *        name: "Button 1",
   *        callback: () => {},
   *      }
   *   ]
   * }
   * 
   * NOTE: When notification is closed it is deleted from the array.
   */
  this.test_notifs = [
    {
      uuid: uuidv4(),
      type: this.INFO,
      msg: "INFO: Message here..",
      src: "path/to/origin",
      action_btns: [
        {
          name: "Button 1",
          callback: () => {
            console.log("Btn click info alert");
          },
        }
      ]
    },
    {
      uuid: uuidv4(),
      type: this.WARNING,
      msg: "WARNING: Message here..",
      src: "path/to/origin",
      action_btns: [
        {
          name: "Yes",
          callback: () => {
            console.log("'Yes' click warning alert");
          },
        },
        {
          name: "No",
          callback: () => {
            console.log("'No' click warning alert");
          },
        }
      ]
    },
    {
      uuid: uuidv4(),
      type: this.ERROR,
      msg: "ERROR: Message here..",
      src: "path/to/origin",
      action_btns: [
        {
          name: "Ok",
          callback: () => {
            console.log("'Ok' click warning alert");
          },
        }
      ]
    }
  ]
  this.notifications = [];
}
inherits(NotificationView, EventEmitterElement);


/**
 * Returns the HTML format for the notification
 * 
 * Types of notifications
 */
NotificationView.prototype.addNotification = function(type, msg="", src="", actions=[]){
  this.notifications.push({
    uuid: uuidv4(),
    type: type,
    msg: msg,
    src: src,
    action_btns: actions
  });
  console.log("Added notification");
}

NotificationView.prototype.removeNotification = function(uuid){
  for(var i in this.notifications){
    if(this.notifications[i].uuid === uuid){
      this.notifications.splice(i, 1);
      return;
    }
  }
}

// NotificationView.prototype.removeNotificationTEST = function(uuid){
//   for(var i in this.test_notifs){
//     if(this.test_notifs[i].uuid === uuid){
//       this.test_notifs.splice(i, 1);
//       return;
//     }
//   }
// }

NotificationView.prototype.render = function(test = false){
  let self = this,
      thumbs, btns;

  function clickCloseNotif(e){
    if(test){
      self.removeNotificationTEST($(this).parent().attr('data-id'));
    }else{
      self.removeNotification($(this).parent().attr('data-id'));
    }
    
    self.send('renderLazy');
  }

  if(test){
    thumbs = self.test_notifs.map(function(n){
      return yo`
        <div class="notification" data-id="${n.uuid}">
          <span class="close" onclick=${clickCloseNotif}>
            <i class="fas fa-times"></i>
          </span>
          <div class="content">
            <div class="row">
              <div class="col-1">
                ${function(){
                  switch(n.type){
                    case self.WARNING:
                      return yo`<i class="fas fa-exclamation-circle"></i>`;
                      break;
                    case self.ERROR:
                      return yo`<i class="fas fa-times-circle"></i>`;
                      break;
                    case self.INFO:
                      return yo`<i class="fas fa-info-circle"></i>`;
                      break;
                  }
                }()}
                
              </div>
              <div class="col-2">
                <span class="msg">${n.msg}</span>
                <span class="src">${n.src}</span>
              </div>
            </div>    
          </div>
          <div class="ctrls">
            ${function(){
              btns = n.action_btns.map(function(b){
                const cb = b.callback;
                return yo`<span class="btn" onclick=${cb}>${b.name}</span>`;
              });
              return btns;
            }()}
          </div>
        </div>
      `;
    });
  }else{
    thumbs = self.notifications.map(function(n){
      return yo`
        <div class="notification" data-id="${n.uuid}">
          <span class="close" onclick=${clickCloseNotif}>
            <i class="fas fa-times"></i>
          </span>
          <div class="content">
            <div class="row">
              <div class="col-1">
                ${function(){
                  switch(n.type){
                    case self.WARNING:
                      return yo`<i class="fas fa-exclamation-circle"></i>`;
                      break;
                    case self.ERROR:
                      return yo`<i class="fas fa-times-circle"></i>`;
                      break;
                    case self.INFO:
                      return yo`<i class="fas fa-info-circle"></i>`;
                      break;
                  }
                }()}
                
              </div>
              <div class="col-2">
                <span class="msg">${n.msg}</span>
                <span class="src">${n.src}</span>
              </div>
            </div>    
          </div>
          <div class="ctrls">
            ${function(){
              btns = n.action_btns.map(function(b){
                const cb = b.callback;
                return yo`<span class="btn" onclick=${cb}>${b.name}</span>`;
              });
              return btns;
            }()}
          </div>
        </div>
      `;
    });
  }

  console.log(thumbs);

  var ret = yo`
    <div class="notification-list hidden">
      ${thumbs}
    </div>
  `;

  console.log(ret)

  return ret;
}