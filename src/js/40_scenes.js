/* ============================================================
   SCENES · awakening, escort, captive, daylight, reentry, reunion, endings
   ============================================================ */
const SC={
 room(g,t,flicker){ // assessment room, overhead, muted
  const f=flicker&&!OPT.reduced?(Math.sin(t*23)>.6?.55:1):1;
  g.fillStyle=`rgba(40,52,62,${f})`;g.fillRect(120,70,400,260);g.fillStyle=`rgba(25,33,40,${f})`;g.fillRect(120,70,400,14);g.fillRect(120,70,14,260);g.fillRect(506,70,14,260);g.fillRect(120,316,400,14);
  g.fillStyle='#7d8b94';g.fillRect(250,170,140,60);g.fillStyle='#b8c4cc';g.fillRect(256,176,128,48);
  g.fillStyle='#8e969c';g.fillRect(270,186,100,26);g.fillStyle='#e2b89a';g.fillRect(250,188,22,22);
  g.fillStyle='#2b3238';g.fillRect(480,84,24,16);g.fillStyle=Math.sin(t*2)>0?'#e04848':'#a03030';g.fillRect(488,89,8,6);
  g.fillStyle='#55606a';g.fillRect(300,312,40,18);
 },
 forearm(g,t){g.fillStyle='#e2b89a';g.fillRect(200,200,240,70);g.fillStyle='#d8cfc4';g.fillRect(300,196,70,78);g.fillStyle='#8a2f2f';g.font='bold 42px monospace';g.textAlign='center';g.fillStyle=`rgba(80,20,20,${Math.min(1,t/1.5)})`;g.fillText('13',335,246);g.textAlign='left'},
 corridor(g,t,ret){ // side-scroll corridor, figures walking right
  g.fillStyle=ret?'#1a1416':'#1c252c';g.fillRect(0,0,VW,VH);g.fillStyle=ret?'#2a2124':'#2d3a44';g.fillRect(0,300,VW,100);g.fillStyle=ret?'#3a2f33':'#3b4a58';g.fillRect(0,120,VW,180);
  const off=(t*60)%160;for(let i=-1;i<6;i++){const x=i*160-off+40;g.fillStyle='#52606a';g.fillRect(x,150,70,150);g.fillStyle='#1d2429';g.fillRect(x+30,210,10,10);g.fillStyle=ret&&i%2?'#333':'#e04848';g.fillRect(x+10,160,6,6)}
  if(ret){g.fillStyle='rgba(200,60,60,'+(0.15+0.1*Math.sin(t*6))+')';g.fillRect(0,0,VW,VH)}
 },
 robot(g,x,y,t){const w=Math.sin(t*8)*4;g.fillStyle='#8d99a3';g.fillRect(x-18,y-60,36,50);g.fillStyle='#b3bec6';g.fillRect(x-14,y-84,28,24);g.fillStyle='#e04848';g.fillRect(x-10,y-76,20,5);g.fillStyle='#5f6b74';g.fillRect(x-16,y-10,12,10+w);g.fillRect(x+4,y-10,12,10-w);g.fillRect(x-26,y-56,8,30);g.fillRect(x+18,y-56,8,30)},
 person(g,x,y,t,female,cloth='#8e969c'){const w=Math.sin(t*8)*4;g.fillStyle=cloth;g.fillRect(x-12,y-54,24,40);g.fillStyle='#e2b89a';g.fillRect(x-9,y-74,18,20);g.fillStyle=female?'#5a3b2a':'#2b2b2b';g.fillRect(x-10,y-77,20,7);if(female)g.fillRect(x-11,y-74,4,16);g.fillStyle='#4d5358';g.fillRect(x-10,y-14,8,14+w);g.fillRect(x+2,y-14,8,14-w)},
 sky(g,t,dawn){const gr=g.createLinearGradient(0,0,0,VH);gr.addColorStop(0,dawn?'#2b3e63':'#0b0f18');gr.addColorStop(.6,dawn?'#d98a5a':'#1b2230');gr.addColorStop(1,dawn?'#f2c27c':'#2d3a44');g.fillStyle=gr;g.fillRect(0,0,VW,VH);
  if(dawn){g.fillStyle='#ffe9b0';g.beginPath();g.arc(320,300-Math.min(60,t*8),40,0,Math.PI*2);g.fill()}
  g.fillStyle='#101a14';for(let i=0;i<14;i++){const x=i*50-20;g.fillRect(x,260,18,120);g.beginPath();g.moveTo(x-18,270);g.lineTo(x+9,180);g.lineTo(x+36,270);g.fill()}g.fillRect(0,330,VW,150)},
 gate(g,open){g.fillStyle='#3b4a58';g.fillRect(200,150,240,200);g.fillStyle='#8b7355';g.fillRect(230,180,open?60:180,170);if(open){g.fillStyle='#0b0f18';g.fillRect(290,180,120,170)}},
 window(g,t){g.fillStyle='#1c252c';g.fillRect(0,0,VW,VH);g.fillStyle='#2f3339';g.fillRect(140,80,360,240);g.fillStyle='rgba(140,190,210,.22)';g.fillRect(140,80,360,240);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(150,90,8,220);
  g.fillStyle='#4e5a63';g.fillRect(220,230,200,30);g.fillStyle='#8e969c';g.fillRect(240,218,150,22);g.fillStyle='#e2b89a';g.fillRect(222,214,26,26);g.fillStyle=G.gender==='female'?'#2b2b2b':'#5a3b2a';g.fillRect(220,210,30,8);g.fillStyle='#8a2f2f';g.fillRect(330,222,40,10);
  if(Math.sin(t*1.5)>.8){g.fillStyle='#fff';g.fillRect(228,222,3,3);g.fillRect(238,222,3,3)}},
 kids(g,t){g.fillStyle='#f2d9a6';g.fillRect(0,0,VW,VH);g.fillStyle='#c98f5a';g.fillRect(0,330,VW,150);g.fillStyle='#7d8b94';g.fillRect(0,300,VW,14);
  g.fillStyle='#6a7278';g.fillRect(300,100,40,230);SC.person(g,200,330,t*.3,true,'#d86a6a');SC.person(g,440,330,t*.3+2,false,'#6a8ad8');
  const tap=Math.floor(t*3)%8;g.fillStyle='#fff';if([0,1,2,5,6].includes(tap)){g.fillRect(270,220+(tap%2)*10,10,10)}},
 blackout(g,a){g.fillStyle=`rgba(0,0,0,${a})`;g.fillRect(0,0,VW,VH)},
 vignette(g,t,i){ // montage vignettes: childhood, laughter, arguments, separation, reunion, shared years
  const warm=['#f2d9a6','#ffe7c2','#d9c9b8','#8b96a3','#f2c27c','#e8d8c0'][i];g.fillStyle=warm;g.fillRect(0,0,VW,VH);g.fillStyle='rgba(90,70,50,.5)';g.fillRect(0,320,VW,160);
  const f=G.gender==='female',a=f?'#d86a6a':'#6a8ad8',b=f?'#6a8ad8':'#d86a6a';
  if(i===0){SC.person(g,220,330,t,f,a);SC.person(g,420,330,t+1,!f,b);g.fillStyle='#6a7278';g.fillRect(310,120,20,210)}
  else if(i===1){SC.person(g,250,330,t*2,f,a);SC.person(g,390,330,t*2+1,!f,b);g.fillStyle='#4d6b3b';g.fillRect(0,330,VW,150);for(let k=0;k<30;k++){g.fillStyle='rgba(255,255,255,.6)';g.fillRect((k*53+t*120)%VW,(k*37+t*300)%330,2,10)}}
  else if(i===2){SC.person(g,180,330,0,f,a);SC.person(g,460,330,0,!f,b);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,0,VW,VH)}
  else if(i===3){SC.person(g,120-t*10,330,t,f,a);SC.person(g,520+t*10,330,t,!f,b);g.fillStyle='#55606a';g.fillRect(300,60,40,270)}
  else if(i===4){SC.person(g,300-Math.max(0,40-t*20),330,t,f,a);SC.person(g,340+Math.max(0,40-t*20),330,t,!f,b)}
  else{SC.person(g,290,330,0,f,a);SC.person(g,350,330,0,!f,b);g.fillStyle='#ffe9b0';g.beginPath();g.arc(320,120,30,0,Math.PI*2);g.fill()}
  if(OPT.reduced)return;g.fillStyle=`rgba(0,0,0,${Math.max(0,.6-t*.6)})`;g.fillRect(0,0,VW,VH);
 }
};
Scenes.defs.awakening={steps:[
 {dur:2.2,text:'Darkness.',draw:(g,t)=>{SC.blackout(g,1)},sfx:()=>SFX.low()},
 {dur:2.4,text:'A low mechanical hum.',cap:'[low mechanical hum]',draw:(g,t)=>{SC.blackout(g,1);g.fillStyle=`rgba(120,140,150,${.05+.04*Math.sin(t*20)})`;g.fillRect(0,0,VW,VH)}},
 {dur:4.5,text:'“Subject 13. Consciousness restored. Neurological response within acceptable parameters.”',cap:'[synthetic voice, calm]',draw:(g,t)=>{SC.blackout(g,1);g.fillStyle=`rgba(255,255,255,${Math.min(.15,t*.05)})`;g.fillRect(0,0,VW,VH)},sfx:()=>SFX.voice()},
 {dur:3.5,text:'Your eyes open. A table. A cold room under a flickering light. Your head is pounding.',draw:(g,t)=>SC.room(g,t,true)},
 {dur:3.5,text:'Gray institutional clothing. A small bandage on your forearm, and beneath it, a number inked into the skin.',draw:(g,t)=>SC.forearm(g,t)},
 {dur:2.2,text:'13.',draw:(g,t)=>SC.forearm(g,t+2)},
 {dur:3.5,text:'You try to remember your name. Nothing.',draw:(g,t)=>SC.room(g,t,false)},
 {dur:3.6,text:'Then, faintly, from somewhere in the wall: three quiet taps. A pause. Two more.',cap:'[three taps · pause · two taps]',draw:(g,t)=>{SC.room(g,t,false);if(t>.5&&t<2.6){g.fillStyle=`rgba(255,255,255,${Math.abs(Math.sin(t*9))*.6})`;g.fillRect(126,200,8,8)}},sfx:()=>SFX.taps(.4)},
 {dur:3.2,text:'Someone is there. A small camera follows your movement, and the door begins to cycle.',cap:'[servo whine]',draw:(g,t)=>SC.room(g,t,false)},
],end(){G.stage='assess';saveGame();buildFloor();ui.say('Take in the room. You can try the door, or lie back and pretend nothing happened.')}};
Scenes.defs.escort={steps:[
 {dur:3,text:'The thing in the doorway is shaped like a person and is not one. It does not speak. It gestures.',cap:'[heavy, even footsteps]',draw:(g,t)=>{SC.corridor(g,0);SC.robot(g,420,300,0);SC.person(g,250,300,0,G.gender==='female')},sfx:()=>SFX.robotStep()},
 {dur:5,text:'It walks you down the detention corridor. Every door you pass is sealed and opaque. Something is behind each of them. You cannot see what.',draw:(g,t)=>{SC.corridor(g,t);SC.robot(g,360,300,t);SC.person(g,280,300,t,G.gender==='female')},sfx:()=>{for(let i=0;i<8;i++)SFX.robotStep(false)}},
 {dur:3.6,text:'“Subject 13 transferred to individual holding. Next evaluation pending.”',cap:'[synthetic voice]',draw:(g,t)=>{SC.corridor(g,t);SC.robot(g,360,300,t);SC.person(g,280,300,t,G.gender==='female')},sfx:()=>SFX.voice()},
 {dur:3.4,text:'The far cell. A bolted bed, a sink, a camera, a smooth door. The door seals. Nothing taps on any wall in here.',draw:(g,t)=>{g.fillStyle='#2f3339';g.fillRect(0,0,VW,VH);g.fillStyle='#4e5a63';g.fillRect(100,140,120,220);g.fillStyle='#aab5bc';g.fillRect(480,160,60,50);g.fillStyle='#2b3238';g.fillRect(300,40,30,20);g.fillStyle='#e04848';g.fillRect(311,46,8,6);g.fillStyle='#55606a';g.fillRect(260,330,120,150)},sfx:()=>SFX.door()},
]};
Scenes.defs.captive={steps:[
 {dur:4,text:'Through the glass: a holding room like yours. Someone lies on the floor beside the bed, one leg wrapped and splinted badly.',draw:(g,t)=>SC.window(g,t)},
 {dur:4,text:'',draw:(g,t)=>SC.window(g,t),on(){Scenes.cur.def.steps[1].text=pronoun().cap+' lifts '+pronoun().their+' head. '+pronoun().cap+' sees you. Something crosses '+pronoun().their+' face that you have no name for, and then '+pronoun().they+' is weeping.'}},
 {dur:4.5,text:'“You came back,” the captive says, through the glass, too quietly to be meant for the camera. “You always come back.”',draw:(g,t)=>SC.window(g,t)},
 {dur:4.2,text:'',draw:(g,t)=>SC.window(g,t),on(){Scenes.cur.def.steps[3].text=pronoun().cap+' tries to stand and cannot. '+pronoun().cap+' cannot follow you. '+pronoun().cap+' knows it, and tells you to go.'}},
 {dur:4,text:'You have no memory of this person. The sound of their voice hurts. You do not know what they are to you. You know you are leaving them here.',draw:(g,t)=>SC.window(g,t),sfx:()=>SFX.taps(1)},
]};
Scenes.defs.daylight={steps:[
 {dur:3.5,text:'The gate opens. Wind moves through the trees. For the first time you can remember, there is nothing above you.',cap:'[wind]',draw:(g,t)=>{SC.sky(g,t,true);SC.gate(g,true)},sfx:()=>{SFX.gate();SFX.wind()}},
 {dur:4,text:'You can leave. You are free. The road goes somewhere. Someone up there will give you a name.',draw:(g,t)=>SC.sky(g,t+4,true)},
 {dur:4,text:'Someone is still below. Thirteen floors down, with a splinted leg, in a facility that has started to fail.',draw:(g,t)=>{SC.sky(g,t+8,true);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,0,VW,VH)},sfx:()=>SFX.taps(.5)},
 {hold:true,choice:true,text:'',draw:(g,t)=>SC.sky(g,t+12,true),on(){ui.dialog('DAYLIGHT',['Both paths are real. Neither is the wrong one.'],[['LEAVE — walk into the daylight',()=>{Scenes.finish();endLeave()}],['RETURN — go back down for them',()=>{Scenes.finish();beginReturn()}]]);dialogOnEscape=null}},
],noSkip:false};
function endLeave(){G.finished=true;G.ending='leave';saveGame();Scenes.play('escapeComplete')}
function beginReturn(){G.phase='r';G.returnChosen=true;G.floor=1;G.stage='';saveGame();Scenes.play('reentry',()=>{buildFloor();saveGame();ui.say('The facility is failing. Lower lifts are the way down.')})}
Scenes.defs.escapeComplete={steps:[
 {dur:4.5,text:'You walk toward the horizon. Behind you the facility sinks back into the hill as if it had never been there.',draw:(g,t)=>{SC.sky(g,t+10,true);SC.person(g,320-t*8,340,t,G.gender==='female')},sfx:()=>SFX.wind()},
 {dur:4.5,text:'You have survived. You will live. You will be given a name and you will answer to it.',draw:(g,t)=>SC.sky(g,t+14,true)},
 {dur:5,text:'Some nights, in the quiet, you catch yourself tapping on the table. Three. A pause. Two. You never learn what it means.',cap:'[three taps · pause · two taps]',draw:(g,t)=>{SC.sky(g,t+18,true);SC.blackout(g,Math.min(.9,t*.25))},sfx:()=>SFX.taps(1.5)},
 {dur:3,text:'ESCAPE COMPLETE',draw:(g,t)=>{SC.blackout(g,1);g.fillStyle='#eef5f7';g.font='bold 30px monospace';g.textAlign='center';g.fillText('13',320,200);g.font='14px monospace';g.fillStyle='#8fa7b4';g.fillText('ENDING A · ESCAPE COMPLETE',320,230);g.textAlign='left'}},
],end(){ui.dialog('ESCAPE COMPLETE',['You survived. The story keeps its silence about what you left behind.',{cls:'fine',text:G.memories.length?'Fragments recovered: '+G.memories.length+' of 13.':'No fragments recovered. The ending stands on its own.'}],[['Begin again',()=>{G=null;titleScreen()}]]);prevModal='title'}};
Scenes.defs.reentry={steps:[
 {dur:4,text:'You turn around. The gate has already dropped behind you; the alarms you set off are still running.',cap:'[distant alarms]',draw:(g,t)=>{SC.sky(g,t+14,true);SC.gate(g,false);g.fillStyle=`rgba(200,60,60,${.1+.1*Math.sin(t*6)})`;g.fillRect(0,0,VW,VH)},sfx:()=>SFX.alarm()},
 {dur:4.5,text:'The vehicle bay door is bent off its track. Inside, the lights are red and the floor is wet. Whatever was kept down there is not kept anymore.',draw:(g,t)=>SC.corridor(g,t*.3,true),sfx:()=>SFX.low()},
 {dur:3.5,text:'Thirteen floors. Lower lifts only. You start walking.',draw:(g,t)=>{SC.corridor(g,t*.3,true);SC.person(g,200+t*30,300,t,G.gender==='female')}},
]};
Scenes.defs.childhood={steps:[
 {dur:4,text:'A photograph falls out of the file, and you are somewhere else: a house, a creek, a pipe that runs between two bedrooms.',draw:(g,t)=>SC.kids(g,t)},
 {dur:4.5,text:'Two children tapping on it after lights-out. Code out of a library book. One of them keeps getting the same letter wrong.',cap:'[tapping on a pipe]',draw:(g,t)=>SC.kids(g,t+4),sfx:()=>SFX.taps(.3)},
 {dur:4.5,text:'The other one starts getting it wrong on purpose. After that it was theirs: the mistake was the signature. Nobody else would ever send it right.',cap:'[three taps · pause · two taps]',draw:(g,t)=>SC.kids(g,t+8),sfx:()=>SFX.taps(.6)},
 {dur:3.5,text:'You do not remember which of you made the mistake first.',draw:(g,t)=>{SC.kids(g,t+12);SC.blackout(g,Math.min(.8,t*.3))}},
]};
Scenes.defs.reunion={steps:[
 {dur:4,text:'The holding room has half collapsed. The captive is where you left them, against the wall by the bed, splinted leg out straight. They look up.',draw:(g,t)=>{SC.window(g,t);g.fillStyle='rgba(60,40,30,.5)';g.fillRect(0,0,VW,VH)},sfx:()=>SFX.low()},
 {dur:4,text:'Neither of you can stand anymore. You get across the floor the other way. Your hands find each other without being told.',draw:(g,t)=>{SC.window(g,t);SC.blackout(g,.3)}},
 {dur:4.5,text:'“Little Star,” they whisper. It is not your name. It is the only name you have ever answered to.',cap:'[whispered]',draw:(g,t)=>{SC.window(g,t);SC.blackout(g,.45)}},
 {dur:3.5,text:'They tap it on the back of your hand. Three. A pause. Two. Wrong in exactly the right way.',cap:'[three taps · pause · two taps]',draw:(g,t)=>{SC.window(g,t);SC.blackout(g,.55)},sfx:()=>SFX.taps(.3)},
 {dur:3.6,text:'And then it comes, all of it, without warning:',draw:(g,t)=>SC.blackout(g,1)},
 {dur:4,text:'Two children and a pipe between two rooms.',draw:(g,t)=>SC.vignette(g,t,0),sfx:()=>SFX.chime()},
 {dur:4,text:'Running through summer rain, laughing too hard to breathe.',draw:(g,t)=>SC.vignette(g,t,1)},
 {dur:4,text:'A kitchen, years later, and the worst thing either of you ever said.',draw:(g,t)=>SC.vignette(g,t,2)},
 {dur:4,text:'A door closing. A long time with no answer on the other end of the pipe.',draw:(g,t)=>SC.vignette(g,t,3)},
 {dur:4,text:'Finding each other again. Neither of you saying sorry, because neither of you needed to.',draw:(g,t)=>SC.vignette(g,t,4),sfx:()=>SFX.taps(.5)},
 {dur:4.5,text:'The years after. Ordinary years. The best ones.',draw:(g,t)=>SC.vignette(g,t,5)},
 {dur:4.5,text:'You cannot name what you were to each other. You know only that you were never alone, and you are not alone now.',draw:(g,t)=>{SC.window(g,t);SC.blackout(g,.7)}},
 {dur:4,text:'The lights go out. Your hands remain together.',draw:(g,t)=>{SC.window(g,t);SC.blackout(g,Math.min(1,.7+t*.1))},sfx:()=>SFX.low()},
 {dur:3,text:'13 — COMPLETE',draw:(g,t)=>{SC.blackout(g,1);g.fillStyle='#eef5f7';g.font='bold 30px monospace';g.textAlign='center';g.fillText('13',320,200);g.font='14px monospace';g.fillStyle='#8fa7b4';g.fillText('ENDING B · 13 COMPLETE',320,230);g.textAlign='left'}},
],end(){G.finished=true;G.ending='return';saveGame();ui.dialog('13 — COMPLETE',['Both of you, together, at the bottom of the world. It is not a defeat.',{cls:'fine',text:G.memories.length?'Fragments recovered: '+G.memories.length+' of 13.':'No fragments recovered. The ending did not need them.'}],[['Begin again',()=>{G=null;titleScreen()}]]);prevModal='title'}};
