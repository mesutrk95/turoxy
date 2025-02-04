import React, { useEffect, useState } from 'react'

import styles from './AddServer.module.scss' 
import uiEventDispatcher from '../ui-event-dispatcher' 
import { useDialog } from '../DialogProvider' 

function isPrivateKey(content){
    if(content.indexOf('-----BEGIN RSA PRIVATE KEY-----') > -1 &&
        content.indexOf('-----END RSA PRIVATE KEY-----') > -1)
        return true
    else if(content.indexOf('-----BEGIN OPENSSH PRIVATE KEY-----') > -1 &&
        content.indexOf('-----END OPENSSH PRIVATE KEY-----') > -1) 
        return true
    
    return false;
}

export default function AddServer(props) {

    const editMode = props.server ? true: false; 
     
    const [label, setLabel] = useState(props.server?.label || '')
    const [host, setHost] = useState(props.server?.host || '')
    const [port, setPort] = useState(props.server?.port || '')
    const [user, setUser] = useState(props.server?.user || '')

    const [authMethod, setAuthMethod] = useState(props.server?.auth.method || 'basic') 
    const [basicAuthPass, setBasicAuthPass] = useState(props.server?.auth.password || '') 
    const [privateKeyPath, setPrivateKeyPath] = useState('') 
    const [privateKeyContent, setPrivateKeyContent] = useState(props.server?.auth.privateKey || '')  
    const dialog = useDialog();
 
    useEffect(() => { 
        const handler = uiEventDispatcher.listen('select-file-result', (files)=>{
            console.log(files); 
            const content = files[0].content
            if(isPrivateKey(content)){
                setPrivateKeyPath(files[0].filename) 
                setPrivateKeyContent(content)
            }else{
                dialog.show('danger', 'Problem', 
                    `Unrecognized file: The file you are trying to import, is not OpenSSH pem format.`)
            }
        })

        return () => {
            handler.unregister();
        }
    }, [])

    function selectFile(){
        uiEventDispatcher.send('select-file-dialog', { includeFilesData: true }) 
         
    }

    function checkServerIsValid(){
        if(!host || host === '')  throw new Error('The host field cannot be empty!') 
        if(!port || port === '')  throw new Error('The port field cannot be empty!') 
        
        if(authMethod == 'pubkey'){
            if(!privateKeyContent || privateKeyContent === '') 
                throw new Error('Please select private key file for authentication!')  
        }  else if(authMethod == 'basic') { 
            if(!basicAuthPass || basicAuthPass === '') 
                throw new Error('Please fill the password field for basic authentication.')   
        }
    }

    function addServer(){
        try{
            checkServerIsValid();
        }catch(ex){
            dialog.show('danger', 'Problem!', ex.message)
            return;
        }

        const newServer = {   
            host, 
            port, 
            user, 
            label, 
            auth: { 
                method: authMethod
            } 
        }

        if(editMode){
            newServer.time = props.server.time;
        }

        if(authMethod == 'basic'){ 
            newServer.auth.password = basicAuthPass; 
        } else if ( authMethod == 'pubkey'){   
            newServer.auth.privateKey = privateKeyContent;  
        }
        uiEventDispatcher.send('save-server', newServer)  
        props.back();  
    }

    function handleAuthMethodChange(e){ 
        console.log(e.target.value);
        setAuthMethod(e.target.value)
    }

    function deleteServer( ) {
        dialog.confirm('Confirm Operation', `Are you sure about deleting the '${props.server.label}' tunnel configuration?`, 
            null , (result) => {
                if(result.status == 'yes'){
                    props.onDelete(props.server);
                }
            })
        
    }

    return (
        <div className={`${styles.addServer} p-3`}> 
            <h6 className="mb-0 text-muted">Configuration</h6> 
            <h3 className="mb-4">{!editMode ? 'New' : 'Edit'} SSH Tunnel</h3> 
            <div className="row">
                <div className="input-group mb-2">
                    <span className={`${styles.caption} input-group-text`} id="hostname">Host</span>
                    <input type="text" className="form-control" placeholder="SSH Hostname ..." 
                            value={host} onChange={e => setHost(e.target.value)} />
                </div> 
                <div className="input-group mb-2">
                    <span className={`${styles.caption} input-group-text`} id="port">Port</span>
                    <input type="text" className="form-control" placeholder="SSH Port ..." 
                        value={port} onChange={e => setPort(e.target.value)}/>
                </div>  
                <div className="input-group mb-2">
                    <span className={`${styles.caption} input-group-text`} id="user">User</span>
                    <input type="text" className="form-control" placeholder="SSH User (root) ..." 
                        value={user} onChange={e => setUser(e.target.value)}/>
                </div>  
                <div className="input-group mb-2">
                    <span className={`${styles.caption} input-group-text`} id="label">Label</span>
                    <input type="text" className="form-control" placeholder="Tunnel name ..." 
                            value={label} onChange={e => setLabel(e.target.value)} />
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
            <div className={`row mt-1 ${authMethod == 'basic'? 'd-block': 'd-none'}`}  > 
                <div className="input-group mb-2">
                    <span className={`${styles.caption} input-group-text`} id="password">Password</span>
                    <input type="text" className="form-control" placeholder="Auth Password ..."
                            value={basicAuthPass} onChange={e=> setBasicAuthPass(e.target.value)}/>
                </div>  
            </div> 
            
            <div className={`row mt-1 ${authMethod == 'pubkey'? 'd-block': 'd-none'}`}  >
                 
                <div className="input-group mb-3">
                    <button className="btn btn-secondary" type="button" onClick={ e => selectFile() }>Select File</button>
                    <input type="text" className="form-control" placeholder="Private key file ..." 
                            value={privateKeyPath} onChange={e=> setPrivateKeyPath(e.target.value)}/> 
                </div>
 
            </div> 
            
            <div className="row mt-5">
                <div className="col-auto text-center">
                    <div className="btn-glass" onClick={e => props.back()}>Cancel</div> 
                </div>
                <div className="col text-center d-flex justify-content-end"> 
                    {
                        editMode &&  
                        <div className="btn-glass me-2" onClick={e => deleteServer()}>Delete </div> 
                    }
                    <div className="btn-glass px-5" onClick={e => addServer()}>Save</div>
                </div>
            </div>
        </div>
    )
}
