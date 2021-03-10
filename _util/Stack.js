module.exports = Stack

function Stack(){
  this.items = [];
}

Stack.prototype.top = function(){
  return this.items[this.items.length - 1];
}

Stack.prototype.push = function(item){
  this.items.push(item);
}

Stack.prototype.pop = function(){
  return this.items.pop();
}

Stack.prototype.isEmpty = function(){
  return (this.items.length === 0);
}

