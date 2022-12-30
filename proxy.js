const socks = require('socksv5');
const { readFileSync } = require('fs');
const { Client } = require('ssh2');
const regedit = require('regedit').promisified

const sshServer = {
    host: '3.126.153.90',
    port: 22,
    username: 'ubuntu',
    privateKey: readFileSync('C:/Users/MRK/Downloads/german-key-openssh.pem', 'utf8'),
    keepaliveInterval: 50000,
    //   debug: (s) => {console.log(s)} 
};

const socksServer = {
    host: '127.0.0.1',
    port: 54612
}
try {

    // const conn = new Client();
    // conn.on('ready', async () => {
        // console.log('connected to ssh server => ' + sshServer.host + ':' + sshServer.port);

        regedit.putValue({
            'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings': {
                ProxyEnable: { value: 1, type: 'REG_DWORD' }
            }
        })
        regedit.putValue({
            'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings': {
                ProxyServer: {
                    value: 'socks=' + socksServer.host + ':' + socksServer.port, type: 'REG_SZ'
                },
                ProxyOverride: {
                    value: 'localhost;127.*;10.*;172.16.*;172.17.*;172.18.*;172.19.*;172.20.*;172.21.*;172.22.*;172.23.*;172.24.*;172.25.*;172.26.*;172.27.*;172.28.*;172.29.*;172.30.*;172.31.*;192.168.*',
                    type: 'REG_SZ'
                }
            }
        })

        const socksInstance = socks.createServer((info, accept, deny) => {
            console.log(`request ${info.srcAddr}:${info.srcPort} ===> ${info.dstAddr}:${info.dstPort}`);   

            var conn = new Client();
            conn.on('ready', function () {
                conn.forwardOut(info.srcAddr,
                    info.srcPort,
                    info.dstAddr,
                    info.dstPort,
                    function (err, stream) {
                        if (err) {
                            console.log(err);
                            conn.end();
                            return deny();
                        }

                        var clientSocket;
                        if (clientSocket = accept(true)) {
                            stream.pipe(clientSocket).pipe(stream).on('close', function () {
                                conn.end();
                            });
                        } else
                            conn.end();
                    });
            }).on('error', function (err) {
                deny();
                console.log(err);
            }).connect(sshServer);

            // conn.forwardOut(info.srcAddr, info.srcPort,
            //     info.dstAddr,
            //     info.dstPort,
            //     (err, resultStream) => {

            //         console.log(`request ${info.srcAddr}:${info.srcPort} ===> ${info.dstAddr}:${info.dstPort}`);   

            //         if (err) { 
            //             console.log('error exception', err);
            //             return deny();
            //             // return;
            //         }

            //         const clientSocket = accept(true);
            //         if (clientSocket) { 
            //             try { 
            //                 // resultStream.pipe(clientSocket).on('data', (data)=>{
            //                 //     console.log(data);
            //                 // })
            //                 resultStream
            //                     .pipe(clientSocket)
            //                     .pipe(resultStream)
            //                          .on('error', () => { 
            //                              console.log(`error.`);   
            //                          })   
            //                          .on('close', () => { 
            //                              console.log(`transmitted.`);   
            //                          });
            //             } catch (ex) {
            //                 console.log('exceeeeeeeeeeeeeeeeption', ex);
            //             }
            //         } else { 

            //         } 
            // });

        })

        socksInstance
            .listen(socksServer.port, socksServer.host, () => {
                console.log('SOCKSv5 proxy server started on ' + socksServer.host + ':' + socksServer.port);
            })
            .useAuth(socks.auth.None());


    // }).connect(sshServer);



    // conn.on('close', () => {
    //     console.log('clooooooooooooooooooooooooooooooooooooooooosed');
    // });
    // conn.on('error', () => {
    //     console.log('errorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr');
    // });
    // conn.on('end', () => {
    //     console.log('enddddddddddddddddddddddddddddddddddddddddddddd');
    // });
} catch (ex2) {
    console.log('exceeeeeeeeeeeeeeeeption1', ex2);
}

process.on('uncaughtException', function (error) { })

