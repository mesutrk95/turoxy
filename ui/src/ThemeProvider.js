import React, { useState, useContext, useEffect } from "react"; 
import uiEvents from './ui-event-dispatcher'

export const ThemeContext = React.createContext();

export function useTheme() {
    const themeContext = useContext(ThemeContext);
    return themeContext;
}

function ThemeProvider({ children, ...props }) {
    const [theme, setTheme] = useState('');  
 
    useEffect(()=>{

        const appConfigHandler = uiEvents.listen('app-config', config => { 
            console.log('app-config', config); 
            setTheme(config.theme || 'solid')
        })
        uiEvents.send('get-config');

        return ()=>{
            appConfigHandler.unregister();
        }
    })

    if(!theme) return <div></div>

    return (
        <ThemeContext.Provider value={{ theme, setTheme }} {...props}> 
            <div className={'theme-' + theme}>
                {children} 
            </div>
        </ThemeContext.Provider>
    );
}

export default ThemeProvider;

