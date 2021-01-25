// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const path = require('path');
const url = require('url');

//const customTitlebar = require('custom-electron-titlebar');
const customTitlebar = require('custom-electron-titlebar'); // Delete this line and uncomment top line
const { axisRight } = require('d3');
const { remote } = require('electron');
const { Menu, MenuItem } = remote;

/*
Menu.buildFromTemplate([{
      label: 'Click',
      submenu: [
        {
          label: 'blabb',
          type: 'checkbox',
          checked: true
        }
      ]
    },
      {
        label: "NIX",
        submenu: [
          {
            label: "leer"
          }
        ]
      }])
*/

var menu = new Menu();
menu.append(new MenuItem([{label: 'eins', submenu: [{label: 'blabb', type: 'checkbox'}]}]))

window.addEventListener('DOMContentLoaded', () => {
  new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#f7f7f7'),
    //icon: url.format(path.join(__dirname, '/images', '/icon.png')),
    //menu:  menu,
    //menuPosition: 'bottom',
   
  });


  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})