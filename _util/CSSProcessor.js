const UnitConverter = require('./UnitConverter');

/**
 * Static class object handling anything that revolves around fetching data
 * dynamically from CSS.
 */
var CSSProcessor = {
  
  /**
   * Returns the color collections for note backgrounds.
   * 
   * Pairs like:
   *  { selector: ".css-selector", color: "#bbbbbb" }
   */
  getNoteBackgroundColors: function(){
    let rules, rule, i, j, key;
    let colorCollection = [],
        targetSheet = null;

    for(i = 0; i < document.styleSheets.length; i++){ 
        let sHref = document.styleSheets[i].href.split("/");
        if(sHref[sHref.length - 1] === "main.css"){
            targetSheet = document.styleSheets[i];
        }
    }
    if(targetSheet !== null){
      rules = targetSheet.cssRules;
      for (j = 0; j < rules.length; j++) {
        if (rules[j].selectorText.indexOf('postit-bg-') !== -1) {
            colorCollection.push({
              selector: rules[j].selectorText,
              color: UnitConverter.rgbToHex(rules[j].style['background-color'])
            });
        }
      }
      return colorCollection;
    }
  }

}

module.exports = CSSProcessor
