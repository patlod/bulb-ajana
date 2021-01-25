var path = require('path')
var yo = require('yo-yo')
var csjs = require('csjs')
var update = require('./update')
var contextmenu = require('./contextmenu.js')

// TODO: Store opened/closed state internally and use localstorage

module.exports = function tree (files, onselected) {
  console.time('tree')
  var shownMenu = false
  var element = render()
  console.timeEnd('tree')
  return element

  function render () {
    return yo`<div class=${className}>
      <ul>
        ${files.map(function (file) {
          return li(file)
        })}
      </ul>
      ${shownMenu ? contextmenu(shownMenu, menuAction) : ''}
    </div>`
  }

  function li (file) {
    var children = ''
    var icon = ''
    if (file.type === 'folder') {
      if (file.opened) {
        children = yo`<ul>${file.children.map(function (child) {
          return li(child)
        })}</ul>`
        icon = 'fa-folder-open'
      } else {
        icon = 'fa-folder'
      }
    } else {
      icon = 'fa-file'
    }
    icon = yo`<i className="fa ${icon}"></i>`
    var el = yo`<li>
      ${icon}
      <button className="${file.type}" onclick=${function () {
        if (file.type === 'folder') {
          file.opened = !file.opened
          update(el, li(file))
        }
        onselected(file)
      }} oncontextmenu=${function (e) {
        e.preventDefault()
        showMenu(e.target, file)
      }}>${path.basename(file.path)}</button>
      ${children}
    </li>`
    return el
  }

  function menuAction (action) {
    switch (action) {
      case 'hide':
        hideMenu()
        break
      default:
        console.log(action)
        hideMenu()
        break
    }
  }

  function showMenu (target, file) {
    shownMenu = {
      target: target,
      file: file
    }
    update(element, render())
  }

  function hideMenu () {
    shownMenu = false
    update(element, render())
  }
}

var styles = module.exports.styles = csjs`
.tree {
  flex: 2;
  width: 20%;
  background-color: #DCEDC8;
  border-right: 2px solid #C5E1A5;
  padding: 1rem;
  color: #263238;
}
.tree ul {
}
.tree li {
  list-style: none;
  clear: both;
}
.tree li ul {
  padding-left: 1em;
}
.tree i {
  float: left;
  padding: .3em 0;
  color: #1B5E20;
}
.tree button {
  background: transparent;
  border: none;
  text-align: left;
  text-overflow: ellipsis;
  overflow: hidden;
}
.tree button.folder {
  font-weight: bold;
}
.tree button:focus {
  outline: none;
}
`
var className = styles.tree
