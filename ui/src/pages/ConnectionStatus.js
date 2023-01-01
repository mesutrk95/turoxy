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
  responsive: true,
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
      grid: {
        display: false,
      },
      ticks: {
          // Include a dollar sign in the ticks
          callback: function(value, index, ticks) {
              if(value > MEGABYTE){
                  return (value / MEGABYTE).toFixed(2)  + ' Mbps'
              }else if(value > KILOBYTE){
                return (value / KILOBYTE).toFixed(1) + ' Kbps'
              }else {
                return value + ' Bps'
              }
          }
      }
    },
  },
  plugins: {
    legend: {
      display: true,
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
for (let index = 0; index < DEFAULT_SIZE; index++) {
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

    return (
        <div className={`${styles.addServer} p-3`}>  
            <h3 className="mb-4">Connection Status</h3>   
            {
                conn && conn.server && 
                <div>
                    <h5>Server : {conn.server.host}:{conn.server.port}</h5>  
                </div>
            }
            {
                conn && conn.status && 
                <div> 
                    <h5>SSH Connection : {conn.status.ssh}</h5> 
                    <h5>Socks Server : {conn.status.socks}</h5>
                </div>
            } 
            <Line ref={(reference) => setChartReference(reference) }  
                    options={options} data={chartData} style={{ width: '100%', height: '300px'}} 
                    className="my-3" /> 
            {
                stats && 
                <div>
                    <div className='row mt-4'>
                        <div className='col'><h6>Total Sent<br/>{stats.sent[0]} {stats.sent[1]}</h6></div>
                        <div className='col'><h6>Total Received<br/>{stats.received[0]} {stats.received[1]}</h6></div>
                    </div>
                    <div className='row mt-4'>
                        <div className='col'><h6>Upload<br/> {stats.uploadSpeed[0]} {stats.uploadSpeed[1]}</h6></div>
                        <div className='col'><h6>Download<br/> {stats.downloadSpeed[0]} {stats.downloadSpeed[1]}</h6></div>
                    </div>
                </div>
            }
            

            <div className='row mt-4'>
                <div>
                    <span className='btn btn-danger' onClick={e=> disconnect()}>Disconnect</span>
                </div>
            </div>
        </div>
    )
}
