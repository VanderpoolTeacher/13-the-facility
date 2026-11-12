/* ============================================================
   MAIN · input, fixed-step loop, boot, test hooks
   ============================================================ */
const MOVE_KEYS=new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift','control','e',' ']);
window.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if(e.repeat&&k!=='e')return;
 Audio13.resume();
 if(modal==='dialog'||modal==='title'){dialogKey(e);return}
 if(modal==='scene'){Scenes.key(e);return}
 if(puzzle){puzzleKey(e);return}
 if(MOVE_KEYS.has(k)||k==='escape'||k==='j'||k==='r')e.preventDefault();
 if(modal==='capture'){if(k===' ')captureAttempt();return}
 if(k==='escape'){pauseMenu();return}
 if(k==='j'){journalDialog(null);return}
 if(!e.repeat){keys.add(k);if(k==='e'||k==='r')pressed.add(k)}
});
window.addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase())});
window.addEventListener('blur',()=>{keys.clear();pressed.clear();if(R)R.hold=null});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();pressed.clear()}});
$('#saveBtn').onclick=()=>{if(G&&R&&modal==='none'){saveGame()&&ui.say('Saved.')}else ui.say('Save from the pause menu or during play.')};
$('#menuBtn').onclick=()=>{if(modal==='none')pauseMenu();else if(modal==='title')titleScreen()};
canvas.addEventListener('click',()=>{Audio13.resume();$('#screen').focus({preventScroll:true})});

let last=0,acc=0,autoStep=!TEST,frames=0;
function simulate(dt){if(modal==='scene')Scenes.step(dt);else if(puzzle)stepPuzzle(dt);else step(dt)}
function frame(t){
 const dt=Math.min(.1,(t-last)/1000||0);last=t;
 if(autoStep&&G){acc+=dt;let n=0;while(acc>=STEP&&n<6){simulate(STEP);acc-=STEP;n++}if(n===6)acc=0}
 draw();if(G&&R&&frames++%6===0)ui.alertMeter();
 requestAnimationFrame(frame);
}
loadOpts();titleScreen();requestAnimationFrame(frame);

/* ---------- Test hooks: only when the page is opened with #test ---------- */
if(TEST){
 const api={
  get G(){return G},get R(){return R},get modal(){return modal},get puzzle(){return puzzle},get scene(){return Scenes.cur},get FLOOR(){return FLOOR},
  set auto(v){autoStep=v},get auto(){return autoStep},
  step(n=1){for(let i=0;i<n;i++)simulate(STEP)},
  seconds(s){api.step(Math.round(s/STEP))},
  key(k,down=true){k=k.toLowerCase();if(down){keys.add(k);if(k==='e'||k==='r')pressed.add(k)}else keys.delete(k)},
  press(k){api.key(k,true);api.step(1);api.key(k,false);api.step(1)},
  release(){keys.clear();pressed.clear()},
  click(label){const b=dialogButtons.find(b=>b.textContent.toLowerCase().startsWith(label.toLowerCase()));if(!b)return false;b.click();return true},
  buttons(){return dialogButtons.map(b=>b.textContent)},
  sceneNext(){Scenes.next()},sceneSkip(){Scenes.skip()},sceneFinish(){if(Scenes.cur)Scenes.finish()},
  grid(mask){if(!puzzle||puzzle.kind!=='grid')return null;puzzle.mask=mask;const r=puzzle.onSubmit(mask);if(r&&r.close)closePuzzle();return r},
  gridCancel(){if(puzzle){const f=puzzle.onCancel;closePuzzle();f&&f()}},
  keypad(d){if(!puzzle||puzzle.kind!=='keypad')return null;const r=puzzle.onSubmit(d);if(r&&r.close)closePuzzle();return r},
  seqSolve(){if(!puzzle||puzzle.kind!=='sequence')return false;const p=puzzle;while(p.phase==='show')api.step(10);for(const s of p.seq){puzzleKey({key:['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'][s],preventDefault(){}})}api.seconds(1);return true},
  seqFail(){if(!puzzle||puzzle.kind!=='sequence')return false;const p=puzzle;while(p.phase==='show')api.step(10);const wrong=(p.seq[0]+1)%4;puzzleKey({key:['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'][wrong],preventDefault(){}});return p.phase==='fail'},
  captureSpace(){captureAttempt()},
  tile(){return B.tileOf(R.player)},
  near(){return nearestInteractable()},prompt(){return promptFor(nearestInteractable())},
  path(tx,ty,avoid=false){const [sx,sy]=B.tileOf(R.player);return findPath(sx,sy,tx,ty,false,avoid)},
  // Physically walk the player along a BFS path by feeding movement keys into the real simulation.
  walkTo(tx,ty,opts={}){const stance=opts.stance||'walk';const maxFrames=opts.maxFrames||4000;
   const [sx,sy]=B.tileOf(R.player);let path=findPath(sx,sy,tx,ty,false,!opts.ignoreHazards);if(!path)return {ok:false,reason:'nopath',from:[sx,sy]};const resets=R.resets;
   path.push([tx,ty]);let frames=0;
   for(const [wx,wy] of path){const c=tc(wx,wy);let guard=0;
    while(dist(R.player,c)>3&&guard<600){
     if(modal!=='none')return {ok:false,reason:'modal:'+modal,at:B.tileOf(R.player)};if(R.resets!==resets){keys.clear();return {ok:false,reason:'reset',at:B.tileOf(R.player)}}
     keys.clear();if(stance==='run')keys.add('shift');if(stance==='crouch')keys.add('control');
     const dx=c.x-R.player.x,dy=c.y-R.player.y;if(Math.abs(dx)>1.5)keys.add(dx>0?'d':'a');if(Math.abs(dy)>1.5)keys.add(dy>0?'s':'w');
     simulate(STEP);frames++;guard++;if(frames>maxFrames){keys.clear();return {ok:false,reason:'timeout',at:B.tileOf(R.player)}}
    }
    if(guard>=600){keys.clear();return {ok:false,reason:'stuck',at:B.tileOf(R.player),want:[wx,wy]}}
   }
   keys.clear();simulate(STEP);return {ok:true,at:B.tileOf(R.player),frames};
  },
  use(){api.press('e')},
  holdE(sec){keys.add('e');pressed.add('e');api.step(1);api.seconds(sec);keys.delete('e');api.step(1)},
  fs(){return FS()},flag(n){return FS()[n]},
  save(){return saveGame()},reload(){const s=loadGame();if(!s)return false;G=s;modal='none';buildFloor();return true},
  reset(){resetToCheckpoint('test reset')},
  jump(floor,phase){G.floor=floor;G.phase=phase;G.stage='';modal='none';buildFloor();saveGame();return [G.floor,G.phase]},
  storage(){try{return localStorage.getItem(SAVE_KEY)}catch(e){return null}},
  clearStorage(){try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem(OLD_KEY)}catch(e){}},
  seedOld(){try{localStorage.setItem(OLD_KEY,'{"floor":5}')}catch(e){}},
  setOpt(k,v){OPT[k]=v;saveOpts()},
  canSee(i=0){return canSee(R.guards[i])},canHear(i=0){return canHear(R.guards[i])},
  guard(i=0){const g=R.guards[i];return g?{x:g.x,y:g.y,mode:g.mode,angle:g.angle,disabled:g.disabled,active:g.active,tile:B.tileOf(g)}:null},
  subject(i=0){const s=R.subjects[i];return s?{x:s.x,y:s.y,mode:s.mode,tile:B.tileOf(s)}:null},
  setGuard(i,o){Object.assign(R.guards[i],o)},setSubject(i,o){Object.assign(R.subjects[i],o)},
  setPlayer(tx,ty){const c=tc(tx,ty);R.player.x=c.x;R.player.y=c.y},
  timers(){return Object.assign({},R.timers)},
  announceLog:[],
 };
 const origAnnounce=ui.announce;ui.announce=t=>{api.announceLog.push(t);origAnnounce(t)};
 const origSay=ui.say;api.sayLog=[];ui.say=t=>{api.sayLog.push(t);origSay(t)};
 window.__13=api;
}
})();
