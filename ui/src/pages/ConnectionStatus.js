import React, { useEffect, useState } from 'react'

import styles from './ConnectionStatus.module.scss'
import uiEvent from '../ui-event-dispatcher'
import { useDialog } from '../DialogProvider'
import { useTheme } from '../ThemeProvider';

import NetworkViewer from './NetworkViewer'
import NetworkStatsChart from './NetworkStatsChart'

import { UploadIcon, PackageDependenciesIcon, PackageDependentsIcon, DownloadIcon } from '@primer/octicons-react'

const MEGABYTE = 1024 * 1024
const KILOBYTE = 1024

function autoSizeAdjust(amount) {
    if (amount > MEGABYTE)
        return [(amount / MEGABYTE).toFixed(2), ' MB'];
    if (amount > 1024)
        return [(amount / KILOBYTE).toFixed(1), ' KB'];
    else
        return [amount.toFixed(0), ' Bytes'];
}
function autoSpeedSizeAdjust(amount) {
    if (amount > MEGABYTE)
        return [(amount / MEGABYTE).toFixed(2), ' Mbps'];
    if (amount > KILOBYTE)
        return [(amount / KILOBYTE).toFixed(1), ' Kbps'];
    else
        return [amount.toFixed(0), ' Bps'];
}
function toHHMMSS(secs) {
    var sec_num = parseInt(secs, 10)
    var hours   = Math.floor(sec_num / 3600)
    var minutes = Math.floor(sec_num / 60) % 60
    var seconds = sec_num % 60

    return [hours,minutes,seconds]
        .map(v => v < 10 ? "0" + v : v)
        .filter((v,i) => v !== "00" || i > 0)
        .join(":")
}
export default function ConnectionStatus(props) {

    const [conn, setConn] = useState({})
    const [stats, setStats] = useState(null)

    

    useEffect(() => {
        let handler1 = uiEvent.listen('ssh-connection', (conn) => {
            setConn(conn)
        });
        let handler2 = uiEvent.listen('connection-stats', (stats) => {
            const connStats = {
                startTime: stats.startTime,
                sent: autoSizeAdjust(stats.sent),
                received: autoSizeAdjust(stats.received),
                uploadSpeed: autoSpeedSizeAdjust(stats.speed.upload),
                downloadSpeed: autoSpeedSizeAdjust(stats.speed.download),
            };
            setStats(connStats)
        });
        uiEvent.send('ssh-connection')

        return () => {
            handler1.unregister()
            handler2.unregister()
        }
    }, [])

    function disconnect() {
        uiEvent.send('ssh-disconnect');
    }
    
    return (
        <div className={`${styles.connectionStatus} p-0`}>
            <div className='page-header'>
                <h6 className={`mb-0 text-muted ${styles.headerText}`}>Connection Status</h6>
                <h3 className={`${styles.headerTextCaption} mb-0`}>{conn?.server?.label || ''}</h3>
            </div>
            <div className='py-3'>
                <div className='w-100 d-flex justify-content-center mt-1'>
                    <NetworkStatsChart />
                </div>
                <div className='row mt-3 px-2 '>
                    <div className="mx-auto " style={{ width: '85%' }}>
                        <NetworkViewer connection={conn} />
                    </div>

                </div>
                <h6 className={`text-muted mt-3 mb-0`}>Activated Duration</h6>
                {
                    stats?.startTime && 
                    <h2 className="mb-0 mt-0">{toHHMMSS((new Date().getTime() - stats?.startTime) / 1000) }</h2>
                }
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

            </div>

            <div className={styles.bottomBox}>
                <div className='row pb-4 px-4'>
                    <div>
                        <span className='btn btn-danger w-100 py-3' onClick={e => disconnect()}>Disconnect</span>
                    </div>
                </div>

            </div>


        </div>
    )
}
