 
import React, { useEffect, useState } from 'react';
import styles from './App.module.scss'; 
import DialogProvider from './DialogProvider';
import AddServer from './pages/AddServer';
import ConnectionStatus from './pages/ConnectionStatus';
import MainPage from './pages/MainPage';
import AppConfig from './pages/AppConfig';

import uiEvents from './ui-event-dispatcher'

import  {GearIcon, PlusIcon} from '@primer/octicons-react'


function App() {
  const [page, setPage] = useState('main')
  const [editServer, setEditServer] = useState()

  useEffect(()=>{  
    
    const exceptionHandler = uiEvents.listen('node-exception', ex => { 
      console.log('uncaught-exception', ex);
    })

    const logHandler = uiEvents.listen('node-log', log => { 
      console.log('node-log', ...log);
    })
    const connHandler = uiEvents.listen('ssh-connection', (conn) => {
      setPage('ssh-connection')
      console.log('ssh-connection', conn);
    })
  
    const disHandler = uiEvents.listen('ssh-disconnect', ( ) => {
      setPage('main')
      console.log('ssh-disconnect');
    }) 

    uiEvents.send('node-exception-reg')
    uiEvents.send('node-log-reg')

    return ()=>{ 
      connHandler.unregister()
      disHandler.unregister()
      exceptionHandler.unregister()
      logHandler.unregister() 
    }
  }, [uiEvents.time])

  function onEdit(server){
    setEditServer(server)
    setPage('edit-server')
  }

  return (
    <div className={styles.App}> 
      <div className={styles.bgOverlay}> </div>
      <div className="" style={{ zIndex: 2}}>
        <DialogProvider>

          { page === 'main' && <MainPage onEdit={ server => onEdit(server) } /> }
          { page === 'add-server' && <AddServer back={()=>setPage('main')} /> }
          { page === 'edit-server' && <AddServer back={()=>setPage('main')} server={editServer} /> }
          { page === 'config' && <AppConfig back={()=>setPage('main')} /> }
          { page === 'ssh-connection' && <ConnectionStatus back={()=>setPage('main')} /> }
          {
            page === 'main' &&  
            <>
              <div className={`btn-glass circle ${styles.addServerBtn}`} onClick={e => setPage('add-server')}>
                <PlusIcon size="28"/>
              </div>
              <div className={`btn-glass circle ${styles.configBtn}`} onClick={e => setPage('config')}>
                <GearIcon size="20" />
              </div>
            </>
          }

        </DialogProvider>

      </div>
    </div>
  ); 
}

export default App;
