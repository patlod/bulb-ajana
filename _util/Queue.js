module.exports = Queue


function Queue(type = 'string', capacity = 6, items = []){

  this.type = type;
  // Variables
  this.capacity = capacity;
  if(items.length > capacity){
    return;
  }
  for(var i in items){
    if(typeof items[i] !== type){
      return;
    }
  }
  this.items = items;

  // Methods
  this.getItem = function(index){
    if(index < 0 || index > this.items.length){
      return null;
    }
    return this.items[index];
  }

  this.getAllItems = function(){
    return this.items;
  }

  this.addItem = function(val){
    let index = this.items.indexOf(val);

    if(index >= 0){
      // Remove old
      this.items.splice(index,1);
      // Reinsert as most recent
      this.items.unshift(val);
    }else{
      this.items.unshift(val);
        if(this.items.length > this.capacity){
          this.items.pop();
        }
    }
  }

  this.resetItems = function(items){
    if(items !== null && items.isArray()){
      this.items = items;
    }
    
  }
  
  this.removeItem = function(val){
    if(typeof val !== 'string'){
      console.error('Parameter value must be of type string');
      return;
    }

    for(var i in this.items){
      if(this.items[i].localeCompare(val)){
        return this.items.splice(i,1);
      }
    }
  }

  this.getLength = function(){
    return this.items.length;
  }

  this.getMaxCapacity = function(){
    return this.capacity;
  }

  
}