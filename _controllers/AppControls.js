module.exports = AppControls

const app = require('electron').remote.app

function AppControls () {

  this.menu = { default: {} }
  this.mode = 'default'

  this.app = app

  this.start = function () {
  }

  this.add = function (mode, cat, label, fn, accelerator, type="normal") {
    if (!this.menu[mode]) { this.menu[mode] = {} }
    if (!this.menu[mode][cat]) { this.menu[mode][cat] = {} }
    this.menu[mode][cat][label] = { fn: fn, accelerator: accelerator, type: type }
  }

  this.addRole = function (mode, cat, label) {
    if (!this.menu[mode]) { this.menu[mode] = {} }
    if (!this.menu[mode][cat]) { this.menu[mode][cat] = {} }
    this.menu[mode][cat][label] = { role: label }
  }

  this.addSpacer = function (mode, cat, label, type = 'separator') {
    if (!this.menu[mode]) { this.menu[mode] = {} }
    if (!this.menu[mode][cat]) { this.menu[mode][cat] = {} }
    this.menu[mode][cat][label] = { type: type }
  }

  this.clearCat = function (mode, cat) {
    if (this.menu[mode]) { this.menu[mode][cat] = {} }
  }

  this.set = function (mode = 'default') {
    this.mode = mode
    this.commit()
  }

  this.format = function () {
    const f = []
    const m = this.menu[this.mode]
    for (const cat in m) {
      const submenu = []
      for (const name in m[cat]) {
        const option = m[cat][name]
        if(option.fn){
          submenu.push({ label: name, accelerator: option.accelerator, click: option.fn, type: option.type})
        }else if (option.role){
          submenu.push({ role: option.role })
        }else{
          submenu.push({ type: option.type })
        }
      }
      f.push({ label: cat, submenu: submenu })
    }
    return f
  }

  this.commit = function () {
    console.log('Controller', 'Changing..')
    console.log(this.format())
    this.app.injectMenu(this.format())
  }

  this.accelerator = function (key, menu) {
    const acc = { basic: null, ctrl: null }
    for (cat in menu) {
      const options = menu[cat]
      for (const id in options.submenu) {
        const option = options.submenu[id]; if (option.role) { continue }
        acc.basic = (option.accelerator.toLowerCase() === key.toLowerCase()) ? option.label.toUpperCase().replace('TOGGLE ', '').substr(0, 8).trim() : acc.basic
        acc.ctrl = (option.accelerator.toLowerCase() === ('CmdOrCtrl+' + key).toLowerCase()) ? option.label.toUpperCase().replace('TOGGLE ', '').substr(0, 8).trim() : acc.ctrl
      }
    }
    return acc
  }

}

