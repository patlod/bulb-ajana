/**
 * Static class object that offers methods to unit conversions of any kind.
 */

var UnitConverter = {
  rgbToHex: function(rgb_string){
    let rgb_arr = rgb_string.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    function hex(x) {return ("0" + parseInt(x).toString(16)).slice(-2);}
    return "#" + hex(rgb_arr[1]) + hex(rgb_arr[2]) + hex(rgb_arr[3]);
  }
}

module.exports = UnitConverter