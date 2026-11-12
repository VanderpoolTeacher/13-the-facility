/* ============================================================
   ENGINE · world, builder, stealth, hazards, capture, save, transitions
   ============================================================ */
const NAMES={13:'DETENTION',12:'PROCESSING',11:'MEDICAL',10:'RESEARCH',9:'CONTAINMENT',8:'ENGINEERING',7:'SECURITY',6:'RECORDS',5:'OPERATIONS',4:'TRAINING',3:'LOGISTICS',2:'ADMINISTRATION',1:'SURFACE ACCESS'};
const MEMORIES={13:'A worn metal token, scratched with a lopsided star. Two children laughing in summer rain. You do not know whose hand you are holding.',12:'Intake record 0013/0014: two subjects admitted together, same transport, same date. Next of kin: each other.',11:'A recording. Two voices under anesthesia, promising not to leave. One of them is yours.',10:'A cognitive trial log. The voice behind the glass said your name before the examiner did. The name has been redacted.',9:'Modification protocol, approved. “Aggression and tissue change are expected outcomes.” Someone signed it.',8:'Power-consumption ledger. The facility draws more than the town above it. Nobody up there asked why.',7:'Security footage, undated. You, running down this corridor. You did not get far. You do not remember it.',6:'A small house, a creek, two bicycles in the grass. Two children tapping on a pipe between rooms. One of them keeps making the same mistake, and the other starts making it on purpose.',5:'Directive 7-C: research continuity supersedes subject welfare. Issued by a human office.',4:'Warden training slides. Subjects are referred to as inventory. Escape attempts are referred to as shrinkage.',3:'Shipment manifest. Two units of classified cargo, live, handled with care. The dates match the intake record.',2:'The authorization carries three human signatures and a government seal. The AI only ever did what it was told.',1:'The first sunrise you can remember. It is beautiful. Someone should be standing beside you.'};
const ROOMS={WA:[3,13,4,10,15,7],EA:[26,36,4,10,24,7],WB:[3,13,13,19,15,16],EB:[26,36,13,19,24,16],WC:[3,13,22,26,15,24],EC:[26,36,22,26,24,24]};
const FLOOR={}; // FLOOR[n][phase] definitions registered by floor modules
const SAVE_KEY='thirteen_v2',OPT_KEY='thirteen_opts',OLD_KEY='thirteen_fullgame_v1';

let G=null; // durable game state (saved)
let R=null; // runtime floor state (rebuilt)
const OPT={captions:true,mute:false,reduced:false};
const keys=new Set(),pressed=new Set();
let modal='title'; // 'none' | 'dialog' | 'scene' | 'grid' | 'keypad' | 'sequence' | 'capture' | 'title'
let storageNote='';

function newGame(gender){
 return {v:2,gender,floor:13,phase:'e',floors:{},memories:[],learned:{pattern:null,f12:false},attempts:[],finished:false,ending:null,returnChosen:false,stage:'assess',saved:0};
}
function fsOf(floor,phase){const k=floor+phase;return G.floors[k]||(G.floors[k]={})}
function FS(){return fsOf(G.floor,G.phase)}
function pronoun(){return G.gender==='female'?{they:'he',them:'him',their:'his',cap:'He'}:{they:'she',them:'her',their:'her',cap:'She'}}

/* ---------- Storage ---------- */
function saveGame(){
 if(!G)return false;G.saved=Date.now();
 try{localStorage.setItem(SAVE_KEY,JSON.stringify(G));return true}catch(e){storageNote='Saving is unavailable in this browser context; progress will not persist.';ui.say(storageNote);return false}
}
function validateSave(x){
 if(!x||typeof x!=='object'||x.v!==2)return null;
 if(!(x.floor>=1&&x.floor<=13)||!['e','r'].includes(x.phase))return null;
 if(!['female','male'].includes(x.gender))return null;
 if(typeof x.floors!=='object'||x.floors===null)x.floors={};
 if(!Array.isArray(x.memories))x.memories=[];
 x.memories=x.memories.filter(n=>Number.isInteger(n)&&n>=1&&n<=13);
 if(!x.learned||typeof x.learned!=='object')x.learned={pattern:null,f12:false};
 if(!Array.isArray(x.attempts))x.attempts=[];
 x.finished=!!x.finished;x.returnChosen=!!x.returnChosen;
 if(typeof x.stage!=='string')x.stage='assess';
 return x;
}
function loadGame(){
 try{
  const raw=localStorage.getItem(SAVE_KEY);
  if(raw){const v=validateSave(JSON.parse(raw));if(v)return v;storageNote='A saved game was found but could not be validated. It was ignored.';return null}
  if(localStorage.getItem(OLD_KEY)){storageNote='An older prototype save (v1) was found. That format is not supported by this build; start a new game.'}
 }catch(e){storageNote='Saved games are unavailable in this browser context.'}
 return null;
}
function loadOpts(){try{const o=JSON.parse(localStorage.getItem(OPT_KEY));if(o)Object.assign(OPT,o)}catch(e){}Audio13.setMuted(OPT.mute)}
function saveOpts(){try{localStorage.setItem(OPT_KEY,JSON.stringify(OPT))}catch(e){}Audio13.setMuted(OPT.mute)}

/* ---------- World builder ---------- */
function makeRuntime(){
 return {grid:Array.from({length:H},()=>new Uint8Array(W).fill(1)),kind:Array.from({length:H},()=>Array(W).fill('w')),paint:[],labels:[],
  doors:[],props:[],items:[],guards:[],subjects:[],hazards:[],hides:new Set(),effects:[],
  timers:{},rt:{},resets:0,t:0,player:null,checkpoint:null,entry:null,exit:null,def:null,alert:0,alertState:'HIDDEN',grace:0,seenT:0,
  capture:null,hold:null,holdT:0,prompt:null,static:null,dirty:true,flash:0,shake:0,lightsUp:0,msgT:0,fx:[],footT:0};
}
const B={
 get fs(){return FS()},get rt(){return R.rt},get R(){return R},get G(){return G},
 wall(x,y){if(x>=0&&x<W&&y>=0&&y<H){R.grid[y][x]=1;R.kind[y][x]='w'}},
 floor(x,y,k='f'){if(x>=0&&x<W&&y>=0&&y<H){R.grid[y][x]=0;R.kind[y][x]=k}},
 rect(x0,y0,x1,y1,k='f'){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)B.floor(x,y,k)},
 wallRect(x0,y0,x1,y1){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)B.wall(x,y)},
 box(x0,y0,x1,y1,k='f'){B.wallRect(x0-1,y0-1,x1+1,y1+1);B.rect(x0,y0,x1,y1,k)},
 isWall(x,y){return !(x>=0&&x<W&&y>=0&&y<H)||R.grid[y][x]===1},
 paint(x,y,k){R.paint.push({x,y,k})},
 label(x,y,text,color){R.labels.push({x,y,text,color})},
 hide(x,y){R.hides.add(key(x,y))},
 door(o){const d=Object.assign({open:false,locked:null,label:'Door',kind:'door',auto:0,timer:0,persist:true,x:0,y:0},o);
  const i=R.doors.findIndex(x=>x.id===d.id);if(i>=0)R.doors.splice(i,1); // a floor redefining a skeleton door replaces it
  if(d.persist&&FS().d&&FS().d[d.id])d.open=true;R.grid[d.y][d.x]=0;R.kind[d.y][d.x]='d';R.doors.push(d);return d},
 doorById(id){return R.doors.find(d=>d.id===id)},
 openDoor(id,persist){const d=B.doorById(id);if(!d||d.open)return;d.open=true;if(d.auto)d.timer=d.auto;if(persist!==false&&d.persist&&!d.auto){const fs=FS();(fs.d||(fs.d={}))[id]=1}SFX.door();R.dirty=true},
 closeDoor(id){const d=B.doorById(id);if(!d||!d.open)return;d.open=false;d.timer=0;const fs=FS();if(fs.d)delete fs.d[id];SFX.door();R.dirty=true},
 prop(o){const p=Object.assign({solid:true,w:1,h:1,kind:'crate',x:0,y:0},o);R.props.push(p);return p},
 item(o){const it=Object.assign({solid:false,w:1,h:1,kind:'console',visible:()=>true,prompt:null,reach:46},o);
  it.px=(it.x+it.w/2)*T;it.py=(it.y+it.h/2)*T;R.items.push(it);return it},
 guard(o){const g=Object.assign({kind:'robot',speed:55,vision:160,fov:Math.PI/3,mode:'patrol',wp:0,path:null,pathT:0,lookT:0,disabled:0,route:[],angle:Math.PI/2,active:true,label:'WARDEN'},o);
  if(o.tx!==undefined){const c=tc(o.tx,o.ty);g.x=c.x;g.y=c.y}g.home={x:g.x,y:g.y,angle:g.angle};R.guards.push(g);return g},
 subject(o){const s=Object.assign({kind:'subject',speed:70,mode:'roam',target:null,wait:0,area:[18,3,22,26],path:null,pathT:0,label:'ESCAPED SUBJECT',active:true,linger:0},o);
  if(o.tx!==undefined){const c=tc(o.tx,o.ty);s.x=c.x;s.y=c.y}s.home={x:s.x,y:s.y};R.subjects.push(s);return s},
 hazard(o){const h=Object.assign({kind:'electric',active:()=>true,msg:'You are thrown back.',tiles:[]},o);h.set=new Set(h.tiles.map(([x,y])=>key(x,y)));R.hazards.push(h);return h},
 has(n){return !!FS()[n]},
 flag(n,v=true){const fs=FS();if(fs[n]===v)return;fs[n]=v;ui.objectives();saveGame();},
 timer(n,sec){R.timers[n]=sec;(R.timerMax||(R.timerMax={}))[n]=sec},left(n){return R.timers[n]||0},active(n){return (R.timers[n]||0)>0},
 say(t){ui.say(t)},announce(t){ui.announce(t)},
 effect(e){R.fx.push(Object.assign({t:0,dur:.6},e))},
 inRoom(e,rm){const [x0,x1,y0,y1]=rm;const tx=Math.floor(e.x/T),ty=Math.floor(e.y/T);return tx>=x0&&tx<=x1&&ty>=y0&&ty<=y1},
 tileOf(e){return [Math.floor(e.x/T),Math.floor(e.y/T)]},
 reset(reason){resetToCheckpoint(reason)},save(){saveGame()},
 scene(id,done){Scenes.play(id,done)},
 setCheckpoint(tx,ty){R.checkpoint=tc(tx,ty)},
};

/* Shared six-room skeleton (the canonical map). Floors modify it afterwards. */
function skeleton(){
 for(let y=3;y<=26;y++)for(let x=18;x<=22;x++)B.floor(x,y,'c');
 B.floor(20,2,'lift');B.floor(20,27,'lift');
 for(const [name,a] of Object.entries(ROOMS)){
  for(let y=a[2];y<=a[3];y++)for(let x=a[0];x<=a[1];x++)B.floor(x,y,'r');
  const west=name[0]==='W';
  for(let x=Math.min(a[4],west?17:23);x<=Math.max(a[4],west?17:23);x++)B.floor(x,a[5],'c');
  B.floor(west?14:25,a[5],'c');
  B.door({id:name,x:a[4],y:a[5],label:'Door',open:true,persist:false});
 }
}
function roomCenter(n){const a=ROOMS[n];return [Math.floor((a[0]+a[1])/2),Math.floor((a[2]+a[3])/2)]}

function buildFloor(){
 R=makeRuntime();
 const def=FLOOR[G.floor][G.phase];R.def=def;
 R.entry=G.phase==='e'?[20,27]:[20,2];R.exit=G.phase==='e'?[20,2]:[20,27];
 if(!def.bespoke)skeleton();
 def.build(B);
 const sp=def.spawn?def.spawn(B):(R.arriveStairs?R.arriveStairs:R.entry);
 const c=tc(sp[0],sp[1]);R.player={x:c.x,y:c.y,facing:-Math.PI/2,stance:'walk',moving:false,anim:0};
 if(!R.checkpoint)R.checkpoint={x:c.x,y:c.y};
 ui.floorHeader();ui.objectives();R.dirty=true;
 Audio13.ambientOn(G.phase==='e'?'escape':'return');
 if(def.onEnter)def.onEnter(B);
}

/* ---------- Collision ---------- */
function solidAt(px,py,ignore){
 const tx=Math.floor(px/T),ty=Math.floor(py/T);
 if(tx<0||ty<0||tx>=W||ty>=H||R.grid[ty][tx])return true;
 for(const d of R.doors)if(!d.open&&d.x===tx&&d.y===ty&&d!==ignore)return true;
 for(const p of R.props)if(p.solid&&p!==ignore&&tx>=p.x&&tx<p.x+p.w&&ty>=p.y&&ty<p.y+p.h)return true;
 for(const it of R.items)if(it.solid&&it!==ignore&&it.visible()&&tx>=it.x&&tx<it.x+it.w&&ty>=it.y&&ty<it.y+it.h)return true;
 return false;
}
function canStand(x,y,r=10,ignore){return !solidAt(x-r,y-r,ignore)&&!solidAt(x+r,y-r,ignore)&&!solidAt(x-r,y+r,ignore)&&!solidAt(x+r,y+r,ignore)}
function tileBlocked(tx,ty,forGuard){
 if(tx<0||ty<0||tx>=W||ty>=H||R.grid[ty][tx])return true;
 for(const d of R.doors)if(!d.open&&d.x===tx&&d.y===ty){if(forGuard&&!d.locked&&!d.noRobot)continue;return true}
 for(const p of R.props)if(p.solid&&tx>=p.x&&tx<p.x+p.w&&ty>=p.y&&ty<p.y+p.h)return true;
 for(const it of R.items)if(it.solid&&it.visible()&&tx>=it.x&&tx<it.x+it.w&&ty>=it.y&&ty<it.y+it.h)return true;
 return false;
}
function clearPath(a,b,ignore,short=0){
 const d=dist(a,b);for(let t=4;t<d-short;t+=4){const x=a.x+(b.x-a.x)*t/d,y=a.y+(b.y-a.y)*t/d;if(solidAt(x,y,ignore))return false}return true;
}
function losTiles(a,b){ // walls and closed doors block sight; props and items do not
 const d=dist(a,b);for(let t=6;t<d;t+=6){const x=a.x+(b.x-a.x)*t/d,y=a.y+(b.y-a.y)*t/d;const tx=Math.floor(x/T),ty=Math.floor(y/T);
  if(tx<0||ty<0||tx>=W||ty>=H||R.grid[ty][tx])return false;
  for(const dr of R.doors)if(!dr.open&&dr.x===tx&&dr.y===ty&&dr.kind!=='glass')return false;}
 return true;
}
function hazardAt(x,y){for(const h of R.hazards)if(h.set.has(key(x,y))&&(h.activeTile?h.activeTile(B,x,y):h.active(B)))return true;return false}
function findPath(sx,sy,tx,ty,forGuard=true,avoid=false){
 if(sx===tx&&sy===ty)return [];
 const prev=new Map();const q=[[sx,sy]];prev.set(key(sx,sy),null);
 for(let i=0;i<q.length;i++){const [x,y]=q[i];if(x===tx&&y===ty)break;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(prev.has(k)||tileBlocked(nx,ny,forGuard)||(avoid&&hazardAt(nx,ny)))continue;prev.set(k,[x,y]);q.push([nx,ny])}}
 if(!prev.has(key(tx,ty)))return null;
 const out=[];let cur=[tx,ty];while(cur){out.unshift(cur);cur=prev.get(key(cur[0],cur[1]))}out.shift();return out;
}
function moveEntity(e,tx,ty,speed,dt,forGuard=true){ // move along path to tile; returns true when arrived
 const [ex,ey]=B.tileOf(e);
 if(!e.path||e.pathT<=0||e.pathGoal!==key(tx,ty)){e.path=findPath(ex,ey,tx,ty,forGuard);e.pathGoal=key(tx,ty);e.pathT=.5;if(!e.path)return false}
 e.pathT-=dt;
 let target=e.path.length?tc(e.path[0][0],e.path[0][1]):tc(tx,ty);
 const d=dist(e,target);
 if(d<3){if(e.path.length){e.path.shift();return e.path.length===0&&dist(e,tc(tx,ty))<4}return true}
 const s=Math.min(d,speed*dt);e.angle=Math.atan2(target.y-e.y,target.x-e.x);
 const nx=e.x+Math.cos(e.angle)*s,ny=e.y+Math.sin(e.angle)*s;
 const [ntx,nty]=[Math.floor(nx/T),Math.floor(ny/T)];
 for(const dr of R.doors)if(!dr.open&&dr.x===ntx&&dr.y===nty&&forGuard&&!dr.locked&&!dr.noRobot){dr.open=true;dr.timer=dr.auto||2.5;dr.robotOpened=true;R.dirty=true;SFX.door()}
 e.x=nx;e.y=ny;return false;
}

/* ---------- Stealth ---------- */
function playerHidden(g){const [tx,ty]=B.tileOf(R.player);return R.hides.has(key(tx,ty))&&dist(g,R.player)>48}
function canSee(g){
 const p=R.player,d=dist(g,p);if(d>g.vision)return false;
 const a=Math.atan2(p.y-g.y,p.x-g.x),delta=Math.atan2(Math.sin(a-g.angle),Math.cos(a-g.angle));
 if(Math.abs(delta)>g.fov/2&&d>26)return false;
 if(playerHidden(g))return false;
 return losTiles(g,p);
}
function noiseRadius(){const p=R.player;if(!p.moving)return 0;return p.stance==='run'?128:p.stance==='walk'?48:16}
function canHear(g){const n=noiseRadius();if(!n)return false;const d=dist(g,R.player);if(d>n)return false;return losTiles(g,R.player)||d<n*.5}
function stepGuard(g,dt){
 if(!g.active)return;
 if(g.disabled>0){g.disabled-=dt;if(g.disabled<=0){g.mode='patrol';g.path=null}return}
 if(g.mode==='script'||g.mode==='idle'){if(g.script)g.script(g,dt);return}
 const p=R.player;
 const seen=canSee(g),heard=!seen&&canHear(g);
 if(seen){if(g.mode!=='pursue'){g.mode='pursue';g.path=null;if(!R.seenT)SFX.alarm();R.seenT=1.2}g.lastSeen={x:p.x,y:p.y};g.lostT=2.5;R.alert=Math.min(100,R.alert+dt*90)}
 else if(heard&&g.mode!=='pursue'){g.mode='investigate';g.noise={x:p.x,y:p.y};g.lookT=2;g.path=null;R.alert=Math.min(100,R.alert+dt*20)}
 if(g.mode==='pursue'){
  if(!seen){g.lostT-=dt;if(g.lostT<=0){g.mode='investigate';g.noise=g.lastSeen;g.lookT=2.5;g.path=null}}
  const tgt=seen?p:g.lastSeen;const [tx,ty]=[Math.floor(tgt.x/T),Math.floor(tgt.y/T)];
  moveEntity(g,tx,ty,g.pursueSpeed||105,dt);
  if(dist(g,p)<22&&seen)startCapture(g);
 }else if(g.mode==='investigate'){
  const [tx,ty]=[Math.floor(g.noise.x/T),Math.floor(g.noise.y/T)];
  const arrived=moveEntity(g,tx,ty,g.speed*1.3,dt);
  if(arrived||g.path===null){g.lookT-=dt;g.angle+=dt*1.5;if(g.lookT<=0){g.mode='patrol';g.path=null}}
 }else{ // patrol
  if(g.route.length){const wp=g.route[g.wp%g.route.length];if(moveEntity(g,wp[0],wp[1],g.speed,dt)){g.wp=(g.wp+1)%g.route.length;g.path=null}}
  else{const d=dist(g,g.home);if(d>4)moveEntity(g,Math.floor(g.home.x/T),Math.floor(g.home.y/T),g.speed,dt);else{g.angle=g.home.angle+Math.sin(R.t*.7)*.6}}
 }
}
function stepSubject(s,dt){
 if(!s.active)return;const p=R.player;
 if(s.mode==='held')return;
 if(s.mode==='lured'){if(moveEntity(s,s.target[0],s.target[1],s.speed*1.3,dt,false)){s.mode='linger';s.linger=s.lingerFor||4}}
 else if(s.mode==='linger'){s.linger-=dt;s.angle+=dt*2;if(s.linger<=0){s.mode='roam';s.wait=0;s.target=null;if(s.onLeave)s.onLeave(s)}}
 else{ // roam within area
  if(!s.target||s.wait>0){s.wait-=dt;if(s.wait<=0||!s.target){const [x0,y0,x1,y1]=s.area;let tries=0;do{s.target=[x0+Math.floor(rand()*(x1-x0+1)),y0+Math.floor(rand()*(y1-y0+1))];tries++}while(tileBlocked(s.target[0],s.target[1],false)&&tries<20);s.path=null;s.wait=0}}
  else if(moveEntity(s,s.target[0],s.target[1],s.speed,dt,false)){s.wait=1+rand()*2;}
  else if(s.path===null){s.target=null}
  // notice player: subjects chase when close with line of sight
  const d=dist(s,p);if(d<120&&losTiles(s,p)&&!playerHidden(s)){s.chase=1.5}
  if(s.chase>0){s.chase-=dt;const [tx,ty]=B.tileOf(p);moveEntity(s,tx,ty,s.speed*1.4,dt,false);R.alert=Math.min(100,R.alert+dt*60)}
 }
 if(dist(s,p)<20&&s.mode!=='held')startCapture(s,'ESCAPED SUBJECT');
}
function startCapture(by,title){
 if(R.capture||modal!=='none'||R.grace>0)return;
 R.capture={by,title:title||'SECURITY RESTRAINT',t:0,limit:3,attempted:false,result:null,resultT:0};modal='capture';SFX.capture();keys.clear();
 ui.say(title?'The subject has you. One chance: press SPACE when the marker crosses the center.':'Restrained by security. One chance: press SPACE when the marker crosses the center.');
}
function captureAttempt(){
 const c=R.capture;if(!c||c.attempted)return;c.attempted=true;
 const m=markerPos(c.t);
 if(Math.abs(m-.5)<.09){c.result='ok';c.resultT=.8;SFX.escape()}else{c.result='fail';c.resultT=1;SFX.deny()}
}
function markerPos(t){return .5+.5*Math.sin(t*4.2)}
function stepCapture(dt){
 const c=R.capture;c.t+=dt;
 if(c.result){c.resultT-=dt;if(c.resultT<=0){
  if(c.result==='ok'){ // break contact: brief grace, raise alert, keep progress
   const by=c.by;by.disabled=3.5;by.mode='patrol';by.path=null;if(by.kind==='subject'){by.mode='roam';by.wait=3;by.chase=0;by.stun=3.5}
   R.alert=100;R.grace=2;const dx=R.player.x-by.x,dy=R.player.y-by.y,l=Math.hypot(dx,dy)||1;
   for(let i=0;i<6;i++){const nx=R.player.x+dx/l*6,ny=R.player.y+dy/l*6;if(canStand(nx,ny)){R.player.x=nx;R.player.y=ny}}
   R.capture=null;modal='none';ui.say('You twist free. The alarm is raised, but your progress is intact.');
  }else{R.capture=null;modal='none';resetToCheckpoint('Captured. Security returned you to the last checkpoint. Progress on completed objectives is retained.')}
 }return}
 if(c.t>=c.limit){c.result='fail';c.resultT=.6;ui.say('Too slow.')}
}
function resetToCheckpoint(msg){
 const cp=R.def.checkpoint?R.def.checkpoint(B):R.checkpoint;
 R.player.x=cp.x;R.player.y=cp.y;R.player.moving=false;
 R.capture=null;if(modal==='capture')modal='none';R.alert=0;R.grace=1.5;R.hold=null;R.holdT=0;keys.clear();
 for(const g of R.guards){g.x=g.home.x;g.y=g.home.y;g.angle=g.home.angle;g.mode=g.homeMode||'patrol';g.path=null;g.disabled=0;g.wp=0}
 for(const s of R.subjects){s.x=s.home.x;s.y=s.home.y;s.mode='roam';s.target=null;s.chase=0;s.path=null}
 for(const d of R.doors)if(d.auto||d.robotOpened){d.open=false;d.timer=0;d.robotOpened=false}
 R.timers={};R.rt={};R.resets++;if(R.def.onReset)R.def.onReset(B);
 R.dirty=true;ui.say(msg||'Reset to checkpoint. Progress retained.');ui.objectives();
}

/* ---------- Interaction ---------- */
function nearestInteractable(){
 const p=R.player;let best=null,bd=1e9;
 const score=(c,d)=>{const a=Math.atan2(c.y-p.y,c.x-p.x);const dl=Math.atan2(Math.sin(a-p.facing),Math.cos(a-p.facing));return d-26*Math.cos(dl)}; // prefer what the player faces
 const [ptx,pty]=B.tileOf(p);
 for(const it of R.items){if(!it.visible())continue;const c={x:it.px,y:it.py};const d=dist(p,c);const reach=it.reach+(it.solid?(Math.max(it.w,it.h)-1)*16:0);if(d>=reach)continue;const sc=score(c,d);if(sc>=bd)continue;
  if(it.w===1&&it.h===1&&R.grid[it.y][it.x]===1){ // wall-mounted: must stand on the approach tile, never through the wall
   const sides={n:[0,-1],s:[0,1],e:[1,0],w:[-1,0]};let ok=false;
   if(it.side){const [ox,oy]=sides[it.side];ok=ptx===it.x+ox&&pty===it.y+oy}
   else ok=Math.abs(ptx-it.x)+Math.abs(pty-it.y)===1&&!R.grid[pty][ptx];
   if(ok){best={type:'item',o:it};bd=sc}continue}
  if(clearPath(p,c,it,15)){best={type:'item',o:it};bd=sc}}
 for(const d of R.doors){const c=tc(d.x,d.y);const dd=dist(p,c);if(dd>=46)continue;if(Math.abs(ptx-d.x)+Math.abs(pty-d.y)>1)continue; // doors: orthogonally adjacent only, never across a wall corner
  const sc=score(c,dd);if(sc<bd&&clearPath(p,c,d)){best={type:'door',o:d};bd=sc}}
 const ex=tc(R.exit[0],R.exit[1]);if(!R.def.noExitTile&&dist(p,ex)<40){best={type:'exit'};}
 return best;
}
function promptFor(n){
 if(!n)return null;
 if(n.type==='exit')return G.phase==='e'?'E: Call the upper lift':'E: Call the lower lift';
 if(n.type==='door'){const d=n.o;if(d.prompt)return typeof d.prompt==='function'?d.prompt(B,d):d.prompt;return d.open?(d.closable?'E: Close '+d.label:null):'E: '+(d.locked?'Try ':'Open ')+d.label}
 const it=n.o;const pr=typeof it.prompt==='function'?it.prompt(B,it):it.prompt;return pr===null?null:'E: '+(pr||it.label);
}
function interact(){
 const n=nearestInteractable();R.prompt=n;
 if(!n){ui.say('Nothing to use here. Move closer to a console, door or lift.');return}
 if(n.type==='exit'){useExit();return}
 if(n.type==='door'){const d=n.o;
  if(d.use){d.use(B,d);return}
  if(d.open){if(d.closable){d.open=false;d.timer=0;R.dirty=true;SFX.door();ui.say(d.label+' closed.')}return}
  const lock=typeof d.locked==='function'?d.locked(B,d):d.locked;
  if(lock){ui.say(typeof lock==='string'?lock:d.label+' is locked.');SFX.doorDeny();if(d.onDeny)d.onDeny(B,d);return}
  B.openDoor(d.id);ui.say(d.label+' opens.');if(d.onOpen)d.onOpen(B,d);return;
 }
 const it=n.o;if(it.hold){R.hold=it;R.holdT=0;if(it.holdStart)it.holdStart(B,it);return}
 it.use(B,it);
}
function useExit(){
 const def=R.def;const ready=def.exitReady(FS());
 if(!ready){const m=typeof def.exitMsg==='function'?def.exitMsg(FS()):def.exitMsg;ui.say(m||'The lift does not respond. Something still has to be done on this floor.');SFX.deny();return}
 transition();
}
function transition(){
 if(G.floor===1&&G.phase==='e'){Scenes.play('daylight');return}
 if(G.floor===13&&G.phase==='r'){Scenes.play('reunion');return}
 SFX.lift();const next=G.phase==='e'?G.floor-1:G.floor+1;
 fade(()=>{G.floor=next;G.stage='';buildFloor();saveGame();ui.say((G.phase==='e'?'Ascending. ':'Descending. ')+'Floor '+G.floor+' · '+NAMES[G.floor]+'.')});
}
function transitionStairs(next,arrive){
 fade(()=>{G.floor=next;G.stage='';const prevR=R;buildFloor();if(arrive){const c=tc(arrive[0],arrive[1]);R.player.x=c.x;R.player.y=c.y;R.checkpoint={x:c.x,y:c.y}}saveGame();ui.say('Stairwell. Floor '+G.floor+' · '+NAMES[G.floor]+'.')});
}
function fade(fn){R.flash=1;R.fadeFn=fn}

/* ---------- Simulation step ---------- */
function step(dt){
 if(modal==='capture'){stepCapture(dt);return}
 if(modal!=='none')return;
 R.t+=dt;if(R.grace>0)R.grace-=dt;if(R.seenT>0)R.seenT-=dt;
 const p=R.player;
 let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
 let dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
 p.stance=keys.has('control')?'crouch':keys.has('shift')?'run':'walk';
 p.moving=!!(dx||dy);
 if(p.moving&&!R.hold){const l=Math.hypot(dx,dy);dx/=l;dy/=l;p.facing=Math.atan2(dy,dx);
  const sp={walk:90,run:150,crouch:45}[p.stance],mv=sp*dt;
  if(canStand(p.x+dx*mv,p.y))p.x+=dx*mv;else if(canStand(p.x+Math.sign(dx)*mv,p.y)&&dx)p.x+=Math.sign(dx)*mv;
  if(canStand(p.x,p.y+dy*mv))p.y+=dy*mv;else if(canStand(p.x,p.y+Math.sign(dy)*mv)&&dy)p.y+=Math.sign(dy)*mv;
  p.anim+=dt*(p.stance==='run'?14:8);R.footT-=dt;if(R.footT<=0){SFX.step(p.stance);R.footT=p.stance==='run'?.25:.45}
 }else p.moving=false;
 // hold interactions (E held on an item)
 if(R.hold){const it=R.hold;if(!keys.has('e')||dist(p,{x:it.px,y:it.py})>it.reach+16){if(it.release)it.release(B,it,R.holdT);R.hold=null;R.holdT=0}else{R.holdT+=dt;it.hold(B,it,dt,R.holdT)}}
 // edge-triggered actions
 if(pressed.has('e')){pressed.delete('e');interact()}
 if(pressed.has('r')){pressed.delete('r');resetToCheckpoint('Manual reset to checkpoint. Completed objectives are retained.')}
 pressed.clear();
 // timers
 for(const k in R.timers){if(R.timers[k]>0){R.timers[k]-=dt;if(R.timers[k]<=0){R.timers[k]=0;if(R.def.onExpire)R.def.onExpire(B,k)}}}
 for(const d of R.doors)if(d.timer>0){d.timer-=dt;if(d.timer<=0){d.timer=0;d.open=false;d.robotOpened=false;R.dirty=true;SFX.door();if(d.onClose)d.onClose(B,d)}}
 if(R.def.tick)R.def.tick(dt,B);
 for(const g of R.guards)stepGuard(g,dt);
 for(const s of R.subjects)stepSubject(s,dt);
 // hazards
 const [ptx,pty]=B.tileOf(p);
 for(const h of R.hazards)if(h.set.has(key(ptx,pty))&&(h.activeTile?h.activeTile(B,ptx,pty):h.active(B))){if(h.kind==='push'){const nx=p.x+(h.dx||0)*dt*60,ny=p.y+(h.dy||0)*dt*60;if(canStand(nx,ny)){p.x=nx;p.y=ny}}else{SFX.shock();R.shake=.4;resetToCheckpoint(h.msg);return}}
 // alert bookkeeping
 R.alert=Math.max(0,R.alert-dt*3);
 R.alertState=R.guards.some(g=>g.active&&g.mode==='pursue')||R.subjects.some(s=>s.chase>0)?'SEEN':R.guards.some(g=>g.active&&g.mode==='investigate')?'SUSPICIOUS':'HIDDEN';
 R.prompt=nearestInteractable();
 for(const f of R.fx)f.t+=dt;R.fx=R.fx.filter(f=>f.t<f.dur);
 if(R.shake>0)R.shake-=dt;if(R.lightsUp>0)R.lightsUp-=dt;
 if(R.flash>0){R.flash-=dt*2;if(R.flash<=0&&R.fadeFn){const f=R.fadeFn;R.fadeFn=null;f()}}
}
