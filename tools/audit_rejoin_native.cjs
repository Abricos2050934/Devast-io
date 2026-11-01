// Inspect only native interfaces in a browser initialized from saved public files.
const fs=require('fs'),zlib=require('zlib'),{chromium}=require('playwright-core'),acorn=require('./parser.cjs');
const symbols=JSON.parse(fs.readFileSync('patches/recovered-bindings.json')).symbols;
const profile=JSON.parse(fs.readFileSync('patches/recovered-current.json'));
const source=process.argv.includes('--patched')?fs.readFileSync('dist/game.modded.js','utf8'):zlib.gunzipSync(fs.readFileSync('baselines/current.js.gz')).toString();
const tree=acorn.parse(source,{ecmaVersion:'latest'}),offset=tree.body[0].expression.callee.body.end-1;
const fields={'network':'о̃༩','world':'еܞ︌','entities':'ι‌̵','input':'ρ̃५','renderer':'ᴇ️̅','graphics':'ᴘᚉ٦','items':'ιᄅᴄ','types':'εᚇ๓'};
const network=tree.body[0].expression.callee.body.body.flatMap(n=>n.type==='VariableDeclaration'?n.declarations:[]).find(n=>n.id.name===symbols['о̃༩']);
const ret=network.init.callee.body.body.find(n=>n.type==='ReturnStatement');
const insertion='window.__networkInternals={start:ᴀ︃๕,disconnect:ⲣ๔І,getSocket:()=>І̎ܘ,prepareRestoreFixture:()=>{рߌᴇ=undefined;І̎ܘ={close(){}};а༥ᄂ=()=>{};},getJoinMode:()=>ѕ٨ᚄ(35)[4],getJoinPayloadSource:()=>String(ѕ٨ᚄ),getSocketFactorySource:()=>String(рܕρ),probeJoinModes:()=>{const state=оᴌ︈.state,beforeCookie=document.cookie,beforeIdentity=["token","tokenId","userId"].map(k=>localStorage.getItem(k));try{оᴌ︈.state=64;const restored=ѕ٨ᚄ(35);оᴌ︈.state=0;const ordinary=ѕ٨ᚄ(35);return {restoreFlag:restored[4],normalFlag:ordinary[4],identityPreserved:[1,2,3].every(i=>restored[i]===ordinary[i]),storedIdentityPreserved:beforeIdentity.every((v,i)=>v===localStorage.getItem(["token","tokenId","userId"][i])),cookiesPreserved:document.cookie===beforeCookie};}finally{оᴌ︈.state=state;}},probeInvalidId:()=>{const state=оᴌ︈.state,previous=localStorage.getItem("userId");try{localStorage.setItem("userId","not-a-number");оᴌ︈.state=0;return {invalidIdHasFiniteFallback:Number.isFinite(ѕ٨ᚄ(35)[3])};}finally{оᴌ︈.state=state;if(previous===null)localStorage.removeItem("userId");else localStorage.setItem("userId",previous);}}};';
const code=(source.slice(0,ret.start)+insertion+source.slice(ret.start,offset))+'window.__nativeAudit={'+Object.entries(fields).map(([k,n])=>k+':'+symbols[n]).join(',')+'};'+source.slice(offset);
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,env:{...process.env,HOME:'/tmp/devast-browser-home'},proxy:{server:process.env.HTTPS_PROXY},args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const page=await browser.newPage();await page.route('https://devast.io/',r=>r.fulfill({status:200,contentType:'text/html',body:fs.readFileSync('build/download/index.html','utf8')}));await page.route(profile.source_url,r=>r.fulfill({status:200,contentType:'text/javascript',body:code}));
 await page.goto('https://devast.io/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.__nativeAudit);
 const data=await page.evaluate(s=>{
 const n=window.__nativeAudit;
 let recoveryIntegration;
 if(window.__devastMod){
   const m=window.__devastMod,keys=['token','tokenId','userId','BestModMenuConfig'];
   const before=keys.map(k=>localStorage.getItem(k)),cookies=document.cookie,joins=[];
   const row=['fixture-lobby',0,0,0,'fixture-region',0,'fixture-mode'];
   n.network[s['ԁᴄࡃ']]=row;n.network[s['ոߒ४']]=[row];
   n.network[s['ⲅ︊ᄃ']]=(_,cb)=>cb();
   n.network[s['ᅠϲ᠍']]=()=>joins.push(window.__networkInternals.getJoinMode());
   window.__networkInternals.prepareRestoreFixture();n.network.state=64;m.step(0);
   n.network[s['е̅ܙ']]();m.step(1);m.step(1001);
   recoveryIntegration={nativeRestoreHandlerCalled:true,normalJoinAttempts:joins.length,joinMode:joins[0],identityAndSettingsPreserved:keys.every((k,i)=>localStorage.getItem(k)===before[i]),cookiesPreserved:document.cookie===cookies,modErrors:[...m.diagnostics.errors]};
   if(joins.length!==1||joins[0]!==0||!recoveryIntegration.identityAndSettingsPreserved||!recoveryIntegration.cookiesPreserved||recoveryIntegration.modErrors.length)throw Error('Native session recovery fixture failed');
 }

 const shape=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,typeof v==='function'?{type:'function',source:String(v)}:v===null?null:['string','number','boolean'].includes(typeof v)?v:Array.isArray(v)?{type:'array',length:v.length}:{type:typeof v}]));
 return {recoveryIntegration,modeProbe:window.__networkInternals.probeJoinModes(),invalidIdProbe:window.__networkInternals.probeInvalidId(),joinPayloadSource:window.__networkInternals.getJoinPayloadSource(),socketFactorySource:window.__networkInternals.getSocketFactorySource(),connectionStart:String(window.__networkInternals.start),disconnect:String(window.__networkInternals.disconnect),flags:n.network[s['еԁ༦']],input:shape(n.input),network:shape(n.network),entity:shape(n.entities.create(0)),gauges:shape(n.world[s['ᴘρࡀ']]),gauge:shape(n.world[s['ᴘρࡀ']][s['ᴇ༤ᚆ']]),items:n.items.slice(0,100).map(shape)};
 },symbols);
 fs.writeFileSync('build/rejoin-native-audit.json',JSON.stringify(data,null,2)+'\n');console.log('Native interface shapes and methods recorded.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
