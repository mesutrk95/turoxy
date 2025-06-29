
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
const { log, log2console } = require('./log');

class SSHProxy extends EventEmitter{
 
    statesIntervalHandler
    stats = {
        startTime: 0,
        sent: 0,
        received: 0,
        speed: {
            download : 0,
            upload: 0,
        },
        sockets:{
            socks: 0,
            http: 0
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
                    this.stats.sent = (this.httpProxy?.stats.sent || 0) + (this.socksProxy?.stats.sent || 0)
                    this.stats.received = (this.httpProxy?.stats.received || 0) + (this.socksProxy?.stats.received || 0)

                    const diffDownload = this.stats.received - lastStats.received
                    const diffUpload = this.stats.sent - lastStats.sent 
                    lastStats = { sent : this.stats.sent, received: this.stats.received }
                    lastCheckedNetworkSpeed = now;
                    this.stats.speed.download = 1024 * diffDownload / dt;
                    this.stats.speed.upload = 1024 * diffUpload / dt; 
                    this.stats.speed.time = now; 
                    this.stats.sockets.socks = this.socksProxy?.stats.sockets || 0;
                    this.stats.sockets.http = this.httpProxy?.stats.sockets || 0; 
                // }
            }

            
            this.emit("stats", this.stats); 
        }, 500); 

        this.emitStatus();
        this.sshClient = new SSHClient(this.config.ssh);
        this.sshClient.on('status', (status) =>{
            this.emitStatus();
        })
        
        this.sshClient.connect(); 

        if(this.config?.socksProxy?.enable){
            this.emitStatus(); 
            this.socksProxy = new SocksProxyServer(this.config.socksProxy); 
            this.socksProxy.setSSHClient(this.sshClient)
            await this.socksProxy.start();   
        }
        
        if(this.config?.httpProxy?.enable){
            this.emitStatus();
            this.httpProxy = new HttpProxyServer(this.config.httpProxy);
            this.httpProxy.setSSHClient(this.sshClient) 
            await this.httpProxy.start();   
        } 
        
        this.emitStatus();
        await this.enableSystemProxy();   
    }

    async stop(){
        clearInterval(this.statesIntervalHandler) 

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
        const asDefaultSystemProxy = this.config.asDefaultSystemProxy || true;
        if(!asDefaultSystemProxy) return;

        try {
            log('setting registry keys.');
            
            if(process.platform === "win32"){   
                await exec('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f')
            
            } else if(process.platform === 'linux') {
                await exec(`gsettings set org.gnome.system.proxy mode 'none'`)
            } else if (process.platform === 'darwin'){
                await exec(`networksetup -setsecurewebproxystate wi-fi off`)
                await exec(`networksetup -setwebproxystate wi-fi off`)
            }
        } catch(ex){
            log2console(ex.toString())
        }

    }
    async enableSystemProxy(){ 

        const asDefaultSystemProxy = this.config.asDefaultSystemProxy || true;
        if(!asDefaultSystemProxy) return;

        try{
            log('setting registry keys.');

            if(process.platform === "win32"){ 
    
                let proxyUrl = '';
                if(this.config.httpProxy){
                    proxyUrl = this.config.httpProxy.host + ':' + this.config.httpProxy.port
                } else if(this.config.socksProxy) {
                    proxyUrl = 'socks=' + this.config.socks.host + ':' + this.config.socks.port
                }
                let proxyOverride = 'localhost;127.*;10.*;172.16.*;172.17.*;172.18.*;172.19.*;172.20.*;172.21.*;172.22.*;172.23.*;172.24.*;172.25.*;172.26.*;172.27.*;172.28.*;172.29.*;172.30.*;172.31.*;192.168.*';
        
                await exec('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f')
                await exec(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d ${proxyUrl} /f`)
                await exec(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyOverride /t REG_SZ /d ${proxyOverride} /f`)
        
            } else if(process.platform === 'linux') { 
                await exec(`gsettings set org.gnome.system.proxy.http host '${this.config.httpProxy.host}'`)
                await exec(`gsettings set org.gnome.system.proxy.http port ${this.config.httpProxy.port}`)
                await exec(`gsettings set org.gnome.system.proxy mode 'manual'`) 

                await exec(`gsettings set org.gnome.system.proxy.https host '${this.config.httpProxy.host}'`)
                await exec(`gsettings set org.gnome.system.proxy.https port ${this.config.httpProxy.port}`)
                await exec(`gsettings set org.gnome.system.proxy mode 'manual'`)  

            } else if (process.platform === 'darwin'){
                
                await exec(`networksetup -setwebproxystate wi-fi on`) 
                await exec(`networksetup -setsecurewebproxystate wi-fi on`) 
                await exec(`networksetup -setwebproxy wi-fi ${this.config.httpProxy.host} ${this.config.httpProxy.port}`) 
                await exec(`networksetup -setsecurewebproxy wi-fi ${this.config.httpProxy.host} ${this.config.httpProxy.port}`)
            }
        } catch (ex){
            log2console(ex.toString())
        }
 
    } 
    
} 

module.exports = SSHProxy;
