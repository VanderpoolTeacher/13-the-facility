(()=>{'use strict';
/* ============================================================
   13 — The Facility · single-file runtime
   Sections: core/audio · engine · floor 13 · floors 12–1 · scenes · main
   ============================================================ */
const W=40,H=30,T=32,VW=640,VH=480,STEP=1/60;
const TEST=typeof location!=='undefined'&&/test/.test(location.hash);
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const tc=(x,y)=>({x:(x+.5)*T,y:(y+.5)*T});
const key=(x,y)=>x+','+y;
const lerp=(a,b,t)=>a+(b-a)*t;
function rng(seed){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
const rand=rng((Date.now()&0xffff)|1);

/* ---------- Audio: fully synthesized, created on first gesture ---------- */
const Audio13=(()=>{
 let ac=null,master=null,muted=false,ambient=null;
 function ctx(){
  if(ac)return ac;
  try{ac=new (window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=muted?0:.5;master.connect(ac.destination)}catch(e){ac=null}
  return ac;
 }
 function resume(){const c=ctx();if(c&&c.state==='suspended')c.resume()}
 function setMuted(m){muted=m;if(master)master.gain.value=m?0:.5}
 function tone(f,dur,type='square',vol=.3,when=0,slide=0){
  const c=ctx();if(!c)return;const t=c.currentTime+when;
  const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f+slide),t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.02);
 }
 function noise(dur,vol=.2,when=0,lp=1200){
  const c=ctx();if(!c)return;const t=c.currentTime+when;
  const b=c.createBuffer(1,Math.ceil(c.sampleRate*dur),c.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const s=c.createBufferSource();s.buffer=b;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=lp;
  const g=c.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  s.connect(f);f.connect(g);g.connect(master);s.start(t);
 }
 const sfx={
  tap(when=0){tone(900,.06,'triangle',.25,when);noise(.03,.08,when,3000)},
  taps(when=0){/* three, pause, two — provisional motif; never decoded */
   const g=.22;[0,1,2].forEach(i=>sfx.tap(when+i*g));[0,1].forEach(i=>sfx.tap(when+3*g+.55+i*g));},
  step(stance){if(stance==='crouch')return;noise(.05,stance==='run'?.12:.06,0,stance==='run'?900:600)},
  robotStep(far){noise(.09,far?.05:.14,0,300);tone(70,.08,'sine',far?.08:.2)},
  door(){noise(.25,.18,0,500);tone(160,.25,'sawtooth',.08,0,-60)},
  doorDeny(){tone(220,.12,'square',.2);tone(180,.18,'square',.2,.13)},
  beep(){tone(1200,.07,'square',.15)},
  confirm(){tone(880,.08,'square',.15);tone(1320,.12,'square',.15,.09)},
  deny(){tone(200,.2,'square',.2);tone(150,.25,'square',.2,.18)},
  voice(){tone(520,.05,'sine',.12);tone(700,.07,'sine',.12,.06)},
  alarm(){for(let i=0;i<3;i++){tone(640,.18,'square',.18,i*.4);tone(480,.18,'square',.18,i*.4+.2)}},
  pulse(){/* electrical touch: a dry crackle, not a hum */noise(.08,.14,0,2500);tone(60,.1,'sine',.12);noise(.05,.1,.12,2500)},
  spark(){noise(.06,.2,0,4000);tone(2000,.05,'sawtooth',.06)},
  shock(){noise(.3,.3,0,3000);tone(90,.3,'sawtooth',.2)},
  capture(){tone(300,.3,'sawtooth',.25,0,-150);noise(.3,.15)},
  escape(){tone(500,.1,'square',.15);tone(750,.1,'square',.15,.1);tone(1000,.2,'square',.15,.2)},
  lift(){noise(.6,.12,0,250);tone(110,.7,'sine',.15);tone(165,.5,'sine',.08,.3)},
  gate(){noise(.8,.2,0,400);tone(80,.9,'sawtooth',.12)},
  memory(){[523,659,784,1046].forEach((f,i)=>tone(f,.35,'sine',.12,i*.12))},
  growl(){tone(110,.35,'sawtooth',.18,0,-40);noise(.3,.1,0,400)},
  lure(){[0,1,2,3].forEach(i=>tone(1500,.08,'square',.1,i*.25))},
  wind(){noise(2.5,.08,0,500)},
  chime(){[880,1108,1318].forEach((f,i)=>tone(f,.5,'sine',.1,i*.15))},
  low(){tone(55,1.2,'sine',.2)},
 };
 function ambientOn(kind){
  const c=ctx();if(!c)return;ambientOff();
  const o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
  o.type='sawtooth';o.frequency.value=kind==='return'?38:48;f.type='lowpass';f.frequency.value=kind==='return'?140:90;
  g.gain.value=kind==='return'?.05:.03;o.connect(f);f.connect(g);g.connect(master);o.start();ambient={o,g};
 }
 function ambientOff(){if(ambient){try{ambient.o.stop()}catch(e){}ambient=null}}
 return {ctx,resume,setMuted,sfx,ambientOn,ambientOff,get muted(){return muted}};
})();
const SFX=Audio13.sfx;
