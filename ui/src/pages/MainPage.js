import React, { useEffect, useState } from 'react'

import styles from './MainPage.module.scss' 
import uiEvent from '../ui-event-dispatcher' 
import { useDialog } from '../DialogProvider'

export default function MainPage(props) {
     
    const [servers, setServers] = useState([])   
    const dialog = useDialog()   
 
    useEffect(() => { 
        uiEvent.send('get-all-servers');
        
        const handler = uiEvent.listen('all-servers', (data)=>{
            console.log('all-servers', data);
            setServers(data) 
        })

        return () => {  
            handler.unregister();
        }
    }, [])

    function onDelete(server){
        dialog.confirm('Confirm Operation', `Are you sure about deleting the '${server.label}' tunnel configuration?`, 
            null , (result)=>{
                if(result.status == 'yes'){
                    console.log('confirmed');
                    
                    uiEvent.send('delete-server', { time : server.time });
                    const handler = uiEvent.listen('server-deleted', ()=>{
                        handler.unregister();

                        uiEvent.send('get-all-servers');
                    })


                }
            })
    }
 
    function onConnect(server){ 
        uiEvent.send('connect-server', { time : server.time });
    }

    return (
        <div className={`${styles.mainPage} p-3`}> 
            <h4>SSH Tunnels</h4>
            {
                servers.map(server => (
                    <div key={server.time} className={styles.serverItem}>
                        <h5 className="m-0">
                            {server.label} 
                            <small className={styles.ip}>({server.host}:{server.port})</small>
                        </h5>
                        <div className='row'>
                            <div className='col'> 
                                <div className="btn btn-sm btn-danger mt-2" 
                                    onClick={ e => onDelete(server) }>Delete</div>    
                                <div className="btn btn-sm btn-secondary mt-2 ms-2">Edit</div>    
                            </div>
                            <div className='col d-flex justify-content-end'> 
                                <div className="btn btn-sm btn-primary mt-2 ms-2" 
                                    onClick={e => onConnect(server)}>Connect</div>   
                            </div>
   
                        </div> 
                    </div>
                ))
            }
        </div>
    )
}
