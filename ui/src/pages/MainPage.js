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
            <h6 className="mb-0 text-muted">Configurations</h6>
            <h3 className="mb-3">SSH Tunnels</h3>
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
    )
}
