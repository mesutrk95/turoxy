import React, { useState, useContext } from "react";
import Dialog from "./Dialog";

export const DialogContext = React.createContext();

export function useDialog() {
    const dialogContext = useContext(DialogContext);
    return dialogContext;
}

function DialogProvider({ children, ...props }) {
    const [dialog, setDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        handler: null
    });

    function show(type, title, message, buttons) {
        setDialog({
            isOpen: true,
            clickOutside: 'close',
            title,
            message,
            type,
            buttons
        });
    }

    function confirm(title, message, buttons, handler) {
        setDialog({
            isOpen: true, title, message, type: 'success',
            clickOutside: 'none', handler, 
            buttons: buttons || { yes: {}, no: {} }  
        });
    }

    function hide( ) {
        setDialog({
            isOpen: false 
        });
    }

    return (
        <DialogContext.Provider value={{ dialog, setDialog, confirm, show, hide }} {...props}>
            {
                dialog.isOpen && <Dialog > </Dialog>
            }
            {children}
        </DialogContext.Provider>
    );
}

export default DialogProvider;

