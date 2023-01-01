
// const  {ipcRenderer} = window.require("electron"); 
let ipcRenderer = null;
try {
    const electron = window.require("electron"); 
    ipcRenderer = electron.ipcRenderer
} catch (error) {
    
}

class UIEventDispatcher {

    subsicribedChannels = new Set;
    listeners = new Map;
    time;

    constructor(){
        this.time = 0;
    }

    send(channel, data){
        ipcRenderer.send(channel, data)
        this.time = new Date().getTime()
    }

    listen(channel, callback){
        this.time = new Date().getTime()
        let chnl = this.listeners.get(channel); 
        if(!chnl){
            chnl = [];
            this.listeners.set(channel, chnl); 
        }

        chnl.push(callback)
        this.listeners.set(channel, chnl);

        if(!this.subsicribedChannels.has(channel)){
            this.subsicribedChannels.add(channel)
            ipcRenderer.on(channel, (evt, data)=>{  
                // console.log('emit', channel, chnl.length);
                chnl.forEach(c => c(data));
            })  
        } 

        return { 
            unregister : ()=>{
                chnl.splice(callback, 1);
            }
        }

    }
}

const uiEventDispatcher = new UIEventDispatcher();
export default uiEventDispatcher;