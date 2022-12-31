import React, { useEffect, useState } from 'react'

import styles from './ConnectionStatus.module.scss' 
import uiEvent from '../ui-event-dispatcher' 
import { useDialog } from '../DialogProvider' 

export default function ConnectionStatus(props) {
      
    const [connStatus, setConnStatus] = useState({  }) 
    const [stats, setStats] = useState({  }) 

    useEffect(() => {  
        let handler1 = uiEvent.listen('ssh-connection', (conn) => {
            setConnStatus(conn.status)
            console.log(conn);
        });
        let handler2 = uiEvent.listen('connection-stats', (stats) => {
            setStats(stats)
        });
        
        return () => { 
            handler1.unregister()
            handler2.unregister()
        }
    }, []) 

    function disconnect() {
        uiEvent.send('ssh-disconnect');
    }

    return (
        <div className={`${styles.addServer} p-3`}> 
            <h3 className="mb-4">Connection Status</h3>  
            {JSON.stringify(connStatus)}
            {
                connStatus && 
                <div>
                    <h5>SSH Connection : {connStatus.ssh}</h5> 
                    <h5>Socks Server : {connStatus.socks}</h5>
                </div>
            }
            <div className='row mt-4'>
                <div className='col'><h6>Sent : {Math.floor(stats.send / 1024)} KB</h6></div>
                <div className='col'><h6>Received : {Math.floor(stats.receive / 1024)} KB</h6></div>
            </div>
            
            <div className='row mt-4'>
                <div>
                    <span className='btn btn-danger' onClick={e=> disconnect()}>Disconnect</span>
                </div>
            </div>
        </div>
    )
}
