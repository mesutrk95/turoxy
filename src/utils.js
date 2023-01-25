
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
function wait(amount){
    return new Promise(async (resolve, reject)=>{  
        setTimeout(async ()=> resolve() , amount) 
    }) 
}

module.exports= { waitFor, wait }