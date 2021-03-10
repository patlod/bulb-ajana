var UIAssistant = {
  resizeElementByContent: function(el){
    if(!el){
      return;
    }
  
    let default_height = 26;
    el.style.height = default_height.toString() + "px";
    el.style.height = el.scrollHeight.toString() + "px";
  }
}

module.exports = UIAssistant