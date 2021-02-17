module.exports = TextSearchIterator

const ASCENDING = 1;
const DESCENDING = 0;

function TextSearchIterator(needle, haystack, results) {
  this.haystack = haystack;
  this.needle = needle;
  this.results = results;
  this.index = 0;
  this.direction = ASCENDING;
}

TextSearchIterator.prototype.toggleIndexDirection = function(){
  if(this.direction === ASCENDING){
    this.direction = DESCENDING;
    // Adjust the index
    this.index -= 2;
    if(this.index < 0){
      this.index = ( this.results.length + this.index ) % this.results.length;
    }
  }else{
    if(this.direction === DESCENDING){
      this.direction = ASCENDING;
      this.index = (this.index + 2) % this.results.length;
    }
  }
}
TextSearchIterator.prototype.next__Ring = function(){
  if(this.direction === DESCENDING){
    this.toggleIndexDirection();
  }
  let res = this.results[this.index];
  this.index = (++this.index) % this.results.length;
  return res;
}

TextSearchIterator.prototype.prev__Ring = function(){
  if(this.direction === ASCENDING){
    this.toggleIndexDirection();
  }
  let res = this.results[this.index];
  --this.index;
  if(this.index < 0){
    this.index = ( this.results.length + this.index ) % this.results.length;
  }
  return res;
}

TextSearchIterator.prototype.size = function(){
  return this.results.length;
}

TextSearchIterator.prototype.getResults = function(){
  return this.results;
}

TextSearchIterator.prototype.resetIndex = function(){
  this.index = 0;
}

// TextSearchIterator.prototype.next__Linear = function(){
//   if(this.direction === 0){
//     ++this.index;
//     this.direction = 1; 
//   }  
//   return (this.index < this.results.length) ? this.results[this.index++] : null;
  
// }
// TextSearchIterator.prototype.prev__Linear = function(){
//   if(this.direction === 1){
//     this.index = Math.abs(--this.index) % this.results.length;
//     this.direction = 0; 
//   }
//   return (this.index  1 >= 0) ? this.results[this.index--] : null;
// }
