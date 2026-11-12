const {open}=require('./lib');const fs=require('fs');const path=require('path');
const solvers=fs.readFileSync(path.join(__dirname,'solvers.js'),'utf8');
(async()=>{const out=[];const chk=(c,m)=>{out.push((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
 let {browser,page,errors}=await open();await page.addScriptTag({content:solvers});
 // memory fragment: collect on ascent, journal, reload, no duplicate on descent
 await page.evaluate(()=>{__13.clearStorage();__13.click('New game');__13.click('Male')});await page.waitForFunction(()=>__13.modal==='scene');
 let m=await page.evaluate(()=>{const A=__13;A.sceneFinish();A.jump(6,'e');A.R.guards.forEach(g=>g.active=false);A.walkTo(10,25);A.use();return {mem:A.G.memories.slice(),journal:document.querySelector('#journal').textContent.slice(0,40)}});
 await page.waitForFunction(()=>__13.modal==='scene'&&__13.scene.id==='childhood',{timeout:3000});
 let m2=await page.evaluate(()=>{const A=__13;A.sceneFinish();A.save();const ok=A.reload();const after=A.G.memories.slice();A.jump(6,'r');const dup=A.R.items.find(i=>i.id==='mem6').visible();return {ok,after,dup,journalCount:document.querySelectorAll('#journal p').length}});
 await page.keyboard.press('j');const jd=await page.evaluate(()=>({modal:__13.modal,text:document.querySelector('#dialog').textContent}));await page.evaluate(()=>__13.click('Close'));
 chk(m.mem.length===1&&m.mem[0]===6,'fragment collected on floor 6 ascent');chk(m2.ok&&m2.after.length===1&&m2.after[0]===6,'fragment survives save/reload');chk(m2.dup===false&&m2.journalCount===1,'no duplicate entry on descent');chk(jd.modal==='dialog'&&/Floor 6/.test(jd.text)&&/bicycles/.test(jd.text),'J opens journal with the fragment');
 // reunion scene plays with a memory collected (coherence smoke)
 const re=await page.evaluate(()=>{const A=__13;A.jump(13,'r');A.fs().contained=true;A.fs().breachOpen=true;A.R.player.x=15.5*32;A.R.player.y=6.5*32;return true});
 // keyboard navigation on the title screen and options
 await page.evaluate(()=>{__13.click('Begin again')}).catch(()=>{});await page.evaluate(()=>{window.__13.G=null});
 await page.reload();await page.waitForFunction(()=>window.__13);
 const nav1=await page.evaluate(()=>document.activeElement&&document.activeElement.textContent);await page.keyboard.press('ArrowDown');const nav2=await page.evaluate(()=>document.activeElement&&document.activeElement.textContent);await page.keyboard.press('Enter');const nav3=await page.evaluate(()=>document.querySelector('#dialog h2').textContent);
 chk(nav1==='Continue'||nav1==='New game','first title button focused ('+nav1+')');chk(nav2!==nav1&&nav3==='OPTIONS'||nav3==='SUBJECT 13','arrow moves focus, Enter activates ('+nav2+' -> '+nav3+')');
 await page.evaluate(()=>{__13.click('Back');__13.click('Options')});
 const opt=await page.evaluate(()=>{const b=[...document.querySelectorAll('#dialog button')];const bt=b.find(x=>x.textContent==='Off'||x.textContent==='On');if(!bt)return null;const before=bt.textContent;bt.click();return {before,after:bt.textContent,stored:localStorage.getItem('thirteen_opts')}});
 chk(opt&&opt.before!==opt.after&&opt.stored,'options toggle persists ('+(opt&&opt.stored)+')');
 // unsupported old save notice
 await page.evaluate(()=>{__13.clearStorage();__13.seedOld()});await page.reload();await page.waitForFunction(()=>window.__13);
 const warn=await page.evaluate(()=>document.querySelector('#dialog .warn')&&document.querySelector('#dialog .warn').textContent);chk(/older prototype/.test(warn||''),'old v1 save explained in the interface: '+warn);
 // corrupt save
 await page.evaluate(()=>{localStorage.setItem('thirteen_v2','{"v":2,"floor":99}')});await page.reload();await page.waitForFunction(()=>window.__13);
 const warn2=await page.evaluate(()=>({w:document.querySelector('#dialog .warn')&&document.querySelector('#dialog .warn').textContent,b:__13.buttons()}));chk(/could not be validated/.test(warn2.w||'')&&!warn2.b.includes('Continue'),'invalid save rejected and explained');
 // smaller viewport legibility + screenshots
 await page.setViewport({width:900,height:620});await page.evaluate(()=>{__13.clearStorage()});await page.reload();await page.waitForFunction(()=>window.__13);
 const dims=await page.evaluate(()=>{const c=document.querySelector('#game').getBoundingClientRect(),p=document.querySelector('.panel').getBoundingClientRect();return {cw:c.width,ch:c.height,pw:p.width,px:p.x,fontPanel:getComputedStyle(document.querySelector('.panel')).fontSize}});
 chk(dims.cw>=500&&dims.pw>=250,'900px viewport: canvas '+dims.cw.toFixed(0)+'px wide, panel '+dims.pw.toFixed(0)+'px');
 await page.evaluate(()=>{__13.click('New game');__13.click('Female')});await page.waitForFunction(()=>__13.modal==='scene');await page.screenshot({path:path.join(__dirname,'../build/shot-awakening-900.png')});
 await page.evaluate(()=>{__13.sceneFinish();__13.auto=true});await new Promise(r=>setTimeout(r,300));await page.screenshot({path:path.join(__dirname,'../build/shot-assessment-900.png')});
 await page.evaluate(()=>{__13.auto=false;__13.jump(8,'e');__13.fs().genA=true;__13.step(5)});await page.screenshot({path:path.join(__dirname,'../build/shot-f8-900.png')});
 await page.evaluate(()=>{__13.jump(13,'r');__13.step(5)});await page.screenshot({path:path.join(__dirname,'../build/shot-f13r-900.png')});
 await page.evaluate(()=>{__13.jump(13,'e');__13.G.stage='cell';__13.step(5);__13.walkTo(13,14);__13.use()});await page.screenshot({path:path.join(__dirname,'../build/shot-gridlock-900.png')});
 console.log(out.join('\n'));console.log('console errors (test page):',errors);if(errors.length)process.exitCode=1;await browser.close();
 // normal mode (no #test): no hooks, auto loop runs, no errors
 ({browser,page,errors}=await open({test:false}));await new Promise(r=>setTimeout(r,1500));
 const nm=await page.evaluate(()=>({hooks:typeof window.__13,title:document.querySelector('#dialog h2').textContent}));
 console.log((nm.hooks==='undefined'&&nm.title==='13'?'PASS ':'FAIL ')+'normal mode: no test hooks, title shown; console errors: '+JSON.stringify(errors));if(nm.hooks!=='undefined'||errors.length)process.exitCode=1;
 await browser.close()})().catch(e=>{console.error('FAIL',e);process.exit(1)});
