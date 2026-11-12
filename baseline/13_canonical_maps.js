// 13 — Canonical 40x30 tile geometry and static reachability tests.
// Run: node 13_canonical_maps.js
const W=40,H=30;
const ROOM_NAMES=["WA","EA","WB","EB","WC","EC"];
const ROOMS={
 WA:{x0:3,x1:13,y0:4,y1:10,door:[15,7], passage:[14,17,7]},
 EA:{x0:26,x1:36,y0:4,y1:10,door:[24,7], passage:[23,25,7]},
 WB:{x0:3,x1:13,y0:13,y1:19,door:[15,16],passage:[14,17,16]},
 EB:{x0:26,x1:36,y0:13,y1:19,door:[24,16],passage:[23,25,16]},
 WC:{x0:3,x1:13,y0:22,y1:26,door:[15,24],passage:[14,17,24]},
 EC:{x0:26,x1:36,y0:22,y1:26,door:[24,24],passage:[23,25,24]}
};
const ROUTES={
 13:{escape:["WA","EA","EC"],return:["EC","WB","EA"]},
 12:{escape:["WA","EB","WC"],return:["WC","EC"]},
 11:{escape:["WB","WC","EA"],return:["EC","EB"]},
 10:{escape:["WA","EA","EC"],return:["EB","EC"]},
 9:{escape:["WC","WB","EB"],return:["WA","EB"]},
 8:{escape:["WA","EC","EA"],return:["EC","WC"]},
 7:{escape:["WA","EA","EC"],return:["WB","EA"]},
 6:{escape:["WA","EA","WB"],return:["EC","WC"]},
 5:{escape:["WB","EA"],return:["EA","EC"]},
 4:{escape:["WA","WC"],return:["WC","EA"]},
 3:{escape:["EB","WB"],return:["WB","EB"]},
 2:{escape:["WB","EA"],return:["EC","WB"]},
 1:{escape:["EA","WB"],return:["WB","EC"]}
};
function makeMap(floor,phase){
 const tiles=Array.from({length:H},()=>Array(W).fill("#"));
 const carve=(x,y)=>{if(x>0&&x<W-1&&y>0&&y<H-1)tiles[y][x]=".";};
 for(let y=3;y<=26;y++)for(let x=18;x<=22;x++)carve(x,y);
 for(const room of Object.values(ROOMS)){
   for(let y=room.y0;y<=room.y1;y++)for(let x=room.x0;x<=room.x1;x++)carve(x,y);
   for(let x=room.passage[0];x<=room.passage[1];x++)carve(x,room.passage[2]);
 }
 carve(20,2);carve(20,27);
 const doors=Object.fromEntries(ROOM_NAMES.map(n=>[n,{x:ROOMS[n].door[0],y:ROOMS[n].door[1],state:"closed"}]));
 return {floor,phase,tiles,doors,entry:phase==="escape"?[20,27]:[20,2],exit:phase==="escape"?[20,2]:[20,27]};
}
function bfs(map,start,goal,openDoors=new Set()){
 const doorByCoord=new Map(Object.entries(map.doors).map(([n,d])=>[`${d.x},${d.y}`,n]));
 const q=[start],seen=new Set([start.join(",")]);
 for(let i=0;i<q.length;i++){
   const [x,y]=q[i];if(x===goal[0]&&y===goal[1])return true;
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
     const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;
     if(nx<0||nx>=W||ny<0||ny>=H||map.tiles[ny][nx]==="#"||seen.has(k))continue;
     const door=doorByCoord.get(k);
     if(door&&!openDoors.has(door)&&map.doors[door].state!=="open")continue;
     seen.add(k);q.push([nx,ny]);
   }
 }
 return false;
}
function validate(floor,phase){
 const m=makeMap(floor,phase),route=ROUTES[floor][phase];
 const opened=new Set();
 let current=m.entry;
 const results=[];
 for(const name of route){
   const r=ROOMS[name],target=[Math.floor((r.x0+r.x1)/2),Math.floor((r.y0+r.y1)/2)];
   // Geometry test assumes this door can be opened by a reachable control.
   // Event prerequisites and dynamic hazards require separate tests.
   const d=r.door;
   const outside=name[0]==="W"?[d[0]+1,d[1]]:[d[0]-1,d[1]];
   if(!bfs(m,current,outside,opened))throw Error(`Floor ${floor} ${phase}: cannot reach ${name} door`);
   opened.add(name);
   if(!bfs(m,current,target,opened))throw Error(`Floor ${floor} ${phase}: cannot enter ${name}`);
   results.push(name);current=target;
 }
 if(!bfs(m,current,m.exit,opened))throw Error(`Floor ${floor} ${phase}: cannot reach exit`);
 return results;
}
if(typeof require!=="undefined"&&require.main===module){
 let passes=0;
 for(let floor=13;floor>=1;floor--)for(const phase of ["escape","return"]){
   validate(floor,phase);passes++;
 }
 console.log(`PASS: ${passes}/26 structural room-route checks`);
 console.log("NOT TESTED: puzzle dependencies, hazard timing, enemy collision, Floor 13 special crawl/breach, Floor 1 surface choice.");
}
if(typeof module!=="undefined")module.exports={makeMap,bfs,validate,ROOMS,ROUTES};
