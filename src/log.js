 
const { EventEmitter } = require('events');

const exceptionEventEmitter = new EventEmitter()
const logEventEmitter = new EventEmitter()


function log(...args){
    console.log(args);
    logEventEmitter.emit('data', args)
}  

function log2console(...args){
    console.log(args);
}  

module.exports = { log, log2console, exceptionEventEmitter, logEventEmitter }