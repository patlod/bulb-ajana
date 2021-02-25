const { app, ipcMain, BrowserWindow, Menu, MenuItem } = require('electron')
const electronConnect = require('electron-connect');
const path = require('path');

var client = null;

var force_quit = false;

function createWindow () {
  //console.log(path.join(__dirname,'preload.js'));
  var win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 698,
    minHeight: 333,
    webPreferences: {
      //preload: path.join(__dirname,'preload_titlebar.js'),
      nodeIntegration: true,
      enableRemoteModule: true
    },
    //frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: {x: 7, y: 17}
  })

  win.on('close', function(e){
    if(!force_quit){
      if (win) {
        e.preventDefault();
        win.webContents.send('saveEdits')
      }
    }
  });

  ipcMain.on('closed', _ => {
    //win.close()
    win = null;
    if (process.platform !== 'darwin') {
      app.quit()
      //app.exit();
    }
    app.quit()
    //app.exit();
  });

  /*win.on('closed', function(){
      //console.log("closed");
      //client.sendMessage('closed');
      win = null;
      app.quit();
  });*/

  app.on('activate-with-no-open-windows', function(){
      win.show();
  });

  var INDEX = 'file://' + path.join(__dirname, 'index.html')
  //win.loadFile('index.html');
  win.loadURL(INDEX);
  win.webContents.openDevTools();

  client = electronConnect.client.create(win);
}

app.whenReady().then(function(){
  createWindow();
})

app.on('close', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
   createWindow(); 
  }
})

app.injectMenu = function (menu) {
  try {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menu))
  } catch (err) {
    console.warn('Cannot inject menu.')
  }
}

