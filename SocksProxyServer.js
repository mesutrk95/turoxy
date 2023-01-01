const socks = require('socksv5');

class SocksProxyServer {

    onRequest;
    listening = false;

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
            this.socksServer = socks.createServer((info, accept, deny) => this.onRequest(info, accept, deny))
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
}

module.exports = SocksProxyServer;