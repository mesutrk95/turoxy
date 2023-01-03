import React, { useEffect, useState } from 'react'
import styles from './NetworkStatsChart.module.scss'

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
  } from 'chart.js';

import { Line } from 'react-chartjs-2'; 

import uiEvent from '../ui-event-dispatcher' 

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);
  
export const options = { 
  responsive: true,
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
        // drawBorder: false,
        display: false,
      },
    },
    y: {
      beginAtZero: true,
    //   suggestedMin: 5, 
      display: false,
      grid: {
        display: false,
        // drawBorder: false,
      },
    //   ticks: {
    //       // Include a dollar sign in the ticks
    //       callback: function(value, index, ticks) {
    //           if(value > MEGABYTE){
    //               return (value / MEGABYTE).toFixed(1)  + ' Mbps'
    //           }else if(value > KILOBYTE){
    //             return (value / KILOBYTE).toFixed(0) + ' Kbps'
    //           }else {
    //             return value + ' Bps'
    //           }
    //       }
    //   }
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

const sharedSeriesOpts = {
    borderWidth: 1,
    pointBorderWidth: 0,
    pointHoverRadius: 0,
    pointHoverBorderWidth: 0,
    pointRadius: 0,
    pointHitRadius: 0,
    tension: 0.4,

    fill: true ,
    backgroundColor: 'rgba(255,255,255,0.1)',  

}

const uploadOpt = {
    label: 'Upload', 
    borderColor: '#e67e22',   
    pointBorderColor: "rgba(0,0,0,0)",
    pointBackgroundColor: "rgba(0,0,0,0)", 
    pointHoverBackgroundColor: "rgba(0,0,0,0)",
    pointHoverBorderColor: "rgba(0,0,0,0)", 
    backgroundColor: '#e67e2244',  
    ...sharedSeriesOpts
}
const downloadOpt = {
    label: 'Download', 
    borderColor: '#16a085', 
    pointBorderColor: "rgba(0,0,0,0)",
    pointBackgroundColor: "rgba(0,0,0,0)", 
    pointHoverBackgroundColor: "rgba(0,0,0,0)",
    pointHoverBorderColor: "rgba(0,0,0,0)", 

    backgroundColor: '#16a08544', 
    ...sharedSeriesOpts
}


let DEFAULT_SIZE = 20;
let downloadTicks = []; 
let uploadTicks = []; 
let labels =  []; 

function initData(){
    uploadTicks = []
    downloadTicks = [];
    labels =  []; 
    while (downloadTicks.length < DEFAULT_SIZE) {
        uploadTicks.push(0)
        downloadTicks.push(0)
        labels.push(downloadTicks.length)
    } 
}
function scaleValue(minX, maxX, minY, maxY, value) {  
    return (value - minX) * ((maxY - minY) / (maxX - minX)) + minY;;
}

function delay(amount){
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, amount);

    })
}

export default function NetworkStatsChart(props) {
 
    const [chartData, setChartData] = useState({datasets: []}) 
    const [chartReference, setChartReference] = useState(null) 

    useEffect(() => {  
        initData();

        function lerp (start, end, amt){
            return (1-amt)*start+amt*end;
        }

          
        let handler2 = uiEvent.listen('connection-stats', async (stats) => {  

            // const lastUploadRate = uploadTicks[uploadTicks.length -1];
            // const lastDownloadRate = uploadTicks[uploadTicks.length -1];

            // for (let index = 0; index < 10; index++) { 
            //     let lerpAmount = (index + 1) / 10

            //     uploadTicks.push(lerp(lastUploadRate, stats.speed.upload, lerpAmount) )
            //     downloadTicks.push(lerp(lastDownloadRate, stats.speed.download, lerpAmount))
                
            //     setChartData({ 
            //         labels,  datasets: [ { ...uploadOpt, data: uploadTicks }, { ...downloadOpt, data: downloadTicks } ],
            //     }) 
                
            //     await delay(50)
            //     downloadTicks.shift() 
            //     uploadTicks.shift()  
            // }
            
            uploadTicks.push(stats.speed.upload)
            downloadTicks.push(stats.speed.download)
            
            if(downloadTicks.length > DEFAULT_SIZE) downloadTicks.shift() 
            if(uploadTicks.length > DEFAULT_SIZE) uploadTicks.shift()   
            
            if(chartReference) chartReference.update()
            
        });
        
        setChartData({  
            labels,  datasets: [ { ...uploadOpt, data: uploadTicks }, { ...downloadOpt, data: downloadTicks } ],
        }) 

        return ()=>{
            handler2.unregister();
        }
    }, [chartReference]) 

    return (
           <div className='w-100' > 
                <div style={{ width : '100%' }}>
                    <Line ref={(reference) => setChartReference(reference) }  
                            options={options} data={chartData}  
                            className="mx-auto" height={30} style={{width : '100%' }} /> 
                    
                </div>
                <div> 
                    <div className={styles.chartBottomContainer}>
                        <div className={styles.chartBottom}>

                        </div>

                    </div>
                </div>
           </div>
           
    )
}
