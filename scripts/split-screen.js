module.exports = SplitManager

var Split1 = require("split.js")
var Split2 = require("split.js")

function SplitManager(app, aInit = 20, bInit = 22, cInit = 58, 
            aMinSize = 140, bMinSize = 140, cMinSize = 408){

  var self = this

  self.app = app

  self.aInit = aInit 
  self.bInit = bInit
  self.cInit = cInit;
  self.aMinSize = aMinSize;
  self.bMinSize = bMinSize;
  self.cMinSize = cMinSize;

  self.sizesBuffer = [aInit, bInit, cInit]   /* Current sizes after dragging */

  this.getSizesBuffer = function(){
    var self = this

    return self.sizesBuffer
  }

  // Titlebar
  self.split_tb = Split1(['#tb-prjct-tools','#tb-notes-tools','#tb-content-tools'],{
    gutterSize: 0,
    sizes: [aInit,bInit,cInit],
    minSize: [aMinSize,bMinSize,cMinSize],
  });

  // Main content
  self.split_main = Split2(['#left-menu-1','#left-menu-2','#content'],{
    gutterSize: 3,
    sizes: [aInit,bInit,cInit],
    minSize: [aMinSize,bMinSize,cMinSize],
    onDrag: onDragHandler,
    onDragEnd: onDragEndHandler
  }); 

  

  function onDragHandler(sizes){
    // Adjust the sizes of the titlebar split accordingly
    self.split_tb.setSizes([sizes[0],sizes[1], sizes[2]])
    self.sizesBuffer = [sizes[0],sizes[1], sizes[2]]
    //console.log("Current sizes: " + self.sizesBuffer)
  }
  
  function onDragEndHandler(sizes){
    // The width at which the content should be completely collapsed
    let width_for_hide = 55
  
    //console.log(sizes);
    let body_width = document.body.clientWidth
    //console.log("Body width: " + body_width)
    //console.log("Screen width pixels: " + body_width)
    let content_width = body_width * sizes[2] / 100;
    //console.log("Content width percent: " + content_width)
    
    let percent_40px = width_for_hide * 100 / body_width;
    //console.log("Content 40px in percent: " + percent_40px)
    let mid_w_percent = 100 - sizes[0] - percent_40px
    //console.log("New mid: " + mid_w_percent);
  
    if(content_width < 200){
      // Hide the content panel
      self.split_main.setSizes([sizes[0],mid_w_percent,percent_40px])
      self.sizesBuffer = [sizes[0],mid_w_percent,percent_40px]
    }

    // If project is in graph mode update the GraphEditorView
    if(self.app.session.getGraphMode()){
      self.app.views.graph.updateWindow()
    }
  
  }

  console.log("Created SplitManager...")
  // console.log(self.split_main)
  // console.log(self.split_tb)

  /**
   * Create or overwrites the splitscreen instances. 
   * ATTENTION: This method should only be called once the DOM is build so that the element references
   * handed to the constructors can be found. 
   * If the split screen was already created the existing one is overwritten
   * @param {*} aInit 
   * @param {*} bInit 
   * @param {*} cInit 
   * @param {*} aMinSize 
   * @param {*} bMinSize 
   * @param {*} cMinSize 
   */
  this.createSplitScreen = function(aInit = this.aInit, bInit = this.bInit, cInit = this.cInit,
    aMinSize = this.aMinSize, bMinSize = this.bMinSize, cMinSize = this.cMinSize){ 

    if(!document.getElementById("tb-prjct-tools")){
    console.log("DOM tree is not existing")
    return;
    }

    self.split_tb = Split1(['#tb-prjct-tools','#tb-notes-tools','#tb-content-tools'],{
    gutterSize: 0,
    sizes: [aInit,bInit,cInit],
    minSize: [aMinSize,bMinSize,cMinSize],
    });

    self.split_main = Split2(['#left-menu-1','#left-menu-2','#content'],{
    gutterSize: 3,
    sizes: [aInit,bInit,cInit],
    minSize: [aMinSize,bMinSize,cMinSize],
    onDrag: onDragHandler,
    onDragEnd: onDragEndHandler
    });
  }

  this.recreateFromBuffer = function(){

    if(!document.getElementById("tb-prjct-tools")){
      console.log("DOM tree is not existing")
      return;
    }
  
    self.split_tb = Split1(['#tb-prjct-tools','#tb-notes-tools','#tb-content-tools'],{
      gutterSize: 0,
      sizes: [self.sizesBuffer[0], self.sizesBuffer[1], self.sizesBuffer[2]],
      minSize: [aMinSize,bMinSize,cMinSize],
    });
  
    self.split_main = Split2(['#left-menu-1','#left-menu-2','#content'],{
      gutterSize: 3,
      sizes: [self.sizesBuffer[0], self.sizesBuffer[1], self.sizesBuffer[2]],
      minSize: [aMinSize,bMinSize,cMinSize],
      onDrag: onDragHandler,
      onDragEnd: onDragEndHandler
    });
  }
}









