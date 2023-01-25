
const httpProxy = require('http-proxy');

const net = require('net');
const http = require('http');
const url = require('url'); 
// const findProcess = require('find-process');

const { EventEmitter } = require('stream');
const { log, log2console} = require('./log');
 

class HttpProxyServer extends EventEmitter {
 
    openSockets = new Map
    listening = false;
    stats = { 
        sent: 0,
        received: 0, 
        sockets: 0
    }

    constructor(config){
        super();
        this.config = config;
    }

    get status()  { 
        return this.listening ? 'started' : 'not-started'
    } 

    setSSHClient(sshClient){
        this.sshClient = sshClient;
    }
  
    start() {
        return new Promise((resolve, reject) => {  
            this.proxy = http.createServer((req, res) => {
                this.handleOptionsRequest(req, res) 
            });
            
            // handle https proxy requests (CONNECT method)
            this.proxy.on('connect', async (clientRequest, clientSocket, head) => {
                // console.log(clientRequest.socket.localPort, clientRequest.socket.remotePort); 

                // let n = new Date().getTime()
                // findProcess('port', clientRequest.socket.remotePort)
                //     .then(function (list) {
                //         console.log(new Date().getTime() - n , list);
                //     }, function (err) {
                //         console.log(err.stack || err);
                //     })

  
                let reqUrl = url.parse('https://' + clientRequest.url);   

                function accept(){   
                    return { clientSocket, head, clientRequest };
                }
                function deny(){  
                    clientSocket.end()
                }
                const srcSockAddr = clientSocket.address()
                
                this.handleHttpRequest( {  
                    id: Math.floor(Math.random()  * 1000000).toString(),
                    srcAddr: srcSockAddr.address, 
                    srcPort: srcSockAddr.port.toString(), 
                    dstAddr: reqUrl.host.split(':')[0], 
                    dstPort: reqUrl.port, 
                }, accept, deny ) 
            });
            
            this.proxy.on('clientError', (err, clientSocket) => {
              console.log('client error: ' + err);
              console.log('client errorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr ');
              clientSocket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            });
            
            this.proxy.listen(this.config.port , () => {
                console.log(`http proxy server listening to: ${this.config.port}`);
                this.listening = true;
                resolve();
            });
        })
    } 
 
    handleOptionsRequest = (clientReq, clientRes) => {
        
        let reqUrl = url.parse(clientReq.url);
        log('options proxy for http request: ' + reqUrl.href);
      
        let options = {
            host: reqUrl.hostname,
            port: reqUrl.port,
            path: reqUrl.path,
            method: clientReq.method,
            headers: clientReq.headers,
            agent: this.sshClient.httpAgent
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

    
    onSocketClosed(info, type){   
        log2console(`http client socket ${type}, id: ${info.id}, sockets: ` , this.openSockets.size); 
        this.openSockets.delete(info.id); 
        this.stats.sockets = this.openSockets.size;
    }

    handleHttpRequest = (info, accept, deny) => {
        log(`request ${info.srcAddr}:${info.srcPort} ===> ${info.dstAddr}:${info.dstPort}`);   
        
        const { clientSocket, clientRequest, head} = accept();

        clientSocket.on('close', () => this.onSocketClosed(info, 'close'));   
        clientSocket.on('end', () => this.onSocketClosed(info, 'end')); 
        clientSocket.on('finish', () => this.onSocketClosed(info, 'finish'));
        clientSocket.on('timeout', () => this.onSocketClosed(info, 'timeout')); 
 
        if(!this.sshClient.conn || !this.sshClient.isOpen){
            clientSocket.end();
            return;
        }
        this.openSockets.set(info.id, {socket: clientSocket, info}); 
        this.stats.sockets = this.openSockets.size;
           
        this.sshClient.conn.forwardOut(info.srcAddr, info.srcPort, info.dstAddr, info.dstPort,
            (err, resultStream) => {
                
                log(`transmit ${info.srcAddr}:${info.srcPort} <=== ${info.dstAddr}:${info.dstPort}`);   

                if (err) { 
                    log('error exception', err);
                    return deny();
                    // return;
                } 
                clientSocket.write('HTTP/' + clientRequest.httpVersion + ' 200 Connection Established\r\n' +
                    'Proxy-agent: Turoxy\r\n' +
                        '\r\n', 'UTF-8', () => {
                    // creating pipes in both ends
                    resultStream.write(head);
                    resultStream.pipe(clientSocket);
                    clientSocket.pipe(resultStream);
                }); 
 
                try {  
                    clientSocket.on('data', data => {  
                        this.stats.sent += data.length 
                    });
                    resultStream.on('data', data => {   
                        this.stats.received += data.length  
                    });
                } catch (ex) {
                    log('exception', ex);
                } 
        }); 

    }
     
    stop() {
        return new Promise(async (resolve, reject) => { 
            this.dead = true;
            log(`http open sockets: ${this.openSockets.size}`);
            this.openSockets.forEach((item, key, map) => {
                log(`closing http socket ${key}, ${item.info.dstAddr + ':' + item.info.dstPort}`);
                item.socket.end()
            })
            this.openSockets.clear();
            // await waitFor(() => this.openSockets.size == 0)

            if(this.proxy == null) {  
                resolve()
                return ;
            }
            this.proxy.close()
            resolve()

        }) 
    }
}

module.exports = HttpProxyServer;