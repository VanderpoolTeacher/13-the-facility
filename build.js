// Concatenates src/shell.html + src/js/*.js into the single deliverable 13.html
const fs=require('fs'),path=require('path');
const root=__dirname,js=path.join(root,'src/js');
const files=fs.readdirSync(js).filter(f=>f.endsWith('.js')).sort();
const script=files.map(f=>`/* --- ${f} --- */\n`+fs.readFileSync(path.join(js,f),'utf8')).join('\n');
const shell=fs.readFileSync(path.join(root,'src/shell.html'),'utf8');
if(!shell.includes('/*SCRIPT*/'))throw Error('marker missing');
fs.writeFileSync(path.join(root,'13.html'),shell.replace('/*SCRIPT*/',()=>script));
fs.writeFileSync(path.join(root,'build/game.js'),script);
console.log('built 13.html',(fs.statSync(path.join(root,'13.html')).size/1024).toFixed(1)+' KB from',files.join(', '));
