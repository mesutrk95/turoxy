
const httpProxy = require('http-proxy');

const net = require('net');
const http = require('http');
const url = require('url');
 

class HttpProxyServer {

    onRequest;
    listening = false;

    constructor(config){
        this.config = config;
    }

    get status()  { 
        return 'sssss'
    } 

    // async createSocket(){
    //     return new Promise((resolve, reject) => { 

    //         let srv = net.createServer(sock => { 
    //             sock.on('data', (data)=> {
    //                 console.log(data.length);
    //             })
    //         });
    //         srv.listen(0, '127.0.0.1', () => {  
    //             let socket = new net.Socket();
    //             socket.connect(srv.address().port, '127.0.0.1', () => { 
    //                 resolve(socket)
    //             });
    //         }); 

    //     })
    // }

    start() {
        return new Promise((resolve, reject) => {
            // this.proxy = httpProxy.createProxyServer(options); 
            
            this.proxy = http.createServer((req, res) => this.httpOptions(req, res));
            
            // handle https proxy requests (CONNECT method)
            this.proxy.on('connect', async (clientRequest, clientSocket, head) => {
                
                if(this.onRequest) { 

                    let reqUrl = url.parse('https://' + clientRequest.url);   

                    function accept(intercept){  
                        
                        return { clientSocket, head, clientRequest };
                    }
                    async function deny(){  
                        clientSocket.end()
                    }
                    this.onRequest(
                        {  
                            srcAddr: clientSocket.address().address, 
                            srcPort: clientSocket.address().port.toString(), 
                            dstAddr: reqUrl.host.split(':')[0], 
                            dstPort: reqUrl.port, 
                        }, accept, deny )
                    
                    // const startTime = new Date().getTime();
                    // const socket = await this.createSocket()
                    // console.log('new socket in ', (new Date().getTime() - startTime) + 'ms, ', socket.address().port);

                    // function accept(){ 
                    //     socket.on('data', data => {
                    //         console.log(data);
                    //     }).on('close' , ()=>{
                    //         console.log('close');
                    //     })
                    //     return socket;
                    // }
                    // async function deny(){ 
                    //     socket.end();
                    //     clientSocket.end()
                    // }
                    // let reqUrl = url.parse('https://' + clientReq.url);  
                    // this.onRequest(
                    //     { 
                    //         srcAddr: socket.address().address, 
                    //         srcPort: socket.address().port.toString(), 
                    //         dstAddr: reqUrl.host.split(':')[0], 
                    //         dstPort: reqUrl.port, 
                    //     }, 
                    //     accept, deny)
                }
                return;

                let reqUrl = url.parse('https://' + clientRequest.url);
                console.log('proxy for https request: ' + reqUrl.href + '(path encrypted by ssl)');
            
                let options = {
                    port: reqUrl.port,
                    host: reqUrl.hostname
                };

            
                // create socket connection for client, then pipe (redirect) it to client socket
                let serverSocket = net.connect(options, () => {
                    clientSocket.write('HTTP/' + clientReq.httpVersion + ' 200 Connection Established\r\n' +
                                'Proxy-agent: Node.js-Proxy\r\n' +
                                '\r\n', 'UTF-8', () => {
                    // creating pipes in both ends
                    serverSocket.write(head);
                    serverSocket.pipe(clientSocket);
                    clientSocket.pipe(serverSocket);
                });
                });
            
                clientSocket.on('error', (e) => {
                    console.log("client socket error: " + e);
                    serverSocket.end();
                });
            
                serverSocket.on('error', (e) => {
                    console.log("forward proxy server connection error: " + e);
                    clientSocket.end();
                });
            });
            
            this.proxy.on('clientError', (err, clientSocket) => {
              console.log('client error: ' + err);
              clientSocket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            });
            
            this.proxy.listen(this.config.port , () => {
                console.log(`http proxy server listening to: ${this.config.port}`);
                resolve();
            });
        })
    } 

    httpOptions(clientReq, clientRes) { 
        
        let reqUrl = url.parse(clientReq.url);
        // console.log('options proxy for http request: ' + reqUrl.href);
      
        let options = {
          hostname: reqUrl.hostname,
          port: reqUrl.port,
          path: reqUrl.path,
          method: clientReq.method,
          headers: clientReq.headers
        };
      
        // create socket connection on behalf of client, then pipe the response to client response (pass it on)
        let serverConnection = http.request(options, function (res) {
          clientRes.writeHead(res.statusCode, res.headers)
          res.pipe(clientRes);
        });
      
        clientReq.pipe(serverConnection);
      
        clientReq.on('error', (e) => {
          console.log('client socket error: ' + e);
        });
      
        serverConnection.on('error', (e) => {
          console.log('server connection error: ' + e);
        });
    }
    stop() {
        return new Promise((resolve, reject) => {
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