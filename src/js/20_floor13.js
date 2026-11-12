/* ============================================================
   FLOOR 13 · DETENTION · bespoke geometry, both journeys
   ============================================================ */
const F13={
 corridor:[3,14,37,16],cell:[35,37,10,12],lab:[10,17,9,12],captiveRoom:[12,16,4,7],
 geometry(ret){
  B.rect(3,14,37,16,'c');                 // detention corridor
  B.rect(19,3,21,13,'c');B.floor(20,2,'lift'); // lift corridor + upper lift
  B.rect(4,9,9,12,'r');B.floor(6,13,'c');       // assessment room + doorway
  B.rect(10,9,17,12,'r');B.floor(13,13,'c');B.floor(18,11,'c'); // lab + two doorways
  B.rect(12,4,16,7,'cell');                     // captive holding room
  for(const x of [23,27,31])B.rect(x,10,x+2,12,'cell'),B.floor(x+1,13,'c');  // north cells
  B.rect(35,10,37,12,'cell');B.floor(36,13,'c');            // cell 13
  for(const x of [23,27,35])B.rect(x,18,x+2,20,'cell'),B.floor(x+1,17,'c');  // south cells
  B.rect(31,17,32,18,'alcove');B.hide(31,17);B.hide(32,17);B.hide(31,18);B.hide(32,18); // service alcove
  B.rect(12,17,13,18,'alcove');B.hide(12,17);B.hide(13,17);B.hide(12,18);B.hide(13,18); // storage niche
  B.label(20,4,'LIFT','#cfd8dc');B.label(20,6,'OPERATOR','#9fb0ba');B.label(20,7,'STANDBY','#9fb0ba');B.label(6,8,'ASSESSMENT');B.label(13,8,'TESTING 1');B.label(36,9,'CELL 13');
  B.label(24,9,'CELL 9');B.label(28,9,'CELL 10');B.label(32,9,'CELL 11');B.label(24,21,'CELL 14');B.label(28,21,'CELL 15');B.label(36,21,'CELL 16');B.label(31,19,'SERVICE','#9fb0ba');B.label(12,19,'STORAGE','#9fb0ba');
  if(ret){for(const [x,y] of [[8,15],[17,14],[25,16],[30,15],[20,9],[21,12]])B.paint(x,y,'debris');B.paint(14,15,'blood');B.paint(20,12,'blood')}
  // captive room glass: three window panes on the lab's north wall
  for(const x of [13,14,15])B.door({id:'glass'+x,x,y:8,kind:'glass',open:false,locked:'Reinforced glass.',persist:false,noRobot:true,label:'Observation window'});
 }
};
/* Pattern-lock helpers · 4×4 grid, masks compared as cell sets */
const LINES4=(()=>{const L=[];for(let r=0;r<4;r++)L.push([0,1,2,3].map(c=>r*4+c));for(let c=0;c<4;c++)L.push([0,1,2,3].map(r=>r*4+c));L.push([0,5,10,15]);L.push([3,6,9,12]);return L.map(cells=>cells.reduce((m,i)=>m|(1<<i),0))})();
function submittedMasks(lock){return new Set(G.attempts.filter(a=>!lock||a.lock===lock).map(a=>a.mask))}
function recordAttempt(lock,mask,ok){G.attempts.push({lock,mask,ok:!!ok,t:Date.now()});saveGame()}
function chooseSolution(){ // clue-consistent (four contacts, one line) and never submitted anywhere
 const used=submittedMasks(null);const cands=LINES4.filter(m=>!used.has(m));
 if(cands.length)return cands[Math.floor(rand()*cands.length)];
 for(let a=0;a<16;a++)for(let b=a+1;b<16;b++)for(let c=b+1;c<16;c++)for(let d=c+1;d<16;d++){const m=(1<<a)|(1<<b)|(1<<c)|(1<<d);if(!used.has(m))return m}
 return null;
}
function maskHint(m){let s='';for(let i=0;i<16;i++)s+=(m&(1<<i))?'■':'·',s+=(i%4===3?'  ':'');return s.trim()}

FLOOR[13]={};
FLOOR[13].e={name:'DETENTION',bespoke:true,
 objectives:[
  {id:'wake',label:'Take in the assessment room',done:fs=>G.stage!=='assess'},
  {id:'search',label:'Search the cell for a way out',done:fs=>fs.ability},
  {id:'latch',label:'Feel for the latch circuit through the cell door',done:fs=>fs.doorOpened},
  {id:'hide',label:'Hide in the service alcove or make for Testing',done:fs=>fs.doorOpened&&(fs.revealed||fs.labOpen)},
  {id:'learn',label:fs=>fs.revealed?'Enter the operator’s pattern at the Testing 1 door':'Learn how the Testing 1 door is opened',done:fs=>fs.labOpen},
  {id:'captive',label:'Reach the observation window',done:fs=>fs.captiveMet},
  {id:'circuit',label:'Interrupt the security response at the circuit console',done:fs=>fs.liftReleased},
  {id:'lift',label:'Release the upper lift at its control (the pattern opens Floor 12)',done:fs=>fs.liftReleased},
 ],
 exitReady:fs=>!!fs.liftReleased,exitMsg:'The lift control has not been released.',
 spawn(B){const fs=B.fs;if(G.stage==='assess')return [6,11];if(fs.labOpen)return [12,11];return [36,11]},
 checkpoint(B){const fs=B.fs;if(G.stage==='assess')return tc(6,11);if(fs.labOpen)return tc(12,11);return tc(36,11)},
 build(B){
  const fs=B.fs,rt=B.rt;F13.geometry(false);
  rt.op={state:'standby',t:0,fault:0,fails:0};rt.camOff=0;rt.faultT=-1;rt.assessT=0;
  // --- assessment room ---
  B.prop({x:5,y:10,w:2,h:1,kind:'table'});
  B.item({id:'table',x:5,y:11,w:2,h:1,kind:'spot',label:'Lie back on the table',visible:()=>G.stage==='assess',use(B){F13.choice(B,'table')}});
  B.item({id:'acam',x:9,y:8,kind:'camera',label:'Camera',visible:()=>G.stage==='assess',use(B){B.say('A small camera. It follows you. The red light does not blink.')}});
  B.item({id:'pipe',x:3,y:11,kind:'pipe',label:'Pipe in the wall',visible:()=>G.stage==='assess',use(B){SFX.taps();if(OPT.captions)ui.caption('[three taps · pause · two taps]',2.5);B.say('A pipe runs through the wall. The sound came along it: three taps, a pause, two. Deliberate. A pattern you cannot read.')}});
  B.item({id:'tattoo',x:8,y:12,kind:'spot',label:'Look at your forearm',visible:()=>G.stage==='assess',use(B){B.say('A bandage. Under it, inked into the skin: 13. You try to remember your name. Nothing.')}});
  B.door({id:'adoor',x:6,y:13,label:'Assessment door',persist:false,noRobot:true,locked:(B)=>G.stage!=='assess'?'Sealed.':null,
   prompt:(B,d)=>G.stage==='assess'?'E: Try the door':null,use(B,d){if(G.stage!=='assess')return;F13.choice(B,'door')}});
  // --- cell 13 ---
  B.prop({x:35,y:10,w:1,h:2,kind:'bed'});B.prop({x:37,y:10,kind:'sink'});
  B.item({id:'bed',x:35,y:12,kind:'spot',label:'Bolted bed',visible:()=>G.stage!=='assess',use(B){B.say('The bed is bolted to the floor. The blanket smells of disinfectant and nothing else.')}});
  B.item({id:'sink',x:37,y:11,kind:'spot',label:'Sink',visible:()=>G.stage!=='assess',use(B){B.say('A steel sink. The water runs cold and stops on its own. No pipe you can reach.')}});
  B.item({id:'ccam',x:36,y:9,kind:'camera',label:'Camera housing (hold E)',holdTime:.6,off:B=>B.rt.camOff>0,visible:()=>G.stage!=='assess',
   holdStart(B){B.say('You press your palm against the camera housing.')},
   hold(B,it,dt,tot){const rt=B.rt;if(tot>=.6){if(rt.camOff===0){SFX.pulse();B.effect({kind:'pulse',x:it.px,y:it.py});if(!B.has('ability')){B.flag('ability');B.say('A dry crackle under your palm. The red light dies. Something in you reached into the wire and moved it.')}else B.say('The red light dies under your hand.')}
     rt.camOff+=dt;if(rt.camOff>4&&!rt.camChecked){rt.camChecked=true;F13.dispatch(B,'camCheck','Camera fault, cell 13. Operator dispatched.')}}},
   release(B,it,tot){const rt=B.rt;if(rt.camOff>0){rt.camRestart=.8;B.say('You let go. The housing clicks; the red light comes back.')}rt.camOff=0}});
  const cell=B.door({id:'cell13',x:36,y:13,kind:'cell',label:'Cell 13 door',persist:false,noRobot:true,holdTime:1.6,statusLit:(B,d)=>d.open?'#7fd0c6':B.rt.latchT>0?'#e7c45c':'#e04848',
   prompt:(B,d)=>d.open?null:B.has('ability')?'E: Feel for the latch circuit (hold)':'E: Examine the door',
   use(B,d){if(d.open)return;if(!B.has('ability')){B.say('Smooth metal. No handle, no keypad on this side. It opened for the operator; it will not open for you.');SFX.doorDeny();return}
    d.px=tc(d.x,d.y).x;d.py=tc(d.x,d.y).y;d.reach=46;R.hold=d;R.holdT=0;B.say('You flatten your hand against the door and feel for anything live.')},
   hold(B,d,dt,tot){B.rt.latchT=tot;if(tot>.5&&!d.warm){d.warm=true;B.say('There. A warm point under the surface — a live trace to the latch. You lean on it.');SFX.pulse()}
    if(tot>=1.6){R.hold=null;d.open=true;d.warm=false;B.rt.latchT=0;R.dirty=true;SFX.door();B.flag('doorOpened');G.stage='corridor';saveGame();B.rt.faultT=0;B.say('The latch lets go. The door slides back. The corridor is empty, for now.')}},
   release(B,d,tot){B.rt.latchT=0;if(!d.open){d.warm=false;B.say('You let go. The latch settles back into place.')}}});
  // other detention cells: distinct codes the player never gets
  const cells=[[24,13,'Cell 9'],[28,13,'Cell 10'],[32,13,'Cell 11'],[24,17,'Cell 14'],[28,17,'Cell 15'],[36,17,'Cell 16']];
  for(const [x,y,label] of cells)B.door({id:label.replace(' ',''),x,y,kind:'cell',label:label+' door',persist:false,noRobot:true,prompt:'E: Test the pattern lock ('+label+')',
   use(B,d){openGrid({title:label.toUpperCase()+' · PATTERN LOCK',hint:'Each cell has its own code. Yours would not open this one.',onSubmit(mask){recordAttempt(d.id,mask,false);F13.fault(B,d);SFX.doorDeny();return {msg:'Rejected. '+label+' keeps its own code.'}}})}});
  // --- lab / testing 1 ---
  B.door({id:'labdoor',x:13,y:13,label:'Testing 1 door',persist:true,prompt:(B,d)=>d.open?null:G.learned.pattern?'E: Apply the remembered pattern':'E: Pattern lock',
   use(B,d){if(d.open)return;
    if(G.learned.pattern){B.say('Contact. The pattern you remember runs through the lock. Testing 1 opens.');SFX.confirm();B.openDoor('labdoor');B.flag('labOpen');return}
    const fs=B.fs;openGrid({title:'TESTING 1 · PATTERN LOCK',hint:fs.revealed?'You remember the operator’s shape: '+maskHint(fs.solution):'Four contacts. The operator knows the shape; you do not, yet.',
     onSubmit(mask){const ok=fs.solution!=null&&mask===fs.solution;recordAttempt('lab',mask,ok);
      if(ok){G.learned.pattern=mask;G.learned.f12=true;saveGame();B.openDoor('labdoor');B.flag('labOpen');B.say('The lock accepts it. You will not need to think about this shape again: your hands know it now.');SFX.confirm();return {close:true}}
      F13.fault(B,d);SFX.doorDeny();return {msg:'Rejected. '+(fs.revealed?'That is not the shape you saw.':'The lock expects a shape you have not seen.')}}})}});
  B.door({id:'labside',x:18,y:11,label:'Service door',persist:false,noRobot:false,locked:(B)=>B.has('labOpen')?null:'Locked from the lift side.',closable:true});
  for(const x of [13,14,15]){const g=B.doorById('glass'+x);g.prompt=(B)=>B.has('captiveMet')?'E: Look through the window':'E: Look through the observation window';g.use=(B)=>{if(B.has('captiveMet')){B.say(pronoun().cap+' has not moved. '+pronoun().cap+' is watching the door, not you.');return}Scenes.play('captive',()=>{B.flag('captiveMet');F13.response(B)})}}
  B.item({id:'captiveE',x:14,y:6,kind:'captive',label:'',visible:()=>true,prompt:()=>null,use(){}});
  B.item({id:'circuit',x:10,y:9,kind:'console',solid:true,label:'Circuit console',lit:B=>B.active('circuit')?'#e7c45c':'#7fd0c6',prompt:'E: Interrupt the operator’s power loop',
   use(B){if(!B.has('captiveMet')){B.say('The console shows the operator’s power loop and the lift lobby. Nothing is moving out there yet.');return}
    B.timer('circuit',10);const op=R.guards[0];op.disabled=10;op.mode='patrol';op.path=null;SFX.pulse();B.say('You interrupt the operator’s loop. It drops where it stands. Ten seconds, maybe less — go.');if(OPT.captions)ui.caption('[operator powers down]',2)}});
  B.item({id:'mem13',x:17,y:9,kind:'memory',label:'Worn token in a tray',visible:()=>!G.memories.includes(13),use(B){collectMemory(13)}});
  B.item({id:'liftctl',x:18,y:3,kind:'panel',label:'Lift control',lit:B=>B.has('liftReleased')?'#7fd0c6':'#e04848',prompt:B=>B.has('liftReleased')?'E: Lift released':'E: Release the lift',
   use(B){if(B.has('liftReleased')){B.say('The lift is released. Call it from the doors.');return}
    if(!G.learned.pattern){B.say('A pattern lock, the same family as the Testing door. Your hand finds nothing it knows.');SFX.doorDeny();return}
    SFX.confirm();B.flag('liftReleased');B.announce('Lift 13 released. Destination Floor 12 authorized.');B.say('Contact. The remembered pattern releases the lift. Floor 12 is the only destination offered.')}});
  // --- the single operator ---
  B.guard({id:'op',tx:20,ty:5,angle:Math.PI/2,speed:70,pursueSpeed:110,label:'OPERATOR',route:[]});
  if(fs.captiveMet)F13.response(B,true);
 },
 onReset(B){const rt=B.rt;rt.op={state:'standby',t:0,fault:0,fails:0};rt.camOff=0;rt.faultT=-1;const c=B.doorById('cell13');if(c&&!B.has('labOpen'))c.open=false;if(B.has('captiveMet'))F13.response(B,true);R.dirty=true},
 onExpire(B,k){if(k==='circuit')B.say('The operator reboots. Its head comes up.')},
 tick(dt,B){
  const rt=B.rt,fs=B.fs,op=R.guards[0];
  if(G.stage==='assess'){rt.assessT+=dt;const d=B.doorById('adoor');if(rt.assessT>4&&!d.open&&!rt.aOpened){rt.aOpened=true;d.open=true;R.dirty=true;SFX.door();B.say('The door begins to open. Beyond it, heavy footsteps, evenly spaced.');if(OPT.captions)ui.caption('[robotic footsteps approaching]',2.5)}
   if(rt.aOpened){rt.stepT=(rt.stepT||0)-dt;if(rt.stepT<=0){SFX.robotStep(true);rt.stepT=.7}}return}
  if(rt.camRestart>0){rt.camRestart-=dt}
  if(rt.faultT>=0){rt.faultT+=dt;if(rt.faultT>2.5&&rt.op.state==='standby'&&!rt.faultSent){rt.faultSent=true;F13.dispatch(B,'doorCheck','Door opened without authorization, cell 13. Operator dispatched.')}}
  F13.operator(B,op,dt);
 }
};
F13.choice=function(B,which){
 if(G.stage!=='assess')return;const fs=B.fs;fs.choice=which;
 if(which==='door'){R.lightsUp=2.5;B.announce('Subject 13. Remain in place.');B.say('You push at the door. It is already moving. The lights come up hard, and the footsteps do not change pace.')}
 else{B.announce('Compliance noted.');B.say('You lie back and watch the ceiling. The door finishes opening on its own.')}
 keys.clear();setTimeout(()=>Scenes.play('escort',()=>{G.stage='cell';saveGame();buildFloor();ui.say('The door seals behind you. The isolation is complete. Search the cell.')}),1200);
};
F13.fault=function(B,d){const rt=B.rt;rt.op.fails++;if(rt.op.fails>=3&&rt.op.state==='standby'){rt.op.fails=0;F13.dispatch(B,'labCheck','Repeated access failure, '+(d.id==='labdoor'?'Testing 1':d.label.replace(' door',''))+'. Operator dispatched.')}else if(rt.op.fails===2)B.say('The lock flashes twice. Somewhere, something has noticed.')};
F13.dispatch=function(B,kind,text){const rt=B.rt,op=R.guards[0];if(rt.op.state!=='standby'||op.mode==='pursue')return;B.announce(text);rt.op.state=kind;rt.op.t=0;op.mode='script';op.path=null;if(OPT.captions)ui.caption('[footsteps start, far off]',2.5)};
F13.response=function(B,silent){const op=R.guards[0];B.rt.op.state='response';op.route=[[20,4],[20,12]];op.mode='patrol';op.homeMode='patrol';op.path=null;op.speed=60;if(!silent){B.announce('Unauthorized presence, Testing 1. Security response active.');B.say('Beyond the service door the operator has taken up a sweep of the lift lobby. The circuit console shows its power loop.')}};
F13.reveal=function(B){const fs=B.fs;if(fs.revealed)return;if(fs.solution==null)fs.solution=chooseSolution();fs.revealed=true;saveGame();ui.objectives();
 B.effect({kind:'grid',x:13*T+16,y:12*T,mask:fs.solution,dur:4});SFX.chime();B.say('The operator presses four contacts on the Testing 1 lock, in a line. You watch its hand. You memorize the shape.');if(OPT.captions)ui.caption('[the lock chimes and releases]',2.5)};
F13.operator=function(B,op,dt){
 const rt=B.rt,st=rt.op;if(op.mode!=='script'){if(st.state!=='standby'&&st.state!=='response'&&op.mode==='patrol'){st.state='standby';op.route=[]}return}
 st.t+=dt;
 // scripted operator still sees the player
 if(canSee(op)&&R.grace<=0){op.mode='pursue';op.lastSeen={x:R.player.x,y:R.player.y};op.lostT=2.5;op.path=null;SFX.alarm();st.state='standby';B.say('The operator turns. It has you in view.');return}
 st.stepT=(st.stepT||0)-dt;if(st.stepT<=0){const far=dist(op,R.player)>260;SFX.robotStep(far);st.stepT=.55}
 const go=(tx,ty,speed)=>moveEntity(op,tx,ty,speed||80,dt);
 const face=a=>{op.angle=a};
 switch(st.state){
  case 'camCheck':case 'doorCheck':
   if(!st.phase){if(go(36,14)){st.phase='look';st.t=0;face(-Math.PI/2)}}
   else if(st.phase==='look'){face(-Math.PI/2);if(st.t>2){st.phase=null;st.t=0;
     if(st.state==='camCheck'){B.announce('Anomaly cleared, cell 13.');st.state='back'}
     else{const inCell=B.inRoom(R.player,F13.cell);if(inCell){op.mode='pursue';op.lastSeen={x:R.player.x,y:R.player.y};op.lostT=3;st.state='standby';B.say('The operator looks into the open cell. It looks at you.');return}
      B.announce('Subject 13 unaccounted for. Sweeping Testing wing.');st.state='labCheck';st.phase=null}}}
   break;
  case 'labCheck':
   if(!st.phase){if(go(13,14)){st.phase='operate';st.t=0;face(-Math.PI/2)}}
   else if(st.phase==='operate'){face(-Math.PI/2);if(st.t>.8&&!st.shown){st.shown=true;const p=R.player;const seeIt=dist(p,tc(13,13))<230&&losTiles(tc(13,14),p);if(seeIt)F13.reveal(B);else B.say('Somewhere down the corridor a lock chimes. You could not see what the operator did.');}
    if(st.t>2.6){const d=B.doorById('labdoor');if(!d.open){d.open=true;d.robotOpened=true;R.dirty=true;SFX.door()}st.phase='inside';st.t=0}}
   else if(st.phase==='inside'){if(go(13,11)){face(Math.PI/2);if(st.t>3){st.phase='out';st.t=0}}}
   else if(st.phase==='out'){if(go(13,14)){const d=B.doorById('labdoor');if(d.robotOpened&&!B.has('labOpen')){d.open=false;d.robotOpened=false;R.dirty=true;SFX.door()}st.phase=null;st.shown=false;st.state='back';B.announce('Sweep complete. No contact.')}}
   break;
  case 'back':if(go(20,5)){st.state='standby';op.mode='patrol';op.route=[];op.path=null;face(Math.PI/2);rt.camChecked=false}break;
  default:st.state='standby';op.mode='patrol';
 }
};

/* ---------- Floor 13 · RETURN ---------- */
FLOOR[13].r={name:'DETENTION',bespoke:true,noExitTile:true,exitLabel:'Reach the captive',
 objectives:[
  {id:'power',label:'Route emergency power to Testing 1 containment',done:fs=>fs.emPower},
  {id:'lure',label:'Trigger the lure and let the subject enter the chamber',done:fs=>fs.contained},
  {id:'close',label:'Close the chamber from the corridor while it is occupied',done:fs=>fs.contained},
  {id:'breach',label:'Open the rescue hatch to the holding room',done:fs=>fs.breachOpen},
 ],
 exitReady:fs=>!!fs.breachOpen,exitMsg:'',
 spawn(){return [20,3]},checkpoint(){return tc(20,3)},
 build(B){
  const fs=B.fs;F13.geometry(true);
  if(fs.breachOpen){B.floor(17,5,'c');B.floor(18,5,'c')}
  B.door({id:'cell13',x:36,y:13,kind:'cell',open:true,persist:false,label:'Cell 13 door'});
  B.door({id:'labdoor',x:13,y:13,label:'Containment door',persist:false,noRobot:true,open:false,locked:(B)=>fs.contained?'Sealed. Something moves behind it.':'Motorized. The corridor panel controls it.'});
  B.door({id:'labside',x:18,y:11,label:'Service door',persist:false,noRobot:true,locked:'Jammed shut.'});
  B.item({id:'empower',x:18,y:7,kind:'panel',label:'Emergency power panel',lit:B=>B.has('emPower')?'#7fd0c6':'#e04848',prompt:B=>B.has('emPower')?'E: Power routed':'E: Route emergency power to containment',
   use(B){if(B.has('emPower'))return;B.flag('emPower');SFX.confirm();B.announce('Emergency power routed. Testing 1 containment door and lure online.');B.say('The panel takes what little power is left and sends it to Testing 1. The chamber door motor wakes up.')}});
  B.item({id:'lurectl',x:12,y:13,side:'s',kind:'panel',label:'Containment panel',lit:B=>B.rt.lure?'#e7c45c':B.has('contained')?'#7fd0c6':'#9fb0ba',
   prompt:B=>B.has('contained')?'E: Chamber sealed':B.rt.lure?'E: Close the chamber door':'E: Trigger the lure',
   use(B){const rt=B.rt,d=B.doorById('labdoor'),s=R.subjects[0];
    if(B.has('contained')){B.say('Sealed. The thing inside throws itself at the door and stops.');return}
    if(!B.has('emPower')){B.say('Dead panel. Nothing on this wing has power.');SFX.deny();return}
    if(!rt.lure){rt.lure=true;d.open=true;R.dirty=true;SFX.door();SFX.lure();if(OPT.captions)ui.caption('[a tone pulses inside the chamber]',2.5);s.mode='lured';s.target=[13,11];s.lingerFor=5;s.path=null;s.chase=0;s.onLeave=()=>{B.say('The subject loses interest and comes back out. Reset the lure and try again.')};B.say('The chamber door opens and a tone pulses inside. Down the corridor, something answers it. Stand clear — the storage niche is behind you — and close the door once it is in.');return}
    const inside=B.inRoom(s,F13.lab);d.open=false;R.dirty=true;SFX.door();rt.lure=false;
    if(inside){s.mode='held';s.active=true;B.flag('contained');SFX.confirm();B.announce('Containment restored, Testing 1.');B.say('The door seals with the subject inside. It screams once. The rescue hatch interlock releases.')}
    else{s.mode='roam';s.target=null;B.say('The door closes on an empty chamber. The lure resets; trigger it again.');SFX.deny()}}});
  B.item({id:'hatch',x:18,y:5,kind:'breach',label:'Rescue hatch',prompt:B=>B.has('breachOpen')?null:'E: Open the rescue hatch',visible:()=>!B.has('breachOpen'),
   use(B){if(!B.has('contained')){B.say('HATCH LOCKED — CONTAINMENT BREACH ACTIVE. The interlock will not release while the subject is loose.');SFX.doorDeny();return}
    B.flag('breachOpen');B.floor(17,5,'c');B.floor(18,5,'c');R.dirty=true;SFX.gate();R.shake=.6;B.say('The hatch gives. Beyond it, the wall of the holding room has already half collapsed. You climb through.')}});
  B.item({id:'captive',x:14,y:6,kind:'captive',label:'The captive',prompt:'E: Go to '+pronoun().them,use(B){Scenes.play('reunion')}});
  B.subject({id:'sub',tx:25,ty:15,area:[4,14,37,16],speed:65});
  if(fs.contained){const s=R.subjects[0];const c=tc(13,11);s.x=c.x;s.y=c.y;s.mode='held';s.home={x:c.x,y:c.y}}
 },
 onReset(B){const s=R.subjects[0];if(B.has('contained')){const c=tc(13,11);s.x=c.x;s.y=c.y;s.mode='held'}else{const d=B.doorById('labdoor');d.open=false;B.rt.lure=false}R.dirty=true},
 tick(dt,B){const s=R.subjects[0];if(B.has('contained')){const c=tc(13,11);s.x=c.x+Math.sin(R.t*3)*6;s.y=c.y;s.mode='held';s.angle+=dt*3;if(Math.floor(R.t)%4===0&&R.t%1<dt)SFX.growl()}},
};
function collectMemory(f){if(G.memories.includes(f))return;G.memories.push(f);SFX.memory();ui.say('Memory fragment · '+MEMORIES[f]);ui.journal();saveGame();if(OPT.captions)ui.caption('[a fragment of memory]',2);if(f===6)setTimeout(()=>Scenes.play('childhood'),600)}
