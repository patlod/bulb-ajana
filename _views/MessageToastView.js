module.exports = MessageToastView;

function MessageToastView(target, focus_manager) {
  var self = this;
  EventEmitterElement.call(this, target);
  this.app = target;


}
inherits(MessageToastView, EventEmitterElement);


/**
 * Returns the HTML format for the toast
 */
MessageToastView.prototype.getToastTemplate = function(){
  // TODO
  // - Depending on the condition (warning, info, etc. similar as with electron popups) 
  //   adjust the background color or used symbols
  // - Maybe also format content differently according to conditions.
}


MessageToastView.prototype.showMessage = function(message){
  // TODO
  // Show at fixed position.
  // Question how to show multiple Toasts just like in VSCode..
}

MessageToastView.prototype.hideMessage = function(message){
  // TODO
}