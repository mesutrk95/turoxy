import React, { useEffect, useState } from 'react'

import styles from './AppConfig.module.scss' 
import uiEvent from '../ui-event-dispatcher' 
import { useDialog } from '../DialogProvider' 

export default function AppConfig(props) {
 
    const dialog = useDialog();
    const [label, setLabel] = useState(props.server?.label || '') 
 
    useEffect(() => {  
        return () => { 
        }
    }, [])
 
    return (
        <div className={`${styles.addServer} p-3`}> 
            {/* <h6 className="mb-0 text-muted">Configuration</h6> 
            <h3 className="mb-4">{!editMode ? 'New' : 'Edit'} SSH Tunnel</h3> 
            <div className="row">
                <div className="input-group mb-2">
                    <span className={`${styles.caption} input-group-text`} id="hostname">Host</span>
                    <input type="text" className="form-control" placeholder="SSH Hostname ..." 
                            value={host} onChange={e => setHost(e.target.value)} />
                </div>  
            </div> 
            <div className="row pt-3">
                <div className="col-auto text-start" >
                    <div className="form-check">
                        <input className="form-check-input" name="authentication" type="radio" value="none" 
                                onChange={handleAuthMethodChange} defaultChecked={authMethod == 'none'}
                                id="defaultCheck0"   />
                        <label className="form-check-label  " htmlFor="defaultCheck0">
                            No Authentication
                        </label>
                    </div>
                    <div className="form-check">
                        <input className="form-check-input" name="authentication" type="radio" value="basic" 
                                onChange={handleAuthMethodChange} defaultChecked={authMethod == 'basic'}
                                id="defaultCheck1"   />
                        <label className="form-check-label  " htmlFor="defaultCheck1">
                            Basic Authentication
                        </label>
                    </div>
                    <div className="form-check">
                        <input className="form-check-input" name="authentication" type="radio" value="pubkey" 
                                onChange={handleAuthMethodChange}  defaultChecked={authMethod == 'pubkey'}
                                id="defaultCheck3"/>
                        <label className="form-check-label" htmlFor="defaultCheck3">
                            Public-key Authentication
                        </label>
                    </div>

                </div>
            </div>
              */}
            
            <div className="row mt-5">
                <div className="col-auto text-center">
                    <div className="btn-glass" onClick={e => props.back()}>Cancel</div> 
                </div>
                <div className="col text-center d-flex justify-content-end"> 
                    <div className="btn-glass" >Save</div>
                </div>
            </div>
        </div>
    )
}
