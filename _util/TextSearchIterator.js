module.exports = TextSearchIterator

function TextSearchIterator(needle, results) {
  this.needle = needle;
  this.results = results;
  this.index = 0;
}

TextSearchIterator.prototype.next = function(){
  return (index < this.results.length) ? this.results[index++] : null;
}
TextSearchIterator.prototype.prev = function(){
  return (index - 1 >= 0) ? this.results[++index] : null;
}
TextSearchIterator.prototype.size = function(){
  return this.results.length;
}
