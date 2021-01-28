module.exports = UIVertexWrapper

function UIVertexWrapper(vertex, width = 0, height = 0){
  this.vertex = vertex
  this.width = width
  this.height = height


  this.calcNodeCenter = function(){
    return {x: this.vertex.posX + this.width/2, y: this.vertex.posY + this.height/2}
  }
}