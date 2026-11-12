const puppeteer=require('/private/tmp/claude-501/-Users-michaelvanderpool/9bdc1aad-6ef1-461c-8e35-f6cfd331fcca/scratchpad/pup/node_modules/puppeteer-core');
const path=require('path');
async function open(opts={}){
 const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();await page.setViewport({width:opts.width||1100,height:opts.height||800});
 const errors=[],requests=[];
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 page.on('pageerror',e=>errors.push('PAGEERROR '+e.message));
 page.on('request',r=>{requests.push(r.url())});
 page.on('requestfailed',r=>errors.push('REQFAIL '+r.url()));
 await page.goto('file://'+path.resolve(__dirname,'../13.html')+(opts.test===false?'':'#test'));
 await page.waitForFunction(()=>typeof window.__13!=='undefined'||!location.hash.includes('test'),{timeout:5000});
 return {browser,page,errors,requests};
}
module.exports={open};
