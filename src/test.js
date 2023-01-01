
const { EventEmitter } = require('events');

const logEventEmitter = new EventEmitter()


logEventEmitter.on('data', data => {
    console.log(data);
})

logEventEmitter.emit('data', {hello : 'ok'})
