/* ============================================================
   UI · DOM panel, dialogs, puzzle overlays, scene framework, renderer
   ============================================================ */
const canvas=$('#game'),ctx=canvas.getContext('2d'),overlay=$('#overlay'),dialogEl=$('#dialog'),captionEl=$('#caption');
ctx.imageSmoothingEnabled=false;
let dialogButtons=[],dialogOnClose=null,prevModal='none';
const ui={
 say(t){$('#message').textContent=t;R&&(R.msgT=6)},
 announce(t){ui.say('AI: “'+t+'”');SFX.voice();if(OPT.captions)ui.caption('[AI announcement] '+t,3.2)},
 caption(t,sec=2.5){captionEl.textContent=t;captionEl.classList.remove('hidden');clearTimeout(ui._ct);ui._ct=setTimeout(()=>captionEl.classList.add('hidden'),sec*1000)},
 floorHeader(){$('#level').textContent='FLOOR '+G.floor+' · '+NAMES[G.floor];$('#phase').textContent=G.phase==='e'?'ASCENT · ESCAPE':'DESCENT · RETURN'},
 objectives(){
  if(!G||!R||!R.def){$('#objectives').innerHTML='';return}
  const fs=FS(),list=R.def.objectives;let cur=true;
  let html='';for(const o of list){const done=o.done(fs);const label=typeof o.label==='function'?o.label(fs):o.label;const cls=done?'done':cur?'cur':'todo';html+=`<div class="obj ${cls}">${done?'✓':cls==='cur'?'◆':'○'} ${label}</div>`;if(!done)cur=false}
  const ex=R.def.exitLabel||(G.floor===1&&G.phase==='e'?'Walk out through the exterior gate':G.phase==='e'?'Take the upper lift':'Take the lower lift');
  html+=`<div class="obj ${R.def.exitReady(fs)?'cur':'todo'}">${R.def.exitReady(fs)?'◆':'○'} ${ex}</div>`;
  $('#objectives').innerHTML=html;ui.journal();
 },
 journal(){$('#journal').innerHTML=G&&G.memories.length?[...G.memories].sort((a,b)=>b-a).map(f=>`<p><b>F${f}</b> · ${MEMORIES[f]}</p>`).join(''):'No fragments recovered.'},
 dialog(title,paras,buttons,o={}){
  prevModal=modal==='dialog'?prevModal:modal;modal='dialog';overlay.classList.remove('hidden');dialogEl.replaceChildren();dialogButtons=[];dialogOnClose=o.onClose||null;
  const h=document.createElement('h2');h.textContent=title;if(o.small)h.className='small';dialogEl.append(h);
  for(const p of paras){const el=document.createElement('p');if(typeof p==='object'){el.className=p.cls;el.textContent=p.text}else el.textContent=p;dialogEl.append(el)}
  if(o.custom)dialogEl.append(o.custom);
  const row=document.createElement('div');row.className='row';
  for(const [label,fn,primary] of buttons){const b=document.createElement('button');b.type='button';b.textContent=label;if(primary)b.className='primary';b.onclick=()=>{if(!o.stay)ui.closeDialog();fn&&fn()};row.append(b);dialogButtons.push(b)}
  dialogEl.append(row);keys.clear();setTimeout(()=>dialogButtons[0]&&dialogButtons[0].focus(),0);
 },
 closeDialog(){overlay.classList.add('hidden');modal=prevModal==='dialog'?'none':prevModal;prevModal='none';const f=dialogOnClose;dialogOnClose=null;if(f)f();$('#screen').focus({preventScroll:true})},
 alertMeter(){$('#alert').style.width=(R?R.alert:0)+'%';$('#alertState').textContent=R?R.alertState:'—';$('#stance').textContent=R?R.player.stance.toUpperCase():'—'},
};
/* keyboard navigation of dialog buttons */
function dialogKey(e){
 const k=e.key;if(!dialogButtons.length)return;
 const i=dialogButtons.indexOf(document.activeElement);
 if(k==='ArrowRight'||k==='ArrowDown'||k==='Tab'&&!e.shiftKey){e.preventDefault();dialogButtons[(i+1+dialogButtons.length)%dialogButtons.length].focus()}
 else if(k==='ArrowLeft'||k==='ArrowUp'||k==='Tab'&&e.shiftKey){e.preventDefault();dialogButtons[(i-1+dialogButtons.length)%dialogButtons.length].focus()}
 else if(k==='Enter'||k===' '){e.preventDefault();(i>=0?dialogButtons[i]:dialogButtons[0]).click()}
 else if(k==='Escape'&&dialogOnEscape){e.preventDefault();const f=dialogOnEscape;dialogOnEscape=null;f()}
}
let dialogOnEscape=null;

/* ---------- Menus ---------- */
function titleScreen(){
 modal='title';const saved=loadGame();const paras=['An amnesiac wakes thirteen floors underground. Someone nearby already knows who they are.',{cls:'fine',text:'Keyboard game · WASD/arrows, Shift, Ctrl, E, Space, J, Esc'}];
 if(storageNote)paras.push({cls:'warn',text:storageNote});
 const btns=[];
 if(saved)btns.push([saved.finished?'Resume (finished)':'Continue',()=>{G=saved;if(G.finished){if(G.ending==='leave')Scenes.play('escapeComplete');else Scenes.play('reunion')}else{startRuntime()}},true]);
 btns.push(['New game',()=>chooseProtagonist()]);btns.push(['Options',()=>optionsMenu(titleScreen)]);btns.push(['Controls',()=>controlsDialog(titleScreen)]);
 ui.dialog('13',paras,btns,{onClose:()=>{}});modal='title';prevModal='title';
}
function chooseProtagonist(){
 ui.dialog('SUBJECT 13',['Who wakes on the table?',{cls:'fine',text:'The injured captive is the opposite sex. The relationship is never named.'}],[['Female protagonist',()=>beginNew('female'),true],['Male protagonist',()=>beginNew('male')],['Back',()=>titleScreen()]]);prevModal='title';
}
function beginNew(gender){try{localStorage.removeItem(SAVE_KEY)}catch(e){}G=newGame(gender);modal='none';Audio13.resume();Scenes.play('awakening')}
function startRuntime(){modal='none';Audio13.resume();buildFloor();ui.say('Game restored. Transient security has been rebuilt from a safe state.')}
function optionsMenu(back){
 const wrap=document.createElement('div');
 const mk=(label,get,set)=>{const row=document.createElement('div');row.className='opt';const s=document.createElement('span');s.textContent=label;const b=document.createElement('button');b.type='button';b.textContent=get()?'On':'Off';b.onclick=()=>{set(!get());b.textContent=get()?'On':'Off';saveOpts()};row.append(s,b);wrap.append(row);return b};
 const b1=mk('Sound captions',()=>OPT.captions,v=>OPT.captions=v),b2=mk('Mute audio',()=>OPT.mute,v=>OPT.mute=v),b3=mk('Reduced motion',()=>OPT.reduced,v=>OPT.reduced=v);
 ui.dialog('OPTIONS',[],[['Back',back]],{custom:wrap,small:true});dialogButtons.unshift(b1,b2,b3);prevModal=back===titleScreen?'title':prevModal;
}
function controlsDialog(back){ui.dialog('CONTROLS',['WASD or arrows: move. Shift: run (loud). Ctrl: crouch (quiet, slow).','E: interact. Hold E to keep touching something. Space: one timed attempt to break a capture.','J: memory journal. Esc: pause. R: reset to the last checkpoint (objectives are kept).','In pattern locks: arrows move, E or Space toggles a contact, Enter submits, Esc cancels.'],[['Back',back]],{small:true});if(back===titleScreen)prevModal='title'}
function pauseMenu(){
 if(modal!=='none')return;
 ui.dialog('PAUSED',['The facility is still waiting.'],[['Resume',null,true],['Save',()=>{saveGame()&&ui.say('Saved.')}],['Journal',()=>journalDialog(pauseMenu)],['Options',()=>optionsMenu(pauseMenu)],['Controls',()=>controlsDialog(pauseMenu)],['New game',()=>ui.dialog('START OVER?',['This erases the current save.'],[['Erase and start over',()=>{try{localStorage.removeItem(SAVE_KEY)}catch(e){}G=null;R=null;titleScreen()}],['Cancel',pauseMenu]])]]);
 dialogOnEscape=()=>ui.closeDialog();
}
function journalDialog(back){
 const paras=G.memories.length?[...G.memories].sort((a,b)=>b-a).map(f=>'Floor '+f+': '+MEMORIES[f]):['No memories recovered. The journal does not gate anything; it only deepens what you see.'];
 ui.dialog('MEMORY JOURNAL',paras,[['Close',back===pauseMenu?pauseMenu:null]],{small:true});dialogOnEscape=()=>ui.closeDialog();
}

/* ---------- Puzzle overlays (canvas, keyboard) ---------- */
let puzzle=null;
function openGrid(o){ // o:{title,hint,size,onSubmit(mask),onCancel}
 puzzle={kind:'grid',size:o.size||4,cur:0,mask:0,title:o.title||'PATTERN LOCK',hint:o.hint||'',onSubmit:o.onSubmit,onCancel:o.onCancel,flash:0,msg:''};modal='grid';keys.clear();
}
function openKeypad(o){puzzle={kind:'keypad',digits:'',len:o.len||4,title:o.title||'KEYPAD',hint:o.hint||'',onSubmit:o.onSubmit,onCancel:o.onCancel,msg:''};modal='keypad';keys.clear()}
function openSequence(o){const seq=[];for(let i=0;i<(o.len||4);i++)seq.push(Math.floor(rand()*4));puzzle={kind:'sequence',seq,input:[],phase:'show',t:0,title:o.title||'COGNITIVE STATION',onDone:o.onDone,msg:''};modal='sequence';keys.clear()}
function closePuzzle(){puzzle=null;modal='none';keys.clear()}
function puzzleKey(e){
 const k=e.key.toLowerCase(),p=puzzle;if(!p)return;e.preventDefault();
 if(p.kind==='grid'){const n=p.size;
  if(k==='arrowright'||k==='d')p.cur=(p.cur%n===n-1)?p.cur-(n-1):p.cur+1;
  else if(k==='arrowleft'||k==='a')p.cur=(p.cur%n===0)?p.cur+(n-1):p.cur-1;
  else if(k==='arrowdown'||k==='s')p.cur=(p.cur+n)%(n*n);
  else if(k==='arrowup'||k==='w')p.cur=(p.cur-n+n*n)%(n*n);
  else if(k==='e'||k===' '){p.mask^=(1<<p.cur);SFX.beep()}
  else if(k==='enter'){if(!p.mask){p.msg='Select at least one contact.';return}const r=p.onSubmit(p.mask);if(r&&r.close)closePuzzle();else if(r&&r.msg){p.msg=r.msg;p.mask=0}}
  else if(k==='escape'){const f=p.onCancel;closePuzzle();f&&f()}
 }else if(p.kind==='keypad'){
  if(/^[0-9]$/.test(k)&&p.digits.length<p.len){p.digits+=k;SFX.beep()}
  else if(k==='backspace')p.digits=p.digits.slice(0,-1);
  else if(k==='enter'){if(p.digits.length<p.len){p.msg='Enter '+p.len+' digits.';return}const r=p.onSubmit(p.digits);if(r&&r.close)closePuzzle();else{p.msg=(r&&r.msg)||'Rejected.';p.digits=''}}
  else if(k==='escape'){const f=p.onCancel;closePuzzle();f&&f()}
 }else if(p.kind==='sequence'){
  if(k==='escape'){closePuzzle();return}
  if(p.phase!=='input')return;
  const map={arrowup:0,w:0,arrowright:1,d:1,arrowdown:2,s:2,arrowleft:3,a:3,'1':0,'2':1,'3':2,'4':3};
  if(map[k]===undefined)return;p.input.push(map[k]);SFX.beep();
  const i=p.input.length-1;
  if(p.input[i]!==p.seq[i]){p.msg='Sequence mismatch. A fresh sequence is generated.';p.phase='fail';p.t=0;SFX.deny();return}
  if(p.input.length===p.seq.length){p.phase='ok';p.t=0;SFX.confirm()}
 }
}
function stepPuzzle(dt){const p=puzzle;if(!p||p.kind!=='sequence')return;p.t+=dt;
 if(p.phase==='show'&&p.t>p.seq.length*.8+1){p.phase='input';p.t=0}
 else if(p.phase==='fail'&&p.t>1.4){p.seq=p.seq.map(()=>Math.floor(rand()*4));p.input=[];p.phase='show';p.t=0;p.msg=''}
 else if(p.phase==='ok'&&p.t>.8){const f=p.onDone;closePuzzle();f(true)}
}

/* ---------- Scenes ---------- */
const Scenes={defs:{},cur:null,
 play(id,done){const d=Scenes.defs[id];if(!d)return;Scenes.cur={id,def:d,i:0,t:0,done,total:0};modal='scene';keys.clear();captionEl.classList.add('hidden');Scenes.enter()},
 enter(){const s=Scenes.cur,st=s.def.steps[s.i];s.t=0;if(st.sfx)try{st.sfx()}catch(e){}if(st.cap&&OPT.captions)ui.caption(st.cap,st.dur||3);if(st.on)st.on()},
 step(dt){const s=Scenes.cur;if(!s)return;s.t+=dt;s.total+=dt;const st=s.def.steps[s.i];if(st.dur&&s.t>=st.dur&&!st.hold)Scenes.next()},
 next(){const s=Scenes.cur;if(!s)return;s.i++;if(s.i>=s.def.steps.length){Scenes.finish()}else Scenes.enter()},
 skip(){const s=Scenes.cur;if(!s||s.def.noSkip)return;Scenes.finish()},
 finish(){const s=Scenes.cur;Scenes.cur=null;modal='none';captionEl.classList.add('hidden');keys.clear();if(s.def.end)s.def.end();if(s.done)s.done()},
 key(e){const k=e.key.toLowerCase();const s=Scenes.cur;if(!s)return;const st=s.def.steps[s.i];
  if(k==='escape'){e.preventDefault();if(st.choice)return;Scenes.skip()}
  else if(k==='enter'||k===' '||k==='e'){e.preventDefault();if(st.choice)return;if(s.t>.25)Scenes.next()}}
};

/* ---------- Rendering ---------- */
const PAL={13:['#2a3540','#3b4a58','#2d3a44','#334350','#c8553d'],12:['#2b3748','#3e4c62','#2f3b4b','#374555','#d8a24a'],11:['#2f3d3f','#43575a','#324446','#3a4e50','#7fd0c6'],10:['#30334a','#454a68','#33374f','#3b405a','#9b7fd6'],9:['#3a3030','#524343','#3f3535','#473c3c','#d4594f'],8:['#3c3a2c','#55523f','#403d30','#484536','#e3b14b'],7:['#2d3440','#3f4a5a','#303946','#384250','#5b8fd6'],6:['#3a3528','#524b3b','#3f3a2d','#474234','#c9a66b'],5:['#2c3a3c','#405557','#304042','#374a4c','#62c4b2'],4:['#38332c','#4f4a40','#3c3730','#433e36','#d87a4a'],3:['#333a2d','#4a533f','#383f32','#3f473a','#b7c94b'],2:['#3a3444','#524a5e','#3e3848','#463f52','#c78bd0'],1:['#2f3a44','#44525e','#333f4a','#3b4752','#9ad2f0']};
function makeStatic(){
 const c=document.createElement('canvas');c.width=W*T;c.height=H*T;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const pal=PAL[G.floor],ret=G.phase==='r';const dark=ret?.78:1;
 const sh=(hex,m)=>{const n=parseInt(hex.slice(1),16);const r=((n>>16)&255)*m|0,gg=((n>>8)&255)*m|0,b=(n&255)*m|0;return `rgb(${r},${gg},${b})`};
 const rs=rng(G.floor*31+(ret?7:1));
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const k=R.kind[y][x],wall=R.grid[y][x]===1;const px=x*T,py=y*T;
  if(wall){g.fillStyle=sh(pal[0],dark);g.fillRect(px,py,T,T);
   const below=y+1<H&&!R.grid[y+1][x];
   g.fillStyle=sh(pal[1],dark);g.fillRect(px,py,T,below?22:T);
   g.fillStyle=sh(pal[0],dark*.9);for(let i=0;i<3;i++){g.fillRect(px+(i%2?0:16),py+i*7+2,14,1);g.fillRect(px+(i%2?16:0),py+i*7+2,14,1)}
   if(below){g.fillStyle=sh(pal[0],dark*.7);g.fillRect(px,py+22,T,10)}
   if(ret&&rs()<.12){g.fillStyle='#1a1a1a';g.fillRect(px+6,py+4,2,10);g.fillRect(px+8,py+13,6,2)}
  }else{
   let base=k==='c'||k==='d'?pal[2]:k==='r'||k==='f'?pal[3]:k==='lift'?'#4d5a66':k==='stairs'?'#56606a':k==='grass'?'#4d6b3b':k==='concrete'?'#6a6f72':k==='lane'?pal[2]:k==='cell'?'#2f3339':k==='alcove'?sh(pal[2],.7):k==='glass'?'#6d8fa0':pal[3];
   g.fillStyle=sh(base,dark);g.fillRect(px,py,T,T);
   g.fillStyle='rgba(0,0,0,.12)';g.fillRect(px,py,T,1);g.fillRect(px,py,1,T);
   if(k==='c'){g.fillStyle='rgba(255,255,255,.04)';g.fillRect(px+2,py+15,28,2)}
   if(k==='grass'){g.fillStyle='#5d7f45';for(let i=0;i<5;i++)g.fillRect(px+(rs()*28|0),py+(rs()*28|0),2,3)}
   if(k==='lane'){g.fillStyle='#d8b74a';g.fillRect(px+2,py+2,4,28);g.fillRect(px+26,py+2,4,28)}
   if(k==='mark'){g.strokeStyle='#e7c45c';g.lineWidth=2;g.strokeRect(px+3,py+3,26,26)}
   if(k==='lift'){g.fillStyle='#9fb2c0';g.fillRect(px+4,py+2,10,28);g.fillRect(px+18,py+2,10,28);g.fillStyle='#1a222a';g.fillRect(px+14,py+2,4,28)}
   if(k==='stairs'){g.fillStyle='#8a949c';for(let i=0;i<4;i++)g.fillRect(px+2,py+3+i*8,28,3)}
   if(k==='cell'){g.fillStyle='rgba(255,255,255,.05)';g.fillRect(px+4,py+4,24,24)}
   if(ret&&rs()<.08){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(px+rs()*20,py+rs()*20,10,6)}
  }
 }
 for(const p of R.paint){const px=p.x*T,py=p.y*T;
  if(p.k==='stripe'){g.fillStyle='#d8b74a';g.fillRect(px+2,py+2,4,28);g.fillRect(px+26,py+2,4,28)}
  else if(p.k==='mark'){g.strokeStyle='#e7c45c';g.lineWidth=2;g.strokeRect(px+3,py+3,26,26)}
  else if(p.k==='blood'){g.fillStyle='#5a1f1f';g.fillRect(px+8,py+10,14,8);g.fillRect(px+4,py+16,6,4)}
  else if(p.k==='debris'){g.fillStyle='#5b5146';g.fillRect(px+3,py+20,12,6);g.fillRect(px+18,py+8,8,5)}
  else if(p.k==='arrow'){g.fillStyle='#e7c45c';g.fillRect(px+6,py+14,16,4);g.fillRect(px+18,py+10,4,12)}
  else if(p.k==='drain'){g.fillStyle='#22282d';g.fillRect(px+10,py+10,12,12)}
 }
 g.font='bold 10px monospace';g.textAlign='center';
 for(const l of R.labels){g.fillStyle=l.color||'#e4d7a8';g.fillText(l.text,l.x*T+T/2,l.y*T+T/2+4)}
 return c;
}
function sprPlayer(g,p){
 const bob=p.moving?Math.sin(p.anim)*2:0,crouch=p.stance==='crouch';
 const skin='#e2b89a',cloth='#8e969c',hair=G.gender==='female'?'#5a3b2a':'#2b2b2b';
 g.save();g.translate(Math.round(p.x),Math.round(p.y));
 g.fillStyle='rgba(0,0,0,.35)';g.fillRect(-7,8,14,4);
 const h=crouch?-4:-12;
 g.fillStyle=cloth;g.fillRect(-6,h+8,12,crouch?8:12);
 g.fillStyle='#4d5358';g.fillRect(-5,h+(crouch?16:20),4,crouch?3:6+bob/2);g.fillRect(1,h+(crouch?16:20),4,crouch?3:6-bob/2);
 g.fillStyle=skin;g.fillRect(-5,h,10,9);g.fillStyle=hair;g.fillRect(-5,h-1,10,4);if(G.gender==='female')g.fillRect(-6,h,2,9);
 g.fillStyle='#c8553d';g.fillRect(-2,h+10,4,2);
 const fx=Math.cos(p.facing),fy=Math.sin(p.facing);g.fillStyle='#1c1c1c';g.fillRect(-5+fx*3+2,h+3+fy*2,2,2);g.fillRect(-1+fx*3+2,h+3+fy*2,2,2);
 g.restore();
}
function sprRobot(g,r,t){
 g.save();g.translate(Math.round(r.x),Math.round(r.y));
 const off=r.disabled>0;const walk=Math.sin(t*9)*2;
 g.fillStyle='rgba(0,0,0,.35)';g.fillRect(-9,10,18,4);
 g.fillStyle=off?'#555c60':'#8d99a3';g.fillRect(-8,-6,16,16);
 g.fillStyle='#5f6b74';g.fillRect(-7,10,5,6+walk);g.fillRect(2,10,5,6-walk);
 g.fillStyle=off?'#60686d':'#b3bec6';g.fillRect(-6,-16,12,10);
 g.fillStyle=off?'#3a2a2a':r.mode==='pursue'?'#ff5544':r.mode==='investigate'?'#f0c04a':'#e04848';g.fillRect(-4,-13,8,3);
 g.fillStyle='#2b3238';g.fillRect(-11,-4,3,10);g.fillRect(8,-4,3,10);
 if(r.kind==='drone'){g.fillStyle='#6c7f8c';g.fillRect(-12,-18,24,3);g.fillRect(-12,-21+Math.sin(t*40)*2,24,2)}
 g.restore();
}
function sprSubject(g,s,t){
 g.save();g.translate(Math.round(s.x),Math.round(s.y));
 const tw=Math.sin(t*13)*1.5;g.fillStyle='rgba(0,0,0,.35)';g.fillRect(-8,8,16,4);
 g.fillStyle='#6f8f6a';g.fillRect(-7+tw,-6,14,14);g.fillStyle='#86a37d';g.fillRect(-5,-15,10,9);
 g.fillStyle='#d8e0a0';g.fillRect(-3,-12,2,2);g.fillRect(2,-12,2,2);
 g.fillStyle='#4e6a4a';g.fillRect(-6,8,4,7);g.fillRect(2,8,4,7);g.fillRect(-11,-4+tw,4,9);g.fillRect(7,-4-tw,4,9);
 g.restore();
}
function sprCaptive(g,x,y,t){
 g.save();g.translate(x,y);g.fillStyle='#8e969c';g.fillRect(-12,-4,24,9);g.fillStyle='#e2b89a';g.fillRect(-16,-5,8,8);g.fillStyle=G.gender==='female'?'#2b2b2b':'#5a3b2a';g.fillRect(-17,-6,9,4);
 g.fillStyle='#8a2f2f';g.fillRect(2,-2,8,4);g.fillStyle='#c8553d';g.fillRect(-4,-3,3,2);
 if(Math.sin(t*1.2)>.9){g.fillStyle='#fff';g.fillRect(-13,-3,2,2)}g.restore();
}
function drawProp(g,p,t){
 const px=p.x*T,py=p.y*T,w=p.w*T,h=p.h*T;
 switch(p.kind){
  case 'table':g.fillStyle='#7d8b94';g.fillRect(px+3,py+6,w-6,h-10);g.fillStyle='#b8c4cc';g.fillRect(px+5,py+8,w-10,h-16);break;
  case 'bed':g.fillStyle='#4e5a63';g.fillRect(px+2,py+4,w-4,h-6);g.fillStyle='#8f9ba3';g.fillRect(px+4,py+6,10,h-10);g.fillStyle='#2b3238';g.fillRect(px+2,py+h-4,w-4,3);break;
  case 'sink':g.fillStyle='#aab5bc';g.fillRect(px+8,py+8,16,14);g.fillStyle='#39434a';g.fillRect(px+13,py+12,6,6);break;
  case 'crate':g.fillStyle='#8a6d47';g.fillRect(px+2,py+2,w-4,h-4);g.fillStyle='#5f4a2f';g.fillRect(px+2,py+h/2-1,w-4,2);g.fillRect(px+w/2-1,py+2,2,h-4);break;
  case 'shelf':g.fillStyle='#6a5b49';g.fillRect(px+1,py+1,w-2,h-2);g.fillStyle='#8c7a63';for(let i=0;i<p.w*2;i++)g.fillRect(px+4+i*16,py+4,10,h-8);break;
  case 'arm':{g.fillStyle='#8b94a0';g.fillRect(px+w/2-4,py+h/2-4,8,8);const a=p.angle||0;g.strokeStyle='#c9d2da';g.lineWidth=5;g.beginPath();g.moveTo(px+w/2,py+h/2);g.lineTo(px+w/2+Math.cos(a)*(p.len||40),py+h/2+Math.sin(a)*(p.len||40));g.stroke();g.fillStyle='#e05050';g.fillRect(px+w/2+Math.cos(a)*(p.len||40)-3,py+h/2+Math.sin(a)*(p.len||40)-3,6,6);break}
  case 'generator':g.fillStyle='#5b6670';g.fillRect(px+2,py+2,w-4,h-4);g.fillStyle=p.on?'#7fe0a0':'#3a3f44';g.fillRect(px+6,py+6,8,6);g.fillStyle='#2b3238';g.fillRect(px+w-14,py+6,8,h-12);break;
  case 'forklift':g.fillStyle='#d8a24a';g.fillRect(px+4,py+6,w-8,h-10);g.fillStyle='#2b3238';g.fillRect(px+2,py+h-8,8,6);g.fillRect(px+w-10,py+h-8,8,6);g.fillStyle='#7d8b94';g.fillRect(px+w-6,py+2,4,h-4);break;
  case 'rubble':g.fillStyle='#5b5146';g.fillRect(px+2,py+10,w-4,h-12);g.fillStyle='#766a5c';g.fillRect(px+6,py+4,12,10);g.fillRect(px+w-16,py+12,10,8);break;
  case 'camera':g.fillStyle='#2b3238';g.fillRect(px+10,py+4,12,10);g.fillStyle=p.off?'#333':'#e04848';g.fillRect(px+14,py+7,4,4);break;
  case 'pipe':g.fillStyle='#6a7278';g.fillRect(px+13,py,6,h);g.fillStyle='#8c959b';g.fillRect(px+11,py+8,10,4);break;
  case 'vehicle':g.fillStyle='#4a5560';g.fillRect(px+2,py+6,w-4,h-10);g.fillStyle='#2b3238';g.fillRect(px+6,py+h-6,10,5);g.fillRect(px+w-16,py+h-6,10,5);g.fillStyle='#6c8ea8';g.fillRect(px+6,py+8,w-12,8);break;
  case 'bot':g.fillStyle='#d8a24a';g.fillRect(px+6,py+8,20,16);g.fillStyle='#2b3238';g.fillRect(px+4,py+22,8,6);g.fillRect(px+20,py+22,8,6);g.fillStyle=p.on?'#7fe0a0':'#3a3f44';g.fillRect(px+13,py+11,6,4);break;
  case 'glassWall':g.fillStyle='rgba(140,190,210,.45)';g.fillRect(px+10,py,12,h);g.fillStyle='rgba(255,255,255,.5)';g.fillRect(px+12,py+4,2,h-8);break;
  case 'decoy':g.fillStyle='#c9d2da';g.fillRect(px+10,py+6,12,20);g.fillStyle='#e04848';g.fillRect(px+13,py+9,6,3);break;
  default:g.fillStyle='#6a7278';g.fillRect(px+4,py+4,w-8,h-8);
 }
}
function drawItem(g,it,t,active){
 const px=it.x*T,py=it.y*T,w=it.w*T,h=it.h*T;
 const k=it.kind;
 if(k==='console'||k==='terminal'){g.fillStyle='#3d4a55';g.fillRect(px+4,py+6,w-8,h-10);g.fillStyle=it.lit?it.lit(B):'#7fd0c6';g.fillRect(px+8,py+9,w-16,8);g.fillStyle='#1d2429';g.fillRect(px+8,py+19,w-16,4)}
 else if(k==='panel'){g.fillStyle='#55606a';g.fillRect(px+8,py+6,16,20);g.fillStyle=it.lit?it.lit(B):'#e7c45c';g.fillRect(px+12,py+10,8,4);g.fillStyle='#2b3238';g.fillRect(px+12,py+17,8,6)}
 else if(k==='lever'){g.fillStyle='#55606a';g.fillRect(px+10,py+8,12,16);g.fillStyle='#e04848';g.fillRect(px+14,py+4,4,10)}
 else if(k==='memory'){const b=Math.sin(t*4)*2;g.fillStyle='#b8a6e5';g.fillRect(px+11,py+11+b,10,10);g.fillStyle='#fff';g.fillRect(px+14,py+14+b,4,4)}
 else if(k==='window'){g.fillStyle='rgba(140,190,210,.5)';g.fillRect(px+4,py+8,w-8,16);g.fillStyle='rgba(255,255,255,.6)';g.fillRect(px+6,py+10,3,12)}
 else if(k==='camera'){g.fillStyle='#2b3238';g.fillRect(px+10,py+4,12,10);g.fillStyle=it.off&&it.off(B)?'#333':'#e04848';g.fillRect(px+14,py+7,4,4);g.fillStyle='#55606a';g.fillRect(px+15,py+14,2,8)}
 else if(k==='door'){g.fillStyle='#55606a';g.fillRect(px+4,py+2,w-8,h-4)}
 else if(k==='token'){g.fillStyle='#d8b74a';g.fillRect(px+12,py+12,8,8)}
 else if(k==='threshold'){g.fillStyle='rgba(255,240,200,.25)';g.fillRect(px,py,w,h)}
 else if(k==='breach'){g.fillStyle='#4a3b36';g.fillRect(px+2,py+2,w-4,h-4);g.fillStyle='#1a1414';g.fillRect(px+8,py+6,6,20);g.fillRect(px+16,py+10,8,14)}
 else if(k==='captive'){sprCaptive(g,px+16,py+16,t)}
 else if(k==='spot'){g.strokeStyle='rgba(231,196,92,.5)';g.strokeRect(px+4,py+4,w-8,h-8)}
 else{g.fillStyle='#6a7278';g.fillRect(px+6,py+6,w-12,h-12)}
 if(active){g.strokeStyle='rgba(255,240,180,'+(0.6+0.4*Math.sin(t*8))+')';g.lineWidth=2;g.strokeRect(px+1,py+1,w-2,h-2)}
}
function drawDoor(g,d,t){
 const px=d.x*T,py=d.y*T;const vert=R.grid[d.y]&&(R.grid[d.y][d.x-1]===1||d.x===0)&&(R.grid[d.y][d.x+1]===1);
 const lock=typeof d.locked==='function'?d.locked(B,d):d.locked;
 if(d.kind==='glass'){g.fillStyle='rgba(140,190,210,.45)';if(vert)g.fillRect(px+11,py,10,T);else g.fillRect(px,py+11,T,10);g.fillStyle='rgba(255,255,255,.5)';if(vert)g.fillRect(px+13,py+3,2,T-6);else g.fillRect(px+3,py+13,T-6,2);return}
 if(d.open){g.fillStyle=d.kind==='cell'?'#3a4248':'#4d9c86';if(vert){g.fillRect(px+12,py,8,6);g.fillRect(px+12,py+T-6,8,6)}else{g.fillRect(px,py+12,6,8);g.fillRect(px+T-6,py+12,6,8)}}
 else{g.fillStyle=d.kind==='cell'?'#5a636b':d.kind==='gate'?'#8b7355':lock?'#b8604a':'#4d9c86';if(vert)g.fillRect(px+10,py,12,T);else g.fillRect(px,py+10,T,12);
  g.fillStyle='#1d2429';if(vert)g.fillRect(px+14,py+12,4,8);else g.fillRect(px+12,py+14,8,4);
  if(d.kind==='cell'){g.fillStyle=d.statusLit?d.statusLit(B,d):'#e04848';g.fillRect(vert?px+24:px+2,vert?py+4:py+2,4,4)}}
}
function draw(){
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0b141c';ctx.fillRect(0,0,VW,VH);
 if(modal==='title'||!G){drawTitle();return}
 if(modal==='scene'&&Scenes.cur){drawScene();return}
 if(!R)return;
 const p=R.player,t=R.t;
 if(R.dirty||!R.static){R.static=makeStatic();R.dirty=false}
 let camX=clamp(p.x-VW/2,0,W*T-VW),camY=clamp(p.y-VH/2,0,H*T-VH);
 if(R.shake>0&&!OPT.reduced){camX+=(rand()-.5)*6;camY+=(rand()-.5)*6}
 ctx.save();ctx.translate(-Math.round(camX),-Math.round(camY));
 ctx.drawImage(R.static,0,0);
 // hide zones
 for(const k of R.hides){const [x,y]=k.split(',').map(Number);ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x*T,y*T,T,T)}
 // hazards
 for(const h of R.hazards){for(const [x,y] of h.tiles){const on=h.activeTile?h.activeTile(B,x,y):h.active(B);const px=x*T,py=y*T;
  if(h.kind==='electric'){ctx.fillStyle=on?'rgba(255,230,80,.18)':'rgba(255,230,80,.04)';ctx.fillRect(px,py,T,T);if(on&&!OPT.reduced&&rand()<.15){ctx.fillStyle='#fff6a0';ctx.fillRect(px+rand()*28,py+rand()*28,3,3)}else if(on){ctx.fillStyle='#fff6a0';ctx.fillRect(px+14,py+14,3,3)}}
  else if(h.kind==='gas'){ctx.fillStyle=on?'rgba(120,220,120,.3)':'rgba(120,220,120,.05)';ctx.fillRect(px,py,T,T);if(on){ctx.fillStyle='rgba(180,255,180,.5)';ctx.fillRect(px+8+Math.sin(t*2+x)*4,py+8,6,6)}}
  else if(h.kind==='uv'){ctx.fillStyle=on?'rgba(170,120,255,.33)':'rgba(170,120,255,.05)';ctx.fillRect(px,py,T,T)}
  else if(h.kind==='sweep'){ctx.fillStyle=on?'rgba(255,120,80,.25)':'rgba(255,120,80,.05)';ctx.fillRect(px,py,T,T)}
  else if(h.kind==='push'){ctx.fillStyle=on?'rgba(230,200,80,.22)':'rgba(230,200,80,.08)';ctx.fillRect(px,py,T,T);ctx.fillStyle='#e7c45c';const o=on?(t*40)%T:8;ctx.fillRect(px+o,py+14,8,4)}
 }}
 for(const d of R.doors)drawDoor(ctx,d,t);
 for(const pr of R.props)if(!pr.hidden)drawProp(ctx,pr,t);
 const act=R.prompt;
 for(const it of R.items)if(it.visible())drawItem(ctx,it,t,act&&act.type==='item'&&act.o===it&&modal==='none');
 // vision cones
 for(const g of R.guards){if(!g.active||g.disabled>0)continue;ctx.beginPath();ctx.moveTo(g.x,g.y);ctx.arc(g.x,g.y,g.vision,g.angle-g.fov/2,g.angle+g.fov/2);ctx.closePath();ctx.fillStyle=g.mode==='pursue'?'rgba(230,70,70,.22)':g.mode==='investigate'?'rgba(240,190,70,.16)':'rgba(230,200,120,.09)';ctx.fill()}
 for(const g of R.guards)if(g.active)sprRobot(ctx,g,t);
 for(const s of R.subjects)if(s.active)sprSubject(ctx,s,t);
 sprPlayer(ctx,p);
 for(const f of R.fx){const a=1-f.t/f.dur;if(f.kind==='pulse'){ctx.strokeStyle=`rgba(255,240,170,${a})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y,6+f.t*60,0,Math.PI*2);ctx.stroke()}else if(f.kind==='text'){ctx.fillStyle=`rgba(255,255,255,${a})`;ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.fillText(f.text,f.x,f.y-f.t*20);ctx.textAlign='left'}else if(f.kind==='ring'){ctx.strokeStyle=`rgba(255,80,80,${a})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(f.x,f.y,10+f.t*80,0,Math.PI*2);ctx.stroke()}
  else if(f.kind==='grid'){ctx.fillStyle=`rgba(10,20,28,${Math.min(.9,a*2)})`;ctx.fillRect(f.x-40,f.y-60,80,80);for(let i=0;i<16;i++){const on=f.mask&(1<<i);ctx.fillStyle=on?`rgba(231,196,92,${Math.min(1,a*2)})`:`rgba(60,80,95,${Math.min(1,a*2)})`;ctx.fillRect(f.x-34+(i%4)*17,f.y-54+Math.floor(i/4)*17,13,13)}}}
 // active timed windows
 let ty=52;for(const k in R.timers){if(R.timers[k]>0){ctx.fillStyle='rgba(4,12,18,.75)';ctx.fillRect(camX+8,camY+ty,150,16);ctx.fillStyle='#e7c45c';ctx.fillRect(camX+10,camY+ty+2,146*Math.min(1,R.timers[k]/(R.timerMax&&R.timerMax[k]||R.timers[k])),12);ctx.fillStyle='#000';ctx.font='bold 10px monospace';ctx.fillText(k.toUpperCase(),camX+14,camY+ty+12);ty+=20}}
 if(R.lightsUp>0){ctx.fillStyle=`rgba(255,250,220,${Math.min(.25,R.lightsUp*.25)})`;ctx.fillRect(camX,camY,VW,VH)}
 if(G.phase==='r'&&!OPT.reduced&&Math.sin(t*7)>.97){ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(camX,camY,VW,VH)}
 ctx.restore();
 // HUD
 ctx.fillStyle='rgba(4,12,18,.8)';ctx.fillRect(0,0,VW,26);ctx.fillStyle='#e7f2f2';ctx.font='13px monospace';ctx.textAlign='left';
 const task=currentTask();ctx.fillText(`F${G.floor} ${G.phase==='e'?'ASCENT':'RETURN'} · ${NAMES[G.floor]}`,8,17);
 ctx.fillStyle='#f0d79a';ctx.textAlign='right';ctx.fillText(task.slice(0,52),VW-8,17);ctx.textAlign='left';
 const pr=promptFor(act);if(pr&&modal==='none'){ctx.fillStyle='rgba(4,12,18,.8)';ctx.fillRect(0,VH-26,VW,26);ctx.fillStyle='#fff';ctx.fillText(pr,8,VH-9)}
 if(R.alertState!=='HIDDEN'){ctx.fillStyle=R.alertState==='SEEN'?'#ff6b5b':'#f0c04a';ctx.fillRect(VW-110,30,102,18);ctx.fillStyle='#000';ctx.font='bold 11px monospace';ctx.fillText(R.alertState==='SEEN'?'! SEEN':'? SUSPICIOUS',VW-104,43)}
 if(R.hold){const it=R.hold;ctx.fillStyle='#000a';ctx.fillRect(220,VH-60,200,14);ctx.fillStyle='#ffe9a8';ctx.fillRect(222,VH-58,196*Math.min(1,R.holdT/(it.holdTime||1.5)),10)}
 if(modal==='capture')drawCapture();
 if(puzzle)drawPuzzle();
 if(R.flash>0){ctx.fillStyle=`rgba(0,0,0,${Math.min(1,R.flash)})`;ctx.fillRect(0,0,VW,VH)}
}
function currentTask(){if(!R||!R.def)return '';const fs=FS();for(const o of R.def.objectives)if(!o.done(fs))return typeof o.label==='function'?o.label(fs):o.label;return R.def.exitLabel||(G.phase==='e'?'Reach the upper lift':'Reach the lower lift')}
function drawCapture(){
 const c=R.capture;ctx.fillStyle='rgba(25,11,11,.86)';ctx.fillRect(0,0,VW,VH);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 24px monospace';ctx.fillText(c.title,320,170);
 ctx.font='15px monospace';ctx.fillText(c.attempted?(c.result==='ok'?'You break free.':'Held. Returning to checkpoint.'):'ONE ATTEMPT · press SPACE when the marker is in the center',320,205);
 ctx.fillStyle='#687a7d';ctx.fillRect(170,250,300,16);ctx.fillStyle='#79d8b0';ctx.fillRect(320-27,250,54,16);
 const m=170+markerPos(c.t)*300;ctx.fillStyle=c.result==='fail'?'#ff6b5b':'#fff';ctx.fillRect(m-3,244,6,28);
 ctx.fillStyle='#ddd';ctx.fillText(Math.max(0,c.limit-c.t).toFixed(1)+' s',320,300);ctx.textAlign='left';
}
function drawPuzzle(){
 const p=puzzle;ctx.fillStyle='rgba(4,10,16,.9)';ctx.fillRect(0,0,VW,VH);ctx.textAlign='center';ctx.fillStyle='#eef5f7';ctx.font='bold 20px monospace';ctx.fillText(p.title,320,60);ctx.font='13px monospace';ctx.fillStyle='#9ab4c0';
 if(p.kind==='grid'){ctx.fillText(p.hint,320,86);const n=p.size,cs=56,ox=320-n*cs/2,oy=120;
  for(let i=0;i<n*n;i++){const x=ox+(i%n)*cs,y=oy+Math.floor(i/n)*cs;const on=p.mask&(1<<i);ctx.fillStyle=on?'#e7c45c':'#243540';ctx.fillRect(x+4,y+4,cs-8,cs-8);if(i===p.cur){ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.strokeRect(x+2,y+2,cs-4,cs-4)}}
  ctx.fillStyle='#9ab4c0';ctx.fillText('Arrows move · E/Space toggles a contact · Enter submits · Esc steps back',320,oy+n*cs+30);
  if(p.msg){ctx.fillStyle='#ff9c8a';ctx.fillText(p.msg,320,oy+n*cs+52)}
 }else if(p.kind==='keypad'){ctx.fillText(p.hint,320,86);ctx.font='bold 36px monospace';ctx.fillStyle='#e7c45c';ctx.fillText((p.digits+'____').slice(0,p.len).split('').join(' '),320,170);ctx.font='13px monospace';ctx.fillStyle='#9ab4c0';ctx.fillText('Type digits · Backspace · Enter submits · Esc steps back',320,220);if(p.msg){ctx.fillStyle='#ff9c8a';ctx.fillText(p.msg,320,250)}}
 else{const names=['▲','▶','▼','◀'];ctx.fillText(p.phase==='show'?'Watch the sequence.':p.phase==='input'?'Repeat it with arrows or 1–4.':p.phase==='ok'?'Sequence accepted. Synchronization window open.':p.msg,320,90);
  for(let i=0;i<4;i++){const x=200+i*80,y=160;let lit=false;if(p.phase==='show'){const idx=Math.floor((p.t-.5)/.8);lit=idx>=0&&idx<p.seq.length&&p.seq[idx]===i&&((p.t-.5)%.8)<.5}ctx.fillStyle=lit?'#e7c45c':'#243540';ctx.fillRect(x,y,60,60);ctx.fillStyle='#fff';ctx.font='bold 26px monospace';ctx.fillText(names[i],x+30,y+40)}
  ctx.font='13px monospace';ctx.fillStyle='#9ab4c0';ctx.fillText('Entered: '+p.input.map(i=>names[i]).join(' ')+'   ('+p.seq.length+' steps) · Esc cancels',320,260)}
 ctx.textAlign='left';
}
function drawTitle(){
 const t=performance.now()/1000;ctx.fillStyle='#070d13';ctx.fillRect(0,0,VW,VH);
 for(let i=0;i<13;i++){ctx.fillStyle=`rgba(80,110,130,${.08+.04*Math.sin(t+i)})`;ctx.fillRect(60,40+i*30,520,22)}
 ctx.fillStyle='#eef5f7';ctx.font='bold 80px monospace';ctx.textAlign='center';ctx.fillText('13',320,250);ctx.font='14px monospace';ctx.fillStyle='#8fa7b4';ctx.fillText('T H E   F A C I L I T Y',320,285);ctx.textAlign='left';
}
function drawScene(){
 const s=Scenes.cur,st=s.def.steps[s.i],t=s.t;
 ctx.fillStyle='#000';ctx.fillRect(0,0,VW,VH);
 if(st.draw)st.draw(ctx,t,s.total);
 if(st.text){ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,VH-110,VW,110);ctx.fillStyle='#f1f5f7';ctx.font='16px monospace';ctx.textAlign='center';
  const lines=wrap(st.text,66);lines.forEach((l,i)=>ctx.fillText(l,320,VH-80+i*20));
  ctx.fillStyle='#7d95a4';ctx.font='11px monospace';ctx.fillText(st.choice?'':(st.hold?'Enter · continue':'Enter · continue      Esc · skip scene'),320,VH-10);ctx.textAlign='left'}
}
function wrap(text,n){const words=text.split(' '),out=[];let line='';for(const w of words){if((line+' '+w).trim().length>n){out.push(line.trim());line=w}else line+=' '+w}if(line.trim())out.push(line.trim());return out}
