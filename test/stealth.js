const {open}=require('./lib');
(async()=>{const {browser,page,errors}=await open();const out=[];const chk=(c,m)=>{out.push((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
 await page.evaluate(()=>{__13.clearStorage();__13.click('New game');__13.click('Female')});await page.waitForFunction(()=>__13.modal==='scene');
 const r=await page.evaluate(()=>{const A=__13;A.sceneFinish();A.jump(5,'e');const R=A.R;const T=32,tc=(x,y)=>({x:(x+.5)*T,y:(y+.5)*T});const res={};
  R.guards[1].active=false;const g=R.guards[0];const put=(gx,gy,ang)=>{Object.assign(g,tc(gx,gy));g.angle=ang;g.mode='patrol';g.path=null;g.route=[];g.home={x:g.x,y:g.y,angle:ang}};
  const pl=(x,y)=>A.setPlayer(x,y);const WA=R.doors.find(d=>d.id==='WA');
  // 1 line of sight and occlusion
  put(18,7,Math.PI);pl(14,7);res.seeOpenDoor=A.canSee(0);WA.open=false;res.seeClosedDoor=A.canSee(0);WA.open=true;pl(13,5);res.seeBehindWall=A.canSee(0);
  pl(14,7);g.angle=0;res.seeBehindBack=A.canSee(0);
  // 2 hearing: running behind the guard is heard, walking/crouching at the same distance is not
  put(20,10,-Math.PI/2);pl(20,13);A.key('shift');A.key('s');A.step(1);res.heardRun=A.canHear(0);res.modeAfterRun=A.guard(0).mode;A.step(3);res.modeLater=A.guard(0).mode;A.release();
  put(20,10,-Math.PI/2);pl(20,13);A.key('s');A.step(2);res.heardWalk=A.canHear(0);A.release();put(20,10,-Math.PI/2);pl(20,13);A.key('control');A.key('s');A.step(2);res.heardCrouch=A.canHear(0);A.release();
  // 3 pursuit and capture, success path
  put(20,10,Math.PI/2);pl(20,13);A.step(2);res.pursue=A.guard(0).mode;let n=0;while(A.modal!=='capture'&&n<600){A.step(1);n++}res.captured=A.modal==='capture';
  const c=R.capture;n=0;while(Math.abs((.5+.5*Math.sin(c.t*4.2))-.5)>.04&&n<400){A.step(1);n++}A.captureSpace();res.captureResult=c.result;A.seconds(1);res.afterSuccessModal=A.modal;res.guardDisabled=A.guard(0).disabled>0;res.graceGiven=R.grace>0;
  // 4 failure path: progress preserved, reset to checkpoint
  A.fs().released=true;R.grace=0;put(20,10,Math.PI/2);pl(20,12);g.mode='pursue';g.lastSeen={x:R.player.x,y:R.player.y};n=0;while(A.modal!=='capture'&&n<600){A.step(1);n++}res.captured2=A.modal==='capture';
  const c2=R.capture;n=0;while(Math.abs((.5+.5*Math.sin(c2.t*4.2))-.5)<.3&&n<400){A.step(1);n++}const resets=R.resets;A.captureSpace();res.failResult=c2.result;A.seconds(1.3);res.resetAfterFail=R.resets>resets;res.tileAfterFail=A.tile();res.progressKept=A.fs().released===true;
  // 5 timeout path
  R.grace=0;put(20,10,Math.PI/2);pl(20,12);g.mode='pursue';g.lastSeen={x:R.player.x,y:R.player.y};n=0;while(A.modal!=='capture'&&n<600){A.step(1);n++}const r2=R.resets;A.seconds(4);res.timeoutReset=R.resets>r2&&A.modal==='none';
  // 6 pause stops simulation; blur clears keys; R resets
  R.grace=0;const t0=R.t;A.key('d');return res;});
 // pause via real key events
 await page.keyboard.press('Escape');const p1=await page.evaluate(()=>({modal:__13.modal,t:__13.R.t,buttons:__13.buttons()}));await page.evaluate(()=>__13.step(120));const p2=await page.evaluate(()=>({modal:__13.modal,t:__13.R.t}));
 await page.evaluate(()=>__13.click('Resume'));const p3=await page.evaluate(()=>__13.modal);
 const blur=await page.evaluate(()=>{const A=__13;A.release();A.key('d');const x0=A.R.player.x;A.step(10);const moved=A.R.player.x>x0;window.dispatchEvent(new Event('blur'));const x1=A.R.player.x;A.step(10);return {moved,stoppedAfterBlur:A.R.player.x===x1}});
 const rr=await page.evaluate(()=>{const A=__13;A.setPlayer(20,10);const r0=A.R.resets;A.press('r');return {reset:A.R.resets>r0,tile:A.tile()}});
 for(const [k,v] of Object.entries(r))out.push('  '+k+' = '+JSON.stringify(v));
 chk(r.seeOpenDoor&&!r.seeClosedDoor&&!r.seeBehindWall&&!r.seeBehindBack,'LOS: seen through open door, occluded by closed door/wall, not behind back');
 chk(r.heardRun&&r.modeAfterRun==='investigate'&&r.modeLater==='pursue'&&!r.heardWalk&&!r.heardCrouch,'hearing: running heard -> investigate (then turns and sees); walking/crouching at 96px not heard');
 chk(r.pursue==='pursue'&&r.captured&&r.captureResult==='ok'&&r.afterSuccessModal==='none'&&r.guardDisabled&&r.graceGiven,'pursuit -> capture -> Space success breaks contact with grace');
 chk(r.captured2&&r.failResult==='fail'&&r.resetAfterFail&&JSON.stringify(r.tileAfterFail)==='[20,27]'&&r.progressKept,'capture failure resets to checkpoint, progress kept');
 chk(r.timeoutReset,'capture timeout resets safely');
 chk(p1.modal==='dialog'&&p1.t===p2.t&&p3==='none'&&p1.buttons.includes('Resume'),'Esc pauses (sim time frozen) and resumes');
 chk(blur.moved&&blur.stoppedAfterBlur,'blur clears held keys');chk(rr.reset&&JSON.stringify(rr.tile)==='[20,27]','R resets to checkpoint');
 console.log(out.join('\n'));console.log('console errors:',errors);if(errors.length)process.exitCode=1;await browser.close()})().catch(e=>{console.error('FAIL',e);process.exit(1)});
