import React, { useEffect, useState } from 'react'

import styles from './ConnectionStatus.module.scss' 
import uiEvent from '../ui-event-dispatcher' 
import { useDialog } from '../DialogProvider' 
  
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';
import { Line } from 'react-chartjs-2'; 

import {CodespacesIcon, DeviceDesktopIcon, GlobeIcon,
        DesktopDownloadIcon, UploadIcon, PackageDependenciesIcon, PackageDependentsIcon, DownloadIcon} from '@primer/octicons-react'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);
  
export const options = { 
  responsive: false,
  maintainAspectRatio: false,
  showTooltips: false,
  animation: {
    duration: 0,
  },
  scales: {
    x: { 
        ticks: {
            display: false //this will remove only the label
        },
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      display: false,
      grid: {
        display: false,
      },
      ticks: {
          // Include a dollar sign in the ticks
          callback: function(value, index, ticks) {
              if(value > MEGABYTE){
                  return (value / MEGABYTE).toFixed(1)  + ' Mbps'
              }else if(value > KILOBYTE){
                return (value / KILOBYTE).toFixed(0) + ' Kbps'
              }else {
                return value + ' Bps'
              }
          }
      }
    },
  },
  plugins: {
    legend: {
      display: false,
      position: "bottom",
    },
    title: {
      display: false,
      text: "Chart.js Line Chart",
    },
  },
};
    
const MEGABYTE = 1024 * 1024
const KILOBYTE = 1024 

function autoSizeAdjust(amount){
    if(amount > MEGABYTE)
        return [(amount / MEGABYTE).toFixed(2) , ' MB']; 
    if(amount > 1024)
        return [(amount / KILOBYTE).toFixed(1) , ' KB']; 
    else  
        return [amount.toFixed(0), ' Bytes'];  
}
function autoSpeedSizeAdjust(amount){
    if(amount > MEGABYTE)
        return [(amount / MEGABYTE).toFixed(2) , ' Mbps']; 
    if(amount > KILOBYTE)
        return [(amount / KILOBYTE).toFixed(1) , ' Kbps']; 
    else  
        return [amount.toFixed(0) , ' Bps'];  
}

let DEFAULT_SIZE = 20;
let networkTicks = []; 
while (networkTicks.length < DEFAULT_SIZE) {
    networkTicks.push({upload :0, download : 0})
}

export default function ConnectionStatus(props) {
      
    const [conn, setConn] = useState({  }) 
    const [stats, setStats] = useState(null) 
    const [chartData, setChartData] = useState({datasets: []}) 
    const [chartReference, setChartReference] = useState(null) 
    

    useEffect(() => {  
        let handler1 = uiEvent.listen('ssh-connection', (conn) => {
            setConn(conn)  
        });
        let handler2 = uiEvent.listen('connection-stats', (stats) => {
            const connStats = {
                sent : autoSizeAdjust(stats.sent), 
                received: autoSizeAdjust(stats.received),
                uploadSpeed : autoSpeedSizeAdjust(stats.speed.upload), 
                downloadSpeed: autoSpeedSizeAdjust(stats.speed.download), 
            };
            setStats(connStats)
            // console.log(networkTicks.map( nt => Number(nt.upload) ));
            networkTicks.push({ upload: stats.speed.upload, download: stats.speed.download})
            if(networkTicks.length > DEFAULT_SIZE) networkTicks.shift() 

            setChartData({ 
                labels: networkTicks.map( (nt, index) => index ),
                datasets: [
                  {
                    label: 'Upload',
                    data: networkTicks.map( nt => Number(nt.upload) ),
                    borderColor: '#e67e22', 
                    borderWidth: 1,

                    pointBorderColor: "rgba(0,0,0,0)",
                    pointBackgroundColor: "rgba(0,0,0,0)",
                    pointBorderWidth: 0,
                    pointHoverRadius: 0,
                    pointHoverBackgroundColor: "rgba(0,0,0,0)",
                    pointHoverBorderColor: "rgba(0,0,0,0)",
                    pointHoverBorderWidth: 0,
                    pointRadius: 0,
                    pointHitRadius: 0,

                    backgroundColor: '#e67e22', 
                    tension: 0.5,
                    fill: true 
                  },
                  {
                    label: 'Download',
                    data: networkTicks.map( nt => Number(nt.download)),
                    borderColor: '#16a085',
                    borderWidth: 1,
                    pointBorderColor: "rgba(0,0,0,0)",
                    pointBackgroundColor: "rgba(0,0,0,0)",
                    pointBorderWidth: 0,
                    pointHoverRadius: 0,
                    pointHoverBackgroundColor: "rgba(0,0,0,0)",
                    pointHoverBorderColor: "rgba(0,0,0,0)",
                    pointHoverBorderWidth: 0,
                    pointRadius: 0,
                    pointHitRadius: 0,

                    backgroundColor: '#16a085',
                    tension: 0.5,
                    fill: true 
                  },
                ],
            })
            // chartReference.update()
        });
        uiEvent.send('ssh-connection')
        
        return () => { 
            handler1.unregister()
            handler2.unregister()
        }
    }, [uiEvent.time]) 

    function disconnect() {
        uiEvent.send('ssh-disconnect');
    }

    function getSSHConnectionClass(){ 
        if(conn && conn.status){
            if(conn.status.ssh == "failed") return 'text-danger'
            
            return  conn.status.ssh == 'connected' ? 'text-success': 'text-warning'
        }else{
            return 'text-danger'
        }
    }
    function getProxyServerClass(){
        if(conn && conn.status) {
            return  conn.status.http == 'started' ? 'text-success': 'text-warning'
        }else{
            return 'text-danger'
        }
    }

    return (
        <div className={`${styles.connectionStatus} p-3`}>  
            <h3 className="mb-4">Connection Status</h3>   
            <div className='row mt-5 mb-2 px-2 '>
                <div className={`${styles.border } col d-flex justify-content-start ${getProxyServerClass()}`}> 
                    <div className={styles.minWidthHost}> 
                        <DeviceDesktopIcon size={40}></DeviceDesktopIcon>
                        <div className='mt-1'>
                            <h6 className='fw-thin '>Your <br/> Device</h6>  
                        </div>
                    </div>
                    <span className={styles.right}></span>
                </div>
                <div className='col-auto px-0 '> 
                    <GlobeIcon size={40}></GlobeIcon>
                        <div className='mt-1'>
                            <h6 className='fw-thin '>Internet</h6>  
                        </div>
                </div>
                <div className={`${styles.border } col d-flex justify-content-end  ` + 
                    `${getSSHConnectionClass()}`}>
                    <span className={styles.left}></span>
                    <div className={styles.minWidthHost}>
                        <CodespacesIcon size={40}></CodespacesIcon>
                        {
                            conn && conn.server && 
                            <div className='mt-1'> 
                                <h6 className='fw-thin'>{conn.server.host}<br/>SSH Server</h6>  
                            </div>
                        } 

                    </div>
                </div>
            </div>
             <div className='w-100 d-flex justify-content-center mb-5 mt-5'>
                <div className='' style={{ width : '100%' }}> 
                    <Line ref={(reference) => setChartReference(reference) }  
                            options={options} data={chartData}  
                            className="mx-auto" height={50}/> 
                </div>
                
             </div>
            {
                stats && 
                <div>
                    <div className='row mt-4'>
                        <div className='col'>
                            <DownloadIcon className='mb-2' size={18} />
                            <h6 className='m-0'>Download</h6>
                            <span className='text-muted'>{stats.downloadSpeed[0]} {stats.downloadSpeed[1]}</span>   
                        </div> 
                        <div className='col'>
                            <UploadIcon className='mb-2' size={18} />
                            <h6 className='m-0'>Upload</h6>
                            <span className='text-muted'>{stats.uploadSpeed[0]} {stats.uploadSpeed[1]}</span>   
                        </div>
                    </div>
                    <div className='row mt-4'>
                        <div className='col'>
                            <PackageDependenciesIcon className='mb-2' size={18} />
                            <h6 className='m-0'>Total Received</h6>
                            <span className='text-muted'>{stats.received[0]} {stats.received[1]}</span> 
                        </div>
                        <div className='col'>
                            <PackageDependentsIcon className='mb-2' size={18} />
                            <h6 className='m-0'>
                                Total Sent 
                            </h6>
                            <span className='text-muted'>{stats.sent[0]} {stats.sent[1]}</span>
                        </div>
                    </div>
                </div>
            }
            <div className='row mt-5'>
                <div>
                    <span className='btn btn-danger w-100 py-3' onClick={e=> disconnect()}>Disconnect</span>
                </div>
            </div>
             
        </div>
    )
}
