const fs = require("fs");
const path = require("path");
const net = require("net");
const url = require("url");
const os = require("os");
const HttpProxyServer = require("./HttpProxyServer");
const SSHClient = require("./SSHClient");
const SSHProxy = require("./SSHProxy");

const DATA_FILE_PATH = path.join(path.join(os.homedir(), '/Documents/turoxy/tunnels.json') )

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

    let sshProxy = new SSHProxy({ ssh , httpProxy : { host: '127.0.0.1', port : 54610 }});
    await sshProxy.start()
 
  
}
main()