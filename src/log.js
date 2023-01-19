 
const { EventEmitter } = require('events');
const isDev = require('electron-is-dev');

const exceptionEventEmitter = new EventEmitter()
const logEventEmitter = new EventEmitter()

let logFile = null;

function setLogFile(lf){
    logFile = lf;
}

function log2console(...args){
    if(isDev) console.log(...args);
    
    try{ 
        logFile?.write('[' + new Date() + '] ' + 
        args.map(a => typeof(a) == 'object' ? JSON.stringify(a) : a.toString()).join(', ')  + '\n');
    }catch(ex){

    }
}  
function log(...args){ 
    log2console(...args)
}  


module.exports = { log, log2console, setLogFile, exceptionEventEmitter, logEventEmitter }