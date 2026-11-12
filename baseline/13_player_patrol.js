// Player movement, interaction, patrol sensing, and Floor 13 special transitions.
// Run: node 13_player_patrol.js
const assert=require('node:assert/strict');
const {makeMap,bfs}=require('./13_canonical_maps.js');
const {SecuritySystem}=require('./13_security_rules.js');
const TILE=32;
const center=([x,y])=>({x:(x+.5)*TILE,y:(y+.5)*TILE});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const tile=p=>[Math.floor(p.x/TILE),Math.floor(p.y/TILE)];
function lineOfSight(map,a,b){
 const d=dist(a,b),steps=Math.max(1,Math.ceil(d/8));
 for(let i=1;i<steps;i++){
  const x=a.x+(b.x-a.x)*i/steps,y=a.y+(b.y-a.y)*i/steps;
  const [tx,ty]=tile({x,y});
  if(!map.tiles[ty]||map.tiles[ty][tx]==='#')return false;
  for(const door of Object.values(map.doors))
   if(door.x===tx&&door.y===ty&&door.state!=='open')return false;
 }
 return true;
}
class GameSlice {
 constructor(floor=13,phase='escape'){
  this.security=new SecuritySystem(floor,phase);
  this.map=this.security.map;
  this.player={...center(this.map.entry),stance:'walk',captured:false};
  this.guard={...center([20,14]),angle:Math.PI/2,mode:'patrol',alert:0};
  this.special={crawlOpen:false,breachOpen:false,captiveSeen:false};
  this.floor=floor;this.phase=phase;
 }
 syncDoors(){for(const [k,d] of Object.entries(this.security.doors))this.map.doors[k].state=d.state;}
 move(dx,dy,dt){
  if(this.player.captured)return false;
  const length=Math.hypot(dx,dy);if(!length)return true;
  const speed={walk:90,run:150,crouch:45}[this.player.stance];
  const step=Math.min(speed*dt,8),ux=dx/length,uy=dy/length;
  let remaining=speed*dt,moved=false;
  while(remaining>0){
   const s=Math.min(step,remaining),candidate={x:this.player.x+ux*s,y:this.player.y+uy*s};
   const [tx,ty]=tile(candidate);
   this.syncDoors();
   if(!this.map.tiles[ty]||this.map.tiles[ty][tx]==='#')break;
   if(Object.values(this.map.doors).some(d=>d.x===tx&&d.y===ty&&d.state!=='open'))break;
   this.player.x=candidate.x;this.player.y=candidate.y;remaining-=s;moved=true;
  }
  return moved;
 }
 interact(object){
  if(dist(this.player,object)>40)return false;
  if(object.type==='door')return this.security.openDoor(object.name,{requires:object.requires||[],duration:object.duration||0});
  if(object.type==='terminal'){this.security.mark(object.flag);return true;}
  if(this.floor===13&&object.type==='crawlPanel'&&this.phase==='escape'){
   this.special.crawlOpen=true;this.security.mark('F13_E_PANEL');return true;
  }
  if(this.floor===13&&object.type==='captiveWindow'&&this.phase==='escape'){
   this.special.captiveSeen=true;this.security.mark('F13_E_CAPTIVE');return true;
  }
  if(this.floor===13&&object.type==='breach'&&this.phase==='return'){
   if(!this.security.flags.has('F13_R_CONTAIN'))return false;
   this.special.breachOpen=true;return true;
  }
  return false;
 }
 detect(){
  const d=dist(this.player,this.guard),direction=Math.atan2(this.player.y-this.guard.y,this.player.x-this.guard.x);
  const angle=Math.atan2(Math.sin(direction-this.guard.angle),Math.cos(direction-this.guard.angle));
  const visible=d<=160&&Math.abs(angle)<=Math.PI/6&&lineOfSight(this.map,this.guard,this.player);
  const noise=this.player.stance==='run'?128:this.player.stance==='walk'?48:0;
  const heard=d<=noise&&lineOfSight(this.map,this.guard,this.player);
  this.guard.mode=visible?'pursue':heard?'investigate':'patrol';
  return this.guard.mode;
 }
}
function tests(){
 let count=0;const test=(name,fn)=>{fn();count++;console.log('PASS',name)};
 test('walk and crouch movement speeds',()=>{
  const g=new GameSlice(8);Object.assign(g.player,center([20,15]));const x=g.player.x;
  g.move(1,0,.2);assert(Math.abs(g.player.x-x-18)<1e-5);
  g.player.stance='crouch';const y=g.player.y;g.move(0,1,.2);assert(Math.abs(g.player.y-y-9)<1e-5);
 });
 test('solid walls block player',()=>{
  const g=new GameSlice(8);Object.assign(g.player,center([20,15]));g.move(1,0,2);assert(g.player.x<23*TILE);
 });
 test('door interaction requires proximity and flag',()=>{
  const g=new GameSlice(9);Object.assign(g.player,center([16,16]));
  const door={...center([15,16]),type:'door',name:'WB',requires:['F09_E_AIRLOCK_A']};
  assert.equal(g.interact(door),false);g.security.mark('F09_E_AIRLOCK_A');
  assert.equal(g.interact(door),true);g.syncDoors();assert.equal(g.map.doors.WB.state,'open');
 });
 test('vision cone and crouch noise',()=>{
  const g=new GameSlice(8);g.guard={...center([20,14]),angle:Math.PI/2,mode:'patrol'};
  Object.assign(g.player,center([20,17]));assert.equal(g.detect(),'pursue');
  Object.assign(g.player,center([20,8]));g.player.stance='crouch';assert.equal(g.detect(),'patrol');
 });
 test('Floor 13 captive and return breach triggers',()=>{
  const e=new GameSlice(13,'escape');Object.assign(e.player,center([8,7]));
  assert(e.interact({...center([8,7]),type:'crawlPanel'}));assert(e.special.crawlOpen);
  Object.assign(e.player,center([31,7]));assert(e.interact({...center([31,7]),type:'captiveWindow'}));
  const r=new GameSlice(13,'return');Object.assign(r.player,center([31,7]));
  const breach={...center([31,7]),type:'breach'};
  assert.equal(r.interact(breach),false);r.security.mark('F13_R_CONTAIN');
  assert.equal(r.interact(breach),true);
 });
 console.log(`${count} interaction and patrol test groups passed.`);
}
if(require.main===module)tests();
module.exports={GameSlice,lineOfSight,tests};
