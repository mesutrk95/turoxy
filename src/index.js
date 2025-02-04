 
// Modules to control application life and create native browser window
const { log, logEventEmitter, log2console, exceptionEventEmitter,setLogFile } = require('./log')

const isDev = require('electron-is-dev');
const path = require('path')
const fs = require('fs')
const os = require('os');
 
function getStorePath(){
  return path.join(os.homedir(), '/Documents/turoxy/')
}
const STORE_DIR = getStorePath()
log(STORE_DIR);
 
const { app, BrowserWindow } = require('electron')
const { ipcMain , dialog } = require('electron')  
 
const SSHProxy = require('./SSHProxy');   

const LOG_FILE_PATH = path.join(STORE_DIR , 'log.txt')
const DATA_FILE_PATH = path.join(STORE_DIR , 'tunnels.json')
const CONFIG_FILE_PATH = path.join(STORE_DIR , 'config.json')

let selectedServer = null;
let sshProxy = null;
let logFile = null;

let allServers = [];
let appConfig = {
  socksProxy: { 
    enable: true,
    host: '127.0.0.1',
    port: 54612
  },
  httpProxy: {
    enable: true,
    host: '127.0.0.1',
    port: 54610
  },
  blockList: [
    'windowsupdate.microsoft.com',
    'stats.microsoft.com',
    'update.microsoft.com',
    'download.microsoft.com',
    'ntservicepack.microsoft.com',
    'download.windowsupdate.com',
    'windowsupdate.com',
    'wustat.windows.com',
  ],
  startup: false
};

function init(){
  logFile = fs.createWriteStream(LOG_FILE_PATH, {flags : 'w'}); 
  setLogFile(logFile);

  if(!fs.existsSync(STORE_DIR)){
    fs.mkdirSync(STORE_DIR, { recursive : true })
  } 

  if(fs.existsSync(DATA_FILE_PATH)){
    allServers = JSON.parse(fs.readFileSync(DATA_FILE_PATH)) 
  }
  if(fs.existsSync(CONFIG_FILE_PATH)){
    let config = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH)) 
    appConfig = { 
      ...appConfig, 
      ...config
    }
  }

  log2console('appConfig', appConfig)
}
init()

function registerEvents(){

  ipcMain.on('select-file-dialog', (event, data) => {
    log('select-file-dialog'); 
    const dialogOptions = {
      defaultPath: "c:/",
      filters: [
        { name: "OpenSSH Private Key", extensions: ["pem"] },
        { name: "Putty Private Key", extensions: ["ppk"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile"]
    };
  
    dialog.showOpenDialog(dialogOptions).then(function (response) {
        if (!response.canceled) {
            // handle fully qualified file name
          let result = null;
          if(data && data.includeFilesData){
            let list = [];
            response.filePaths.forEach(fp => {
              const fileData= fs.readFileSync(fp, 'utf8')
              const item = { content : fileData, filename : fp } 
              list.push(item)
            })
            result = list;
          }else{
            result = response.filePaths;
          } 
          log(result);
          event.reply('select-file-result', result) 
        } else {
          log("no file selected");
          event.reply('select-file-result', null) 
        }
    });
  })
  
  ipcMain.on('get-all-servers', (event, title) => {
    // log('get-all-servers');  
    event.reply('all-servers', allServers) 
  })
  
  ipcMain.on('save-server', (event, newServer) => {
    log('save-server', newServer); 
    if(newServer.time){
      let server = allServers.find(s => s.time == newServer.time)
      server.label = newServer.label;
      server.host = newServer.host;
      server.port = newServer.port;
      server.user = newServer.user;
      server.auth = newServer.auth;
    } else { 
      let server = { ...newServer, time: new Date().getTime() }
      allServers.push(server); 
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(allServers, null, 2))
  })   
  
  ipcMain.on('delete-server', (event, server) => { 
    log('delete-server', server); 
    allServers = allServers.filter( s => s.time != server.time)
  
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(allServers, null, 2))
    event.reply('server-deleted', allServers) 
  })   
  
  ipcMain.on('ssh-disconnect', async (event, server) => { 
    
    if(sshProxy){
      await sshProxy.stop()
      sshProxy = null;
    }
  
    event.reply('ssh-disconnect') 
    
  })

  ipcMain.on('ssh-connection', async (event, server) => {  
     
    event.reply('ssh-connection', { server : selectedServer, status : sshProxy.status})  
  })
  
  ipcMain.on('connect-server', async (event, server) => { 
    log('connect-server', server);    
    selectedServer = allServers.find( s => s.time === server.time)
     
    const ssh = {
      host: selectedServer.host,
      port: selectedServer.port,
      username: selectedServer.user,
      keepaliveInterval: 30000,
      //   debug: (s) => {console.log(s)} 
    }
    if(selectedServer.auth.method == 'pubkey'){
      ssh.privateKey = selectedServer.auth.privateKey  
    }else if(selectedServer.auth.method == 'basic'){
      ssh.password = selectedServer.auth.password  
    }
  
  
    if(sshProxy){
      await sshProxy.stop()
      sshProxy = null;
    }

    const { httpProxy, socksProxy}  = appConfig  
    sshProxy = new SSHProxy({ ssh, socksProxy, httpProxy })
    sshProxy.start()
  
    sshProxy.on('status', (status)=>{
      event.reply('ssh-connection', { server : selectedServer, status}) 
    })
    sshProxy.on('stats', (stats)=>{
      event.reply('connection-stats', stats) 
    })
    event.reply('ssh-connection', { server : selectedServer, status : sshProxy.status}) 
  
  })   
  
  ipcMain.on('node-exception-reg', (event, server) => { 
    log2console('node-exception'); 
    exceptionEventEmitter.on('data', data => event.reply('node-exception', data))
  })   

  ipcMain.on('node-log-reg', (event, server) => {   
    log2console('node-log'); 
    logEventEmitter.on('data', data => event.reply('node-log', data))
  })    
  ipcMain.on('save-config', (event, config) => {   
    log2console('save-config'); 
    appConfig = config;
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2)) 
  })   
  ipcMain.on('get-config', (event) => {   
    log2console('get-config'); 
    event.reply('app-config', appConfig)
  })    
  
  // ipcMain.on('ready', (event, title) => { 
  //   // log('ready');
  //   event.reply('ready', { status :'ok' })
  // })
}
let mainWindow = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    ... appConfig.x && { x: appConfig.x },
    ... appConfig.y && { y: appConfig.y },
    width: 400,
    height: 700, 
    resizable: false,
    autoHideMenuBar: true,
    // frame: true, 
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
      : `file://${path.join(__dirname, '../ui/build/index.html')}`
  );

  mainWindow.on("close", () => {
    const bounds = mainWindow.getNormalBounds();
    appConfig.x = bounds.x;
    appConfig.y = bounds.y;
    log2console('save-config');  
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(appConfig, null, 2)) 
})

  // Open the DevTools.
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  
  registerEvents();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {
  

  try {
    if(sshProxy){
      await sshProxy.stop()
    } 
  } catch (error) {
    log2console(error)
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

process.on('uncaughtException', function (error) {  
  log('uncaughtException' , error , error.stack);
  
  exceptionEventEmitter.emit(error) 
})

