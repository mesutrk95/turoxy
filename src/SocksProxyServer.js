const socks = require('socksv5');
const { log, log2console } = require('./log');

class SocksProxyServer {

    onRequest;
    openSockets = new Map;
    listening = false;
    
    stats = { 
        sent: 0,
        received: 0, 
        sockets: 0
    }

    constructor(config){
        this.config = config;
    }

    get status()  {
        if(!this.socksServer) return 'not-inited';
        if(this.listening) return 'started'
        else return 'starting'
    } 

    stop() {
        return new Promise((resolve, reject) => {
                
            log(`socks open sockets: ${this.openSockets.size}`);
            this.openSockets.forEach((socket,key,map) => {
                log(`closing socks socket ${key}...`);
                socket.end()
            })
            // this.openSockets.clear();
            
            if(this.socksServer == null) {  
                resolve()
                return ;
            }
            const onClose =()=>{ 
                this.listening = false
                resolve() 
            } 
            this.socksServer.on('close' , ()=> onClose()) 
            this.socksServer.close(()=> onClose()) 
        }) 
    }

    start() {
        return new Promise((resolve, reject) => {
            this.socksServer = socks.createServer((info, accept, deny) => { 
                this.handleRequest(info, accept, deny) 
            })
            this.socksServer.on('error', err => {
                console.log('error', err);
            })
            this.socksServer.listen(this.config.port, this.config.host, () => {
                this.listening = true
                console.log('SOCKSv5 proxy server started on ' + this.config.host + ':' + this.config.port);

                resolve()
            }).useAuth(socks.auth.None()); 
        })
    }

    setSSHClient(sshClient){
        this.sshClient = sshClient;
    }

    handleRequest = (info, accept, deny)=>{ 
        log(`request ${info.srcAddr}:${info.srcPort} ===> ${info.dstAddr}:${info.dstPort}`);   
        
        if(!this.sshClient || !this.sshClient.conn || !this.sshClient.isOpen) {
            log('error exception, ssh client doesnt exist\'s.');
            return deny();
        } 

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
                this.stats.sockets = this.openSockets.size;

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
                            log2console('socks client socket closed, sockets: ' , this.openSockets.size); 
                            this.openSockets.delete(info.srcPort)
                            this.stats.sockets = this.openSockets.size;
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
}

module.exports = SocksProxyServer;