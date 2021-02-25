const EventEmitterElement = require('../_app/EventEmitterElement')
var inherits = require('util').inherits


const TB_SEARCH_FIELD   = 0;
const PROJECT_THUMB     = 1;
const NOTES_THUMB       = 2;
const GRAPH_THUMB       = 3;
const NOTE_EDITOR       = 4;
const GRAPH_EDITOR      = 5; 

function FocusManager(target, focus_object = null){
    var self = this

    EventEmitterElement.call(this, target)

    this.focus_object = focus_object;
}
inherits(FocusManager, EventEmitterElement)

FocusManager.prototype.setFocusObject = function(focus_object){
  this.focus_object = focus_object;
}

FocusManager.prototype.getFocusObject = function(){
  return this.focus_object;
}

FocusManager.prototype.isFocused = function(focus_object){
  return (this.focus_object === focus_object);
}

FocusManager.prototype.clearFocusObject = function(){
  this.focus_object = null;
}

module.exports = {
  TB_SEARCH_FIELD:  TB_SEARCH_FIELD,
  PROJECT_THUMB:    PROJECT_THUMB,
  NOTES_THUMB:      NOTES_THUMB,
  GRAPH_THUMB:      GRAPH_THUMB,
  NOTE_EDITOR:      NOTE_EDITOR,
  GRAPH_EDITOR:     GRAPH_EDITOR,
  constructor:      FocusManager
}