module.exports = EventEmitterElement;

var inherits = require('util').inherits;
var EE = require('events').EventEmitter;

function EventEmitterElement (target) {
  EE.call(this);     // JS inheritance pattern.
  this.target = target || null;
}
inherits(EventEmitterElement, EE);

EventEmitterElement.prototype.send = function () {
  if (this.target && typeof this.target.emit === 'function') {
    this.target.emit.apply(this.target, arguments);
  }
}