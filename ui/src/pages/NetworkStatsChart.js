import React, { useEffect, useState } from 'react'

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

import uiEvent from '../ui-event-dispatcher' 

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

let DEFAULT_SIZE = 20;
let networkTicks = []; 
while (networkTicks.length < DEFAULT_SIZE) {
    networkTicks.push({upload :0, download : 0})
}

export default function NetworkStatsChart(props) {
 
    const [chartData, setChartData] = useState({datasets: []}) 
    const [chartReference, setChartReference] = useState(null) 

    useEffect(() => {  
        let handler2 = uiEvent.listen('connection-stats', (stats) => { 
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
        return ()=>{
            handler2.unregister();
        }
    }, [ ]) 

    return (
           <div className='' style={{ width : '100%' }}> 
               <Line ref={(reference) => setChartReference(reference) }  
                       options={options} data={chartData}  
                       className="mx-auto" height={50}/> 
           </div>
           
    )
}
