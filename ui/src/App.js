 
import React, { useState } from 'react';
import styles from './App.module.scss'; 
import DialogProvider from './DialogProvider';
import AddServer from './pages/AddServer';
import ConnectionStatus from './pages/ConnectionStatus';
import MainPage from './pages/MainPage';

import uiEvents from './ui-event-dispatcher'

function App() {
  const [page, setPage] = useState('main')

  uiEvents.listen('connection-status', (server) => {
    setPage('connection-status')
  })

  return (
    <div className={styles.App}> 
      <DialogProvider>

        {
          page === 'main' &&  
          <div className={styles.addServerBtn} onClick={e => setPage('add-server')}>
            <span> + </span>
          </div>
        }
        { page === 'main' && <MainPage /> }
        { page === 'add-server' && <AddServer back={()=>setPage('main')} /> }
        { page === 'connection-status' && <ConnectionStatus back={()=>setPage('main')} /> }

      </DialogProvider>
    </div>
  ); 
}

export default App;
