
function waitFor(condition, frequence){
    return new Promise(async (resolve, reject)=>{ 
        if(await condition()) resolve();
        
        const check = ()=>{
            setTimeout(async ()=>{
                if(!await condition())
                    check(); 
                else resolve()
            }, frequence || 200) 
        } 
        check();
    }) 
}

module.exports= { waitFor }