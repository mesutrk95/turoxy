import React, { useEffect, useState } from 'react'

import styles from './ConnectionStatus.module.scss' 
import uiEvent from '../ui-event-dispatcher' 
import { useDialog } from '../DialogProvider' 

export default function ConnectionStatus(props) {
     
    const [label, setLabel] = useState('') 

    useEffect(() => {  
        return () => { 
        }
    }, []) 

    return (
        <div className={`${styles.addServer} p-3`}> 
            <h3 className="mb-4">Connection Status</h3>  
        </div>
    )
}
