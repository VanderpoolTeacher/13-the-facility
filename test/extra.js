const {open}=require('./lib');const path=require('path');
(async()=>{const {browser,page,errors}=await open();const out=[];const chk=(c,m)=>{out.push((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
 await page.evaluate(()=>{__13.clearStorage();__13.click('New game');__13.click('Female')});await page.waitForFunction(()=>__13.modal==='scene');
 const r=await page.evaluate(()=>{const A=__13;A.sceneFinish();A.jump(13,'r');const res={};
  A.setPlayer(12,12);A.R.player.facing=Math.PI/2;A.step(1);res.insideLab=A.near()&&A.near().o&&A.near().o.id;A.use();res.insideSay=A.sayLog.at(-1);
  A.setPlayer(12,14);A.R.player.facing=-Math.PI/2;A.step(1);res.corridor=A.near()&&A.near().o&&A.near().o.id;
  A.setPlayer(14,14);A.R.player.facing=-Math.PI*.75;A.step(1);const n=A.near();res.diagonalDoor=n?n.type+':'+(n.o&&n.o.id):null;
  // reunion with a memory collected: ending text acknowledges it, scene still plays
  A.G.memories.push(6);A.fs().contained=true;A.fs().breachOpen=true;A.jump(13,'r');A.setPlayer(15,6);A.R.player.facing=Math.PI;A.step(1);A.use();res.reunion=A.modal==='scene'&&A.scene.id==='reunion';A.sceneFinish();res.endText=document.querySelector('#dialog').textContent;res.ending=A.G.ending;
  return res});
 chk(r.insideLab!=='lurectl'&&!/lure|Dead panel/.test(r.insideSay||''),'E from inside the lab does not reach the corridor panel through the wall ('+r.insideLab+')');
 chk(r.corridor==='lurectl','same panel reachable from the corridor side');chk(r.diagonalDoor===null||!/labdoor/.test(r.diagonalDoor),'door not usable diagonally through a wall corner ('+r.diagonalDoor+')');
 chk(r.reunion&&r.ending==='return'&&/Fragments recovered: 1/.test(r.endText),'reunion plays with a memory and the ending acknowledges it');
 // pattern lock screenshot
 await page.evaluate(()=>{__13.click('Begin again');__13.clearStorage();__13.click('New game');__13.click('Male')});await page.waitForFunction(()=>__13.modal==='scene');
 await page.evaluate(()=>{const A=__13;A.sceneFinish();A.G.stage='cell';A.jump(13,'e');A.fs().doorOpened=true;A.fs().revealed=true;A.fs().solution=15;A.R.guards[0].active=false;A.setPlayer(13,14);A.R.player.facing=-Math.PI/2;A.step(1);A.use();A.step(1)});
 const grid=await page.evaluate(()=>__13.modal);chk(grid==='grid','pattern lock UI opens at the Testing 1 door');
 await page.screenshot({path:path.join(__dirname,'../build/shot-gridlock.png')});
 console.log(out.join('\n'));console.log('console errors:',errors);if(errors.length)process.exitCode=1;await browser.close()})().catch(e=>{console.error('FAIL',e);process.exit(1)});
