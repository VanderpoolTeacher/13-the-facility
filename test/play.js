// Full playthrough driver: Leave journey (13 escape states) and Return journey (26 states).
const {open}=require('./lib');const fs=require('fs');const path=require('path');
const solvers=fs.readFileSync(path.join(__dirname,'solvers.js'),'utf8');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function run(page,name,arg){
 const r=await page.evaluate((n,a)=>{try{const out=SOLVE.S[n](a||{});return {ok:true,out,floor:__13.G.floor,phase:__13.G.phase}}catch(e){return {ok:false,err:String(e&&e.message||e),floor:__13.G.floor,phase:__13.G.phase,tile:__13.R&&__13.tile(),say:__13.sayLog.slice(-3),ann:__13.announceLog.slice(-3)}}},name,arg);
 if(!r.ok){throw Error(`[${name}] ${r.err} :: ${JSON.stringify(r)}`)}
 console.log(`  ok ${name}${r.out?' -> '+r.out:''} (now F${r.floor}${r.phase})`);return r.out;
}
async function waitScene(page,id){await page.waitForFunction(id=>__13.modal==='scene'&&__13.scene&&__13.scene.id===id,{timeout:5000},id)}
async function newGame(page,gender){await page.evaluate(()=>{__13.clearStorage();__13.announceLog.length=0;__13.sayLog.length=0});await page.evaluate(()=>__13.click('New game'));await page.evaluate(g=>__13.click(g==='female'?'Female':'Male'),gender);await waitScene(page,'awakening')}
async function floor13(page,opts){
 await run(page,'13e',opts);await waitScene(page,'escort');await run(page,'13e-afterEscort',opts);
}
(async()=>{
 const {browser,page,errors,requests}=await open();await page.addScriptTag({content:solvers});
 if(process.argv[2]==='return-from'){const from=+process.argv[3];console.log('== RETURN-ONLY from F'+from+'r ==');
  await newGame(page,'male');await page.evaluate(f=>{__13.sceneFinish();__13.G.returnChosen=true;__13.jump(f,'r')},from);
  for(let f=from;f<=12;f++){await run(page,f+'r',f===10?{reload:true}:{})}
  const re=await run(page,'13r');if(re!=='reunion')throw Error('no reunion');await page.evaluate(()=>__13.sceneFinish());
  const st=await page.evaluate(()=>({finished:__13.G.finished,ending:__13.G.ending}));console.log('  ending',JSON.stringify(st),'errors',errors);await browser.close();process.exit(errors.length?2:0)}
 const visited=[];
 const track=async()=>{const s=await page.evaluate(()=>[__13.G.floor,__13.G.phase]);visited.push(s.join(''))};
 console.log('== LEAVE RUN (female, table choice, alcove route, zero memories) ==');
 await newGame(page,'female');await floor13(page,{choice:'table',route:'alcove'});visited.push('13e');
 for(const f of ['12e','11e','10e','9e','8e','7e','6e','5e','4e','3e','2e']){await track();await run(page,f)}
 await track();const choice=await run(page,'1e');if(choice!=='choice')throw Error('no choice');
 await page.evaluate(()=>__13.click('LEAVE'));await waitScene(page,'escapeComplete');await page.evaluate(()=>__13.sceneFinish());
 let st=await page.evaluate(()=>({finished:__13.G.finished,ending:__13.G.ending,mem:__13.G.memories.length,saved:JSON.parse(__13.storage()||'{}')}));
 console.log('  leave ending:',st.finished,st.ending,'memories',st.mem,'saved.finished',st.saved.finished,st.saved.ending);
 if(!(st.finished&&st.ending==='leave'&&st.saved.ending==='leave'&&st.mem===0))throw Error('leave ending state wrong');
 console.log('  visited escape states:',visited.length,visited.join(' '));if(new Set(visited).size!==13)throw Error('expected 13 escape states');
 // resume finished save goes to the ending
 await page.evaluate(()=>__13.click('Begin again'));await page.evaluate(()=>__13.click('Resume'));await waitScene(page,'escapeComplete');console.log('  finished save resumes to ending: ok');
 await page.evaluate(()=>{__13.sceneFinish();__13.click('Begin again')});

 console.log('== RETURN RUN (male, door choice, dash route, zero memories, save/reload mid-timer) ==');
 const visited2=[];
 await newGame(page,'male');await floor13(page,{choice:'door',route:'dash'});visited2.push('13e');
 for(const f of ['12e','11e','10e','9e','8e','7e','6e']){visited2.push(await page.evaluate(()=>__13.G.floor+__13.G.phase));await run(page,f)}
 visited2.push(await page.evaluate(()=>__13.G.floor+__13.G.phase));await run(page,'5e',{reload:true});
 for(const f of ['4e','3e','2e']){visited2.push(await page.evaluate(()=>__13.G.floor+__13.G.phase));await run(page,f)}
 visited2.push(await page.evaluate(()=>__13.G.floor+__13.G.phase));await run(page,'1e');
 await page.evaluate(()=>__13.click('RETURN'));await waitScene(page,'reentry');await page.evaluate(()=>__13.sceneFinish());
 st=await page.evaluate(()=>({floor:__13.G.floor,phase:__13.G.phase,tile:__13.tile(),chosen:__13.G.returnChosen}));console.log('  return begins at',JSON.stringify(st));
 if(!(st.floor===1&&st.phase==='r'&&st.chosen))throw Error('return start wrong');
 for(const f of ['1r','2r','3r','4r','5r','6r','7r','8r','9r']){visited2.push(await page.evaluate(()=>__13.G.floor+__13.G.phase));await run(page,f)}
 visited2.push(await page.evaluate(()=>__13.G.floor+__13.G.phase));await run(page,'10r',{reload:true});
 for(const f of ['11r','12r']){visited2.push(await page.evaluate(()=>__13.G.floor+__13.G.phase));await run(page,f)}
 visited2.push(await page.evaluate(()=>__13.G.floor+__13.G.phase));const re=await run(page,'13r');if(re!=='reunion')throw Error('no reunion');
 await page.evaluate(()=>__13.sceneFinish());
 st=await page.evaluate(()=>({finished:__13.G.finished,ending:__13.G.ending,mem:__13.G.memories.length,saved:JSON.parse(__13.storage()||'{}'),buttons:__13.buttons()}));
 console.log('  return ending:',st.finished,st.ending,'memories',st.mem,'saved.ending',st.saved.ending,st.buttons);
 if(!(st.finished&&st.ending==='return'&&st.saved.ending==='return'&&st.mem===0))throw Error('return ending state wrong');
 console.log('  visited states:',visited2.length,visited2.join(' '));if(new Set(visited2).size!==26)throw Error('expected 26 states');
 console.log('requests:',requests.length,'console errors:',errors.length,errors.slice(0,5));
 await browser.close();if(errors.length)process.exit(2);
})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
