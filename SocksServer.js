const socks = require('socksv5');

class SocksServer {

    onRequest;

    constructor(config){
        this.config = config;
    }

    stop() {
        return new Promise((resolve, reject) => {
            if(this.socksServer == null) return;
            this.socksServer.close(()=>{
                resolve()
            })
        }) 
    }

    start() {
        return new Promise((resolve, reject) => {
            this.socksServer = socks.createServer((info, accept, deny) => this.onRequest(info, accept, deny))
        
            this.socksServer.listen(this.config.port, this.config.host, () => {
                console.log('SOCKSv5 proxy server started on ' + socksServer.host + ':' + socksServer.port);
                resolve()
            }).useAuth(socks.auth.None()); 
        })
    }
}

module.exports = SocksServer;