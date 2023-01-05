
const { readFileSync } = require('fs');
const regedit = require('regedit').promisified 
const http = require('http');
const url = require('url');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const SSH2 = require('ssh2')
const SSHClient = require('./SSHClient')
const SocksProxyServer = require('./SocksProxyServer')
const HttpProxyServer = require('./HttpProxyServer')
const EventEmitter = require('events');
const { log } = require('./log');

class SSHProxy extends EventEmitter{

    openSockets = new Map();

    statesIntervalHandler
    stats = {
        startTime: 0,
        sent: 0,
        received: 0,
        speed: {
            download : 0,
            upload: 0,
        }
    }

    constructor(config){
        super();
        this.config = config; 
    }

    get status()  {
        return { 
            ssh : this.sshClient ? this.sshClient.status : 'not-started', 
            socks: this.socksProxy  ? this.socksProxy.status : 'not-started',
            http: this.httpProxy  ? this.httpProxy.status : 'not-started' 
        }
    } 
    
    emitStatus(){
        this.emit("status", this.status ); 
    }


    async start(){  
        this.stats.startTime = new Date().getTime();  
        
        let lastCheckedNetworkSpeed = -1, lastStats ;
        clearInterval(this.statesIntervalHandler)
        this.statesIntervalHandler = setInterval(() => {
            const now = new Date().getTime();

            if(lastCheckedNetworkSpeed < 0){
                lastCheckedNetworkSpeed = now;
                lastStats = { sent : this.stats.sent, received: this.stats.received }
            }else{
                const dt = now - lastCheckedNetworkSpeed;
                // if(dt > 1000){
                    const diffDownload = this.stats.received - lastStats.received
                    const diffUpload = this.stats.sent - lastStats.sent 
                    lastStats = { sent : this.stats.sent, received: this.stats.received }
                    lastCheckedNetworkSpeed = now;
                    this.stats.speed.download = 1000 * diffDownload / dt;
                    this.stats.speed.upload = 1000 * diffUpload / dt; 
                    this.stats.speed.time = now; 
                // }
            }

            
            this.emit("stats", this.stats); 
        }, 500); 

        this.emitStatus();
        this.httpAgent = new SSH2.HTTPAgent(this.config.ssh);
        this.sshClient = new SSHClient(this.config.ssh);
        this.sshClient.on('status', (status) =>{
            this.emitStatus();
        })
        await this.sshClient.connect(); 

        if(this.config?.socksProxy?.enable){
            this.emitStatus(); 
            this.socksProxy = new SocksProxyServer(this.config.socksProxy);
            this.socksProxy.onRequest = this.handleSocksRequest
            await this.socksProxy.start();   
        }
        
        if(this.config?.httpProxy?.enable){
            this.emitStatus();
            this.httpProxy = new HttpProxyServer(this.config.httpProxy);
            this.httpProxy.onRequest = this.handleHttpRequest
            this.httpProxy.onOptionsRequest = this.handleHttpOptionsRequest
            await this.httpProxy.start();   
        } 
        
        this.emitStatus();
        await this.enableSystemProxy();   
    }
    handleHttpOptionsRequest = (clientReq, clientRes) => {
        
        let reqUrl = url.parse(clientReq.url);
        log('options proxy for http request: ' + reqUrl.href);
      
        let options = {
            host: reqUrl.hostname,
            port: reqUrl.port,
            path: reqUrl.path,
            method: clientReq.method,
            headers: clientReq.headers,
            agent: this.httpAgent
        };

        let serverConnection = http.request(options, (res) => {
            clientRes.writeHead(res.statusCode, res.headers)
            res.pipe(clientRes); 
        });
        clientReq.pipe(serverConnection);

        clientReq.on('error', (e) => {
            log('client socket error: ' + e);
        });
      
        serverConnection.on('error', (e) => {
            log('server connection error: ' + e);
        }); 
    }

    handleHttpRequest = (info, accept, deny) => {
        log(`request ${info.srcAddr}:${info.srcPort} ===> ${info.dstAddr}:${info.dstPort}`);   
        
        this.sshClient.conn.forwardOut(info.srcAddr, info.srcPort, info.dstAddr, info.dstPort,
            (err, resultStream) => {
                
                log(`transmit ${info.srcAddr}:${info.srcPort} <=== ${info.dstAddr}:${info.dstPort}`);   

                if (err) { 
                    log('error exception', err);
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

                if (clientSocket) { 
                    try {  
                        clientSocket.on('data', data => {  
                           this.stats.sent += data.length 
                        });
                        resultStream.on('data', data => {   
                           this.stats.received += data.length  
                        });
                        clientSocket.on('close', data => {    
                        //    log('closssssssssssssssssssssssssssssssssssssse'); 
                        });   
                    } catch (ex) {
                        log('exception', ex);
                    }
                } else {   
                } 
        }); 

    }
    
    handleSocksRequest = (info, accept, deny)=>{ 
        log(`request ${info.srcAddr}:${info.srcPort} ===> ${info.dstAddr}:${info.dstPort}`);   
        
        this.sshClient.conn.forwardOut(info.srcAddr, info.srcPort, info.dstAddr, info.dstPort,
            (err, resultStream) => {
                
                log(`transmit ${info.srcAddr}:${info.srcPort} <=== ${info.dstAddr}:${info.dstPort}`);   

                if (err) { 
                    log('error exception', err);
                    return deny();
                    // return;
                } 
                const clientSocket = accept(true);
                this.openSockets.set(info.srcPort, clientSocket);

                if (clientSocket) { 
                    try {  
                        clientSocket.on('data', data => {  
                            this.stats.sent += data.length
                        //    log(this.stats, data.length);
                        });
                        resultStream.on('data', data => {   
                            this.stats.received += data.length 
                        //    log(this.stats, data.length);
                        });
                        clientSocket.on('close', data => {    
                        //    log('closssssssssssssssssssssssssssssssssssssse');
                            this.openSockets.delete(info.srcPort)
                        });  

                        resultStream
                            .pipe(clientSocket)
                            .pipe(resultStream)
                                    .on('error', () => { 
                                        log(`error in socket write ${info.srcAddr}:${info.srcPort} <== ${info.dstAddr}:${info.dstPort} `);   
                                    })   
                    } catch (ex) {
                        log('exception', ex);
                    }
                } else { 

                } 
        });  
    }

    async stop(){
        clearInterval(this.statesIntervalHandler)

        log(`socks open sockets: ${this.openSockets.size}`);
        this.openSockets.forEach((socket,key,map) => {
            log(`closing socket ${key}...`);
            socket.end()
        })
        this.openSockets.clear();

        log('stopping socks proxy server ...');
        if(this.socksProxy) await this.socksProxy.stop()

        log('stopping http proxy server ...');
        if(this.httpProxy) await this.httpProxy.stop()
        
        log('disconnecting ssh client ...');
        if(this.sshClient) this.sshClient.stop();

        log('clearing system proxy ...');
        await this.disableSystemProxy(); 
        log('done.');
    }

    async disableSystemProxy(){ 
        log('setting registry keys.');
        // await regedit.putValue({
        //     'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings': {
        //         ProxyEnable: { value: 0, type: 'REG_DWORD' }
        //     }
        // })
        
        await exec('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f')

    }
    async enableSystemProxy(){ 
        log('setting registry keys.');

        let proxyUrl = '';
        if(this.config.httpProxy){
            proxyUrl = this.config.httpProxy.host + ':' + this.config.httpProxy.port
        } else if(this.config.socksProxy) {
            proxyUrl = 'socks=' + this.config.socks.host + ':' + this.config.socks.port
        }
        let proxyOverride = 'localhost;127.*;10.*;172.16.*;172.17.*;172.18.*;172.19.*;172.20.*;172.21.*;172.22.*;172.23.*;172.24.*;172.25.*;172.26.*;172.27.*;172.28.*;172.29.*;172.30.*;172.31.*;192.168.*';

        // await regedit.putValue({
        //     'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings': {
        //         ProxyServer: {
        //             value: proxyUrl, type: 'REG_SZ'
        //         },
        //         ProxyOverride: {
        //             value: 'localhost;127.*;10.*;172.16.*;172.17.*;172.18.*;172.19.*;172.20.*;172.21.*;172.22.*;172.23.*;172.24.*;172.25.*;172.26.*;172.27.*;172.28.*;172.29.*;172.30.*;172.31.*;192.168.*',
        //             type: 'REG_SZ'
        //         }
        //     }
        // })
        // await regedit.putValue({
        //     'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings': {
        //         ProxyEnable: { value: 1, type: 'REG_DWORD' }
        //     }
        // })
        await exec('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f')
        await exec(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d ${proxyUrl} /f`)
        await exec(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyOverride /t REG_SZ /d ${proxyOverride} /f`)
 
    } 
    
} 

module.exports = SSHProxy;
