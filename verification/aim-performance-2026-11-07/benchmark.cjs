const fs=require('node:fs'),{chromium,firefox}=require('playwright-core');
(async()=>{const engine=process.env.DEVAST_BROWSER||'chromium',browser=engine==='firefox'?await firefox.launch({headless:true}):await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],env:{...process.env,HOME:'/tmp/devast-browser-home'}});
try{const page=await browser.newPage();await page.route('https://perf.devast.test/',route=>route.fulfill({body:'<!doctype html><body></body>',contentType:'text/html'}));await page.goto('https://perf.devast.test/');
for(const file of ['vendor/dat.gui.recovered.js','mod/message15-aim.js','mod/responsive.js'])await page.addScriptTag({content:fs.readFileSync(file,'utf8')});
const result=await page.evaluate(()=>{
 function run(players,ghouls,frames,locked=false){const canvas=document.createElement('canvas');canvas.width=800;canvas.height=800;document.body.appendChild(canvas);const packets=[];let metaReads=0;
 const world={'ᅠᏧ‍':{id:1,x:1000,y:1000},'ᴎ︃ᄉ':[],'ﾠࡅ‍':[]};const network={state:1,'ᴎᚂρ':text=>packets.push(JSON.parse(text)),'ѕ᠋༢'(){},'ρ٨٨'(){}};
 const m=__installDevastMod({world,network,entities:{border:[],'ᴎ̂２':[]},categories:{player:1,loot:2},items:[],karma:[],graphics:{options:{}},synchronizedRender:true,view:()=>({x:0,y:0,scale:1,ctx:canvas.getContext('2d')}),chatActive:()=>false});let ticks=0;
 try{for(const[k,v]of Object.entries({AimBotEnabled:false,autoFire:false,JitterEnabled:false,jitterActive:false,mouseFovEnable:false,target:'all',lockId:locked?2:-1}))m.setSetting(k,v);
 for(let id=1;id<=Math.max(players,ghouls);id++){const v={'а༤̘':-1};Object.defineProperty(world['ᴎ︃ᄉ'],id,{get(){metaReads++;return v;},configurable:true});}
 for(let id=1;id<=players;id++)m.trackPacket(1,id,1,1000+id*10,1000+id*5,true);for(let id=1;id<=ghouls;id++)m.trackPacket(13,0,id,2000+id*10,2000+id*5,true);m.setSetting('AimBotEnabled',true);
 function batch(count){for(let i=0;i<count;i++){for(let id=1;id<=players;id++)m.trackPacket(1,id,1,1000+id*10+Math.sin(ticks/15)*10,1000+id*5,true);for(let id=1;id<=ghouls;id++)m.trackPacket(13,0,id,2000+id*10+Math.cos(ticks/15)*10,2000+id*5,true);m.aim.refresh();ticks++;}}
 batch(10);const samples=[];for(let trial=0;trial<3;trial++){metaReads=0;packets.length=0;const start=performance.now();batch(frames);samples.push({msPerBatch:(performance.now()-start)/frames,metaReads,packets:packets.length});}return{players,ghouls,locked,frames,samples};
 }finally{m.dispose();canvas.remove();localStorage.clear();}}
 return {cases:[run(16,32,60),run(120,128,30),run(120,128,30,true)]};
});result.engine=engine;result.version=browser.version();result.scope='Isolated browser installed adapter; synchronous batched target updates, no game rendering or real server';fs.writeFileSync(__dirname+'/'+(process.argv[2]||'browser-before')+'-'+engine+'.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
