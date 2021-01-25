var fs = require('fs')
var path = require('path')

var cwd = process.cwd()

function buildTree (dir) {
  var files = fs.readdirSync(dir)
  return files.map(function (file) {
    var filepath = path.join(dir, file)
    var stat = fs.lstatSync(filepath)
    stat.path = filepath
    if (stat.isDirectory()) {
      stat.children = buildTree(filepath)
      stat.type = 'folder'
    } else {
      stat.type = 'file'
      stat.data = ''
    }
    return stat
  })
}
var tree = buildTree(cwd)

fs.writeFileSync(path.join(__dirname, 'exampleTree.json'), JSON.stringify(tree, null, 2))
