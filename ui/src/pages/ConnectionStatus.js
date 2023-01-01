import React, { useEffect, useState } from 'react'

import styles from './ConnectionStatus.module.scss' 
import uiEvent from '../ui-event-dispatcher' 
import { useDialog } from '../DialogProvider' 

const MEGABYTE = 1024 * 1024
const KILOBYTE = 1024 

function autoSizeAdjust(size){
    if(size > MEGABYTE)
        return Math.floor(size / MEGABYTE) + ' MB'; 
    if(size > 1024)
        return Math.floor(size / KILOBYTE) + ' KB'; 
    else  
        return size + ' Bytes';  
}
function autoSpeedSizeAdjust(amount){
    if(amount > MEGABYTE)
        return (amount / MEGABYTE).toFixed(2) + ' Mbps'; 
    if(amount > KILOBYTE)
        return (amount / KILOBYTE).toFixed(1) + ' Kbps'; 
    else  
        return Math.floor(amount) + ' Bps';  
}

export default function ConnectionStatus(props) {
      
    const [conn, setConn] = useState({  }) 
    const [stats, setStats] = useState({  }) 

    useEffect(() => {  
        let handler1 = uiEvent.listen('ssh-connection', (conn) => {
            setConn(conn)  
        });
        let handler2 = uiEvent.listen('connection-stats', (stats) => {
            setStats({
                sent : autoSizeAdjust(stats.sent), 
                received: autoSizeAdjust(stats.received),
                uploadSpeed : autoSpeedSizeAdjust(stats.speed.upload), 
                downloadSpeed: autoSpeedSizeAdjust(stats.speed.download),

            })
        });
        uiEvent.send('ssh-connection')
        
        return () => { 
            handler1.unregister()
            handler2.unregister()
        }
    }, [uiEvent.time]) 

    function disconnect() {
        uiEvent.send('ssh-disconnect');
    }

    return (
        <div className={`${styles.addServer} p-3`}>  
            <h3 className="mb-4">Connection Status</h3>   
            {
                conn && conn.server && 
                <div>
                    <h5>Server : {conn.server.host}:{conn.server.port}</h5>  
                </div>
            }
            {
                conn && conn.status && 
                <div> 
                    <h5>SSH Connection : {conn.status.ssh}</h5> 
                    <h5>Socks Server : {conn.status.socks}</h5>
                </div>
            }
            <div className='row mt-4'>
                <div className='col'><h6>Total Sent : {stats.sent}</h6></div>
                <div className='col'><h6>Total Received : {stats.received}</h6></div>
            </div>
            <div className='row mt-4'>
                <div className='col'><h6>Upload<br/> {stats.uploadSpeed}</h6></div>
                <div className='col'><h6>Download<br/> {stats.downloadSpeed}</h6></div>
            </div>
            
            <div className='row mt-4'>
                <div>
                    <span className='btn btn-danger' onClick={e=> disconnect()}>Disconnect</span>
                </div>
            </div>
        </div>
    )
}
