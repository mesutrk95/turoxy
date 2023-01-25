
const SSH2 = require('ssh2');
const EventEmitter = require('events');
const { log2console } = require('./log');
const { waitFor, wait } = require('./utils');

class SSHClient extends EventEmitter {

    httpAgent = null;
    config = null;
    conn = null;
    isOpen = false;
    dead = false;
    connStatus = 'none';

    constructor(config){
        super();
        this.config = config;
        this.httpAgent = new SSH2.HTTPAgent(config);
    }

    get status()  {
        // if(!this.conn) return 'not-inited';
        if(this.dead) return 'dead'; 
        
        return this.connStatus;
    } 
 
    _setConnStatus(status){ 
        this.connStatus = status;
        this.emit("status", this.status ); 
    }

    async connect(){
        this.isOpen = false
        
        this._setConnStatus('connecting')
        this.conn = await this._connect(); 
        if(this.dead) return;
        this._setConnStatus('connected')

        this.conn.on('error', async (err) => {
            this.isOpen = false; 
            this.conn = null; 
            if(this.dead) return;
            log2console('error', err); 
            this._setConnStatus('failed')
             
            this.connect();

        });
        this.conn.on('close',async () => {
            this.isOpen = false; 
            this.conn = null; 
            log2console('closed');
        }); 
        this.conn.on('end', () => {
            log2console('end');
        }); 
    }

    stop(){
        this.dead = true;
        if(this.conn) this.conn.end()
    }

    async _connect(){ 
        const establish = async () => {
            return new Promise((resolve, reject)=>{
     
                this.handleErr = async (err)=> {
                    reject(err);
                }
                const conn = new SSH2.Client();  
                conn.on('error', this.handleErr)
                conn.on('ready', () => { 
                    if(this.dead) return;
                    this.isOpen = true; 
    
                    conn.removeListener('error', this.handleErr)
                    log2console('connected to ssh server => ' + this.config.host + ':' + this.config.port);
                    resolve(conn)  
                })
                conn.connect(this.config); 
                // log2console(this.config);
            }) 
        }

        while(!this.dead){
            try{
                const conn = await establish() 
                return conn;
            } catch(ex) {
                log2console('error while ssh establish: ', ex.stack);
                await wait(1500)
            } 
        }
    } 
}

module.exports = SSHClient;