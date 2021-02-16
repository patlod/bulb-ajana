module.exports = TextSearchIterator

function TextSearchIterator(needle, haystack, results) {
  this.haystack = haystack;
  this.needle = needle;
  this.results = results;
  this.index = 0;
}

TextSearchIterator.prototype.next__Linear = function(){
  return (this.index < this.results.length) ? this.results[this.index++] : null;
}
TextSearchIterator.prototype.prev__Linear = function(){
  return (this.index - 1 >= 0) ? this.results[++this.index] : null;
}
TextSearchIterator.prototype.next__Ring = function(){
  let res = this.results[this.index]
  this.index = (this.index + 1) % this.results.length;
  return res
}
TextSearchIterator.prototype.prev__Ring = function(){
  let res = this.results[this.index]
  this.index = (this.index - 1) % this.results.length;
  return res
}
TextSearchIterator.prototype.size = function(){
  return this.results.length;
}
