// 13 — Event wiring + dependency validation for 26 floor phases.
// Run: node 13_event_wiring.js
const {makeMap,bfs,ROOMS,ROUTES}=require("./13_canonical_maps.js");
const FLOOR_TASKS={
13:{escape:["open service panel","observe captive","disable security circuit"],return:["reroute emergency power","contain escaped subject","reach captive"]},
12:{escape:["spoof maintenance identity","cross biometric scanner","interrupt restraint cycle"],return:["activate restraint alarm","contain roaming subject"]},
11:{escape:["access diagnostics","start sterilization","bypass medical scanner"],return:["restore isolation power","lure subject","seal isolation"]},
10:{escape:["redirect lab arm","complete cognitive test","synchronize labs"],return:["redirect ventilation","seal lab chamber"]},
9:{escape:["open airlock A","redirect surveillance","open airlock B"],return:["trigger chamber alarm","seal chamber"]},
8:{escape:["activate generator A","route power","activate generator B"],return:["route auxiliary power","activate maintenance robot"]},
7:{escape:["disable camera","redirect drone","cancel lockdown"],return:["trigger false alarm","override elevator"]},
6:{escape:["retrieve code A","retrieve code B","unlock index"],return:["operate retrieval robot","clear shelving"]},
5:{escape:["activate maintenance command","override operations"],return:["cancel lockdown","issue evacuation command"]},
4:{escape:["enable simulator","deploy decoy"],return:["activate decoy","seal training room"]},
3:{escape:["move cargo","operate conveyor"],return:["restart conveyor","cross machinery"]},
2:{escape:["assign clearance","authorize elevator"],return:["retrieve emergency token","override security"]},
1:{escape:["disable surveillance","open surface gate","choose leave or return"],return:["bypass perimeter","restore lower elevator"]}
};
const center=n=>{const r=ROOMS[n];return [Math.floor((r.x0+r.x1)/2),Math.floor((r.y0+r.y1)/2)]};
const prefix=(floor,phase)=>`F${String(floor).padStart(2,"0")}_${phase==="escape"?"E":"R"}`;
function createWiring(floor,phase){
 const m=makeMap(floor,phase),rooms=ROUTES[floor][phase],tasks=FLOOR_TASKS[floor][phase];
 const events=[{id:`${prefix(floor,phase)}_ENTRY`,kind:"entry",requires:[],effects:[]}];
 let prior=events[0].id;
 for(let i=0;i<rooms.length;i++){
   const room=rooms[i],eventId=`${prefix(floor,phase)}_STEP_${i+1}`;
   events.push({id:eventId,kind:"interact",room,at:center(room),task:tasks[i]||"access control",
     requires:[prior],effects:[{type:"setFlag",name:eventId}]});
   prior=eventId;
 }
 const exitId=`${prefix(floor,phase)}_EXIT`;
 events.push({id:exitId,kind:"transition",at:m.exit,requires:[prior],
   effects:[{type:"transition",to:phase==="escape"?floor-1:floor+1}]});
 if(floor===13&&phase==="return"){
   events[events.length-1].effects=[{type:"playCutscene",id:"final_reunion"},{type:"ending",id:"complete"}];
 }
 if(floor===1&&phase==="escape"){
   events[events.length-1].effects=[{type:"choice",options:["leave","return"]}];
 }
 return {floor,phase,doors:m.doors,events};
}
function validateWiring(floor,phase){
 const m=makeMap(floor,phase),w=createWiring(floor,phase);
 const flags=new Set(),opened=new Set();
 let position=m.entry;
 for(const e of w.events){
   if(!e.requires.every(req=>flags.has(req)))throw Error(`${e.id}: unmet prerequisite`);
   if(e.kind==="interact"){
     const d=ROOMS[e.room].door,approach=e.room[0]==="W"?[d[0]+1,d[1]]:[d[0]-1,d[1]];
     if(!bfs(m,position,approach,opened))throw Error(`${e.id}: door approach unreachable`);
     // Abstract authorization: room door opens on approach.
     // The real terminal authorization still needs a separate puzzle simulation.
     opened.add(e.room);
     if(!bfs(m,approach,e.at,opened))throw Error(`${e.id}: interaction unreachable`);
     position=e.at;
   }else if(e.kind==="transition"&&!bfs(m,position,e.at,opened)){
     throw Error(`${e.id}: exit unreachable`);
   }
   flags.add(e.id);
 }
 return w;
}
if(require.main===module){
 let count=0,events=0;
 for(let f=13;f>=1;f--)for(const phase of ["escape","return"]){
   const w=validateWiring(f,phase);count++;events+=w.events.length;
 }
 console.log(`PASS ${count}/26 event-chain structural simulations (${events} event nodes).`);
 console.log("LIMITATIONS: doors are assumed authorized at approach; no timed puzzle, enemy, or hazard simulation.");
 console.log("Floor 13 special crawl/breach and Floor 1 exterior gate need bespoke collision and story-state implementation.");
}
module.exports={createWiring,validateWiring,FLOOR_TASKS};
