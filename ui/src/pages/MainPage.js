import React, { useEffect, useState } from 'react'

import styles from './MainPage.module.scss' 
import uiEventDispatcher from '../ui-event-dispatcher' 

export default function MainPage(props) {
     
    const [servers, setServers] = useState([])   
 
    useEffect(() => { 
        setServers([{ 
            host: '2.56.210.25', 
            port: '8080', 
            user : 'ubuntu', 
            label: 'My Turk server',
            auth: { 
                method: 'basic'
            } 
        },{ 
            host: '2.56.210.25', 
            port: '80', 
            user : 'ubuntu', 
            label: 'My Turk server 1',
            auth: { 
                method: 'basic'
            } 
        }])
        return () => { 
        }
    }, [])
 

    return (
        <div className={`${styles.mainPage} p-3`}> 
            <h4>SSH Tunnels</h4>
            {
                servers.map(server => (
                    <div className={styles.serverItem}>
                        <h5 className="m-0">
                            {server.label} 
                            <small className={styles.ip}>({server.host}:{server.port})</small>
                        </h5>
                        <div>
                            <div className="btn btn-primary mt-2">Connect</div>    
                            <div className="btn btn-success mt-2 ms-2">Edit</div>    
                        </div>
                        
                    </div>
                ))
            }
        </div>
    )
}
