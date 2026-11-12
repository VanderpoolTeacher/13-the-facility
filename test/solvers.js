// Injected into the #test page. Drives the real simulation through the floor recipes.
window.SOLVE=(()=>{
 const A=window.__13;const log=[];
 const L=m=>{log.push(m)};
 const X=(c,m)=>{if(!c)throw Error('EXPECT '+m+' @F'+A.G.floor+A.G.phase+' tile '+JSON.stringify(A.tile()))};
 const walk=(x,y,st,o={})=>{const r=A.walkTo(x,y,Object.assign({stance:st||'walk'},o));if(!r.ok)throw Error('WALK '+JSON.stringify(r)+' to '+x+','+y+' @F'+A.G.floor+A.G.phase);return r};
 const face=d=>{const k={n:'w',s:'s',e:'d',w:'a'}[d];A.key(k);A.step(1);A.key(k,false);A.step(1)};
 const useAt=(x,y,st,f)=>{walk(x,y,st);if(f)face(f);A.use()};
 const sec=s=>A.seconds(s);
 const fs=()=>A.fs();
 const noGuards=()=>{A.R.guards.forEach(g=>g.active=false)};
 const blindGuards=()=>{A.R.guards.forEach(g=>{g.vision=0})};
 const parkSubject=(tx,ty,area)=>{const s=A.R.subjects[0];if(!s)return;const c={x:(tx+.5)*32,y:(ty+.5)*32};Object.assign(s,{x:c.x,y:c.y,target:[tx,ty],path:null,chase:0,mode:'roam',wait:99});if(area)s.area=area};
 const exitLift=()=>{const [x,y]=A.R.exit;const f=A.G.floor;walk(x,y===2?3:26);A.use();sec(.7);X(A.G.floor!==f,'transition from F'+f);L('transition -> F'+A.G.floor+A.G.phase)};
 const expectExitBlocked=()=>{const [x,y]=A.R.exit;const f=A.G.floor;walk(x,y===2?3:26);A.use();sec(.7);X(A.G.floor===f,'exit should be blocked')};
 const until=(fn,maxSec,label)=>{let t=0;while(!fn()){A.step(6);t+=.1;if(t>maxSec)throw Error('TIMEOUT waiting '+label+' @F'+A.G.floor+A.G.phase)}return t};
 const expectReset=(fn)=>{const r0=A.R.resets;fn();X(A.R.resets>r0,'expected checkpoint reset')};

 const S={};
 /* ---------------- Floor 13 escape ---------------- */
 S['13e']=function(opts={}){
  const route=opts.route||'alcove';
  X(A.modal==='scene'&&A.scene.id==='awakening','awakening scene');A.sceneFinish();
  X(A.G.stage==='assess'&&A.G.floor===13,'assessment stage');X(JSON.stringify(A.tile())==='[6,11]','spawn in assessment room');
  // room atmosphere
  useAt(4,11);X(/three taps/.test(A.sayLog.at(-1)),'pipe says taps');useAt(8,12);useAt(9,9);
  if(opts.choice==='door'){walk(6,12);A.use();X(fs().choice==='door','door choice')}else{walk(5,11);A.use();X(fs().choice==='table','table choice')}
  L('choice='+fs().choice);return 'await-escort';
 };
 S['13e-afterEscort']=function(opts={}){
  const route=opts.route||'alcove';
  X(A.modal==='scene'&&A.scene.id==='escort','escort scene');A.sceneFinish();
  X(A.G.stage==='cell','in cell');X(JSON.stringify(A.tile())==='[36,11]','spawn in cell 13');
  useAt(35,12);useAt(37,11); // atmosphere first
  // door before ability
  walk(36,12);A.use();X(!fs().ability&&/No handle/.test(A.sayLog.at(-1)),'door refuses before ability');
  // camera: brief touch discovers the ability and the camera restarts on release
  walk(36,10);A.holdE(1);X(fs().ability===true,'ability discovered');X(A.R.rt.camOff===0&&A.R.rt.camRestart>0,'camera restarts on release');
  X(!A.announceLog.some(t=>/Camera fault/.test(t)),'short touch draws no check');
  // prolonged fault draws a check: operator walks to the cell and back
  A.holdE(5);X(A.announceLog.some(t=>/Camera fault/.test(t)),'prolonged camera fault announced');
  until(()=>A.announceLog.some(t=>/Anomaly cleared/.test(t)),40,'anomaly cleared');until(()=>A.R.rt.op.state==='standby',30,'operator back on standby');
  // test another cell lock: records attempt, always fails
  // (reachable later from the corridor; here we test from inside after the latch)
  walk(36,12);A.holdE(.9);X(!fs().doorOpened&&/let go/.test(A.sayLog.at(-1)),'early release settles latch');
  A.holdE(2);X(fs().doorOpened&&A.G.stage==='corridor','latch opened the door');
  if(route==='alcove'){
   walk(36,16);A.use();X(A.modal==='grid','cell 16 lock');let rr=A.grid(0b1111);X(/Rejected/.test(rr.msg),'cell 16 rejects a line');A.gridCancel();
   const pre=A.G.attempts.map(a=>a.mask);
   walk(31,18,'run');L('hid in alcove');
   until(()=>A.announceLog.some(t=>/Door opened without authorization/.test(t)),6,'door fault check');
   until(()=>A.announceLog.some(t=>/unaccounted/.test(t)),30,'operator inspects empty cell');
   X(A.modal==='none','not captured while in alcove');
   until(()=>A.guard(0).tile[0]<27,20,'operator passes alcove westward');
   walk(18,15);L('shadowing operator at walking pace');
   until(()=>fs().revealed,20,'pattern revealed while observing');X(!pre.includes(fs().solution),'solution excludes pre-discovery attempts');
   walk(13,18,'run');L('hid in storage niche');
  }else{
   walk(13,18,'run');L('dashed to storage niche');
   until(()=>A.announceLog.some(t=>/Door opened without authorization/.test(t)),6,'door fault check');
   // from the niche, test two cell locks on the way? no: stay hidden. Observe.
   until(()=>fs().revealed,60,'pattern revealed from niche');
  }
  X(A.modal==='none','not captured during reveal');
  until(()=>A.R.rt.op.state==='standby'&&A.guard(0).tile[1]<=6,45,'operator returned to standby');
  // other cell: distinct code, always fails and is recorded
  const n0=A.G.attempts.length;walk(28,14);A.use();X(A.modal==='grid','cell 10 grid lock');let r=A.grid(0b11);X(r&&/Rejected/.test(r.msg),'cell lock rejects');A.gridCancel();
  X(A.G.attempts.length===n0+1,'attempt recorded');
  // lab door: wrong pattern, then the observed one
  const sol=fs().solution;X(sol!=null,'solution chosen');X(!A.G.attempts.some(a=>a.mask===sol),'solution never submitted before');
  walk(13,14);A.use();X(A.modal==='grid','lab grid');const wrong=sol===0b1111?0b11110000:0b1111;r=A.grid(wrong);X(/Rejected/.test(r.msg),'wrong pattern rejected');
  X(A.modal==='grid','grid stays open');r=A.grid(sol);X(r&&r.close,'solution accepted');X(fs().labOpen&&A.G.learned.pattern===sol&&A.G.learned.f12,'pattern learned');
  X(A.R.doors.find(d=>d.id==='labdoor').open,'lab door open');
  // captive encounter, once
  walk(14,9);A.use();X(A.modal==='scene'&&A.scene.id==='captive','captive scene');A.sceneFinish();X(fs().captiveMet,'captive met');
  A.use();X(A.modal==='none','second look is not a scene');
  // lift control refuses without circuit? (operator patrols) · circuit console
  walk(11,9);A.use();X(A.timers().circuit>9,'circuit window');X(A.guard(0).disabled>0,'operator disabled');
  // let it expire and repeat
  sec(11);X(A.guard(0).disabled<=0&&!A.timers().circuit,'circuit expired');A.use();X(A.timers().circuit>9,'circuit repeated');
  walk(17,11,'run');A.use();X(A.R.doors.find(d=>d.id==='labside').open,'service door open');
  walk(19,3,'run');A.use();X(fs().liftReleased,'lift released');X(A.modal==='none','reached lift control unseen');
  exitLift();X(A.G.floor===12&&A.G.phase==='e','on floor 12');
 };
 /* ---------------- Floor 12 escape ---------------- */
 S['12e']=function(opts={}){noGuards();
  useAt(18,13);X(fs().inspected,'scanner inspected');
  // scout the stair landing: blocked
  walk(3,16);A.use();X(!A.R.doors.find(d=>d.id==='landing').open&&/LANDING LOCK/.test(A.sayLog.at(-1)),'landing lock blocked');
  // scanner without credential: restraint and reset
  expectReset(()=>{A.walkTo(20,11,{ignoreHazards:true})});X(JSON.stringify(A.tile())==='[20,27]','returned to lift');
  if(opts.stairs){
   useAt(4,24);X(fs().maintPower,'maint power');useAt(4,15);X(fs().landingUnlocked,'landing unlocked');walk(3,16);A.use();X(A.R.doors.find(d=>d.id==='landing').open,'landing open');
   walk(1,16);A.use();sec(.7);X(A.G.floor===11&&JSON.stringify(A.tile())==='[1,16]','arrived F11 by stairs');X(A.R.guards.length===2,'stair alert patrol present');return;
  }
  useAt(8,25);X(A.timers().spoof>13,'spoofed');sec(15);X(!A.timers().spoof,'spoof expired');
  expectReset(()=>{A.walkTo(20,11,{ignoreHazards:true})});L('expired credential blocked at scanner');
  useAt(8,25);walk(20,11,'run');X(fs().crossed,'crossed scanner');
  // restraint arms: blocked path then window
  walk(20,5);X(A.path(19,3,true)===null,'lobby arms block path while live');
  useAt(31,8);X(A.timers().restraint>9,'restraint paused');walk(19,3,'run');A.use();X(fs().liftReleased,'lift released');
  exitLift();
 };
 /* ---------------- Floor 11 escape ---------------- */
 S['11e']=function(){noGuards();
  const lane=fs().clearLane;const lx=[18,20,22][lane];
  walk(18,12);A.use();X(!A.timers().steril&&/Interlock/.test(A.sayLog.at(-1)),'sterilization needs docked arm');
  useAt(8,17);X(fs().diagRead,'diag read');useAt(31,17);X(fs().armDocked,'arm docked');
  walk(18,12);A.use();X(A.timers().steril>13,'steril running');
  const wx=[18,20,22][(lane+1)%3];expectReset(()=>{A.walkTo(wx,6,{ignoreHazards:true})});L('wrong lane floods');X(fs().armDocked,'progress kept after reset');
  X(!A.timers().steril,'timers rebuilt from safe state');
  walk(18,12);A.use();walk(lx,5,'run');walk(18,4,'run');A.use();X(fs().bypassed,'bypassed');
  walk(20,4);A.use();X(A.R.doors.find(d=>d.id==='mscan').open,'scanner gate open');exitLift();
 };
 /* ---------------- Floor 10 escape ---------------- */
 S['10e']=function(){noGuards();
  walk(31,8);A.use();X(!fs().synced&&/Awaiting/.test(A.sayLog.at(-1)),'pair denied before sync');
  X(A.path(12,4)===null&&A.path(13,5)===null,'station blocked by arm');
  useAt(4,6);X(fs().armParked,'arm parked');walk(13,5);A.use();X(A.modal==='sequence','sequence puzzle');
  X(A.seqFail(),'wrong input fails');sec(1.6);X(A.puzzle&&A.puzzle.phase==='show','fresh attempt');A.seqSolve();X(A.modal==='none'&&A.timers().sync>15,'sync window');
  sec(19);X(!A.timers().sync,'sync expired');walk(31,8);A.use();X(!fs().synced,'pair denied after expiry');
  walk(13,5);A.use();A.seqSolve();walk(31,8,'run');A.use();X(fs().synced,'synced');exitLift();
 };
 /* ---------------- Floor 9 escape ---------------- */
 S['9e']=function(){noGuards();
  walk(20,14);A.use();X(!A.R.doors.find(d=>d.id==='A').open,'A does not open by hand');
  useAt(18,14);X(A.R.doors.find(d=>d.id==='A').open,'A open');walk(20,10);expectReset(()=>sec(3));L('vestibule lockdown without redirect');
  useAt(18,14);walk(22,10,'run');A.use();X(fs().redirected,'redirected');walk(22,9);A.use();X(!A.R.doors.find(d=>d.id==='B').open&&/Interlock/.test(A.sayLog.at(-1)),'B interlock while A open');
  useAt(18,10);X(!A.R.doors.find(d=>d.id==='A').open,'A closed');useAt(22,9);X(A.R.doors.find(d=>d.id==='B').open,'B open');
  sec(9);X(!A.R.doors.find(d=>d.id==='B').open,'B auto-closed');useAt(22,9);walk(20,6,'run');X(fs().passedB,'passed B');exitLift();
 };
 /* ---------------- Floor 8 escape ---------------- */
 S['8e']=function(){noGuards();
  walk(18,16);A.use();X(!fs().routed,'route needs gen A');walk(23,24);A.use();X(!A.R.doors.find(d=>d.id==='EC').open,'EC door locked');
  useAt(8,8);X(fs().genA,'gen A');expectReset(()=>{A.walkTo(20,19,{ignoreHazards:true})});L('arcing floor');
  useAt(18,16);X(fs().routed,'routed');walk(20,19);walk(23,24);A.use();X(A.R.doors.find(d=>d.id==='EC').open,'EC open');useAt(34,24);X(fs().genB,'gen B');exitLift();
 };
 /* ---------------- Floor 7 escape ---------------- */
 S['7e']=function(){noGuards();
  walk(19,3);A.use();X(!fs().lockdownOff,'override denied with drone home');walk(23,7);A.use();X(!A.R.doors.find(d=>d.id==='EA').open,'drone station camera-locked');
  useAt(6,8);X(fs().looped,'looped');walk(23,7);A.use();useAt(31,8);X(A.timers().away>15,'drone away');sec(17);X(!A.timers().away,'drone back');
  walk(19,3);A.use();X(!fs().lockdownOff,'override denied after drone returns');useAt(31,8);walk(19,3,'run');A.use();X(fs().lockdownOff,'lockdown off');exitLift();
 };
 /* ---------------- Floor 6 escape ---------------- */
 S['6e']=function(opts={}){noGuards();
  walk(8,17);A.use();X(A.modal==='keypad','keypad');let r=A.keypad('0000');X(!r.close,'wrong code rejected');A.gridCancel();
  useAt(6,8);X(fs().codeA,'code A');useAt(31,8);X(fs().codeB,'code B');
  if(opts.memory){useAt(10,25);X(A.G.memories.includes(6),'memory 6 collected');return 'await-childhood'}
  walk(8,17);A.use();r=A.keypad(fs().codeA+fs().codeB);X(r.close&&fs().indexed,'index unlocked');exitLift();
 };
 S['6e-finish']=function(){walk(8,17);A.use();const r=A.keypad(fs().codeA+fs().codeB);X(r.close&&fs().indexed,'index unlocked');exitLift()};
 /* ---------------- Floor 5 escape ---------------- */
 S['5e']=function(opts={}){noGuards();
  walk(23,7);A.use();X(!A.R.doors.find(d=>d.id==='EA').open,'command door locked');
  useAt(8,17);X(A.timers().auth>15,'auth window');
  if(opts.reload){A.save();X(A.reload(),'reload mid-timer');noGuards();X(!A.timers().auth,'timer rebuilt from safe state');X(JSON.stringify(A.tile())==='[20,27]','placed at lift');walk(23,7);A.use();X(!A.R.doors.find(d=>d.id==='EA').open,'door locked after reload');useAt(8,17)}
  sec(17);X(!A.timers().auth,'auth expired');walk(23,7);A.use();X(!A.R.doors.find(d=>d.id==='EA').open,'locked after expiry');
  useAt(8,17);walk(23,7,'run');A.use();walk(31,8,'run');A.use();X(fs().released,'released');exitLift();
 };
 /* ---------------- Floor 4 escape ---------------- */
 S['4e']=function(){noGuards();
  walk(10,8);A.use();X(A.R.rt.carrying,'carrying decoy');walk(8,24);A.use();X(!A.R.rt.placed&&/simulator is off/.test(A.sayLog.at(-1)),'decoy useless without simulator');
  useAt(6,8);X(fs().simOn,'sim on');walk(8,24);A.use();X(A.R.rt.placed&&A.timers().divert>19,'decoy placed, wardens diverted');sec(21);X(!A.R.rt.placed&&A.R.props[0].x===10,'decoy reset to simulator room');
  walk(10,8);A.use();walk(8,24);A.use();walk(19,3,'run');A.use();X(fs().liftReleased,'lift released');exitLift();
 };
 /* ---------------- Floor 3 escape ---------------- */
 S['3e']=function(){noGuards();
  X(A.path(20,3)===null,'cargo blocks lift path');walk(8,17);A.use();X(!fs().conveying,'conveyor needs cleared loading area');
  useAt(33,17);X(fs().loadingCleared,'loading cleared');useAt(8,17);X(A.timers().belt>3,'belt running');sec(4.5);X(fs().conveyed,'conveyed');X(A.path(20,3)!==null,'lift path exposed');exitLift();
 };
 /* ---------------- Floor 2 escape ---------------- */
 S['2e']=function(){noGuards();walk(23,7);A.use();X(!A.R.doors.find(d=>d.id==='EA').open,'exec door needs badge');useAt(8,17);X(fs().badge,'badge');walk(23,7);A.use();useAt(31,8);X(fs().authorized,'authorized');exitLift()};
 /* ---------------- Floor 1 escape ---------------- */
 S['1e']=function(){noGuards();
  walk(20,4);A.use();X(!A.R.doors.find(d=>d.id==='gate').open,'gate sealed');
  expectReset(()=>{walk(8,17);A.use()});X(!fs().gateOpen&&A.announceLog.some(t=>/Perimeter alarm/.test(t)),'gate under surveillance alarms');
  useAt(31,8);X(fs().survOff,'surveillance off');useAt(8,17);X(fs().gateOpen&&A.R.doors.find(d=>d.id==='gate').open,'gate open');
  walk(20,3);const rr=A.walkTo(20,1);X(rr.ok||rr.reason==='modal:scene','reached threshold');X(A.modal==='scene'&&A.scene.id==='daylight','daylight scene');A.sceneNext();A.sceneNext();A.sceneNext();X(A.modal==='dialog','choice dialog');
  const b=A.buttons();X(b.length===2&&/LEAVE/.test(b[0])&&/RETURN/.test(b[1]),'both choices presented');return 'choice';
 };
 /* ---------------- RETURN floors ---------------- */
 S['1r']=function(){noGuards();X(JSON.stringify(A.tile())==='[20,1]','start at threshold');
  walk(20,2);A.use();X(!A.R.doors.find(d=>d.id==='gate').open,'gate jammed');parkSubject(31,24,[26,36,22,26]);
  walk(30,4);X(JSON.stringify(A.tile())==='[30,4]','entered vehicle bay');walk(28,8);A.use();X(fs().bypassed,'perimeter bypassed');
  expectExitBlocked();useAt(8,25);X(fs().liftPower,'lift power');exitLift();
 };
 S['2r']=function(){noGuards();parkSubject(31,24,[26,36,22,26]);walk(20,19);A.use();X(!A.R.doors.find(d=>d.id==='shutter').open,'shutter locked');walk(22,19);A.use();X(!fs().override,'override needs token');
  walk(31,7);A.use();X(fs().token,'token');walk(22,19);A.use();X(fs().override&&A.R.doors.find(d=>d.id==='shutter').open,'shutter open');exitLift()};
 S['3r']=function(){noGuards();parkSubject(31,24,[26,36,22,26]);X(A.path(20,26)===null,'debris blocks lane');useAt(8,17);X(A.timers().clear>3,'belt clearing');sec(4.5);X(fs().debrisCleared,'debris cleared');
  // belt cycles: wait for a stopped phase, cross; then test stop control too
  walk(20,19);until(()=>!A.R.rt.beltOn&&(A.R.rt.cycle%7)<4.3,8,'start of a stopped phase');walk(20,22,'run');X(fs().crossed,'crossed during stop');walk(22,19);A.use();X(fs().beltStopped,'belt stopped');exitLift()};
 S['4r']=function(){blindGuards();walk(31,7);A.use();X(A.R.rt.carrying,'carrying decoy');walk(16,24);face('n');A.use();X(!fs().sealed&&/Nothing is inside/.test(A.sayLog.at(-1)),'seal with empty room fails');
  walk(8,24);A.use();X(A.R.rt.placed,'decoy placed');walk(16,24,'run');until(()=>A.R.guards.filter(g=>g.active&&g.x<14*32&&g.y>21*32).length>=2,12,'both robots in training room');face('n');A.use();X(fs().sealed&&!A.R.doors.find(d=>d.id==='WC').open,'training room sealed');exitLift()};
 S['5r']=function(){noGuards();parkSubject(31,16,[26,36,13,19]);walk(23,24);A.use();X(!A.R.doors.find(d=>d.id==='EC').open,'backup room under lockdown');useAt(31,8);X(fs().lockdownOff,'lockdown off');walk(23,24);A.use();useAt(31,25);X(fs().evac,'evac');exitLift()};
 S['6r']=function(opts={}){noGuards();X(A.path(20,26)===null,'shelf blocks corridor');X(!A.near()||A.near().o.id!=='liftctl','lift control buried');
  if(opts.memory){X(A.R.items.find(i=>i.id==='mem6').visible()===false,'memory 6 not duplicated on descent')}
  useAt(31,17);sec(5.5);X(fs().cleared&&A.path(20,26)!==null,'shelf cleared');walk(20,25);A.use();X(fs().liftRestored,'lift restored');exitLift()};
 S['7r']=function(){noGuards();walk(19,26);A.use();X(!fs().evac,'evac denied without handoff');useAt(8,17);X(A.timers().handoff>13,'handoff');sec(15);X(!A.timers().handoff,'handoff expired');walk(19,26);A.use();X(!fs().evac,'denied after expiry');
  useAt(8,17);walk(19,26,'run');A.use();X(fs().evac,'evac');exitLift()};
 S['8r']=function(){noGuards();X(A.path(20,26,true)===null,'live corridor blocks');X(A.path(33,17,true)===null,'bay unreachable before diversion');
  useAt(6,8);X(fs().aux,'aux diverted');X(A.path(33,17,true)!==null,'bay reachable');X(A.path(20,26,true)===null,'junction still live');useAt(33,17);X(fs().botSent,'bot sent');until(()=>fs().isolated,15,'junction isolated');X(A.path(20,26,true)!==null,'route clear');exitLift()};
 S['9r']=function(){noGuards();parkSubject(31,16);walk(23,24);face('n');A.use();X(A.R.rt.lure,'alarm sounded');A.use();X(!fs().resealed&&/empty/.test(A.sayLog.at(-1)),'reseal on empty chamber fails');
  A.use();walk(16,24,'run');until(()=>A.subject(0).mode==='linger',15,'subject enters chamber');walk(23,24,'run');face('n');A.use();X(fs().resealed,'resealed with subject inside');exitLift()};
 S['10r']=function(opts={}){noGuards();parkSubject(31,24,[26,36,22,26]);X(A.path(23,16,true)===null,'contaminated lane blocks seal panel');
  useAt(8,17);X(A.timers().vent>9,'venting');
  if(opts.reload){A.save();X(A.reload(),'reload mid-vent');noGuards();parkSubject(31,24,[26,36,22,26]);X(!A.timers().vent&&!fs().vented,'vent rebuilt from safe state');useAt(8,17)}
  sec(10.5);X(fs().vented,'vented');sec(26);X(!fs().vented,'haze returned without seal');useAt(8,17);sec(10.5);X(fs().vented,'vented again');walk(23,16,'run');face('n');A.use();X(fs().sealed,'sealed');exitLift()};
 S['11r']=function(){noGuards();parkSubject(20,24);walk(17,7);face('n');A.use();X(!fs().isoPower&&/Dead panel/.test(A.sayLog.at(-1)),'lure denied without power');
  walk(16,7);face('s');A.use();X(fs().isoPower,'iso power');walk(17,7);face('n');A.use();X(A.R.rt.lure,'lured');walk(20,4,'run');until(()=>A.subject(0).mode==='linger',15,'subject in isolation');walk(17,7,'run');face('n');A.use();X(fs().isoSealed,'isolation sealed');exitLift()};
 S['12r']=function(){noGuards();parkSubject(20,25);useAt(31,8);X(A.R.rt.lure,'alarm');walk(22,10,'run');face('e');A.use();X(!fs().contained&&/Miss/.test(A.sayLog.at(-1)),'engage on empty footprint misses and resets');
  useAt(31,8);until(()=>{const s=A.subject(0);return s.mode==='linger'},15,'subject in footprint');walk(22,10,'run');face('e');A.use();X(fs().contained,'contained');exitLift()};
 S['13r']=function(){X(A.G.floor===13&&A.G.phase==='r','on 13 return');parkSubject(36,15);
  walk(19,5);A.use();X(!fs().breachOpen&&/HATCH LOCKED/.test(A.sayLog.at(-1)),'hatch interlocked');
  walk(12,14);face('n');A.use();X(!fs().emPower&&/Dead panel/.test(A.sayLog.at(-1)),'lure panel dead without power');
  walk(19,7);A.use();X(fs().emPower,'emergency power');walk(12,14);face('n');A.use();X(A.R.rt.lure,'lure on');face('n');A.use();X(!fs().contained&&/empty/.test(A.sayLog.at(-1)),'closing early misses');
  face('n');A.use();walk(12,17,'run');until(()=>A.subject(0).mode==='linger',20,'subject in chamber');walk(12,14,'run');face('n');A.use();X(fs().contained,'contained');
  X(A.path(15,6)===null,'captive unreachable before breach');walk(19,5);A.use();X(fs().breachOpen,'breach open');X(A.path(15,6)!==null,'breach traversable');walk(15,6);A.use();X(A.modal==='scene'&&A.scene.id==='reunion','reunion scene');return 'reunion'};
 return {S,log,walk,useAt,A,X,sec,until};
})();
