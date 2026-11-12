// Deterministic security rules for 13. Run: node 13_security_rules.js
const assert=require('node:assert/strict');
const {makeMap,bfs,ROOMS}=require('./13_canonical_maps.js');
class SecuritySystem {
 constructor(floor,phase){
  this.map=makeMap(floor,phase);this.time=0;this.flags=new Set();
  this.doors=Object.fromEntries(Object.entries(this.map.doors).map(([k,v])=>[k,{...v,defaultState:'closed',timer:0}]));
  this.scanner={enabled:floor===12,spoofUntil:0,passed:false};
  this.restraint={enabled:floor===12,pausedUntil:0};
  this.circuit={disabledUntil:0};
 }
 tick(dt){
  if(!Number.isFinite(dt)||dt<0)throw Error('Invalid timestep');
  this.time+=dt;
  for(const d of Object.values(this.doors)){
   if(d.timer>0){d.timer=Math.max(0,d.timer-dt);if(d.timer<1e-8){d.timer=0;d.state=d.defaultState};}
  }
 }
 openDoor(name,{duration=0,requires=[]}={}){
  const d=this.doors[name];if(!d)throw Error(`Unknown door ${name}`);
  if(!requires.every(x=>this.flags.has(x)))return false;
  d.state='open';d.timer=duration;return true;
 }
 mark(flag){this.flags.add(flag)}
 spoofIdentity(duration=8){this.scanner.spoofUntil=this.time+duration}
 scan(){if(!this.scanner.enabled)return true;
  const ok=this.time<this.scanner.spoofUntil;
  if(ok){this.scanner.passed=true;this.mark('F12_E_CHECKPOINT');}
  return ok;
 }
 interruptRestraint(duration=8){this.restraint.pausedUntil=this.time+duration}
 restraintSafe(){return this.time<this.restraint.pausedUntil}
 disableCircuit(duration=8){this.circuit.disabledUntil=this.time+duration}
 circuitDisabled(){return this.time<this.circuit.disabledUntil}
 // Safe reset: never consume flags; timed actions can always be repeated.
 resetTemporary(){for(const d of Object.values(this.doors)){d.state=d.defaultState;d.timer=0}
  this.scanner.spoofUntil=0;this.restraint.pausedUntil=0;this.circuit.disabledUntil=0;}
}
function tests(){
 let n=0;const test=(label,fn)=>{fn();n++;console.log('PASS',label)};
 test('door prerequisite and timer',()=>{
  const s=new SecuritySystem(9,'escape');
  assert.equal(s.openDoor('WB',{requires:['AIRLOCK_A'],duration:6}),false);
  s.mark('AIRLOCK_A');assert.equal(s.openDoor('WB',{requires:['AIRLOCK_A'],duration:6}),true);
  s.tick(5.9);assert.equal(s.doors.WB.state,'open');s.tick(.1);assert.equal(s.doors.WB.state,'closed');
  assert.equal(s.openDoor('WB',{requires:['AIRLOCK_A'],duration:6}),true);
 });
 test('scanner spoof expiry and retry',()=>{
  const s=new SecuritySystem(12,'escape');
  assert.equal(s.scan(),false);s.spoofIdentity(8);s.tick(7.9);assert.equal(s.scan(),true);
  s.tick(.1);assert.equal(s.scan(),false);s.spoofIdentity();assert.equal(s.scan(),true);
 });
 test('restraint and circuit windows',()=>{
  const s=new SecuritySystem(12,'escape');
  s.interruptRestraint(8);assert.equal(s.restraintSafe(),true);s.tick(8);assert.equal(s.restraintSafe(),false);
  s.disableCircuit(8);assert.equal(s.circuitDisabled(),true);s.tick(8);assert.equal(s.circuitDisabled(),false);
 });
 test('temporary reset preserves permanent progress',()=>{
  const s=new SecuritySystem(12,'escape');s.mark('AUTHORIZED');s.openDoor('WA',{duration:5});
  s.resetTemporary();assert(s.flags.has('AUTHORIZED'));assert.equal(s.doors.WA.state,'closed');
 });
 test('all six door approaches geometrically reachable from corridor',()=>{
  for(let f=1;f<=13;f++)for(const phase of ['escape','return']){
   const m=makeMap(f,phase);
   for(const [name,r] of Object.entries(ROOMS)){
    const [x,y]=r.door,approach=name[0]==='W'?[x+1,y]:[x-1,y];
    assert(bfs(m,[20,15],approach,new Set()));
   }
  }
 });
 console.log(`${n} security test groups passed.`);
}
if(require.main===module)tests();
module.exports={SecuritySystem,tests};
