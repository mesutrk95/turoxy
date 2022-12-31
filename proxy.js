const socks = require('socksv5');
const { readFileSync } = require('fs');
const SSH2 = require('ssh2');
const regedit = require('regedit').promisified
// const GlobalProxy = require("node-global-proxy").default;
// const globalTunnel = require('global-tunnel-ng');
 
class SSHClient {

    config = null;
    conn = null;
    isOpen = false;
    dead = false;

    constructor(config){
        this.config = config;
    }

    async start(){
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

class SSHProxy {
    constructor(config){
        this.config = config; 
    }
    
    async start(){ 
        await this.enableSystemProxy();

        this.sshClient = new SSHClient(this.config.sshServer);
        await this.sshClient.start();
    
        this.socksInstance = socks.createServer((info, accept, deny) => {
            console.log(`request ${info.srcAddr}:${info.srcPort} ===> ${info.dstAddr}:${info.dstPort}`);   
    
            sshClient.conn.forwardOut(info.srcAddr, info.srcPort,
                info.dstAddr,
                info.dstPort,
                (err, resultStream) => {
    
                    console.log(`transmit ${info.srcAddr}:${info.srcPort} <=== ${info.dstAddr}:${info.dstPort}`);   
    
                    if (err) { 
                        console.log('error exception', err);
                        return deny();
                        // return;
                    }
    
                    const clientSocket = accept(true);
                    if (clientSocket) { 
                        try {  
                            resultStream
                                .pipe(clientSocket)
                                .pipe(resultStream)
                                     .on('error', () => { 
                                         console.log(`error in socket write ${info.srcAddr}:${info.srcPort} <== ${info.dstAddr}:${info.dstPort} `);   
                                     })   
                                     .on('close', () => { 
                                        //  console.log(`transmitted.`);   
                                     });
                        } catch (ex) {
                            console.log('exception', ex);
                        }
                    } else { 
    
                    } 
            }); 
        })
    
        this.socksInstance.listen(this.config.socksServer.port, this.config.socksServer.host, () => {
            console.log('SOCKSv5 proxy server started on ' + socksServer.host + ':' + socksServer.port);
        }).useAuth(socks.auth.None()); 
    }
    
    async stop(){
        this.sshClient.stop();
        this.socksInstance.close()
    }

    async enableSystemProxy(){ 
        console.log('setting registry keys.');
        await regedit.putValue({
            'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings': {
                ProxyServer: {
                    value: 'socks=' + this.config.socksServer.host + ':' + this.config.socksServer.port, type: 'REG_SZ'
                },
                ProxyOverride: {
                    value: 'localhost;127.*;10.*;172.16.*;172.17.*;172.18.*;172.19.*;172.20.*;172.21.*;172.22.*;172.23.*;172.24.*;172.25.*;172.26.*;172.27.*;172.28.*;172.29.*;172.30.*;172.31.*;192.168.*',
                    type: 'REG_SZ'
                }
            }
        })
        await regedit.putValue({
            'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings': {
                ProxyEnable: { value: 1, type: 'REG_DWORD' }
            }
        })


        // GlobalProxy.setConfig({
        //     http: `http://socks=${socksServer.host}:${socksServer.port}`,
        // // https: "https://localhost:1080",
        // });
        // GlobalProxy.start();

        // globalTunnel.initialize({
        //     host:  `socks=${socksServer.host}`,
        //     port: socksServer.port,
        //     // proxyAuth: 'userId:password', // optional authentication
        //     sockets: 50 // optional pool size for each http and https
        //   });
    } 
    
} 

module.exports = SSHProxy;

// process.on('uncaughtException', function (error) { 

//     console.log('uncaughtException' , error);
// })

