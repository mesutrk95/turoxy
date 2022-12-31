
// const  {ipcRenderer} = window.require("electron"); 
let ipcRenderer = null;
try {
    const electron = window.require("electron"); 
    ipcRenderer = electron.ipcRenderer
} catch (error) {
    
}

class UIEventDispatcher {

    listeners = new Map;

    constructor(){

    }

    send(channel, data){
        ipcRenderer.send(channel, data)
    }

    listen(channel, callback){
        let chnl = this.listeners.get(channel);
        let justMade = false;
        if(!chnl){
            chnl = [];
            this.listeners.set(channel, chnl);
            justMade = true;
        }

        chnl.push(callback)

        if(justMade){
            ipcRenderer.on(channel, (evt, data)=>{ 
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