/**
 * Static class object handling anything that revolves around fetching data
 * dynamically from CSS.
 */
var StringFormatter = {
  
  /**
   * Returns the color collections for note backgrounds.
   * 
   * Pairs like:
   *  { selector: ".css-selector", color: "#bbbbbb" }
   */
  getIndicesOf: function(needle, haystack, caseSensitive) {
    var needleStrLength = needle.length, 
        haystackStrLength = haystack.length;
        
    if (needleStrLength == 0 || haystackStrLength < needleStrLength) {
        return [];
    }
    var startIndex = 0, index, indices = [];
    if (!caseSensitive) {
        needle = needle.toLowerCase();
        haystack = haystack.toLowerCase();
    }
    while ((index = haystack.indexOf(needle, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + needleStrLength;
    }
    return indices;
  }
}

module.exports = StringFormatter
