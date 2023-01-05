import React, { useEffect, useState } from 'react'

import styles from './MainPage.module.scss' 
import uiEvent from '../ui-event-dispatcher' 
import { useDialog } from '../DialogProvider'

import { TrashIcon, PencilIcon, PlugIcon, ZapIcon, CodespacesIcon } from '@primer/octicons-react'

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
 
    function onConnect(server){ 
        uiEvent.send('connect-server', { time : server.time });
    }

    return (
        <div className={`${styles.mainPage} p-0`}> 
            <div className='page-header'> 
                <h6 className="mb-0 muted">Configurations</h6>
                <h3 className="mb-0">SSH Tunnels</h3>
            </div>
            <div className='p-3'>
            {
                servers.map(server => (
                    <div key={server.time} className={` ${styles.serverItem}`}>
                        <div className="col-auto ps-4 d-flex align-items-center" onClick={e => onConnect(server)}>  
                            <CodespacesIcon size={24}/>
                        </div> 
                        <div className="col ps-3 py-3" onClick={e => onConnect(server)}>
                            <h5 className="m-0">
                                {server.label} 
                            </h5>
                            <h6 className={`mb-0 ${styles.ip}`}>{server.host}:{server.port}</h6>
                        </div>
                        <div className="col-auto d-flex align-items-center px-4" onClick={e => props.onEdit(server)}> 
                            <PencilIcon size={24}/> 
                        </div> 
                    </div>
                ))
            }

            </div>
        </div>
    )
}
