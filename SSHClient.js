
const SSH2 = require('ssh2');

class SSHClient {

    config = null;
    conn = null;
    isOpen = false;
    dead = false;

    constructor(config){
        this.config = config;
    }

    async connect(){
        this.isOpen = false
        
        this.conn = await this.connect();
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
        this.conn.on('error', (err) => {
            console.log('error', err);
        });
        this.conn.on('end', () => {
            console.log('end');
        }); 
    }

    stop(){
        this.dead = true;
        if(this.conn) this.conn.end()
    }

    connect(){ 
        return new Promise((resolve, reject)=>{
            const conn = new SSH2.Client(); 

            conn.on('ready', async () => {
                // this.isOpen = true;
                console.log('connected to ssh server => ' + this.config.host + ':' + this.config.port);
                resolve(conn)  
            }).connect(this.config); 
        }) 
    } 
}

module.exports = SSHClient;