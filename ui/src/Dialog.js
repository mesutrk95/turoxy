

import React, { useEffect, useState } from 'react'

import styles from './Dialog.module.scss'   
import { useDialog } from './DialogProvider';



export default function Dialog(props) {
    
    const dialog = useDialog();
    const dialogData = dialog.dialog; 

    function onClickOutside(){
        if(dialogData.clickOutside == 'close') dialog.hide()
    }
    function onYes(){ 
        dialogData.handler({status : 'yes'});
        dialog.hide();
    }
    function onNo(){ 
        dialogData.handler({status : 'no'});
        dialog.hide();
    }
    

    return (
        <div className={`${styles.dialogContainer} ${styles[dialogData.type]}`} 
                onClick={ e => onClickOutside() }>
            <div className={styles.dialog} > 
                <h4 className={`${styles.title} fw-bold text-uppercase`}>{dialogData.title}</h4>
                <p className={styles.message}>{dialogData.message}</p>
                { 
                    dialogData.buttons && 
                    <div className='mt-4'> 
                        {
                            dialogData.buttons.no && 
                            <span className='btn btn-sm btn-secondary me-2' onClick={ e=> onNo()}>
                                {dialogData.buttons.no.text || 'Cancel'}</span> 
                        }
                        {
                            dialogData.buttons.yes && 
                            <span className='btn btn-sm btn-success' onClick={ e=> onYes()}>
                                {dialogData.buttons.yes.text || 'Yes'}</span> 
                        }
                    </div>
                }
            </div>
        </div>
    ) 
}


// function show(type, title, message)  {

// }

// export {
//     show
// }
 