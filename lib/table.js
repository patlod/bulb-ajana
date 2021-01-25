var path = require('path')
var yo = require('yo-yo')
var csjs = require('csjs')
var update = require('./update')

module.exports = function table (files, onselected) {
  console.time('table')
  var asc = true
  var sortBy = 'path'
  var element = render(files)
  console.timeEnd('table')
  return element

  function render (files) {
    return yo`<div class="${className}">
      <table>
        ${head()}
        ${body(files)}
      </table>
    </div>`
  }

  function sort (name) {
    asc = !asc
    sortBy = name
    files = files.slice(0).sort(function (a, b) {
      a = a[name]
      b = b[name]
      if (name === 'path') {
        a = path.basename(a)
        b = path.basename(b)
      }
      return (asc) ? a.localeCompare(b) : b.localeCompare(a)
    })
    update('.' + className, render(files))
  }

  function th (key, label) {
    var icon = ''
    if (sortBy === key) {
      icon = (asc) ? yo`<i className="fa fa-caret-down"></i>` : yo`<i className="fa fa-caret-up"></i>`
    }
    return yo`<th>
      <button onclick=${function () {
        sort(key)
      }}>${label}</button>
      ${icon}
    </th>`
  }

  function head () {
    return yo`<thead>
      <tr>
        ${th('path', 'Name')}
        ${th('mtime', 'Modified')}
      </tr>
    </thead>`
  }

  function body () {
    return yo`<tbody>
      ${files.map(function (file) {
        var icon = yo`<i className="fa fa-${file.type}"></i>`
        return yo`<tr>
          <td>
            ${icon}
            <button onclick=${function () {
              onselected(file)
            }}>${path.basename(file.path)}</button>
          </td>
          <td>
            ${file.mtime}
          </td>
        </tr>`
      })}
    </tbody>`
  }
}

var styles = module.exports.styles = csjs`
.table table {
  table-layout: fixed;
  width: 100%;
}
.table button {
  text-align: left;
}
.table thead {
  border-bottom: 1px solid #ddd;
}
.table th {
  text-align: left;
}
.table td, .viewer th {
  padding: .5em;
}
`
var className = styles.table
