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
  },
  
  /**
   * Splits string at new line and returns array with text blocks.
   * 
   * NOTE: Also removes the carriage returns \r
   * 
   * @param {*} string 
   */
  splitAtNewLine: function(string){
    return string.replace(/\r/g, "").split(/\n/g);
  },

  /**
   * Returns array with indices of text lines 
   * (lines without text are removed)
   * 
   * Takes array of strings (text paragraphs)
   * 
   * @param {[String]} arr 
   */
  getParagraphIndices: function(arr){
    //let txt_lines = 0
    let indices = [];
    // Skip empty lines and calculate the cursor index..
    for(var i in arr){
      if(arr[i].length > 0){
        indices.push(i);
      }
    }
    return indices;
  },

  /**
   * Adds HTML to the string.
   * This is useful when string with \n should be displayed in normal <div> or similar
   * HTML elements.
   * 
   * NOTE: Same annotation as in a 'contenteditible' element.
   * 
   * @param {string} string 
   */
   spiceStringWithMarkup: function(string){
    if(!string){ return null; }
    let i = 0,
        arr = this.splitAtNewLine(string);
        spiced = ``;
    for(i in arr){
      if(arr[i].length > 0){
        spiced += `<div>` + arr[i] + `</div>`;
      }else{
        spiced += `<div><br></div>`;
      }
    }
    return spiced;
  }
}

module.exports = StringFormatter
