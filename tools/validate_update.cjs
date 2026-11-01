// Gate an immutable candidate with static checks and real native browser fixtures.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const acorn=require('./parser.cjs'),{hash}=require('./build_client.cjs'),{translate}=require('./translate_payload.cjs');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..'),dir=path.resolve(process.argv[2]||'');
const read=f=>fs.readFileSync(path.join(dir,f),'utf8'),json=f=>JSON.parse(read(f));
const output=read('game.modded.js'),profile=json('profile.json'),symbols=json('bindings.json').symbols,roles=json('roles.json'),source=json('source.json');
const contract=JSON.parse(fs.readFileSync(path.join(root,'mod/contract.json')));
const moduleHashes=Object.fromEntries(contract.modules.map(file=>[file,hash(fs.readFileSync(path.join(root,file)))]));
const tree=acorn.parse(output,{ecmaVersion:'latest'}),body=tree.body[0]?.expression?.callee?.body?.body;
assert.ok(body,'Full native client IIFE required');
for(const name of ['__installDevastMod','__createIlmAim'])assert.equal(body.filter(n=>n.id?.name===name).length,1);
const installer=body.find(n=>n.id?.name==='__installDevastMod');
fs.writeFileSync(path.join(dir,'installer.fixture.js'),output.slice(installer.start,installer.end));
const installerSource=output.slice(installer.start,installer.end);
assert.ok(!installerSource.includes('AIM BOT')&&!installerSource.includes('MOD.ShowGauges'),'Removed overlays returned');
for(const file of ['mod/bootstrap.js','vendor/dat.gui.recovered.js']) {
 const expected=file.startsWith('mod/')?translate(fs.readFileSync(path.join(root,file),'utf8'),symbols).trim():fs.readFileSync(path.join(root,file),'utf8').trim();
 assert.equal(output.split(expected).length,2,'Exact current module required: '+file);
}
assert.equal(output.slice(installer.start,installer.end),translate(fs.readFileSync(path.join(root,'mod/responsive.js'),'utf8'),symbols).trim());
function normalize(value){if(Array.isArray(value))return value.map(normalize);if(!value||typeof value!=='object')return value;return Object.fromEntries(Object.entries(value).filter(([key])=>!['start','end','raw'].includes(key)).map(([key,v])=>[key,normalize(v)]));}
const canonical=acorn.parse(fs.readFileSync(path.join(root,'mod/ilm-aim.js'),'utf8'),{ecmaVersion:'latest'}).body.find(n=>n.id?.name==='__createIlmAim');
assert.deepEqual(normalize(body.find(n=>n.id?.name==='__createIlmAim')),normalize(canonical),'ILM algorithm changed');
assert.equal(hash(read('native.js')),profile.baseline_sha256);
assert.equal(profile.operations.length,11);
const functions={'ι๔̶':'spawn','ᴄ９̗':'headLabel','ⲅ︉️':'leaderLabel','ᴄߌ͏':'update','ⲟ१̖':'packet'};
const edits=[],todo=[tree];while(todo.length){const n=todo.pop();if(!n||typeof n!=='object')continue;
 if(n.type==='FunctionDeclaration')for(const [old,name]of Object.entries(functions))if(n.id.name===roles[old])edits.push({at:n.start,text:`window.__updateFunctions=window.__updateFunctions||{};window.__updateFunctions.${name}=${n.id.name};`});
 for(const v of Object.values(n)){if(Array.isArray(v))todo.push(...v);else if(v&&typeof v==='object')todo.push(v);}
}
assert.equal(edits.length,5,'Unique browser fixture functions required');
const end=tree.body[0].expression.callee.body.end-1;
edits.push({at:end,text:`window.__updateProbe={...window.__updateFunctions,world:${symbols['еܞ︌']},network:${symbols['о̃༩']},entities:${symbols['ι‌̵']},input:${symbols['ρ̃५']},labelFactory:${roles['а̵̠']}};`});
let code=output;for(const e of edits.sort((a,b)=>b.at-a.at))code=code.slice(0,e.at)+e.text+code.slice(e.at);
(async()=>{
 const report={schema:1,status:'failed',output_sha256:hash(output),static_ast:'passed',ilm_core:'identical',mod_contract:contract,module_sha256:moduleHashes,mod_bundle_sha256:hash(JSON.stringify(moduleHashes)),mode:'native browser fixtures; no live game session',page_errors:[]};
 let browser;
 try{
  const executablePath=process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath());
  browser=await chromium.launch({executablePath,headless:true,env:{...process.env,HOME:process.env.DEVAST_BROWSER_HOME||'/tmp/devast-browser-home'},proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.page_errors.push(e.message.slice(0,250)));
  await page.route(source.page_url,r=>r.fulfill({status:200,contentType:'text/html',body:read('index.html')}));
  await page.route(source.script_url,r=>r.fulfill({status:200,contentType:'text/javascript',body:code}));
  await page.goto(source.page_url,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForFunction(()=>!!window.__updateProbe&&!!window.__devastMod?.menu,{timeout:25000});
  report.native=await page.evaluate(({s,r})=>{
   const n=window.__updateProbe,m=window.__devastMod,w=n.world,players=w[s['ᴎ︃ᄉ']],self=w[s['ᅠᏧ‍']];
   const check=(v,message)=>{if(!v)throw Error(message);};
   w[r['ࡀ︌٨']]=121;const names=Array(121).fill(0);names[2]='Update#fixture';w[r['І︈༧']](names);
   check(players[2][s['ο̏︇']]==='Update#fixture#2','Constructor ID binding failed');check(players[3][s['ο̏︇']]===0,'Empty player sentinel changed');
   const text=n.labelFactory[r['ᴉ̷Ꮷ']],captured=[];n.labelFactory[r['ᴉ̷Ꮷ']]=function(...args){captured.push(args[0]);return text.apply(this,args);};
   try{for(const [id,name]of [[2,'Spawn'],[120,''],[2,'Respawn#tag']]){n.spawn([0,id,123,name,0,0]);captured.length=0;check(n.headLabel(players[id])&&n.leaderLabel(players[id],'#fff'),'Label render failed');check(captured.filter(x=>x===name+'#'+id).length>=2,'Native head/leader label ID mismatch');}}
   finally{n.labelFactory[r['ᴉ̷Ꮷ']]=text;}
   function packet(type,id,uid,x,y,active=true){const b=new ArrayBuffer(22),u8=new Uint8Array(b),u16=new Uint16Array(b);u8[2]=id;u8[3]=uid;u8[5]=type;u16[3]=active?1:0;u16[7]=x;u16[8]=y;n.packet(b,u8,0);}
   packet(0,1,1,1000,1000);packet(0,2,1,1100,1000);packet(0,2,1,1120,1020);packet(13,0,17,1200,1200);
   check(m.targets.players[2].prevX[0]===1100&&m.targets.players[2].x===1120&&m.targets.ghouls[17].x===1200,'Current packet bindings failed');
   packet(13,0,17,0,0,false);packet(0,2,1,0,0,false);check(!m.targets.players[2].active&&!m.targets.ghouls[17].active,'Removal binding failed');
   self.id=1;const e=n.entities.get(1,0,1,0);e[s['ᴘ४１']]=1;e.id=0;e[r['ᴎ٨ߍ']]=.25;e[r['ᴑ٧ߓ']]=1;n.input.angle=2;
   for(const [mode,on]of [['withAim',false],['withAim',true],['always',false]]){m.setSetting('ShowRealAngles',mode);m.setSetting('AimBotEnabled',on);e.angle=0;n.update(e);check(Math.abs(e.angle-((mode==='always'||on)?0.5:2))<1e-8,'Self angle binding failed');}
   m.setSetting('AimBotEnabled',false);self.id=0;check(!m.diagnostics.errors.length,'Mod reported errors');
   return {menu:true,initial_metadata:true,head_and_leaderboard_labels:true,packet_history:true,packet_removal:true,self_angle_modes:true,mod_errors:[...m.diagnostics.errors]};
  },{s:symbols,r:roles});
  assert.equal(report.page_errors.length,0,'Browser page errors');report.status='passed';
 }catch(error){report.error=error.message;process.exitCode=1;}
 finally{report.finished_at=new Date().toISOString();fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(browser)await browser.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
