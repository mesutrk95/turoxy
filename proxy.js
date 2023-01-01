const fs = require("fs");
const path = require("path");
const net = require("net");
const url = require("url");
const HttpProxyServer = require("./HttpProxyServer");
const SSHClient = require("./SSHClient");

const DATA_FILE_PATH = path.join(__dirname , 'config.json')

let allServers = [];
if(fs.existsSync(DATA_FILE_PATH)){
  allServers = JSON.parse(fs.readFileSync(DATA_FILE_PATH)) 
}

async function main(){
    const selectedServer = allServers[1];
    const ssh = {
      host: selectedServer.host,
      port: selectedServer.port,
      username: selectedServer.user,
      keepaliveInterval: 30000,
      //   debug: (s) => {console.log(s)} 
    }
    if(selectedServer.auth.method == 'pubkey'){
      ssh.privateKey = selectedServer.auth.privateKey  
    }else if(selectedServer.auth.method == 'basic'){
      ssh.password = selectedServer.auth.password  
    }

    let openSockets = new Map();
    let stats = new Map();

    let sshClient = new SSHClient(ssh);
    await sshClient.connect()

    let httpProxy = new HttpProxyServer()
    await httpProxy.start()

    httpProxy.onRequest = (info, accept, deny, head) => {
         
        console.log(`request ${info.srcAddr}:${info.srcPort} ===> ${info.dstAddr}:${info.dstPort}`); 
     
        sshClient.conn.forwardOut(info.srcAddr, info.srcPort, info.dstAddr, info.dstPort,
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
 
                openSockets.set(info.srcPort, clientSocket);

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
                            openSockets.delete(info.srcPort)
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
main()