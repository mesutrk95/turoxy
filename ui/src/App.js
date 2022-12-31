 
import { useState } from 'react';
import styles from './App.module.scss';
import AddServer from './pages/AddServer';
import MainPage from './pages/MainPage';

import uiEvents from './ui-event-dispatcher'

// const { ipcRenderer } = window.require("electron"); 
// ipcRenderer.send('ready')

function App() {
  const [page, setPage] = useState('main')


  return (
    <div className={styles.App}> 
      <div className={styles.addServerBtn} onClick={e => setPage('add-server')}>
          <span>
            +
          </span>
      </div>
      { page === 'main' && <MainPage /> }
      { page === 'add-server' && <AddServer back={()=>setPage('main')} /> }
      
    </div>
  ); 
}

export default App;
