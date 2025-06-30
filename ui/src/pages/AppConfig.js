import React, { useEffect, useState } from 'react'

import styles from './AppConfig.module.scss' 
import uiEvent from '../ui-event-dispatcher' 
import { useDialog } from '../DialogProvider' 

export default function AppConfig(props) {
 
    const dialog = useDialog(); 

    const [httpProxyEnable, setHttpProxyEnable] = useState('') 
    const [httpProxyHost, setHttpProxyHost] = useState('') 
    const [httpProxyPort, setHttpProxyPort] = useState(0) 

    const [asDefaultSystemProxy, setAsDefaultSystemProxy] = useState()  
    const [socksProxyEnable, setSocksProxyEnable] = useState('')  
    const [socksProxyHost, setSocksProxyHost] = useState('') 
    const [socksProxyPort, setSocksProxyPort] = useState(0)  

    const [appTheme, setAppTheme] = useState('')  
    
    useEffect(() => {  
        uiEvent.send('get-config')
        const handler = uiEvent.listen('app-config', config => { 
            setHttpProxyEnable(config?.httpProxy?.enable)
            setHttpProxyHost(config?.httpProxy?.host)
            setHttpProxyPort(config?.httpProxy?.port)

            setSocksProxyEnable(config?.socksProxy?.enable)
            setAsDefaultSystemProxy(typeof config?.asDefaultSystemProxy?.enable === 'undefined' ? true : config.asDefaultSystemProxy.enable)
            setSocksProxyHost(config?.socksProxy?.host)
            setSocksProxyPort(config?.socksProxy?.port)
            setAppTheme(config?.theme || 'solid')
            console.log('app-config', config);
        })
        return () => { 
            handler.unregister();
        }
    }, [])

    function saveConfig(){
        let config = {
            theme: appTheme,
            httpProxy: {
                enable: httpProxyEnable,
                host: httpProxyHost,
                port: httpProxyPort,
            },
            socksProxy: {
                enable: socksProxyEnable,
                host: socksProxyHost,
                port: socksProxyPort,
            },
            startup: false,
            asDefaultSystemProxy,
        }
        uiEvent.send('save-config', config)
        props.back();
    } 

    return (
        <div className={`${styles.appConfig} px-3`}>  
            <div className='page-header'>
                <h6 className={`mb-0 text-muted ${styles.headerText}`}>Configuration</h6>
                <h3 className={`${styles.headerTextCaption} mb-0`}>Turoxy Settings</h3>
            </div> 
            
            <div className="row pt-3 pb-2">
                <div className="col text-start mx-1" >
                    <div className="form-check">
                        <input className="form-check-input" name="authentication" type="checkbox"  
                                onChange={e => setHttpProxyEnable(e.target.checked)} checked={httpProxyEnable}
                                id="defaultCheck0"  />
                        <label className="form-check-label  " htmlFor="defaultCheck0"> Enable Http Proxy </label>
                    </div> 

                </div>
            </div> 

            <div className="row">
                <div className="input-group mb-2">
                    <span className={`${styles.caption} input-group-text`} id="hostname">Host</span>
                    <input type="text" className="form-control" placeholder="Http Proxy Host ..." 
                            value={httpProxyHost} onChange={e => setHttpProxyHost(e.target.value)} />
                </div>  
            </div> 
            <div className="row">
                <div className="input-group mb-2">
                    <span className={`${styles.caption} input-group-text`} id="hostname">Port</span>
                    <input type="number" className="form-control" placeholder="Http Proxy Port ..." 
                            value={httpProxyPort} onChange={e => setHttpProxyPort(e.target.value)} />
                </div>  
            </div> 
            
            <div className="row pt-3 pb-2">
                <div className="col text-start mx-1" >
                    <div className="form-check">
                        <input className="form-check-input" name="authentication" type="checkbox" value="none" 
                                onChange={e => setSocksProxyEnable(e.target.checked)} checked={socksProxyEnable}
                                id="defaultCheck1"  />
                        <label className="form-check-label  " htmlFor="defaultCheck1"> Enable Socks5 Proxy </label>
                    </div> 

                </div>
            </div>

            <div className="row">
                <div className="input-group mb-2">
                    <span className={`${styles.caption} input-group-text`} id="hostname">Host</span>
                    <input type="text" className="form-control" placeholder="Socks Proxy Host ..." 
                            value={socksProxyHost} onChange={e => setSocksProxyHost(e.target.value)} />
                </div>  
            </div> 
            <div className="row">
                <div className="input-group mb-2">
                    <span className={`${styles.caption} input-group-text`} id="hostname">Port</span>
                    <input type="number" className="form-control" placeholder="Socks Proxy Port ..." 
                            value={socksProxyPort} onChange={e => setSocksProxyPort(e.target.value)} />
                </div>  
            </div> 
            
            <h6 className={`text-start mt-2 mb-1 ms-1 `} >Theme</h6>
            <select class="form-select" value={appTheme} onChange={(event) => setAppTheme(event.target.value)}> 
                <option value="solid">Solid Color</option>
                <option value="barbary">Barbary</option>
                <option value="natural">Natural</option>
            </select>
 
            
            <div className="row pt-3 pb-2">
                <div className="col text-start mx-1" >
                    <div className="form-check">
                        <input className="form-check-input" name="set-as-default-proxy" type="checkbox" value="none" 
                                onChange={e => setAsDefaultSystemProxy(e.target.checked)} checked={asDefaultSystemProxy}
                                id="set-as-default-proxy"  />
                        <label className="form-check-label" htmlFor="set-as-default-proxy"> Set as default system proxy </label>
                    </div>
                </div>
            </div>
            
            <div className="row mt-5">
                <div className="col-auto text-center">
                    <div className="btn-glass" onClick={ e => props.back() }>Cancel</div> 
                </div>
                <div className="col text-center d-flex justify-content-end"> 
                    <div className="btn-glass" onClick={ e => saveConfig() }>Save</div>
                </div>
            </div>
        </div>
    )
}
