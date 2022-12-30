const socks = require('socksv5'); 
const { readFileSync } = require('fs');
const { Client } = require('ssh2');
const regedit = require('regedit').promisified 

const privateKey = readFileSync('C:/Users/MRK/Downloads/german-key-openssh.pem', 'utf8')


const conn = new Client();
conn.on('ready', async () => {
    console.log('Client :: ready');    

    await regedit.putValue({
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings': {
            ProxyEnable: {
                value:  1,
                type: 'REG_DWORD'
            } 
        } 
    }) 
    await regedit.putValue({
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings': { 
            ProxyServer: {
                value: 'http://socks=localhost:54612',
                type: 'REG_SZ'
            },
            ProxyOverride: {
                value: 'localhost;127.*;10.*;172.16.*;172.17.*;172.18.*;172.19.*;172.20.*;172.21.*;172.22.*;172.23.*;172.24.*;172.25.*;172.26.*;172.27.*;172.28.*;172.29.*;172.30.*;172.31.*;192.168.*',
                type: 'REG_SZ'
            }
        } 
    }) 

    socks.createServer((info, accept, deny) => {
    
        conn.forwardOut(info.srcAddr, info.srcPort,
            info.dstAddr,
            info.dstPort,
            (err, stream) => {
                console.log(`${info.srcAddr}:${info.srcPort} ===> ${info.dstAddr}:${info.dstPort}`);   

                if (err) {
                    conn.end();
                    return deny();
                }

                const clientSocket = accept(true);
                if (clientSocket) {
                    stream.pipe(clientSocket).pipe(stream).on('close', () => {
                        conn.end();
                    });
                } else {
                    conn.end();
                }
        });

    }).listen(54612, '0.0.0.0', () => {
        console.log('SOCKSv5 proxy server started on port 54612');
    }).useAuth(socks.auth.None());

}).connect({
    host: '3.126.153.90',
    port: 22,
    username: 'ubuntu',
    privateKey,
    //   debug: (s) => {console.log(s)} 
    keepaliveInterval: 50000, 
});
 


conn.addListener('close', ()=>{

});