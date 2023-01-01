
const SSH2 = require('ssh2');
const EventEmitter = require('events');

class SSHClient extends EventEmitter {

    config = null;
    conn = null;
    isOpen = false;
    dead = false;
    connStatus = 'none';

    constructor(config){
        super();
        this.config = config;
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
        this._setConnStatus('connected')

        this.conn.on('close',async () => {
            console.log('closed');
            this.isOpen = false; 
            this.conn = null;
            if(this.dead) return;

            try {
                await this.start();
                this.isOpen = true; 
            } catch (error) {  
                console.log('error', error);
            }
        });
        // this.conn.on('error', (err) => {
        //     console.log('erroreerrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr', err);
            
        //     this.connStatus = 'failed'
        // });
        this.conn.on('end', () => {
            console.log('end');
        }); 
    }

    stop(){
        this.dead = true;
        if(this.conn) this.conn.end()
    }

    _connect(){ 
        return new Promise((resolve, reject)=>{

            const conn = new SSH2.Client(); 
            conn.on('error', (err) => {
                console.log('error', err);
                
                this._setConnStatus('failed')
            });

            conn.on('ready', () => { 
                console.log('connected to ssh server => ' + this.config.host + ':' + this.config.port);
                resolve(conn)  
            }).connect(this.config); 
            // console.log(this.config);
        }) 
    } 
}

module.exports = SSHClient;