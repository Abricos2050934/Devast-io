// Gate an immutable candidate with static checks and real native browser fixtures.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const acorn=require('./parser.cjs'),{hash}=require('./build_client.cjs'),{translate}=require('./translate_payload.cjs');
const {chromium,firefox}=require('playwright-core');
const root=path.resolve(__dirname,'..'),dir=path.resolve(process.argv[2]||'');
const read=f=>fs.readFileSync(path.join(dir,f),'utf8'),json=f=>JSON.parse(read(f));
const overrideBytes=fs.readFileSync(path.join(root,'resource-override/Devast-io-GitHub-Resource-Override.json'));
const override=JSON.parse(overrideBytes);
assert.equal(override.v,1);assert.equal(override.data[0].rules[0].type,'fileOverride');
const output=read('game.modded.js'),profile=json('profile.json'),symbols=json('bindings.json').symbols,roles=json('roles.json'),source=json('source.json');
const contract=JSON.parse(fs.readFileSync(path.join(root,'mod/contract.json')));
const moduleHashes=Object.fromEntries(contract.modules.map(file=>[file,hash(fs.readFileSync(path.join(root,file)))]));
const tree=acorn.parse(output,{ecmaVersion:'latest'}),body=tree.body[0]?.expression?.callee?.body?.body;
assert.equal(profile.operations.filter(op=>op.id.startsWith('native-integrity-signature-')).length,3,'All three native signature compatibility operations are required');
assert.equal(roles.nativeIntegritySigners?.length,3,'Three reviewed native signers required');
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
assert.deepEqual(profile.operations.map(p=>p.id),JSON.parse(fs.readFileSync(path.join(root,'patches/recovered-current.json'))).operations.map(p=>p.id).concat(['native-integrity-signature-0','native-integrity-signature-1','native-integrity-signature-2']),'Every reviewed native patch is required');
const functions={'ι๔̶':'spawn','ᴄ９̗':'headLabel','ⲅ︉️':'leaderLabel','ᴄߌ͏':'update','ⲟ१̖':'packet','ᴎܕα':'nameTag','ᴎ༩༣':'fire','ѕ٨ᚄ':'joinPayload','рܙ๕':'death','ᅟ᠌５':'leave','ᴀᄁ︃':'landmineRender','рոᴎ':'wireRender','ᅠ̘ܛ':'trapRender'};
const edits=[],placements=[],todo=[tree];while(todo.length){const n=todo.pop();if(!n||typeof n!=='object')continue;
 if(n.type==='ArrayExpression'&&n.elements[0]?.value===14&&n.elements.length===4&&n.elements[1]?.object?.type==='MemberExpression')placements.push(n);
 if(n.type==='FunctionDeclaration')for(const [old,name]of Object.entries(functions))if(n.id.name===roles[old]){
  let text=`window.__updateFunctions=window.__updateFunctions||{};window.__updateFunctions.${name}=${n.id.name};`;
  if(name==='fire')text+=`window.__updateFunctions.capturePackets=()=>{const codec=${roles['еϲᄄ']},key=${JSON.stringify(roles['ᴎ︅ހ'])},encode=codec[key],socket=${roles['І̎ܘ']},packets=[];codec[key]=p=>{packets.push(p.slice());return '';};${roles['І̎ܘ']}={send(){}};return {packets,restore(){codec[key]=encode;${roles['І̎ܘ']}=socket;}};};`;
  edits.push({at:n.start,text});
 }
 for(const v of Object.values(n)){if(Array.isArray(v))todo.push(...v);else if(v&&typeof v==='object')todo.push(v);}
}
assert.equal(edits.length,Object.keys(functions).length,'Unique browser fixture functions required');
assert.equal(placements.length,1,'One native cursor placement expression required');
const end=tree.body[0].expression.callee.body.end-1;
edits.push({at:end,text:`window.__updateProbe={...window.__updateFunctions,world:${symbols['еܞ︌']},network:${symbols['о̃༩']},entities:${symbols['ι‌̵']},input:${symbols['ρ̃५']},labelFactory:${roles['а̵̠']},types:${symbols['εᚇ๓']},graphics:${symbols['ᴘᚉ٦']},items:${symbols['ιᄅᴄ']},get view(){return __responsiveView},set view(value){__responsiveView=value},get ctx(){return ${symbols['а०̅']}},nativePlacement:()=>${output.slice(placements[0].start,placements[0].end)},nativeMenu:()=>${symbols['ɑᚆᴏ']}};`});
edits.push({at:tree.body[0].expression.callee.body.end-1,text:`window.__updateIntegrityProbe={read:()=>${roles.nativeIntegrityFlag},set:value=>${roles.nativeIntegrityFlag}=value,signers:[${roles.nativeIntegritySigners.join(',')}]};`});
let code=output;for(const e of edits.sort((a,b)=>b.at-a.at))code=code.slice(0,e.at)+e.text+code.slice(e.at);
(async()=>{
 const report={schema:1,status:'failed',output_sha256:hash(output),static_ast:'passed',ilm_core:'identical',resource_override_sha256:hash(overrideBytes),mod_contract:contract,module_sha256:moduleHashes,mod_bundle_sha256:hash(JSON.stringify(moduleHashes)),mode:'native browser fixtures; no live game session',page_errors:[]};
 let browser;
 try{
  const engine=process.env.DEVAST_BROWSER||'chromium';assert.ok(['chromium','firefox'].includes(engine),'Unsupported browser');report.browser=engine;
  const executablePath=process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath());
  const proxy=process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined;
  browser=engine==='firefox'?await firefox.launch({headless:true,proxy,firefoxUserPrefs:{'security.enterprise_roots.enabled':true}}):await chromium.launch({executablePath,headless:true,env:{...process.env,HOME:process.env.DEVAST_BROWSER_HOME||'/tmp/devast-browser-home'},proxy,args:['--no-sandbox','--disable-dev-shm-usage']});
  report.browser_version=browser.version();
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
  await page.exposeFunction('__doorClickMouse',point=>page.mouse.click(point.x,point.y,{button:'right'}));
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
   for(const [mode,on]of [['withAim',false],['withAim',true],['always',false]]){m.menu.__folders['Aim Bot'].__controllers.find(c=>c.property==='ShowRealAngles').setValue(mode);m.setSetting('AimBotEnabled',on);e.angle=0;n.update(e);check(Math.abs(e.angle-((mode==='always'||on)?0.5:2))<1e-8,'Self angle binding failed');}
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
   const surface=document.getElementById('can'),surfaceContext=surface.getContext('2d');surfaceContext.save();
   try{
    surfaceContext.setTransform(1,0,0,1,0,0);surfaceContext.globalAlpha=1;surfaceContext.globalCompositeOperation='source-over';surfaceContext.fillStyle='#456789';surfaceContext.fillRect(0,surface.height-4,4,4);
    const corner=Array.from(surfaceContext.getImageData(0,surface.height-4,4,4).data);
    surfaceContext.setTransform(2,0,0,2,17,23);surfaceContext.globalAlpha=.61;surfaceContext.globalCompositeOperation='multiply';surfaceContext.lineWidth=8;
    const state=()=>JSON.stringify([surfaceContext.getTransform().toString(),surfaceContext.globalAlpha,surfaceContext.globalCompositeOperation,surfaceContext.lineWidth]),before=state();m.render();
    check(!m.overlay,'Native render allocated a second full-screen canvas');check(state()===before,'Native drawing changed the game canvas state');
    check(JSON.stringify(Array.from(surfaceContext.getImageData(0,surface.height-4,4,4).data))===JSON.stringify(corner),'Mod cleared the native game canvas');
   }finally{surfaceContext.restore();}

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
     e.angle=-2;e[r['ᴑ٧ߓ']]=-1;n.update(e);
     check(Math.abs(e.angle-(-2+e[r['ᴎ٨ߍ']]*2))<1e-6,'Firing display differs from original ILM server-angle interpolation');
     const before=JSON.stringify(line);transport.packets.length=0;m.trackPacket(0,2,1,x+5,y+5,true);n.network[r['ᴎ༩༣']]();
     check(JSON.stringify(transport.packets)==='[[4]]'&&JSON.stringify(m.targets.lines[0])===before,'Manual fire inserted a calculation outside the ILM timer');
    }
    // Jitter owns the idle angle, but a real native shot must encode aim first.
    n.input.angle=0;m.setSetting('JitterEnabled',true);m.setSetting('JitterSpeed',360);
    const nativeInput={angle:n.input.angle,x:n.input.x,y:n.input.y,state:n.input.state};
    const jitterNow=performance.now();m.step(jitterNow);m.step(jitterNow+250);m.aim.refresh();
    check(Object.keys(nativeInput).every(k=>n.input[k]===nativeInput[k]),'Jitter overwrote native pointer or movement state');
    check(Math.abs(m.jitterAngle-Math.PI/2)<1e-6,'Jitter rotation speed is disconnected');
    e.angle=0;n.update(e);check(Math.abs(e.angle-m.jitterAngle)<1e-6,'Native player sprite does not rotate with Jitter');
    transport.packets.length=0;n.input.angle=-2;n.network[s['ѕ᠋༢']]();n.network[s['ρ٨٨']]();
    check(transport.packets.length===0,'Native mouse direction overwrote Jitter');
    n.network[r['ᴎ༩༣']]();
    const jitterLine=m.targets.lines[0],jitterShot=(Math.round(Math.atan2(jitterLine.y2-jitterLine.y1,jitterLine.x2-jitterLine.x1)*180/Math.PI)+360)%360;
    check(JSON.stringify(transport.packets)===JSON.stringify([[6,jitterShot],[4]]),'Jitter shot encoded attack before corrected aim');
    check(m.jitterAngle===null,'Jitter continued spinning during a shot');
    transport.packets.length=0;const heldLine=JSON.stringify(m.targets.lines[0]);
    for(let i=0;i<20;i++)n.network[r['ᴎ༩༣']]();
    check(transport.packets.length===20&&transport.packets.every(p=>p.length===1&&p[0]===4),'Repeated native attacks flooded extra aim packets');
    check(JSON.stringify(m.targets.lines[0])===heldLine,'Repeated native attacks recalculated prediction between ILM ticks');
    transport.packets.length=0;m.aim.refresh();check(transport.packets.length===1&&transport.packets[0][0]===6,'Continuous fire lost its ILM aim tick');
    m.setSetting('AimBotEnabled',false);
    const blockedSocket={readyState:1,bufferedAmount:4096};m.observeSocket(blockedSocket);
    await new Promise(resolve=>setTimeout(resolve,160));transport.packets.length=0;
    m.step(performance.now());m.aim.refresh();
    check(transport.packets.length===0,'Jitter added cosmetic directions to a backed-up socket');
    check(m.jitterAngle!==null,'Socket backlog stopped local Jitter rendering');
    blockedSocket.bufferedAmount=0;m.aim.refresh();
    check(transport.packets.length===1&&transport.packets[0][0]===6,'Jitter replayed a queue of stale angles');
    m.observeSocket(null);m.setSetting('JitterEnabled',false);
    m.setSetting('AimBotEnabled',false);transport.packets.length=0;
    m.render(performance.now());const stableRecords=m.records,stableEntries=m.records.slice();m.render(performance.now());
    check(stableEntries.length>0&&m.records===stableRecords&&stableEntries.every((r,i)=>m.records[i]===r),'Frame collection rebuilt stable native entity records');
    const loot=[];for(const id of [10,11]){const drop=n.entities.get(0,id,1,1);Object.assign(drop,{id,x:self.x+10,y:self.y,[s['е̝ހ']]:0,[s['Іࡈ５']]:6});loot.push(drop);}
    try{
     m.setSetting('LootDataEnabled',false);m.setSetting('FAutoLootEnabled',true);m.render(0);m.render(16);
     check(JSON.stringify(transport.packets)===JSON.stringify([[12,10],[12,11],[12,10],[12,11]]),'Native fast loot cadence/bindings differ from ILM');
    }finally{m.setSetting('FAutoLootEnabled',false);for(const id of [10,11])n.entities.remove(0,id,1,1,0);}
    transport.packets.length=0;self.x=1234.5;self.y=5678.25;Object.assign(self,{[s['ε︁ᚂ']]:1,[s['օⲥᚁ']]:1,[s['α०ᚂ']]:3,[s['ρⲅ️']]:40,[s['ᴎ︆ࡉ']]:27});m.setSetting('AutoBuiledEnabled',true);
    try{
     m.step(0);m.step(8);check(transport.packets.length===0,'RAF duplicated native AutoBuild');
     m.render(0);m.render(8);
     check(JSON.stringify(transport.packets)===JSON.stringify([n.nativePlacement(),n.nativePlacement()]),'AutoBuild differs from the native cursor placement cell or rotation');
     self[s['օⲥᚁ']]=0;m.render(16);check(transport.packets.length===2,'AutoBuild sent an invalid native preview');
    }finally{m.setSetting('AutoBuiledEnabled',false);}
    const weapons=n.types[0]?.[s.ilmWeaponTable];
    check(Array.isArray(weapons),'Native weapon table binding failed');
    const weaponIndex=weapons.findIndex(item=>item?.[s.ilmBulletSpeed]===1.4);
    check(weaponIndex>=0,'Native AK-speed metadata binding failed: '+JSON.stringify(Object.entries(n.types).slice(0,5).map(([id,t])=>({id,count:t?.[s.ilmWeaponTable]?.length,speeds:t?.[s.ilmWeaponTable]?.slice(0,25).map(w=>w?.[s.ilmBulletSpeed])}))));
    e[s['Іࡈ５']]=weaponIndex;e[s['е̝ހ']]=0;e.x=1000;e.y=1000;m.setSetting('AimBotEnabled',true);transport.packets.length=0;
    const savedNow=performance.now.bind(performance);let testTime=0;performance.now=()=>testTime;
    try{
     m.trackPacket(0,2,1,0,0,false);m.trackPacket(0,1,1,1000,1000,true);
     for(let i=0;i<3;i++){testTime=i*100;m.trackPacket(0,1,1,1000,1000,true);m.trackPacket(0,2,1,1500,1000+i*40,true);}
     m.render();m.setSetting('ImprovedAimEnabled',false);m.aim.refresh();const legacy=transport.packets.at(-1)[1];m.setSetting('ImprovedAimEnabled',true);m.aim.refresh();
     check(transport.packets.at(-1)[1]>legacy,'Timestamped prediction did not use native weapon speed');
     check(transport.packets.length===2&&transport.packets.every(p=>p[0]===6),'Improved prediction changed direction cadence');
    }finally{performance.now=savedNow;}
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
   const uiKey=s.nativeHomeEnter,nativeUi=nativeMenu[uiKey];let uiReturns=0;
   try{
    check(typeof nativeUi==='function','Native home activation method is unavailable');
    nativeMenu[uiKey]=()=>uiReturns++;
    const now=performance.now();n.network.state=0;check(m.beginPlay(),'Play preparation could not start');
    n.network[s['ϲІ̗']]=true;m.step(now+12001);
    check(uiReturns===1&&n.network.state===0&&!n.network[s['ϲІ̗']],'Timed out preparation left the native loading screen active');
    check(['token','tokenId','userId','accountToken'].every((k,i)=>localStorage.getItem(k)===identityBefore[i]),'Returning from loading changed identity');
   }finally{nativeMenu[uiKey]=nativeUi;}
   const deathKey=s['ι︃２'],nativeDeath=n.network[deathKey],health=w[s['ᴘρࡀ']][s['ᴇ༤ᚆ']].value;let deathCalls=0;
   try{
    n.network[deathKey]=code=>{check(code===128,'Native death error code changed');deathCalls++;};n.death(new Uint8Array([5,0,2]));
    const event=m.connectionInfo().events.at(-1);
    check(event.type==='server-death'&&event.health===health,'Native death lost its pre-handler health snapshot');
    check(event.deathOpcode===5&&event.deathPacketLength===3&&event.deathPrefixHex==='05 00 02','Native death packet was not captured');
    check(deathCalls===1,'Death observation changed native handling');
    check(m.connectionInfo().sessionEnded&&m.connectionInfo().awaitingPlay,'Death did not terminate session restoration');
    n.network.state=64;m.step(performance.now());
    check(n.network.state===0&&m.connectionInfo().phase==='dead','Closed socket revived restore mode after death');
    check(['token','tokenId','userId','accountToken'].every((k,i)=>localStorage.getItem(k)===identityBefore[i]),'Death recovery changed stored identity');
   }finally{n.network[deathKey]=nativeDeath;}
   const drawKey=s['ᴑ̸ᴘ'],originalDraw=n.graphics[drawKey],visualState={id:self.id,state:n.network.state,alpha:n.ctx.globalAlpha};
   try{
    self.id=1;n.network.state=1;m.setSetting('ShowMines',true);m.setSetting('ShowWires',true);
    const sprites=[{testSprite:0},{testSprite:1},{testSprite:2}],descriptor=new Proxy({},{get:()=>sprites});
    const mine={id:5,x:100000,y:120000,[s['ᴘ४１']]:999};
    for(const render of [n.landmineRender,n.wireRender,n.trapRender]){
     const draws=[];n.graphics[drawKey]=(...args)=>draws.push({args,alpha:n.ctx.globalAlpha});n.ctx.globalAlpha=.37;const previousAlpha=n.ctx.globalAlpha;
     render(descriptor,mine,3,4,2,1);
     check(draws.length===1&&draws[0].alpha===1,'Distant received mine/wire is still hidden');
     check(Math.abs(draws[0].args[3]-Math.PI)<1e-9,'Revealed object rotation changed');
     check(n.ctx.globalAlpha===previousAlpha,'Reveal leaked canvas alpha');
    }
   }finally{n.graphics[drawKey]=originalDraw;self.id=visualState.id;n.network.state=visualState.state;n.ctx.globalAlpha=visualState.alpha;}
   const doorTransport=n.capturePackets(),doorState=n.network.state,doorRecords=m.records.slice(),doorView=n.view,doorRender=m.render;
   const doorKeys=['id',s['І๔︊'],s['ⲟܐ༠'],s['с̣ߏ'],s['ࡀ︂̄']];
   const doorSaved=doorKeys.map(key=>[key,Object.hasOwn(self,key),self[key]]),hidden=[];
   const doorSettings=Object.fromEntries(['AimBotEnabled','autoFire','JitterEnabled'].map(key=>[key,m.settings[key]]));
   let hitLayer;
   try{
    n.network.state=1;self.id=1;self[s['І๔︊']]=2;self[s['ⲟܐ༠']]=77;self[s['с̣ߏ']]=1;self[s['ࡀ︂̄']]=15;
    m.setSetting('OpenEverythingByClick',true);
    for(const key of Object.keys(doorSettings))m.setSetting(key,false);
    // Keep this native-client fixture stable while a real browser mouse event
    // travels through DOM hit testing and the capture/bubble event path.
    m.render=()=>{};n.view=Object.freeze({x:0,y:0,scale:1,ctx:n.ctx});
    const item=n.items.findIndex(d=>d?.detail?.name==='Wooden Door');check(item>=0,'Native manual door descriptor missing');
    const first={id:77,x:150,y:250,state:0,[s['е̝ހ']]:0,[s['Іࡈ５']]:item<<7,[s['ᴘ४１']]:1,[s['αބ̞']]:1,[s['ᴀܛ٤']]:2};
    const door={...first,id:78,x:250,[s['αބ̞']]:2};m.records.length=0;m.records.push({type:3,e:first},{type:3,e:door});
    const canvas=n.ctx.canvas,rect=canvas.getBoundingClientRect();
    function pointDoor(){
     const v=n.view,ratio=n.graphics.options[s['еߎ༢']]||1,scale=v.scale*ratio;
     const px=((door[s['αބ̞']]+.5)*100+v.x)*scale,py=((door[s['ᴀܛ٤']]+.5)*100+v.y)*scale;
     return {x:rect.left+px*rect.width/canvas.width,y:rect.top+py*rect.height/canvas.height};
    }
    function pressDoor(){const p=pointDoor();return canvas.dispatchEvent(new MouseEvent('mousedown',{button:2,bubbles:true,cancelable:true,clientX:p.x,clientY:p.y}));}
    const before=JSON.stringify(doorKeys.map(k=>self[k]));
    doorTransport.packets.length=0;check(pressDoor()===false,'Right click did not consume the hovered door request');
    check(JSON.stringify(doorTransport.packets)==='[[15,78,1]]','Right click selected the E door instead of the hovered second door');
    canvas.dispatchEvent(new MouseEvent('contextmenu',{button:2,bubbles:true,cancelable:true}));check(doorTransport.packets.length===1,'Contextmenu duplicated the door request');
    check(door.state===0&&JSON.stringify(doorKeys.map(k=>self[k]))===before,'Door request changed native selection or faked server confirmation');
    for(const state of [-1,0,1]){self[s['І๔︊']]=state;doorTransport.packets.length=0;pressDoor();check(JSON.stringify(doorTransport.packets)==='[[15,78,1]]','Request still depends on the native E selector');}
    self[s['І๔︊']]=2;door[s['ᴘ४１']]=2;doorTransport.packets.length=0;pressDoor();check(JSON.stringify(doorTransport.packets)==='[[15,78,2]]','Client filtered the hovered door before server validation');door[s['ᴘ४１']]=1;
    // Match an in-game DOM: home panels hidden, canvas receiving pointer input.
    for(const el of document.body.children)if(el!==canvas){hidden.push([el,el.style.display]);el.style.display='none';}
    const p=pointDoor();check(document.elementFromPoint(p.x,p.y)===canvas,'Door fixture is covered by an unrelated home panel');
    hitLayer=document.createElement('div');Object.assign(hitLayer.style,{position:'fixed',left:(p.x-10)+'px',top:(p.y-10)+'px',width:'20px',height:'20px',zIndex:'200000'});document.body.appendChild(hitLayer);
    doorTransport.packets.length=0;await window.__doorClickMouse(p);
    const requests=doorTransport.packets.filter(packet=>packet[0]===15);
    check(JSON.stringify(requests)==='[[15,78,1]]','A real mouse press through a game surface wrapper failed to request the hovered door');
    check(door.state===0,'Real mouse request faked an open door without a server update');
   }finally{
    hitLayer?.remove();for(const [el,display]of hidden)el.style.display=display;
    n.view=doorView;m.render=doorRender;for(const [key,value]of Object.entries(doorSettings))m.setSetting(key,value);
    doorTransport.restore();n.network.state=doorState;m.records.length=0;m.records.push(...doorRecords);
    for(const [key,present,value]of doorSaved){if(present)self[key]=value;else delete self[key];}
   }
   const integrity=window.__updateIntegrityProbe,networkSnapshot={...n.network},savedIntegrity=integrity.read();
   function restoreIntegrityNetwork(){for(const key of Object.keys(n.network))if(!Object.hasOwn(networkSnapshot,key))delete n.network[key];Object.assign(n.network,networkSnapshot);}
   try{
    for(const signer of integrity.signers){
     const values=[];
     for(const flag of [0,1]){
      restoreIntegrityNetwork();integrity.set(flag);signer('integrity-fixture');
      values.push(JSON.stringify(Object.fromEntries(Object.entries(n.network).filter(([,value])=>['number','boolean','string'].includes(typeof value)))));
     }
     check(values[0]===values[1],'Integrity flag still changes a native signature');
    }
   }finally{restoreIntegrityNetwork();integrity.set(savedIntegrity);}
   check(m.connectionInfo().integrityCompatibility===true,'Automatic build omitted native signature compatibility');
   check(!m.diagnostics.errors.length,'Mod reported errors');
   return {menu:true,right_click_hovered_door:true,right_click_without_native_prompt:true,right_click_real_mouse:true,native_shared_canvas:true,adaptive_weapon_prediction:true,initial_metadata:true,head_and_leaderboard_labels:true,packet_history:true,packet_removal:true,self_angle_modes:true,native_clan_colors_and_cache:true,native_nickname_color_and_cache:true,full_player_list_and_native_lifecycle:true,native_shot_matches_ilm_line:true,jitter_rotation_and_shot_priority:true,jitter_preserves_native_input:true,jitter_socket_backpressure:true,stable_frame_entity_records:true,firing_display_original_ilm_interpolation:true,continuous_fire_ilm_cadence:true,ilm_manual_fire_cadence:true,disconnect_preserves_aim_history:true,native_fast_loot_cadence:true,native_autobuild_cursor_preview:true,native_rejoin_identity:true,native_ad_failure_recovery:true,native_death_observation:true,death_stops_restore_retries:true,mod_errors:[...m.diagnostics.errors]};
  },{s:symbols,r:roles});
  assert.equal(report.page_errors.length,0,'Browser page errors');report.world_visibility={status:'passed',native_renderers:3};report.integrity_compatibility={status:'passed',predicates:3};report.status='passed';
 }catch(error){report.error=error.message;process.exitCode=1;}
 finally{report.finished_at=new Date().toISOString();fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(browser)await browser.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
