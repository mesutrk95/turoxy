 
import styles from './App.module.scss';
import AddServer from './pages/AddServer';

import uiEvents from './ui-event-dispatcher'

// const { ipcRenderer } = window.require("electron"); 
// ipcRenderer.send('ready')

function App() {
  return (
    <div className={styles.App}> 
      <AddServer /> 
    </div>
  ); 
}

export default App;
