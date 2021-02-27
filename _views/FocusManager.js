const EventEmitterElement = require('../_app/EventEmitterElement')
var inherits = require('util').inherits


const TITLEBAR_SEARCH   = 0;
const PROJECT_LIST      = 1;
const ITEM_LIST         = 2;
const NOTE_EDITOR       = 3;
const GRAPH_EDITOR      = 4;
const RIGHT_MENU        = 5;

function FocusManager(target, focus_object = null){
    var self = this

    EventEmitterElement.call(this, target)

    this.TITLEBAR_SEARCH = TITLEBAR_SEARCH;
    this.PROJECT_LIST = PROJECT_LIST;
    this.ITEM_LIST = ITEM_LIST;
    this.NOTE_EDITOR = NOTE_EDITOR;
    this.GRAPH_EDITOR = GRAPH_EDITOR;
    this.RIGHT_MENU = RIGHT_MENU;

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
  TITLEBAR_SEARCH:  TITLEBAR_SEARCH,
  PROJECT_LIST:     PROJECT_LIST,
  ITEM_LIST:        ITEM_LIST,
  NOTE_EDITOR:      NOTE_EDITOR,
  GRAPH_EDITOR:     GRAPH_EDITOR,
  RIGHT_MENU:       RIGHT_MENU,
  constructor:      FocusManager
}