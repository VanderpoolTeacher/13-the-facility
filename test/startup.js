const {open}=require('./lib');
(async()=>{const {browser,page,errors,requests}=await open();
 const r=await page.evaluate(()=>({modal:__13.modal,buttons:__13.buttons(),hasAudio:!!window.AudioContext}));
 console.log('startup',JSON.stringify(r));
 console.log('requests',requests.length,requests);console.log('errors',errors);
 await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
