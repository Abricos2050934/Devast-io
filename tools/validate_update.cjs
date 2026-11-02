// Gate an immutable candidate with static checks and real native browser fixtures.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const acorn=require('./parser.cjs'),{hash}=require('./build_client.cjs'),{translate}=require('./translate_payload.cjs');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..'),dir=path.resolve(process.argv[2]||'');
const read=f=>fs.readFileSync(path.join(dir,f),'utf8'),json=f=>JSON.parse(read(f));
const overrideBytes=fs.readFileSync(path.join(root,'resource-override/Devast-io-GitHub-Resource-Override.json'));
const override=JSON.parse(overrideBytes);
assert.equal(override.v,1);assert.equal(override.data[0].rules[0].type,'fileOverride');
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
assert.deepEqual(profile.operations.map(p=>p.id),JSON.parse(fs.readFileSync(path.join(root,'patches/recovered-current.json'))).operations.map(p=>p.id),'Every reviewed native patch is required');
const functions={'ι๔̶':'spawn','ᴄ９̗':'headLabel','ⲅ︉️':'leaderLabel','ᴄߌ͏':'update','ⲟ१̖':'packet','ᴎܕα':'nameTag','ᴎ༩༣':'fire','ѕ٨ᚄ':'joinPayload','рܙ๕':'death','ᅟ᠌５':'leave'};
const edits=[],todo=[tree];while(todo.length){const n=todo.pop();if(!n||typeof n!=='object')continue;
 if(n.type==='FunctionDeclaration')for(const [old,name]of Object.entries(functions))if(n.id.name===roles[old]){
  let text=`window.__updateFunctions=window.__updateFunctions||{};window.__updateFunctions.${name}=${n.id.name};`;
  if(name==='fire')text+=`window.__updateFunctions.capturePackets=()=>{const codec=${roles['еϲᄄ']},key=${JSON.stringify(roles['ᴎ︅ހ'])},encode=codec[key],socket=${roles['І̎ܘ']},packets=[];codec[key]=p=>{packets.push(p.slice());return '';};${roles['І̎ܘ']}={send(){}};return {packets,restore(){codec[key]=encode;${roles['І̎ܘ']}=socket;}};};`;
  edits.push({at:n.start,text});
 }
 for(const v of Object.values(n)){if(Array.isArray(v))todo.push(...v);else if(v&&typeof v==='object')todo.push(v);}
}
assert.equal(edits.length,Object.keys(functions).length,'Unique browser fixture functions required');
const end=tree.body[0].expression.callee.body.end-1;
edits.push({at:end,text:`window.__updateProbe={...window.__updateFunctions,world:${symbols['еܞ︌']},network:${symbols['о̃༩']},entities:${symbols['ι‌̵']},input:${symbols['ρ̃५']},labelFactory:${roles['а̵̠']},nativeMenu:()=>${symbols['ɑᚆᴏ']}};`});
let code=output;for(const e of edits.sort((a,b)=>b.at-a.at))code=code.slice(0,e.at)+e.text+code.slice(e.at);
(async()=>{
 const report={schema:1,status:'failed',output_sha256:hash(output),static_ast:'passed',ilm_core:'identical',resource_override_sha256:hash(overrideBytes),mod_contract:contract,module_sha256:moduleHashes,mod_bundle_sha256:hash(JSON.stringify(moduleHashes)),mode:'native browser fixtures; no live game session',page_errors:[]};
 let browser;
 try{
  const executablePath=process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath());
  browser=await chromium.launch({executablePath,headless:true,env:{...process.env,HOME:process.env.DEVAST_BROWSER_HOME||'/tmp/devast-browser-home'},proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.page_errors.push(e.message.slice(0,250)));
  // These fixtures exercise native game logic, not third-party ads or audio.
  // Supply valid local dependencies so an asset outage cannot mask game errors.
  await page.route(url=>url.hostname==='webgames.io'&&url.pathname==='/js/widget.min.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:'window.Widget={init(){},filter:value=>value,isBlocked:0,preroll(){},createAdPlayer(){}};'}));
  const silence=Buffer.alloc(204);silence.write('RIFF');silence.writeUInt32LE(196,4);silence.write('WAVEfmt ',8);silence.writeUInt32LE(16,16);silence.writeUInt16LE(1,20);silence.writeUInt16LE(1,22);silence.writeUInt32LE(8000,24);silence.writeUInt32LE(16000,28);silence.writeUInt16LE(2,32);silence.writeUInt16LE(16,34);silence.write('data',36);silence.writeUInt32LE(160,40);
  await page.route(url=>url.hostname==='devast.io'&&url.pathname.startsWith('/audio/')&&url.pathname.endsWith('.mp3'),r=>r.fulfill({status:200,contentType:'audio/wav',body:silence}));
  report.external_dependencies={advertising:'fixture; failures exercised explicitly below',audio:'valid silent WAV fixture'};
  await page.context().addCookies([{name:'devast_fixture_cookie',value:'retained',domain:'devast.io',path:'/',secure:true}]);
  await page.addInitScript(()=>{
   if(!localStorage.getItem('fixture-seeded')){
    for(const [k,v]of Object.entries({token:'fixture-original-token',tokenId:'123',userId:'2',serverVersion:'previous-version',BestModMenuConfig:JSON.stringify({mouseFov:777,zoomFactor:.8}),'BestModMenuConfig:ilm2':'1','BestModMenuConfig:loot':JSON.stringify({steel:false})}))localStorage.setItem(k,v);
    localStorage.setItem('fixture-seeded','1');
   }
  });
  await page.route(source.page_url,r=>r.fulfill({status:200,contentType:'text/html',body:read('index.html')}));
  await page.route(source.script_url,r=>r.fulfill({status:200,contentType:'text/javascript',body:override.data[0].rules[0].file}));
  await page.route(url=>url.hostname==='raw.githubusercontent.com'&&url.pathname==='/Abricos2050934/Devast-io/updates/game.modded.js',r=>r.fulfill({status:200,contentType:'text/plain',headers:{'access-control-allow-origin':'*'},body:code}));
  await page.goto(source.page_url,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForFunction(()=>!!window.__updateProbe&&!!window.__devastMod?.menu,{timeout:25000});
  report.reload_identity=[];
  for(let attempt=0;attempt<3;attempt++){
   if(attempt)await page.reload({waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(key=>!!window.__devastMod?.menu&&typeof window.__updateProbe?.network[key]==='function',symbols['ᅠϲ᠍'],{timeout:25000});
   const kept=await page.evaluate(()=>({token:localStorage.getItem('token')==='fixture-original-token',tokenId:localStorage.getItem('tokenId')==='123',userId:localStorage.getItem('userId')==='2',cookie:document.cookie.includes('devast_fixture_cookie=retained'),settings:window.__devastMod.settings.mouseFov===777&&window.__devastMod.settings.zoomFactor===.8,loot:!window.__devastMod.loot.steel.acquire}));
   assert.ok(Object.values(kept).every(Boolean),'Native startup changed the saved identity or migrated settings');report.reload_identity.push(kept);
   await page.evaluate(()=>window.__devastMod.setSetting('zoomFactor',.8));
  }
  assert.equal(await page.evaluate(()=>window.__devastRemoteLoader?.state),'loaded','Resource Override loader failed');
  report.resource_override_loader='passed';
  report.native=await page.evaluate(async ({s,r})=>{
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
   n.spawn([0,1,123,'Self',0,0]);
   const clans=w[s['ﾠࡅ‍']];clans[0]={name:'ALLY',[s['ոᚄރ']]:7,[s['ᴌ५ᚂ']]:null};clans[1]={name:'ENEMY',[s['ոᚄރ']]:8,[s['ᴌ५ᚂ']]:null};
   Object.assign(players[1],{[s['а༤̘']]:0,[s['ᴌ̗ⲟ']]:7});Object.assign(players[2],{[s['а༤̘']]:1,[s['ᴌ̗ⲟ']]:8});Object.assign(players[120],{[s['а༤̘']]:0,[s['ᴌ̗ⲟ']]:7});
   const labels=[];n.labelFactory[r['ᴉ̷Ꮷ']]=function(...args){labels.push({text:args[0],color:args[2]});return text.apply(this,args);};
   const tag=id=>n.nameTag({[s['ᴘ४１']]:id,[s['Іࡈ５']]:0,x:1000,y:1000});
   try{
    m.setSetting('TeamClanColor','#12ab34');m.setSetting('EnemyClanColor','#ab1234');tag(120);tag(2);
    check(labels.some(p=>p.text==='[ALLY]'&&p.color==='#12ab34')&&labels.some(p=>p.text==='[ENEMY]'&&p.color==='#ab1234'),'Native clan colors are disconnected');
    const count=labels.length;tag(2);check(labels.length===count,'Unchanged clan label is rerendered');
    m.setSetting('EnemyClanColor','#3456ab');tag(2);check(labels.at(-1).text==='[ENEMY]'&&labels.at(-1).color==='#3456ab','Clan color cache did not update');
    Object.assign(players[1],{[s['а༤̘']]:1,[s['ᴌ̗ⲟ']]:8});tag(2);check(labels.at(-1).color==='#12ab34','Clan membership cache did not update');
   }finally{n.labelFactory[r['ᴉ̷Ꮷ']]=text;}
   Object.assign(players[1],{[s['а༤̘']]:0,[s['ᴌ̗ⲟ']]:7});
   const nickColors=[],nickControl=m.menu.__folders.Visuals.__controllers.find(c=>c.property==='NicknameColor');
   n.labelFactory[r['ᴉ̷Ꮷ']]=function(...args){nickColors.push({text:args[0],color:args[2]});return text.apply(this,args);};
   try{
    const meta=players[2],headKey=s['а༠٥'],leaderKey=s['ᴘ๒︅'];
    n.nameTag({[s['ᴘ४１']]:2,[s['Іࡈ５']]:0,x:1000,y:1000});meta[leaderKey]=n.leaderLabel(meta,'#fff');
    nickControl.setValue('#654321');
    check(meta[headKey]===null&&meta[leaderKey]===null&&w[s['ᴑܓօ']]===1,'Nickname GUI did not invalidate native name caches');
    nickColors.length=0;n.nameTag({[s['ᴘ४１']]:2,[s['Іࡈ５']]:0,x:1000,y:1000});n.leaderLabel(meta,'#fff');
    check(nickColors.filter(x=>x.text===meta[s['ο̏︇']]&&x.color==='#654321').length===2,'Native head/leader nickname colors did not change');
    const cached=meta[headKey];n.nameTag({[s['ᴘ४１']]:2,[s['Іࡈ５']]:0,x:1000,y:1000});check(meta[headKey]===cached,'Unchanged nickname canvas was rebuilt');
   }finally{n.labelFactory[r['ᴉ̷Ꮷ']]=text;}
   const listState=n.network.state;n.network.state=1;m.setSetting('PlayersListEnabled',true);
   try{
    m.render(0);const panel=m.playerList,find=id=>panel.querySelector('[data-player-id="'+id+'"]');
    check(find(120)&&find(2),'Player list omitted players outside visible entities');
    check(find(120).children[0].textContent==='#120'&&find(120).children[2].textContent==='[ALLY]','Player list lost ID or clan');
    check(find(2).children[1].style.color==='rgb(101, 67, 33)'&&find(2).children[2].style.color==='rgb(52, 86, 171)','Player list mixed nickname and clan colors');
    n.leave(2);m.render(1);check(!find(2),'Native leave did not remove player from list');
    n.spawn([0,2,123,'Roster#tag',0,0]);m.render(2);
    check(find(2).children[1].textContent==='Roster#tag'&&find(2).children[0].textContent==='#2','Native respawn did not restore nickname and ID');
    Object.assign(players[2],{[s['а༤̘']]:1,[s['ᴌ̗ⲟ']]:8});
   }finally{m.setSetting('PlayersListEnabled',false);n.network.state=listState;}
   n.network.state=1;m.setSetting('AimBotEnabled',true);m.setSetting('autoFire',false);m.setSetting('lockId',2);m.setSetting('visualizeResolving',true);
   const transport=n.capturePackets();
   try{
    m.trackPacket(0,1,1,1000,1000,true);m.trackPacket(0,2,1,1100,1050,true);m.aim.refresh();transport.packets.length=0;
    m.step(0);const history=JSON.stringify(m.targets.players[2]);n.network.state=64;m.step(16);m.aim.refresh();n.network.state=1;m.step(32);
    check(JSON.stringify(m.targets.players[2])===history,'Temporary disconnection erased native packet history');
    for(const [x,y]of [[1080,1100],[900,900],[1100,900],[950,1150]]){
     transport.packets.length=0;m.trackPacket(0,2,1,x,y,true);m.aim.refresh();n.input.angle=-2;
     n.network[s['ѕ᠋༢']]();n.network[s['ρ٨٨']]();n.network[r['ᴎ༩༣']]();
     const line=m.targets.lines[0],angle=(Math.round(Math.atan2(line.y2-line.y1,line.x2-line.x1)*180/Math.PI)+360)%360;
     check(JSON.stringify(transport.packets)===JSON.stringify([[6,angle],[4]]),'Native shot does not follow the current ILM line: '+JSON.stringify({packets:transport.packets,angle,line}));
     const before=JSON.stringify(line);transport.packets.length=0;m.trackPacket(0,2,1,x+5,y+5,true);n.network[r['ᴎ༩༣']]();
     check(JSON.stringify(transport.packets)==='[[4]]'&&JSON.stringify(m.targets.lines[0])===before,'Manual fire inserted a calculation outside the ILM timer');
    }
    m.setSetting('AimBotEnabled',false);transport.packets.length=0;
    const loot=[];for(const id of [10,11]){const drop=n.entities.get(0,id,1,1);Object.assign(drop,{id,x:self.x+10,y:self.y,[s['е̝ހ']]:0,[s['Іࡈ５']]:6});loot.push(drop);}
    try{
     m.setSetting('LootDataEnabled',false);m.setSetting('FAutoLootEnabled',true);m.render(0);m.render(16);
     check(JSON.stringify(transport.packets)===JSON.stringify([[12,10],[12,11],[12,10],[12,11]]),'Native fast loot cadence/bindings differ from ILM');
    }finally{m.setSetting('FAutoLootEnabled',false);for(const id of [10,11])n.entities.remove(0,id,1,1,0);}
    transport.packets.length=0;self.x=1234.5;self.y=5678.25;m.setSetting('AutoBuiledEnabled',true);
    try{
     m.step(0);m.step(8);check(transport.packets.length===0,'RAF duplicated native AutoBuild');
     m.render(0);m.render(8);
     check(JSON.stringify(transport.packets)===JSON.stringify([[14,0,56.7825,12.345],[14,0,56.7825,12.345]]),'Native AutoBuild coordinates or frame cadence differ from ILM');
    }finally{m.setSetting('AutoBuiledEnabled',false);}
    const identity=[localStorage.getItem('token'),localStorage.getItem('tokenId'),Number(localStorage.getItem('userId'))];
    n.network.state=64;const restore=n.joinPayload(35);n.network.state=0;const normal=n.joinPayload(35);
    check(restore[4]===1&&normal[4]===0&&JSON.stringify(restore.slice(1,4))===JSON.stringify(identity)&&JSON.stringify(normal.slice(1,4))===JSON.stringify(identity),'Native rejoin payload changes identity');
   }finally{transport.restore();n.network.state=0;}
   m.setSetting('AimBotEnabled',false);self.id=0;
   const nativeMenu=n.nativeMenu(),widget=window.Widget,waiting=nativeMenu[s['ϲ१༧']],identityBefore=['token','tokenId','userId','accountToken'].map(k=>localStorage.getItem(k));let resumed=0;
   try{
    window.Widget={preroll:()=>Promise.reject(false)};m.step(performance.now());
    nativeMenu[s['ϲ१༧']]=1;window.Widget.preroll();window.Widget.play=()=>{nativeMenu[s['ϲ१༧']]=0;resumed++;};
    for(let i=0;i<6;i++)await Promise.resolve();
    check(resumed===1&&!nativeMenu[s['ϲ१༧']],'Native ad gateway stayed blocked');
    window.Widget.play();check(resumed===1,'Late SDK callback duplicated login');
    check(['token','tokenId','userId','accountToken'].every((k,i)=>localStorage.getItem(k)===identityBefore[i]),'Gateway recovery changed identity');
   }finally{nativeMenu[s['ϲ१༧']]=waiting;window.Widget=widget;}
   const deathKey=s['ι︃２'],nativeDeath=n.network[deathKey],health=w[s['ᴘρࡀ']][s['ᴇ༤ᚆ']].value;let deathCalls=0;
   try{
    n.network[deathKey]=code=>{check(code===128,'Native death error code changed');deathCalls++;};n.death(new Uint8Array([5,0,0]));
    const event=m.connectionInfo().events.at(-1);
    check(event.type==='server-death'&&event.health===health,'Native death lost its pre-handler health snapshot');
    check(event.deathOpcode===5&&event.deathPacketLength===3&&event.deathPrefixHex==='05 00 00','Native death packet was not captured');
    check(deathCalls===1,'Death observation changed native handling');
   }finally{n.network[deathKey]=nativeDeath;}
   check(!m.diagnostics.errors.length,'Mod reported errors');
   return {menu:true,initial_metadata:true,head_and_leaderboard_labels:true,packet_history:true,packet_removal:true,self_angle_modes:true,native_clan_colors_and_cache:true,native_nickname_color_and_cache:true,full_player_list_and_native_lifecycle:true,native_shot_matches_ilm_line:true,ilm_manual_fire_cadence:true,disconnect_preserves_aim_history:true,native_fast_loot_cadence:true,native_autobuild_ilm_cadence:true,native_rejoin_identity:true,native_ad_failure_recovery:true,native_death_observation:true,mod_errors:[...m.diagnostics.errors]};
  },{s:symbols,r:roles});
  assert.equal(report.page_errors.length,0,'Browser page errors');report.status='passed';
 }catch(error){report.error=error.message;process.exitCode=1;}
 finally{report.finished_at=new Date().toISOString();fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(browser)await browser.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
