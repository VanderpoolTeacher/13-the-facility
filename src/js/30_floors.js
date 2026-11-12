/* ============================================================
   FLOORS 12 → 1 · escape and return recipes
   ============================================================ */
function dev(B,o){ // generic device: requirements, optional timer window, durable flag
 return B.item(Object.assign({kind:'console',solid:true,
  prompt:B=>o.doneFlag&&B.has(o.doneFlag)?'E: '+(o.doneLabel||o.label+' (done)'):'E: '+o.label,
  lit:B=>o.doneFlag&&B.has(o.doneFlag)?'#7fd0c6':o.timerName&&B.active(o.timerName)?'#e7c45c':'#e04848',
  use(B){if(o.doneFlag&&B.has(o.doneFlag)){B.say(o.doneMsg||'Already done.');return}
   for(const r of (o.requires||[])){const ok=typeof r==='function'?r(B):B.has(r);if(!ok){B.say(o.deny||'Not ready.');SFX.deny();if(o.onDeny)o.onDeny(B);return}}
   if(o.timerName)B.timer(o.timerName,o.timerSec);
   if(o.doneFlag)B.flag(o.doneFlag);
   SFX.confirm();B.say(o.msg||'Done.');if(o.announce)B.announce(o.announce);if(o.after)o.after(B)}},o));
}
function memoryAt(B,f,room,label){const [x,y]=roomCenter(room);B.item({id:'mem'+f,x:x+2,y:y+1,kind:'memory',label:label||'Memory fragment',visible:()=>!G.memories.includes(f),use(){collectMemory(f)}})}
function patrol(B,id,route,speed=55){return B.guard({id,tx:route[0][0],ty:route[0][1],route,speed})}
function wallBar(y,x0=18,x1=22,skip){for(let x=x0;x<=x1;x++)if(x!==skip)B.wall(x,y)}
function sealRoom(B,room,s){const [x0,x1,y0,y1]=[ROOMS[room][0],ROOMS[room][1],ROOMS[room][2],ROOMS[room][3]];return B.inRoom(s,[x0,x1,y0,y1])}
function lurePanel(B,o){ // shared lure-then-seal control used by return floors
 return B.item({id:o.id,x:o.x,y:o.y,kind:'panel',label:o.label,lit:B=>B.has(o.flag)?'#7fd0c6':B.rt.lure?'#e7c45c':'#9fb0ba',
  prompt:B=>B.has(o.flag)?'E: Sealed':B.rt.lure?'E: Seal '+o.roomName:'E: '+o.lureLabel,
  use(B){const rt=B.rt,s=R.subjects[0],d=B.doorById(o.door);
   if(B.has(o.flag)){B.say(o.roomName+' is sealed.');return}
   for(const r of (o.requires||[]))if(!B.has(r)){B.say(o.deny);SFX.deny();return}
   if(!rt.lure){rt.lure=true;if(d)d.open=true;R.dirty=true;SFX.lure();if(OPT.captions)ui.caption('[alarm tone from '+o.roomName+']',2.5);s.mode='lured';s.target=o.target;s.lingerFor=o.linger||5;s.path=null;s.chase=0;s.onLeave=()=>{B.say('The subject wanders back out. Reset the lure and try again.')};B.say(o.lureMsg+' Stand clear of its path, then come back to the panel.');return}
   const inside=sealRoom(B,o.room,s);rt.lure=false;if(d){d.open=false;R.dirty=true;SFX.door()}
   if(inside){s.mode='held';B.flag(o.flag);SFX.confirm();B.announce(o.announce||'Containment restored.');B.say(o.sealMsg)}
   else{s.mode='roam';s.target=null;B.say('Sealed on an empty room. The control resets; trigger the lure again.');SFX.deny()}}});
}
function heldSubject(B,room){const s=R.subjects[0];const [x,y]=roomCenter(room);const c=tc(x,y);s.x=c.x;s.y=c.y;s.mode='held';s.home={x:c.x,y:c.y}}
function occupancyCue(B,room){const s=R.subjects[0];if(sealRoom(B,room,s)){if(Math.floor(R.t*2)%6===0&&R.t%.5<STEP)SFX.growl();B.effect({kind:'ring',x:s.x,y:s.y,dur:.3})}}
function stairLanding(B){B.floor(1,15,'r');B.floor(1,17,'r');B.floor(1,16,'stairs');B.floor(2,16,'c')}

/* ======================= FLOOR 12 · PROCESSING ======================= */
FLOOR[12]={};
FLOOR[12].e={name:'PROCESSING',
 objectives:[{id:'o1',label:'Scout: maintenance office, service stairs, or inspect the scanner',done:fs=>fs.spoofed||fs.landingUnlocked||fs.inspected},
  {id:'o2',label:'Spoof a maintenance identity (short-lived) and cross the scanner',done:fs=>fs.crossed||fs.usedStairs},
  {id:'o3',label:'Interrupt the restraint cycle, then release the lift',done:fs=>fs.liftReleased||fs.usedStairs},
  {id:'o4',label:'Alternative: power and unlock the service-stair landing',done:fs=>fs.landingUnlocked||fs.liftReleased}],
 exitReady:fs=>!!fs.liftReleased,exitMsg:'Restraint arms cover the lift lobby. Release the lift at its control.',
 build(B){const fs=B.fs;
  wallBar(12,18,22,20);B.door({id:'scanner',x:20,y:12,open:true,persist:false,noRobot:true,label:'Scanner gate',locked:null,prompt:()=>null,use(B){B.say('The scanner reads you as you pass. Nothing to operate here.')}});
  for(let y=13;y<=20;y++)B.floor(20,y,'lane');B.label(20,12,'SCAN','#fff');B.label(16,22,'MAINT →','#e7c45c');B.label(16,15,'← STAIRS','#e7c45c');B.label(16,24,'OFFICE');
  B.hazard({id:'scan',kind:'uv',tiles:[[20,12]],active:B=>!B.active('spoof'),msg:'“Transfer authorization required.” The lane restraints close on you and hold you for review. You are returned to the lift.'});
  B.item({id:'scaninfo',x:18,y:12,side:'s',kind:'panel',label:'Scanner housing',prompt:'E: Inspect the scanner',use(B){B.flag('inspected');B.say('The scanner checks transfer authorization or staff clearance. The floor code got you in; this wants something else. A maintenance credential would pass, briefly.')}});
  dev(B,{id:'badge',x:8,y:24,label:'Spoof maintenance identity',timerName:'spoof',timerSec:14,msg:'The office terminal issues a maintenance credential in your name. It expires fast. Go.',after:B=>B.flag('spoofed'),prompt:B=>'E: Spoof maintenance identity (renewable)'});
  dev(B,{id:'breaker',x:4,y:23,label:'Maintenance breaker',doneFlag:'maintPower',msg:'The breaker closes. A line marked SERVICE LANDING comes alive.',kind:'panel'});
  B.door({id:'landing',x:2,y:16,label:'Stair landing lock',locked:B=>B.has('landingUnlocked')?null:'LANDING LOCK — no power. The maintenance office should have a breaker.'});
  stairLanding(B);dev(B,{id:'landingctl',x:4,y:14,label:'Landing lock release',doneFlag:'landingUnlocked',requires:['maintPower'],deny:'The release is dead. It needs the maintenance breaker.',msg:'The landing lock releases. The service stairs are open, and the facility will notice.',kind:'panel'});
  B.item({id:'stairs',x:1,y:16,kind:'stairs',label:'Service stairs up',prompt:'E: Climb to Floor 11',use(B){B.flag('usedStairs');fsOf(11,'e').stairAlert=true;B.announce('Service stair breach, Floor 12. Patrol dispatched to Floor 11 landing.');transitionStairs(11,[1,16])}});
  B.hazard({id:'arms',kind:'sweep',tiles:[[19,3],[20,3],[21,3],[19,4],[20,4],[21,4]],active:B=>!B.active('restraint')&&!B.has('liftReleased'),msg:'The restraint arms take you off your feet and hold you for AI review. You are returned to the lift.'});
  dev(B,{id:'restraint',x:31,y:7,label:'Interrupt the restraint cycle',timerName:'restraint',timerSec:10,msg:'The restraint cycle pauses. The lobby arms fold back for a few seconds.'});
  dev(B,{id:'liftctl',x:18,y:3,label:'Release the lift',doneFlag:'liftReleased',kind:'panel',msg:'Lift released. The restraint arms stand down for good.',announce:'Lift 12 released.'});
  patrol(B,'g1',[[20,5],[20,10]],50);patrol(B,'g2',[[20,22],[20,16]],45);
  memoryAt(B,12,'EB','Intake records');
 },
 tick(dt,B){const p=R.player,rt=B.rt;const [tx,ty]=B.tileOf(p);if(ty>=13&&ty<=20&&tx===20&&!rt.scanSaid){rt.scanSaid=true;B.announce('Transfer authorization required.')}
  if(ty<12&&tx>=18&&tx<=22&&!B.has('crossed')&&B.active('spoof'))B.flag('crossed');},
 onExpire(B,k){if(k==='spoof')B.say('The maintenance credential expires.');if(k==='restraint')B.say('The restraint cycle resumes.')}
};
FLOOR[12].r={name:'PROCESSING',
 objectives:[{id:'o1',label:'Activate the restraint alarm to attract the roaming subject',done:fs=>fs.contained},{id:'o2',label:'Engage restraint while the subject stands in the marked footprint',done:fs=>fs.contained}],
 exitReady:fs=>!!fs.contained,exitMsg:'The lower lift will not answer while an escaped subject roams Processing.',
 build(B){const fs=B.fs;wallBar(12,18,22,20);B.door({id:'scanner',x:20,y:12,open:true,persist:false,noRobot:true,label:'Dead scanner',prompt:()=>null,use(B){B.say('The scanner is dead. Its lane markings are scorched.')}});
  for(const [x,y] of [[19,9],[20,9],[19,10],[20,10],[19,11],[20,11]])B.paint(x,y,'mark');B.label(21,8,'RESTRAINT','#e7c45c');B.paint(20,14,'debris');B.paint(19,22,'blood');
  dev(B,{id:'alarm',x:31,y:7,label:'Restraint alarm',prompt:B=>'E: Sound the restraint alarm',use(B){const s=R.subjects[0];B.rt.lure=true;SFX.lure();s.mode='lured';s.target=[20,10];s.lingerFor=4;s.path=null;s.chase=0;s.onLeave=()=>{B.rt.lure=false;B.say('The subject drifts out of the footprint. Sound the alarm again to reset the lure.')};B.say('The restraint station begins to chime. Something in the corridor turns toward it. Engage the restraint from the side lever when it stands in the footprint.')}});
  B.item({id:'engage',x:23,y:10,kind:'lever',label:'Restraint lever',prompt:B=>B.has('contained')?'E: Restraint engaged':'E: Engage restraint',use(B){const s=R.subjects[0];if(B.has('contained')){B.say('The subject is held fast.');return}
   const [sx,sy]=B.tileOf(s);const inside=sx>=19&&sx<=20&&sy>=9&&sy<=11;if(inside){s.mode='held';const c=tc(20,10);s.x=c.x;s.y=c.y;B.flag('contained');SFX.confirm();B.announce('Subject restrained. Processing clear.');B.say('The arms close over the subject. It thrashes, then goes still.')}
   else{SFX.deny();B.rt.lure=false;s.mode='roam';s.target=null;B.say('Miss. The restraint cycles on empty air and resets. The lure is cleared; sound the alarm again.')}}});
  B.subject({id:'sub',tx:20,ty:22,area:[18,4,22,26],speed:60});if(fs.contained){const s=R.subjects[0];const c=tc(20,10);s.x=c.x;s.y=c.y;s.mode='held';s.home={x:c.x,y:c.y}}
  memoryAt(B,12,'EB','Intake records');
 },
 onReset(B){if(B.has('contained')){const s=R.subjects[0];const c=tc(20,10);s.x=c.x;s.y=c.y;s.mode='held'}}
};

/* ======================= FLOOR 11 · MEDICAL ======================= */
FLOOR[11]={};
const LANE_NAMES=['A','B','C'];
FLOOR[11].e={name:'MEDICAL',
 objectives:[{id:'o1',label:fs=>fs.diagRead?'Diagnostics: lane '+LANE_NAMES[fs.clearLane]+' stays clear during sterilization':'Read the diagnostics to learn which lane stays clear',done:fs=>fs.diagRead},
  {id:'o2',label:'Dock the surgical arm',done:fs=>fs.armDocked},{id:'o3',label:'Start sterilization and cross the clear lane',done:fs=>fs.bypassed},{id:'o4',label:'Use the medical scanner bypass',done:fs=>fs.bypassed}],
 exitReady:fs=>!!fs.bypassed,exitMsg:'The medical scanner holds the lift doors. Use the bypass.',
 build(B){const fs=B.fs;if(fs.clearLane===undefined){fs.clearLane=Math.floor(rand()*3);saveGame()}
  for(let y=5;y<=10;y++){B.wall(19,y);B.wall(21,y)}
  const lanes=[18,20,22];lanes.forEach((x,i)=>{B.door({id:'lane'+i,x,y:10,label:'Lane '+LANE_NAMES[i]+' gate',persist:false,noRobot:true,locked:B=>B.active('steril')?null:'Lane gates open only during a sterilization cycle.'});
   B.hazard({id:'uv'+i,kind:'uv',tiles:[5,6,7,8,9].map(y=>[x,y]),active:B=>B.active('steril')&&B.fs.clearLane!==i,msg:'Sterilant floods lane '+LANE_NAMES[i]+'. You stumble out, blind and burning, and wake by the lift.'});
   B.label(x,4,'LANE '+LANE_NAMES[i],'#cfd8dc')});
  B.door({id:'mscan',x:20,y:3,label:'Medical scanner gate',locked:B=>B.has('bypassed')?null:'BIOMETRIC MISMATCH. The scanner refuses the lift.'});
  B.hazard({id:'arm',kind:'sweep',tiles:[18,19,20,21,22].map(x=>[x,11]),active:B=>!B.has('armDocked'),msg:'The surgical arm sweeps the corridor and knocks you flat. You come to by the lift.'});
  B.prop({x:20,y:11,kind:'arm',solid:false,angle:0,len:60});
  dev(B,{id:'diag',x:8,y:16,label:'Read diagnostics',doneFlag:'diagRead',msg:'Diagnostics: sterilant feeds are saturated on two lanes. Lane '+LANE_NAMES[fs.clearLane]+' reports nominal — it stays clear during a cycle.'});
  dev(B,{id:'armctl',x:31,y:16,label:'Dock the surgical arm',doneFlag:'armDocked',msg:'The surgical arm folds itself into its dock. The corridor stops moving.'});
  dev(B,{id:'steril',x:17,y:12,label:'Start sterilization cycle',kind:'panel',timerName:'steril',timerSec:14,requires:['armDocked'],deny:'Interlock: the surgical arm is still deployed.',msg:'Sterilization begins. The lane gates open. Two lanes are flooding.',after:B=>{for(let i=0;i<3;i++){const d=B.doorById('lane'+i);d.open=true}R.dirty=true}});
  dev(B,{id:'bypass',x:17,y:4,label:'Medical scanner bypass',kind:'panel',doneFlag:'bypassed',msg:'You bypass the biometric scanner. The lift gate unlocks.',announce:'Medical scanner bypassed. Lift 11 available.'});
  patrol(B,'g1',[[20,24],[20,14]],50);
  stairLanding(B);B.door({id:'landing',x:2,y:16,label:'Stair landing door',persist:false,open:true});B.item({id:'stairsdn',x:1,y:16,kind:'stairs',label:'Service stairs',prompt:'E: Stairs down to Floor 12',use(B){transitionStairs(12,[1,16])}});
  if(fs.stairAlert)patrol(B,'g2',[[4,16],[12,16]],55);
  memoryAt(B,11,'EA','Medical recording');
 },
 tick(dt,B){const p=R.props[0];if(p&&!B.has('armDocked'))p.angle+=dt*2.5;if(B.has('armDocked')){p.angle=-Math.PI/2;p.len=20}},
 onExpire(B,k){if(k==='steril'){for(let i=0;i<3;i++){const d=B.doorById('lane'+i);d.open=false}R.dirty=true;B.say('The sterilization cycle ends. The lane gates close again.')}}
};
FLOOR[11].r={name:'MEDICAL',
 objectives:[{id:'o1',label:'Restore isolation power from the controls outside the room',done:fs=>fs.isoPower},{id:'o2',label:'Lure the subject into isolation',done:fs=>fs.isoSealed},{id:'o3',label:'Seal isolation once it is occupied',done:fs=>fs.isoSealed}],
 exitReady:fs=>!!fs.isoSealed,exitMsg:'The lower lift stays locked while the subject roams Medical.',
 build(B){const fs=B.fs;B.label(9,3,'ISOLATION');B.paint(20,6,'blood');B.paint(21,18,'debris');
  B.door({id:'WA',x:15,y:7,label:'Isolation door',open:false,persist:false,noRobot:true,locked:B=>fs.isoSealed?'Sealed.':'Motorized. Use the outside panel.'});
  B.hazard({id:'leak',kind:'gas',tiles:[[22,14],[22,15],[21,15],[22,16]],active:()=>true,msg:'A ruptured line vents something caustic. You back out coughing and come to by the lift.'});
  dev(B,{id:'isopower',x:16,y:8,kind:'panel',label:'Isolation power',doneFlag:'isoPower',msg:'Isolation power comes back. The door motor and the room alarm wake.'});
  lurePanel(B,{id:'isoctl',x:17,y:6,label:'Isolation control',flag:'isoSealed',door:'WA',room:'WA',roomName:'isolation',target:roomCenter('WA'),requires:['isoPower'],deny:'Dead panel. Restore isolation power first.',lureLabel:'Sound the isolation alarm',lureMsg:'The isolation room alarm sounds and the door opens. The subject turns toward it. Seal the door once it is inside.',sealMsg:'The door seals with the subject inside. Medical is quiet again.',announce:'Isolation sealed.'});
  B.subject({id:'sub',tx:20,ty:20,area:[18,4,22,26],speed:60});if(fs.isoSealed)heldSubject(B,'WA');
  memoryAt(B,11,'EA','Medical recording');
 },
 tick(dt,B){if(B.rt.lure)occupancyCue(B,'WA')},onReset(B){if(B.has('isoSealed'))heldSubject(B,'WA');else{B.doorById('WA').open=false;B.rt.lure=false}}
};

/* ======================= FLOOR 10 · RESEARCH ======================= */
FLOOR[10]={};
FLOOR[10].e={name:'RESEARCH',
 objectives:[{id:'o1',label:'Park the lab arm to expose the cognitive station',done:fs=>fs.armParked},{id:'o2',label:'Match the displayed sequence at the cognitive station',done:fs=>fs.synced},{id:'o3',label:'Activate the paired lab terminal while synchronization is available',done:fs=>fs.synced}],
 exitReady:fs=>!!fs.synced,exitMsg:'The lift waits on laboratory synchronization.',
 build(B){const fs=B.fs;const arm=B.prop({x:12,y:4,w:1,h:2,kind:'arm',solid:true,angle:Math.PI/2,len:30}),arm2=B.prop({x:13,y:5,kind:'arm',solid:true,angle:0,len:20});if(fs.armParked){for(const a of [arm,arm2]){a.hidden=true;a.solid=false}}
  dev(B,{id:'armctl',x:4,y:5,label:'Park the lab arm',doneFlag:'armParked',msg:'The lab arm retracts along its rail and parks. The cognitive station is exposed.',after:B=>{for(const a of [arm,arm2]){a.hidden=true;a.solid=false}}});
  B.item({id:'cog',x:13,y:4,kind:'terminal',solid:true,label:'Cognitive station',prompt:B=>B.has('synced')?'E: Station idle':'E: Begin the visual sequence',use(B){if(B.has('synced')){B.say('The station has nothing more for you.');return}openSequence({len:4,onDone(ok){if(ok){B.timer('sync',18);B.say('Sequence accepted. The paired terminal in the east lab is synchronized for a short window.')}}})}});
  dev(B,{id:'pair',x:31,y:7,label:'Paired lab terminal',doneFlag:'synced',requires:[B=>B.active('sync')],deny:'“Awaiting synchronization.” The cognitive station must be matched first, and recently.',msg:'Both laboratories synchronize. The lift lock drops.',announce:'Research laboratories synchronized. Lift 10 available.'});
  patrol(B,'g1',[[20,8],[20,20]],50);memoryAt(B,10,'EC','Trial log');
 },
 onExpire(B,k){if(k==='sync')B.say('Synchronization window closed. Match a fresh sequence.')}
};
FLOOR[10].r={name:'RESEARCH',
 objectives:[{id:'o1',label:'Set the ventilation damper to exhaust',done:fs=>fs.vented||fs.sealed},{id:'o2',label:'Wait for the contaminated lane to clear',done:fs=>fs.vented||fs.sealed},{id:'o3',label:'Seal the chamber from the safe side',done:fs=>fs.sealed}],
 exitReady:fs=>!!fs.sealed,exitMsg:'The lower lift refuses while the east chamber is open and contaminated.',
 build(B){const fs=B.fs;const tiles=[];for(let y=17;y<=19;y++)for(let x=18;x<=22;x++)tiles.push([x,y]);for(let x=23;x<=25;x++)tiles.push([x,16]);
  B.hazard({id:'contam',kind:'gas',tiles,active:B=>!B.has('vented')&&!B.has('sealed'),activeTile:(B,x,y)=>{if(B.has('vented')||B.has('sealed'))return false;const pr=B.active('vent')?1-B.left('vent')/10:0;return (x-18)/5>=pr},msg:'The contamination takes you in two breaths. You come to by the lift, lungs raw.'});
  B.label(24,15,'EAST LAB','#9fd0a0');B.door({id:'EB',x:24,y:16,label:'Chamber door',open:true,persist:false,locked:B=>fs.sealed?'Sealed.':null});
  dev(B,{id:'damper',x:8,y:16,label:'Ventilation damper → exhaust',timerName:'vent',timerSec:10,requires:[B=>!B.has('vented')],deny:'Already venting.',msg:'The damper swings to exhaust. The haze in the corridor begins to pull east. Wait for it.',kind:'panel'});
  dev(B,{id:'seal',x:23,y:15,kind:'panel',label:'Seal the chamber',doneFlag:'sealed',requires:['vented'],deny:'The haze is still in the corridor. Vent it before you stand here.',msg:'The chamber door slams and seals. The haze stays on its side.',announce:'East laboratory sealed.',after:B=>{B.doorById('EB').open=false;R.dirty=true}});
  B.subject({id:'sub',tx:20,ty:24,area:[18,20,22,26],speed:55});memoryAt(B,10,'EC','Trial log');
 },
 onExpire(B,k){if(k==='vent'){B.flag('vented');B.timer('respread',25);B.say('The lane is clear. The chamber keeps leaking: seal it before the haze returns.')}if(k==='respread'&&!B.has('sealed')){B.fs.vented=false;saveGame();ui.objectives();B.say('The haze creeps back into the corridor. Vent it again.')}}
};
/* hazards with per-tile activity */
const _hazTileActive=(h,x,y)=>h.activeTile?h.activeTile(B,x,y):h.active(B);

/* ======================= FLOOR 9 · CONTAINMENT ======================= */
FLOOR[9]={};
FLOOR[9].e={name:'CONTAINMENT',
 objectives:[{id:'o1',label:'Open Airlock A and enter the vestibule',done:fs=>fs.redirected||fs.passedB},{id:'o2',label:'Redirect surveillance from the vestibule panel',done:fs=>fs.redirected},{id:'o3',label:'Close A, then cycle Airlock B and leave through the next chamber',done:fs=>fs.passedB}],
 exitReady:fs=>!!fs.passedB,exitMsg:'Lift interlock: both airlocks must have cycled.',
 build(B){const fs=B.fs;wallBar(13,18,22,20);wallBar(7,18,22,20);B.label(20,13,'A','#fff');B.label(20,7,'B','#fff');B.label(16,11,'VESTIBULE','#9fb0ba');
  const A=B.door({id:'A',x:20,y:13,label:'Airlock A',persist:false,noRobot:true,auto:8,locked:'Airlock A cycles from its control panels only.'});
  const Bd=B.door({id:'B',x:20,y:7,label:'Airlock B',persist:false,noRobot:true,auto:8,locked:'Airlock B cycles from the vestibule panel only.'});
  B.item({id:'actl',x:17,y:14,kind:'panel',label:'Airlock A control',prompt:'E: Cycle Airlock A',use(B){A.open=true;A.timer=8;R.dirty=true;SFX.door();B.say('Airlock A opens for a few seconds. Get into the vestibule.')}});
  B.item({id:'aclose',x:17,y:10,kind:'panel',label:'Airlock A inner control',prompt:B=>A.open?'E: Close Airlock A':'E: Reopen Airlock A',use(B){if(A.open){A.open=false;A.timer=0;B.say('Airlock A seals behind you.')}else{A.open=true;A.timer=8;B.say('Airlock A reopens briefly.')}R.dirty=true;SFX.door()}});
  dev(B,{id:'surv',x:23,y:10,kind:'panel',label:'Redirect surveillance',doneFlag:'redirected',msg:'The vestibule camera turns to watch an empty chamber. It will not report you now.'});
  B.item({id:'bctl',x:23,y:9,kind:'panel',label:'Airlock B control',prompt:'E: Cycle Airlock B',use(B){if(A.open){B.say('Interlock: Airlock A is open. Close it first.');SFX.deny();return}if(!B.has('redirected')){B.say('Interlock: surveillance flags an unescorted subject. Redirect it first.');SFX.deny();return}Bd.open=true;Bd.timer=8;R.dirty=true;SFX.door();B.say('Airlock B cycles. Go through before it closes.')}});
  patrol(B,'g1',[[19,4],[21,4]],40);memoryAt(B,9,'WC','Modification protocol');
 },
 tick(dt,B){const p=R.player,rt=B.rt;const [tx,ty]=B.tileOf(p);
  if(ty<7&&tx>=18&&tx<=22&&!B.has('passedB'))B.flag('passedB');
  if(ty>=8&&ty<=12&&tx>=18&&tx<=22&&!B.has('redirected')){rt.cam=(rt.cam||0)+dt;if(rt.cam>2.5){rt.cam=0;B.announce('Unescorted subject in vestibule. Lockdown.');for(const d of R.doors)if(d.auto){d.open=false;d.timer=0}R.dirty=true;SFX.alarm();B.reset('Vestibule lockdown. Both airlocks slam shut and the chamber flushes you back to the lift.')}}else rt.cam=0;}
};
FLOOR[9].r={name:'CONTAINMENT',
 objectives:[{id:'o1',label:'Sound the chamber alarm',done:fs=>fs.resealed},{id:'o2',label:'Watch for the subject crossing the threshold, then reseal from outside',done:fs=>fs.resealed}],
 exitReady:fs=>!!fs.resealed,exitMsg:'The lower lift waits for the east chamber to be resealed.',
 build(B){const fs=B.fs;B.label(31,21,'CHAMBER C','#d4594f');B.paint(24,24,'blood');
  B.door({id:'EC',x:24,y:24,label:'Chamber door',open:true,persist:false,noRobot:true,locked:B=>fs.resealed?'Resealed.':'Motorized. Use the outside panel.'});
  lurePanel(B,{id:'cctl',x:23,y:23,label:'Chamber control',flag:'resealed',door:'EC',room:'EC',roomName:'the chamber',target:roomCenter('EC'),lureLabel:'Sound the chamber alarm',lureMsg:'The chamber alarm howls. The subject comes running. Watch the threshold — reseal once it is inside.',sealMsg:'The chamber reseals with the subject inside. Its silhouette hits the glass twice and stops.',announce:'Chamber C resealed.'});
  B.subject({id:'sub',tx:20,ty:16,area:[18,12,22,26],speed:65});if(fs.resealed)heldSubject(B,'EC');memoryAt(B,9,'WC','Modification protocol');
 },
 tick(dt,B){if(B.rt.lure)occupancyCue(B,'EC')},onReset(B){if(B.has('resealed'))heldSubject(B,'EC');else{B.doorById('EC').open=true;B.rt.lure=false}}
};

/* ======================= FLOOR 8 · ENGINEERING ======================= */
FLOOR[8]={};
FLOOR[8].e={name:'ENGINEERING',
 objectives:[{id:'o1',label:'Start Generator A',done:fs=>fs.genA},{id:'o2',label:'Route its output to the service bus',done:fs=>fs.routed},{id:'o3',label:'Start Generator B to stabilize power',done:fs=>fs.genB}],
 exitReady:fs=>!!fs.genB,exitMsg:'Lift power is unstable. Bring Generator B online.',
 build(B){const fs=B.fs;const gA=B.prop({x:5,y:5,w:2,h:2,kind:'generator',on:fs.genA}),gB=B.prop({x:30,y:23,w:2,h:2,kind:'generator',on:fs.genB});
  dev(B,{id:'genA',x:8,y:7,label:'Start Generator A',doneFlag:'genA',msg:'Generator A coughs and catches. Unrouted, its output arcs across the corridor floor.',after:()=>gA.on=true});
  B.hazard({id:'arc',kind:'electric',tiles:[[18,18],[19,18],[20,18],[21,18],[18,19],[19,19],[20,19],[21,19],[18,20],[19,20],[20,20],[21,20]], // the east edge stays dry: a readable safe strip, never a trap
  active:B=>B.has('genA')&&!B.has('routed'),msg:'The floor is live. The shock throws you back; you come to by the lift.'});
  dev(B,{id:'route',x:17,y:16,side:'e',kind:'panel',label:'Route output to service bus',doneFlag:'routed',requires:['genA'],deny:'No source. Start Generator A first.',msg:'The routing display lights the service bus branch. The corridor floor goes dead; the east door motor wakes.'});
  B.door({id:'EC',x:24,y:24,label:'Generator room door',open:false,locked:B=>B.has('routed')?null:'Door motor unpowered. Route the service bus.'});
  dev(B,{id:'genB',x:34,y:25,label:'Start Generator B',doneFlag:'genB',requires:['routed'],deny:'Bus unstable. Route Generator A first.',msg:'Generator B spins up. The power steadies and the lift releases.',announce:'Engineering power stable. Lift 8 released.',after:()=>gB.on=true});
  patrol(B,'g1',[[20,5],[20,13]],50);memoryAt(B,8,'EA','Power ledger');
 }
};
FLOOR[8].r={name:'ENGINEERING',
 objectives:[{id:'o1',label:'Divert auxiliary power from the electrified corridor to the robot bay',done:fs=>fs.aux},{id:'o2',label:'Activate the maintenance robot',done:fs=>fs.botSent},{id:'o3',label:'Let the robot isolate the live junction',done:fs=>fs.isolated}],
 exitReady:fs=>!!fs.isolated,exitMsg:'The corridor is still live between you and the lift.',
 build(B){const fs=B.fs;const tiles=[];for(let y=15;y<=19;y++)for(let x=18;x<=22;x++)tiles.push([x,y]);
  B.hazard({id:'live',kind:'electric',tiles,active:B=>!B.has('isolated'),activeTile:(B,x,y)=>!B.has('isolated')&&(!B.has('aux')||y===19),msg:'Live floor. The shock throws you back to the lift.'});
  B.label(20,14,'LIVE','#ffe066');B.label(31,12,'ROBOT BAY');
  dev(B,{id:'aux',x:6,y:7,kind:'panel',label:'Divert auxiliary power',doneFlag:'aux',msg:'Auxiliary power leaves the corridor and goes to the robot bay. Only one junction stays live.',announce:'Auxiliary power diverted to robot bay.'});
  const bot=B.prop({x:30,y:16,kind:'bot',on:fs.aux});if(fs.isolated){bot.x=20;bot.y=19;bot.solid=false}
  dev(B,{id:'botctl',x:33,y:16,label:'Activate the maintenance robot',doneFlag:'botSent',requires:['aux'],deny:'The bay has no power.',msg:'The maintenance robot rolls out toward the live junction.',after:B=>{B.rt.bot=1;bot.on=true;bot.solid=false}});
  if(fs.botSent&&!fs.isolated){B.rt.bot=1;bot.solid=false}
  memoryAt(B,8,'EA','Power ledger');
 },
 tick(dt,B){const bot=R.props[0];if(B.rt.bot&&!B.has('isolated')){const tx=20,ty=19;const dx=tx-bot.x,dy=ty-bot.y;if(Math.abs(dx)>.05)bot.x+=Math.sign(dx)*dt*2;else if(Math.abs(dy)>.05)bot.y+=Math.sign(dy)*dt*2;else{bot.x=tx;bot.y=ty;B.flag('isolated');SFX.confirm();B.say('The robot clamps the junction and isolates it. The floor goes dead.')}}}
};

/* ======================= FLOOR 7 · SECURITY ======================= */
FLOOR[7]={};
FLOOR[7].e={name:'SECURITY',
 objectives:[{id:'o1',label:'Loop the camera feed to expose the drone station',done:fs=>fs.looped},{id:'o2',label:'Dispatch the drone to a decoy waypoint',done:fs=>fs.lockdownOff},{id:'o3',label:'Cancel lockdown at the lobby override while the drone is away',done:fs=>fs.lockdownOff}],
 exitReady:fs=>!!fs.lockdownOff,exitMsg:'Elevator lockdown is active.',
 build(B){const fs=B.fs;dev(B,{id:'relay',x:6,y:7,label:'Loop the camera feed',doneFlag:'looped',msg:'The relay replays an empty corridor to itself. The drone station door no longer sees you.'});
  B.door({id:'EA',x:24,y:7,label:'Drone station door',open:false,locked:B=>B.has('looped')?null:'CAMERA LOCK — the door will not open while the corridor feed is live.'});
  const drone=B.guard({id:'drone',kind:'drone',tx:20,ty:4,route:[[19,4],[21,4]],speed:45,vision:140,label:'DRONE'});
  dev(B,{id:'dronectl',x:31,y:7,label:'Dispatch the drone to the west decoy waypoint',timerName:'away',timerSec:16,msg:'The drone banks away toward the west wing. The lobby is open for a few seconds.',after:B=>{drone.mode='script';drone.path=null;drone.script=(g,dt)=>{if(B.active('away')){moveEntity(g,8,24,110,dt)}else{if(moveEntity(g,20,4,110,dt)){g.mode='patrol';g.path=null}}}}});
  dev(B,{id:'override',x:18,y:3,kind:'panel',label:'Cancel lockdown',doneFlag:'lockdownOff',requires:[B=>B.active('away')],deny:'The drone covers the lobby. It has to be elsewhere.',msg:'Lockdown cancelled. The lift answers.',announce:'Elevator lockdown cancelled, Floor 7.'});
  patrol(B,'g1',[[20,22],[20,12]],55);memoryAt(B,7,'EC','Security footage');
 },
 onExpire(B,k){if(k==='away')B.say('The drone turns back toward the lobby.')}
};
FLOOR[7].r={name:'SECURITY',
 objectives:[{id:'o1',label:'Trigger a false incident in the empty west wing',done:fs=>fs.evac},{id:'o2',label:'Invoke the evacuation protocol at the lift override during the handoff',done:fs=>fs.evac}],
 exitReady:fs=>!!fs.evac,exitMsg:'Lift authorization is held by security protocol.',
 build(B){const fs=B.fs;const g1=patrol(B,'g1',[[20,16],[20,25]],60),g2=patrol(B,'g2',[[20,24],[20,14]],60);
  dev(B,{id:'incident',x:8,y:16,label:'Report a false incident (west wing)',timerName:'handoff',timerSec:14,msg:'“Incident, west wing.” Control hands the floor to the response units. They are coming here; the lift override is yours for a moment.',after:B=>{for(const g of [g1,g2]){g.mode='script';g.path=null;g.script=(g,dt)=>{if(B.active('handoff'))moveEntity(g,8,16,120,dt);else{const wp=g.route[0];if(moveEntity(g,wp[0],wp[1],100,dt)){g.mode='patrol';g.path=null}}}}}});
  dev(B,{id:'evac',x:18,y:26,kind:'panel',label:'Invoke evacuation protocol',doneFlag:'evac',requires:[B=>B.active('handoff')],deny:'“Authorization held by security protocol.” It needs a handoff in progress.',msg:'Evacuation protocol invoked. The lower lift unlocks.',announce:'Evacuation protocol active. Lift 7 released.'});
  memoryAt(B,7,'EC','Security footage');
 },
 onExpire(B,k){if(k==='handoff')B.say('Control takes the floor back. The units return to their sweep.')}
};

/* ======================= FLOOR 6 · RECORDS ======================= */
FLOOR[6]={};
FLOOR[6].e={name:'RECORDS',
 objectives:[{id:'o1',label:fs=>fs.codeA?'Code A: '+fs.codeA:'Retrieve code A (west archive)',done:fs=>!!fs.codeA},{id:'o2',label:fs=>fs.codeB?'Code B: '+fs.codeB:'Retrieve code B (east archive)',done:fs=>!!fs.codeB},{id:'o3',label:'Combine the codes (A then B) at the archive index',done:fs=>fs.indexed}],
 exitReady:fs=>!!fs.indexed,exitMsg:'The lift requires archive index clearance.',
 build(B){const fs=B.fs;const code=()=>String(10+Math.floor(rand()*90));
  dev(B,{id:'ca',x:6,y:7,label:'Retrieve code A',doneFlag:'hasA',msg:'',use(B){if(!fs.codeA){fs.codeA=code()}B.flag('hasA');B.say('The terminal prints half a clearance: A = '+fs.codeA+'.');SFX.confirm()}});
  dev(B,{id:'cb',x:31,y:7,label:'Retrieve code B',doneFlag:'hasB',use(B){if(!fs.codeB){fs.codeB=code()}B.flag('hasB');B.say('The second half: B = '+fs.codeB+'.');SFX.confirm()}});
  B.item({id:'index',x:8,y:16,kind:'terminal',solid:true,label:'Archive index',prompt:B=>B.has('indexed')?'E: Index cleared':'E: Enter the combined code',use(B){if(B.has('indexed')){B.say('Clearance stands.');return}openKeypad({len:4,title:'ARCHIVE INDEX',hint:'Four digits: code A followed by code B.',onSubmit(d){if(fs.codeA&&fs.codeB&&d===fs.codeA+fs.codeB){B.flag('indexed');SFX.confirm();B.say('The index accepts the combined code. Lift access granted.');return {close:true}}SFX.deny();return {msg:'Rejected. The index wants A then B.'}}})}});
  patrol(B,'g1',[[20,5],[20,12]],50);patrol(B,'g2',[[20,24],[20,16]],50);memoryAt(B,6,'WC','A photograph');
 }
};
FLOOR[6].r={name:'RECORDS',
 objectives:[{id:'o1',label:'Use the retrieval robot to pull the collapsed shelf into the empty bay',done:fs=>fs.cleared},{id:'o2',label:'Restore the exposed lift control',done:fs=>fs.liftRestored}],
 exitReady:fs=>!!fs.liftRestored,exitMsg:'The lift control was buried. Clear it and restore it.',
 build(B){const fs=B.fs;const shelf=B.prop({x:18,y:20,w:5,h:1,kind:'shelf'});if(fs.cleared){shelf.hidden=true;shelf.solid=false}
  dev(B,{id:'retr',x:31,y:16,label:'Operate the retrieval robot',doneFlag:'robotSent',msg:'The retrieval robot locks onto the collapsed shelf and starts dragging it toward the east bay.',after:B=>{B.timer('pull',5)}});
  if(fs.robotSent&&!fs.cleared)B.timer('pull',5);
  B.item({id:'liftctl',x:19,y:25,kind:'panel',label:'Lift control',visible:()=>B.has('cleared'),prompt:B=>B.has('liftRestored')?'E: Restored':'E: Restore the lift control',use(B){if(B.has('liftRestored'))return;B.flag('liftRestored');SFX.confirm();B.say('The control under the shelving still works. The lower lift answers.')}});
  memoryAt(B,6,'WC','A photograph');
 },
 tick(dt,B){const shelf=R.props[0];if(B.active('pull')){shelf.x=18+(1-B.left('pull')/5)*9}},
 onExpire(B,k){if(k==='pull'){const shelf=R.props[0];shelf.hidden=true;shelf.solid=false;B.flag('cleared');B.say('The shelf is in the bay. The corridor is clear, and a lift control is exposed where it lay.')}}
};

/* ======================= FLOOR 5 · OPERATIONS ======================= */
FLOOR[5]={};
FLOOR[5].e={name:'OPERATIONS',
 objectives:[{id:'o1',label:'Issue timed maintenance authorization',done:fs=>fs.released},{id:'o2',label:'Reach the command terminal and use it before expiry',done:fs=>fs.released}],
 exitReady:fs=>!!fs.released,exitMsg:'Elevator lockout stands until the command terminal releases it.',
 build(B){dev(B,{id:'auth',x:8,y:16,label:'Issue maintenance authorization (timed)',timerName:'auth',timerSec:16,msg:'Maintenance authorization issued. The command room will accept you until it expires.'});
  B.door({id:'EA',x:24,y:7,label:'Command room door',open:false,persist:false,locked:B=>B.active('auth')?null:'“Authorization required.” Issue maintenance authorization first.'});
  dev(B,{id:'cmd',x:31,y:7,label:'Command terminal: release the elevator',doneFlag:'released',requires:[B=>B.active('auth')],deny:'“Authorization expired.” Issue it again.',msg:'The command terminal releases the elevator for good.',announce:'Elevator lockout lifted, Floor 5.'});
  patrol(B,'g1',[[20,4],[20,12]],50);patrol(B,'g2',[[20,24],[20,16]],55);memoryAt(B,5,'EC','Directive 7-C');
 },
 onExpire(B,k){if(k==='auth'){const d=B.doorById('EA');if(d.open&&!B.inRoom(R.player,[26,36,4,10])){d.open=false;R.dirty=true}B.say('Maintenance authorization expired.')}}
};
FLOOR[5].r={name:'OPERATIONS',
 objectives:[{id:'o1',label:'Cancel emergency lockdown at the command console',done:fs=>fs.lockdownOff},{id:'o2',label:'Issue an evacuation command from the backup panel',done:fs=>fs.evac}],
 exitReady:fs=>!!fs.evac,exitMsg:'The lower lift waits for an evacuation command.',
 build(B){B.hazard({id:'sparks',kind:'electric',tiles:[[19,14],[20,14],[21,21],[22,21]],active:()=>true,msg:'A fallen cable bites. You come to by the lift.'});
  dev(B,{id:'cmd',x:31,y:7,label:'Cancel emergency lockdown',doneFlag:'lockdownOff',msg:'Emergency lockdown cancelled. The backup room unlocks.',announce:'Emergency lockdown cancelled.'});
  B.door({id:'EC',x:24,y:24,label:'Backup room door',open:false,locked:B=>B.has('lockdownOff')?null:'LOCKDOWN. Cancel it at the command console.'});
  dev(B,{id:'backup',x:31,y:24,label:'Issue evacuation command',doneFlag:'evac',requires:['lockdownOff'],deny:'Backup panel offline under lockdown.',msg:'Evacuation command issued. The lower lift restores.',announce:'Evacuation command accepted.'});
  B.subject({id:'sub',tx:20,ty:18,area:[18,10,22,26],speed:55});memoryAt(B,5,'EC','Directive 7-C');
 }
};

/* ======================= FLOOR 4 · TRAINING ======================= */
FLOOR[4]={};
function markArea(B,cx,cy){for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)B.paint(x,y,'mark')}
FLOOR[4].e={name:'TRAINING',
 objectives:[{id:'o1',label:'Enable the simulator',done:fs=>fs.simOn},{id:'o2',label:'Place a decoy in the marked area (south-west)',done:fs=>fs.liftReleased},{id:'o3',label:'Use the wardens’ diverted patrol to reach the lift release',done:fs=>fs.liftReleased}],
 exitReady:fs=>!!fs.liftReleased,exitMsg:'The lift release in the lobby has not been used.',
 build(B){const fs=B.fs,rt=B.rt;markArea(B,8,24);B.label(8,21,'SIM AREA','#e7c45c');
  dev(B,{id:'sim',x:6,y:7,label:'Enable the simulator',doneFlag:'simOn',msg:'The simulator hums awake. Anything placed in the marked area will read as an intruder.'});
  const decoy=B.prop({x:10,y:8,kind:'decoy',solid:false});
  B.item({id:'pick',x:10,y:8,kind:'decoy',label:'Decoy',visible:()=>!rt.carrying&&!rt.placed,prompt:'E: Pick up the decoy',use(B){rt.carrying=true;decoy.hidden=true;B.say('You lift the training decoy. It is lighter than a person.')}});
  B.item({id:'place',x:8,y:24,kind:'spot',label:'Marked area',visible:()=>!!rt.carrying,prompt:'E: Place the decoy here',use(B){if(!B.has('simOn')){B.say('The simulator is off. A decoy here is just a mannequin.');SFX.deny();return}rt.carrying=false;rt.placed=true;decoy.hidden=false;decoy.x=8;decoy.y=24;B.timer('divert',20);SFX.alarm();B.announce('Simulated intruder, training area. Wardens responding.');B.say('The wardens turn toward the training room. The lobby is yours while they are busy.');for(const g of R.guards){g.mode='script';g.path=null;g.script=(g,dt)=>{if(B.active('divert'))moveEntity(g,g.id==='w1'?7:9,24,110,dt);else{if(moveEntity(g,g.route[0][0],g.route[0][1],100,dt)){g.mode='patrol';g.path=null}}}}}});
  patrol(B,'w1',[[20,4],[20,10]],55);patrol(B,'w2',[[19,12],[21,6]],55);
  dev(B,{id:'release',x:18,y:3,kind:'panel',label:'Lift release',doneFlag:'liftReleased',msg:'Lift released.',announce:'Lift 4 released.'});
  memoryAt(B,4,'WC','Warden slides');
 },
 onExpire(B,k){if(k==='divert'){const rt=B.rt;rt.placed=false;R.props[0].hidden=true;R.props[0].x=10;R.props[0].y=8;R.props[0].hidden=false;B.say('A warden kicks the decoy over and the simulation clears. The decoy is back in the simulator room.')}},
 onReset(B){const rt=B.rt;rt.carrying=false;rt.placed=false;R.props[0].hidden=false;R.props[0].x=10;R.props[0].y=8}
};
FLOOR[4].r={name:'TRAINING',
 objectives:[{id:'o1',label:'Use the decoy to draw the malfunctioning robots into the training room',done:fs=>fs.sealed},{id:'o2',label:'Seal the training room from outside once both are inside',done:fs=>fs.sealed}],
 exitReady:fs=>!!fs.sealed,exitMsg:'Two malfunctioning units still roam. The lower lift waits.',
 build(B){const fs=B.fs,rt=B.rt;markArea(B,8,24);B.label(8,21,'TRAINING','#e7c45c');
  const decoy=B.prop({x:31,y:7,kind:'decoy',solid:false});
  B.item({id:'pick',x:31,y:7,kind:'decoy',label:'Decoy',visible:()=>!rt.carrying&&!rt.placed&&!fs.sealed,prompt:'E: Pick up the decoy',use(B){rt.carrying=true;decoy.hidden=true;B.say('You take the decoy.')}});
  B.item({id:'place',x:8,y:24,kind:'spot',label:'Marked area',visible:()=>!!rt.carrying,prompt:'E: Place the decoy',use(B){rt.carrying=false;rt.placed=true;decoy.hidden=false;decoy.x=8;decoy.y=24;B.timer('draw',10);SFX.alarm();B.say('The decoy starts broadcasting. Both units lurch toward the training room. Seal it from the outside panel once they are in.');for(const g of R.guards){if(!g.active)continue;g.mode='script';g.path=null;g.script=(g,dt)=>{if(B.active('draw'))moveEntity(g,g.id==='m1'?7:9,24,120,dt);else{if(moveEntity(g,g.route[0][0],g.route[0][1],100,dt)){g.mode='patrol';g.path=null}}}}}});
  const m1=patrol(B,'m1',[[20,14],[20,26]],70),m2=patrol(B,'m2',[[20,24],[20,12]],70);m1.fov=Math.PI/2;m2.fov=Math.PI/2;
  if(fs.sealed){for(const g of [m1,m2]){g.active=false}}
  B.door({id:'WC',x:15,y:24,label:'Training room door',open:true,persist:false,noRobot:true,locked:B=>fs.sealed?'Sealed.':null});
  B.item({id:'seal',x:16,y:23,kind:'panel',label:'Training room seal',prompt:B=>fs.sealed?'E: Sealed':'E: Seal the training room',use(B){if(fs.sealed)return;const inside=R.guards.filter(g=>g.active&&B.inRoom(g,[3,13,22,26]));if(inside.length>=2){const d=B.doorById('WC');d.open=false;R.dirty=true;SFX.door();for(const g of R.guards)g.active=false;B.flag('sealed');SFX.confirm();B.announce('Training room sealed. Units contained.');B.say('The door drops and both units beat on it from the inside. They are not getting out.')}else{B.say(inside.length?'Only one unit is inside. Wait for both.':'Nothing is inside yet.');SFX.deny()}}});
  memoryAt(B,4,'WC','Warden slides');
 },
 onExpire(B,k){if(k==='draw'){B.rt.placed=false;R.props[0].x=31;R.props[0].y=7;B.say('The units lose interest and wander out. The decoy has been knocked back to the east office.')}},
 onReset(B){const rt=B.rt;rt.carrying=false;rt.placed=false;R.props[0].hidden=false;R.props[0].x=31;R.props[0].y=7}
};

/* ======================= FLOOR 3 · LOGISTICS ======================= */
FLOOR[3]={};
FLOOR[3].e={name:'LOGISTICS',
 objectives:[{id:'o1',label:'Use the forklift control to clear the conveyor loading area',done:fs=>fs.loadingCleared},{id:'o2',label:'Run the conveyor to move the cargo off the lane',done:fs=>fs.conveyed}],
 exitReady:fs=>!!fs.conveyed,exitMsg:'Cargo still blocks the lift lane.',
 build(B){const fs=B.fs;const crates=[18,19,20,21,22].map(x=>B.prop({x,y:8,kind:'crate'}));if(fs.loadingCleared){crates[0].hidden=crates[1].hidden=true;crates[0].solid=crates[1].solid=false}if(fs.conveyed)crates.forEach(c=>{c.hidden=true;c.solid=false});
  for(let x=18;x<=22;x++)B.paint(x,8,'arrow');B.label(20,7,'CONVEYOR','#e7c45c');B.prop({x:30,y:16,w:2,h:1,kind:'forklift'});
  dev(B,{id:'fork',x:33,y:16,label:'Forklift control: clear the loading area',doneFlag:'loadingCleared',msg:'The forklift lifts two pallets off the loading end of the belt and backs away.',after:()=>{crates[0].hidden=crates[1].hidden=true;crates[0].solid=crates[1].solid=false}});
  dev(B,{id:'conv',x:8,y:16,label:'Run the conveyor',doneFlag:'conveying',requires:['loadingCleared'],deny:'“Loading area obstructed.” Clear it with the forklift first.',msg:'The belt starts. The cargo slides east off the lane.',after:B=>B.timer('belt',4)});
  if(fs.conveying&&!fs.conveyed)B.timer('belt',4);
  B.hazard({id:'belt',kind:'push',tiles:[[20,8],[21,8],[22,8]],active:B=>B.active('belt'),dx:2});
  patrol(B,'g1',[[20,12],[20,24]],55);memoryAt(B,3,'WB','Shipment manifest');
 },
 tick(dt,B){if(B.active('belt')){const k=1-B.left('belt')/4;for(let i=2;i<5;i++)R.props[i].x=18+i+k*4}},
 onExpire(B,k){if(k==='belt'){for(const c of R.props.slice(0,5)){c.hidden=true;c.solid=false}B.flag('conveyed');B.say('The cargo is off the lane. The lift path is clear.')}}
};
FLOOR[3].r={name:'LOGISTICS',
 objectives:[{id:'o1',label:'Restart the damaged conveyor to move debris off the access lane',done:fs=>fs.debrisCleared},{id:'o2',label:'Cross while the belt is stopped, or stop it from the side control',done:fs=>fs.crossed}],
 exitReady:fs=>!!fs.debrisCleared,exitMsg:'Debris still covers the access lane.',
 build(B){const fs=B.fs;const debris=[18,19,20,21,22].map(x=>B.prop({x,y:20,kind:'rubble'}));if(fs.debrisCleared)debris.forEach(d=>{d.hidden=true;d.solid=false});
  for(let x=18;x<=22;x++){B.paint(x,20,'arrow');B.paint(x,21,'arrow')}B.label(23,20,'BELT','#e7c45c');
  dev(B,{id:'restart',x:8,y:16,label:'Restart the damaged conveyor',doneFlag:'restarted',msg:'The belt shudders alive and starts dragging the debris east. It will keep cycling: moving, then stopped.',after:B=>B.timer('clear',4)});
  if(fs.restarted&&!fs.debrisCleared)B.timer('clear',4);
  B.hazard({id:'belt',kind:'push',tiles:[18,19,20,21,22].flatMap(x=>[[x,20],[x,21]]),active:B=>B.has('debrisCleared')&&!B.has('beltStopped')&&B.rt.beltOn,dx:3,msg:''});
  dev(B,{id:'stop',x:23,y:19,kind:'panel',label:'Belt stop control',doneFlag:'beltStopped',msg:'The belt stops for good.'});
  B.subject({id:'sub',tx:20,ty:24,area:[18,22,22,26],speed:50});memoryAt(B,3,'WB','Shipment manifest');
 },
 tick(dt,B){const rt=B.rt;if(B.active('clear')){const k=1-B.left('clear')/4;R.props.slice(0,5).forEach((d,i)=>d.x=18+i+k*6)}
  if(B.has('debrisCleared')&&!B.has('beltStopped')){rt.cycle=(rt.cycle||0)+dt;rt.beltOn=(rt.cycle%7)<4}else rt.beltOn=false;
  const [tx,ty]=B.tileOf(R.player);if(ty>=22&&tx>=18&&tx<=22&&!B.has('crossed'))B.flag('crossed');
  if(rt.beltOn&&ty>=20&&ty<=21&&tx>=18&&tx<=22&&R.player.x>22.6*T){SFX.shock();B.reset('The moving belt carries you into the end wall. You come to by the lift.')}},
 onExpire(B,k){if(k==='clear'){for(const d of R.props.slice(0,5)){d.hidden=true;d.solid=false}B.flag('debrisCleared');B.say('The debris is off the lane. The belt keeps running in cycles: cross while it is stopped, or stop it from the side panel.')}}
};

/* ======================= FLOOR 2 · ADMINISTRATION ======================= */
FLOOR[2]={};
FLOOR[2].e={name:'ADMINISTRATION',
 objectives:[{id:'o1',label:'Assign maintenance clearance at the badge station',done:fs=>fs.badge},{id:'o2',label:'Use the badge at the executive terminal to authorize the upper elevator',done:fs=>fs.authorized}],
 exitReady:fs=>!!fs.authorized,exitMsg:'The upper elevator needs executive authorization.',
 build(B){dev(B,{id:'badge',x:8,y:16,label:'Assign maintenance clearance',doneFlag:'badge',msg:'The badge station prints a maintenance badge. The executive wing will read it.'});
  B.door({id:'EA',x:24,y:7,label:'Executive wing door',open:false,locked:B=>B.has('badge')?null:'“Badge required.”'});
  dev(B,{id:'exec',x:31,y:7,label:'Executive terminal: authorize the upper elevator',doneFlag:'authorized',requires:['badge'],deny:'“Badge required.”',msg:'The executive terminal authorizes the upper elevator.',announce:'Upper elevator authorized, Floor 2.'});
  patrol(B,'g1',[[20,5],[20,13]],55);patrol(B,'g2',[[20,25],[20,15]],55);memoryAt(B,2,'EC','Signed authorization');
 }
};
FLOOR[2].r={name:'ADMINISTRATION',
 objectives:[{id:'o1',label:'Retrieve the emergency token from the accessible office',done:fs=>fs.token},{id:'o2',label:'Use it at the manual override outside the locked route',done:fs=>fs.override}],
 exitReady:fs=>!!fs.override,exitMsg:'The lockdown shutter blocks the lift.',
 build(B){const fs=B.fs;wallBar(20,18,22,20);B.door({id:'shutter',x:20,y:20,kind:'gate',label:'Lockdown shutter',persist:false,locked:B=>fs.override?null:'LOCKDOWN. Manual override only.'});
  if(fs.override)B.doorById('shutter').open=true;
  B.item({id:'token',x:31,y:7,kind:'token',label:'Emergency token',visible:()=>!B.has('token'),prompt:'E: Take the emergency token',use(B){B.flag('token');SFX.confirm();B.say('A physical override token, still in its case. Somebody expected this day.')}});
  dev(B,{id:'ovr',x:23,y:19,kind:'panel',label:'Manual override',doneFlag:'override',requires:['token'],deny:'The override wants a physical token.',msg:'The token turns. The shutter grinds up.',after:B=>{B.doorById('shutter').open=true;R.dirty=true;SFX.gate()}});
  B.subject({id:'sub',tx:20,ty:12,area:[18,4,22,19],speed:55});memoryAt(B,2,'EC','Signed authorization');
 }
};

/* ======================= FLOOR 1 · SURFACE ACCESS ======================= */
FLOOR[1]={};
function exterior(B){for(let y=0;y<=2;y++)for(let x=16;x<=30;x++)B.floor(x,y,'grass');B.floor(20,2,'concrete');B.label(20,0,'OUTSIDE','#dfe9c8')}
FLOOR[1].e={name:'SURFACE ACCESS',noExitTile:true,exitLabel:'Walk out through the exterior gate',
 objectives:[{id:'o1',label:'Disable perimeter surveillance',done:fs=>fs.survOff},{id:'o2',label:'Open the exterior gate',done:fs=>fs.gateOpen},{id:'o3',label:'Walk outdoors',done:fs=>false}],
 exitReady:fs=>!!fs.gateOpen,
 build(B){const fs=B.fs;exterior(B);B.door({id:'gate',x:20,y:3,kind:'gate',label:'Exterior gate',persist:true,locked:B=>fs.gateOpen?null:'The gate is sealed from the control room.'});
  dev(B,{id:'surv',x:31,y:7,label:'Disable perimeter surveillance',doneFlag:'survOff',msg:'The perimeter cameras drop one by one.'});
  dev(B,{id:'gatectl',x:8,y:16,label:'Open the exterior gate',doneFlag:'gateOpen',requires:['survOff'],deny:'“PERIMETER ALARM.” The cameras saw the gate command.',onDeny:B=>{SFX.alarm();B.announce('Perimeter alarm. Subject at surface access.');B.reset('The alarm brings the wardens. You are held and returned to the lift.')},msg:'The exterior gate unlocks. Daylight, somewhere above.',after:B=>{B.openDoor('gate')}});
  B.item({id:'threshold',x:19,y:0,w:3,h:2,kind:'threshold',label:'Threshold',prompt:()=>null,use(){}});
  patrol(B,'g1',[[20,6],[20,14]],55);patrol(B,'g2',[[20,24],[20,16]],55);memoryAt(B,1,'WB','A life outside');
 },
 tick(dt,B){const [tx,ty]=B.tileOf(R.player);if(ty<=1&&tx>=19&&tx<=21&&!B.rt.out){B.rt.out=true;Scenes.play('daylight')}}
};
FLOOR[1].r={name:'SURFACE ACCESS',
 objectives:[{id:'o1',label:'Enter the damaged vehicle bay',done:fs=>fs.bypassed},{id:'o2',label:'Bypass perimeter controls at the manual panel',done:fs=>fs.bypassed},{id:'o3',label:'Restore lower-lift power',done:fs=>fs.liftPower}],
 exitReady:fs=>!!fs.liftPower,exitMsg:'The lower lift has no power.',
 spawn(){return [20,1]},checkpoint(){return tc(20,1)},
 build(B){const fs=B.fs;exterior(B);B.floor(30,3,'concrete');B.label(30,2,'BAY','#dfe9c8');
  B.door({id:'gate',x:20,y:3,kind:'gate',label:'Exterior gate',persist:false,locked:'Jammed. The gate dropped when the alarms began.'});
  B.prop({x:27,y:5,w:3,h:2,kind:'vehicle'});B.prop({x:32,y:8,w:2,h:1,kind:'rubble'});
  B.door({id:'EA',x:24,y:7,label:'Vehicle bay door',open:false,persist:false,locked:B=>fs.bypassed?null:'PERIMETER LOCK.'});
  dev(B,{id:'manual',x:28,y:9,kind:'panel',label:'Manual perimeter panel',doneFlag:'bypassed',msg:'You bypass the perimeter controls by hand. The bay door unlocks.',after:B=>{B.doorById('EA').open=true;R.dirty=true}});
  dev(B,{id:'liftpower',x:8,y:24,label:'Restore lower-lift power',doneFlag:'liftPower',msg:'Lift power comes back with a groan. The way down is open.',announce:'Lift 1 power restored. Descent available.'});
  B.hazard({id:'sparks',kind:'electric',tiles:[[19,15],[21,21]],active:()=>true,msg:'A fallen cable bites. You come to at the threshold.'});
  B.subject({id:'sub',tx:20,ty:20,area:[18,10,22,26],speed:50});memoryAt(B,1,'WB','A life outside');
 }
};
