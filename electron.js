// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const isDev = require('electron-is-dev');
const path = require('path')

const { ipcMain , dialog } = require('electron') 

// const proxy = require('./proxy')

ipcMain.on('ready', (event, title) => { 
  console.log('ready');
})
        
ipcMain.on('select-file-dialog', (event, title) => {
  console.log('select-file-dialog'); 

  dialog.showOpenDialog({properties: ['openFile'] }).then(function (response) {
      if (!response.canceled) {
          // handle fully qualified file name
        console.log(response);
        event.reply('select-file-result', response.filePaths) 
      } else {
        console.log("no file selected");
        event.reply('select-file-result', null) 
      }
  });
})

ipcMain.on('new-server', (event, newServer) => {
    console.log('new-server', newServer); 
})   

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 650,
    // autoHideMenuBar: true,
    title: 'SSH Tunnel Proxy',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    } 
  })

  // and load the index.html of the app.
  // mainWindow.loadFile('index.html')
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:25489'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  // Open the DevTools.
  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.