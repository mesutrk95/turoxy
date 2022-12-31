 
import styles from './App.module.scss';

const { ipcRenderer } = window.require("electron"); 
ipcRenderer.send('ready')

function App() {
  return (
    <div className="App"> 
      hello    sad
    </div>
  ); 
}

export default App;
