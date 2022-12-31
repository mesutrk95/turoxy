import React, { useEffect, useState } from 'react'

import styles from './AddServer.module.scss' 
import uiEventDispatcher from '../ui-event-dispatcher' 

export default function AddServer() {
     
    const [host, setHost] = useState('')
    const [port, setPort] = useState('')
    const [user, setUser] = useState('')

    const [authMethod, setAuthMethod] = useState('basic')
    const [basicAuthUser, setBasicAuthUser] = useState('')
    const [basicAuthPass, setBasicAuthPass] = useState('') 
    const [privateKeyPath, setPrivateKeyPath] = useState('') 
 
    useEffect(() => {
        const handler = uiEventDispatcher.listen('select-file-result', (files)=>{
            console.log(files);
            setPrivateKeyPath(files[0])
        })

        return () => {
            handler.unregister();
        }
    }, [])

    function selectFile(){
        uiEventDispatcher.send('select-file-dialog') 
         
    }

    function addServer(){
        const newServer = { 
            host, 
            port, 
            user, 
            auth: { 
                method: authMethod
            } 
        }
        if(authMethod == 'basic'){
            newServer.auth.username = basicAuthUser;
            newServer.auth.password = basicAuthPass; 
        } else if ( authMethod == 'pubkey'){  
            newServer.auth.privateKey = privateKeyPath; 
        }
        uiEventDispatcher.send('new-server', newServer)  
    }

    function handleAuthMethodChange(e){ 
        console.log(e.target.value);
        setAuthMethod(e.target.value)
    }

    return (
        <div className={`${styles.addServer} p-3`}>
            <h3 className="mb-4">New SSH Connection</h3>
            <div className="row">
                <div className="input-group mb-2">
                    <span className={`${styles.caption} input-group-text`} id="hostname">Host</span>
                    <input type="text" className="form-control" placeholder="SSH Hostname ..." 
                            value={host} onChange={e => setHost(e.target.value)} />
                </div> 
                <div className="input-group mb-2">
                    <span className={`${styles.caption} input-group-text`} id="hostname">Port</span>
                    <input type="text" className="form-control" placeholder="SSH Port ..." 
                        value={port} onChange={e => setPort(e.target.value)}/>
                </div>  
                <div className="input-group mb-2">
                    <span className={`${styles.caption} input-group-text`} id="user">User</span>
                    <input type="text" className="form-control" placeholder="SSH User (root) ..." 
                        value={user} onChange={e => setUser(e.target.value)}/>
                </div>  
            </div> 
            <div className="row py-3">
                <div className="col-auto text-start" >
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
                                id="defaultCheck2"/>
                        <label className="form-check-label" htmlFor="defaultCheck2">
                            Public-key Authentication
                        </label>
                    </div>

                </div>
            </div>
            <div className={`row mt-3 ${authMethod == 'basic'? 'd-block': 'd-none'}`}  >
                <div className="input-group mb-2">
                    <span className={`${styles.caption} input-group-text`} id="username">Username</span>
                    <input type="text" className="form-control" placeholder="Auth Username ..." 
                            value={basicAuthUser} onChange={e=> setBasicAuthUser(e.target.value)}/>
                </div> 
                <div className="input-group mb-2">
                    <span className={`${styles.caption} input-group-text`} id="password">Password</span>
                    <input type="text" className="form-control" placeholder="Auth Password ..."
                            value={basicAuthPass} onChange={e=> setBasicAuthPass(e.target.value)}/>
                </div>  
            </div> 
            
            <div className={`row mt-3 ${authMethod == 'pubkey'? 'd-block': 'd-none'}`}  >
                 
                <div class="input-group mb-3">
                    <button class="btn btn-secondary" type="button" onClick={ e => selectFile() }>Select File</button>
                    <input type="text" className="form-control" placeholder="Private key file ..." value={privateKeyPath}/> 
                </div>
 
            </div> 
            
            <div className="row mt-3">
                <div className="col-auto text-center">
                    <div className="btn btn-primary" onClick={e => addServer()}>Add Server</div>
                </div>
            </div>
        </div>
    )
}
