var yo = require('yo-yo')
var csjs = require('csjs')
var breadcrumb = require('breadcrumb-element')
var table = require('./table.js')

module.exports = function viewer (selected, onselected) {
  console.time('viewer')
  if (!selected) return
  function render () {
    if (selected.type === 'folder') {
      return table(selected.children || [], onselected)
    } else {
      return fileViewer()
    }
  }
  function fileViewer () {
    return yo`<div>${selected.data || 'no file data'}</div>`
  }
  var element = yo`<div class="${className}">
    <div className="breadcrumb">
      ${breadcrumb(selected.path.slice(1).split('/'), function (trail) {
        var p = '/' + trail.join('/')
        console.log('selected', p)
        // TODO: Determine path then send up onselected
      })}
    </div>
    ${render()}
  </div>`
  console.timeEnd('viewer')
  return element
}

var styles = module.exports.styles = csjs`
.viewer {
  flex: 8;
  width: 80%;
  padding: 1rem;
}
`
var className = styles.viewer
