
const { readFileSync } = require('fs');
const regedit = require('regedit').promisified
// const GlobalProxy = require("node-global-proxy").default;
// const globalTunnel = require('global-tunnel-ng');
 
const SSHClient = require('./SSHClient')
const SocksProxyServer = require('./SocksProxyServer')
const HttpProxyServer = require('./HttpProxyServer')
const EventEmitter = require('events');

class SSHProxy extends EventEmitter{

    openSockets = new Map();

    statesIntervalHandler
    stats = {
        send: 0,
        receive: 0
    }

    constructor(config){
        super();
        this.config = config; 
    }

    get status()  {
        return { 
            ssh : this.sshClient ? this.sshClient.status : 'not-inited', 
            socks: this.socksProxy  ? this.socksProxy.status : 'not-inited',
            http: this.http  ? this.httpProxy.status : 'not-inited' 
        }
    } 
    
    emitStatus(){
        this.emit("status", this.status ); 
    }


    async start(){  

        clearInterval(this.statesIntervalHandler)
        this.statesIntervalHandler = setInterval(() => {
            this.emit("stats", this.stats ); 
        }, 500); 

        this.emitStatus();
        this.sshClient = new SSHClient(this.config.ssh);
        this.sshClient.on('status', (status) =>{
            this.emitStatus();
        })
        await this.sshClient.connect(); 

        if(this.config.socksProxy){
            this.emitStatus(); 
            this.socksProxy = new SocksProxyServer(this.config.socksProxy);
            await this.socksProxy.start();  
        }
        
        if(this.config.httpProxy){
            this.emitStatus();
            this.httpProxy = new HttpProxyServer(this.config.httpProxy);
            await this.httpProxy.start();  
        }

        
        this.emitStatus();
        await this.enableSystemProxy(); 

        this.httpProxy.onRequest = (info, accept, deny) => {
            console.log(`request ${info.srcAddr}:${info.srcPort} ===> ${info.dstAddr}:${info.dstPort}`);   
            
            this.sshClient.conn.forwardOut(info.srcAddr, info.srcPort, info.dstAddr, info.dstPort,
                (err, resultStream) => {
                    
                    console.log(`transmit ${info.srcAddr}:${info.srcPort} <=== ${info.dstAddr}:${info.dstPort}`);   
    
                    if (err) { 
                        console.log('error exception', err);
                        return deny();
                        // return;
                    } 
                    const { clientSocket, clientRequest, head} = accept(true);
                    clientSocket.write('HTTP/' + clientRequest.httpVersion + ' 200 Connection Established\r\n' +
                        'Proxy-agent: Node.js-Proxy\r\n' +
                            '\r\n', 'UTF-8', () => {
                        // creating pipes in both ends
                        resultStream.write(head);
                        resultStream.pipe(clientSocket);
                        clientSocket.pipe(resultStream);
                    });
                    this.openSockets.set(info.srcPort, clientSocket);

                    if (clientSocket) { 
                        try {  
                            clientSocket.on('data', data => {  
                               this.stats.send += data.length 
                            });
                            resultStream.on('data', data => {   
                               this.stats.receive += data.length  
                            });
                            clientSocket.on('close', data => {    
                            //    console.log('closssssssssssssssssssssssssssssssssssssse');
                               this.openSockets.delete(info.srcPort)
                            });  

                            // resultStream
                            //     .pipe(clientSocket)
                            //     .pipe(resultStream)
                            //          .on('error', () => { 
                            //              console.log(`error in socket write ${info.srcAddr}:${info.srcPort} <== ${info.dstAddr}:${info.dstPort} `);   
                            //          })   
                        } catch (ex) {
                            console.log('exception', ex);
                        }
                    } else { 
    
                    } 
            }); 

        }

        this.socksProxy.onRequest = (info, accept, deny) => {
            console.log(`request ${info.srcAddr}:${info.srcPort} ===> ${info.dstAddr}:${info.dstPort}`);   
            
            this.sshClient.conn.forwardOut(info.srcAddr, info.srcPort, info.dstAddr, info.dstPort,
                (err, resultStream) => {
                    
                    console.log(`transmit ${info.srcAddr}:${info.srcPort} <=== ${info.dstAddr}:${info.dstPort}`);   
    
                    if (err) { 
                        console.log('error exception', err);
                        return deny();
                        // return;
                    } 
                    const clientSocket = accept(true);
                    this.openSockets.set(info.srcPort, clientSocket);

                    if (clientSocket) { 
                        try {  
                            clientSocket.on('data', data => {  
                               this.stats.send += data.length
                            //    console.log(this.stats, data.length);
                            });
                            resultStream.on('data', data => {   
                               this.stats.receive += data.length 
                            //    console.log(this.stats, data.length);
                            });
                            clientSocket.on('close', data => {    
                            //    console.log('closssssssssssssssssssssssssssssssssssssse');
                               this.openSockets.delete(info.srcPort)
                            });  

                            resultStream
                                .pipe(clientSocket)
                                .pipe(resultStream)
                                     .on('error', () => { 
                                         console.log(`error in socket write ${info.srcAddr}:${info.srcPort} <== ${info.dstAddr}:${info.dstPort} `);   
                                     })   
                        } catch (ex) {
                            console.log('exception', ex);
                        }
                    } else { 
    
                    } 
            }); 
        }
    }
    
    async stop(){
        clearInterval(this.statesIntervalHandler)

        console.log(`socks open sockets: ${this.openSockets.size}`);
        this.openSockets.forEach((socket,key,map) => {
            console.log(`closing socket ${key}...`);
            socket.end()
        })
        this.openSockets.clear();

        console.log('stopping socks proxy server ...');
        if(this.socksProxy) await this.socksProxy.stop()

        console.log('stopping http proxy server ...');
        if(this.httpProxy) await this.httpProxy.stop()
        
        console.log('disconnecting ssh client ...');
        if(this.sshClient) this.sshClient.stop();

        console.log('clearing system proxy ...');
        await this.disableSystemProxy(); 
        console.log('done.');
    }

    async disableSystemProxy(){ 
        console.log('setting registry keys.');
        await regedit.putValue({
            'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings': {
                ProxyEnable: { value: 0, type: 'REG_DWORD' }
            }
        })
    }
    async enableSystemProxy(){ 
        console.log('setting registry keys.');

        let proxyUrl = '';
        if(this.config.httpProxy){
            proxyUrl = this.config.httpProxy.host + ':' + this.config.httpProxy.port
        }else if(this.config.socksProxy){
            proxyUrl = 'socks=' + this.config.socks.host + ':' + this.config.socks.port
        }

        await regedit.putValue({
            'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings': {
                ProxyServer: {
                    value: proxyUrl, type: 'REG_SZ'
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
