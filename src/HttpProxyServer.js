
const httpProxy = require('http-proxy');

const net = require('net');
const http = require('http');
const url = require('url'); 
// const findProcess = require('find-process');

const { EventEmitter } = require('stream');
 

class HttpProxyServer extends EventEmitter {

    onRequest;
    listening = false;

    constructor(config){
        super();
        this.config = config;
    }

    get status()  { 
        return this.listening ? 'started' : 'not-started'
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
            
            this.proxy = http.createServer((req, res) => 
            {
                if(this.onOptionsRequest) this.onOptionsRequest(req, res)
                // this.httpOptions(req, res)
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
                     
                } 
            });
            
            this.proxy.on('clientError', (err, clientSocket) => {
              console.log('client error: ' + err);
              clientSocket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            });
            
            this.proxy.listen(this.config.port , () => {
                console.log(`http proxy server listening to: ${this.config.port}`);
                this.listening = true;
                resolve();
            });
        })
    } 

    httpOptions(clientReq, clientRes) { 
  

        let reqUrl = url.parse(clientReq.url);
        console.log('options proxy for http request: ' + reqUrl.href);
      
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