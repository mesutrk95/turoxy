
const { readFileSync } = require('fs');
const regedit = require('regedit').promisified
// const GlobalProxy = require("node-global-proxy").default;
// const globalTunnel = require('global-tunnel-ng');
 
const SSHClient = require('./SSHClient')
const SocksServer = require('./SocksServer')

class SSHProxy {
    constructor(config){
        this.config = config; 
    }
    
    async start(){ 

        this.sshClient = new SSHClient(this.config.ssh);
        await this.sshClient.start();

        this.socks = new SocksServer(this.config.socks);
        await this.socks.start();
        
        await this.enableSystemProxy(); 

        this.socks.onRequest = (info, accept, deny) => {
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
        }
    }
    
    async stop(){
        this.sshClient.stop();
        await this.socks.stop()
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

