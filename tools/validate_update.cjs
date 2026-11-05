// Gate an immutable candidate with static checks and real native browser fixtures.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),z=require('node:zlib');
const acorn=require('./parser.cjs'),{hash}=require('./build_client.cjs'),{translate}=require('./translate_payload.cjs');
const {chromium,firefox}=require('playwright-core');
const {elapsedTimer}=require('./updater/network-contracts.cjs');
const root=path.resolve(__dirname,'..'),dir=path.resolve(process.argv[2]||'');
const read=f=>fs.readFileSync(path.join(dir,f),'utf8'),json=f=>JSON.parse(read(f));
const overrideBytes=fs.readFileSync(path.join(root,'resource-override/Devast-io-GitHub-Resource-Override.json'));
const override=JSON.parse(overrideBytes);
assert.equal(override.v,1);assert.equal(override.data[0].rules[0].type,'fileOverride');
const output=read('game.modded.js'),profile=json('profile.json'),symbols=json('bindings.json').symbols,roles=json('roles.json'),source=json('source.json');
const contract=JSON.parse(fs.readFileSync(path.join(root,'mod/contract.json')));
const moduleHashes=Object.fromEntries(contract.modules.map(file=>[file,hash(fs.readFileSync(path.join(root,file)))]));
const nativeAnalysis=require('./updater/static.cjs').analyze(output),tree=nativeAnalysis.tree,body=tree.body[0]?.expression?.callee?.body?.body;
assert.equal(profile.operations.filter(op=>op.id.startsWith('native-integrity-signature-')).length,3,'All three native signature compatibility operations are required');
assert.equal(roles.nativeIntegritySigners?.length,3,'Three reviewed native signers required');
assert.ok(body,'Full native client IIFE required');
for(const name of ['__installDevastMod','__createMessage15Aim'])assert.equal(body.filter(n=>n.id?.name===name).length,1);
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
const reference=require('./audit_message15.cjs').reference();
require('./audit_message15.cjs').audit(read('ilm-aim.js'),installerSource);
for(const block of reference.blocks)assert.ok(output.includes(block.source),'Missing exact source block: '+block.label);
assert.equal(hash(read('native.js')),profile.baseline_sha256);
assert.deepEqual(profile.operations.map(p=>p.id),JSON.parse(fs.readFileSync(path.join(root,'patches/recovered-current.json'))).operations.map(p=>p.id).concat(['native-integrity-signature-0','native-integrity-signature-1','native-integrity-signature-2','message15-native-afterRelease','message15-native-onMove','message15-handshake','message15-session-start']),'Every reviewed native patch is required');
const functions={'ι๔̶':'spawn','ᴄ９̗':'headLabel','ⲅ︉️':'leaderLabel','ᴄߌ͏':'update','ⲟ१̖':'packet','ᴎܕα':'nameTag','ᴎ༩༣':'fire','ԁ̶ϲ':'release','ѕ٨ᚄ':'joinPayload','рܙ๕':'death','ᅟ᠌５':'leave','ᴀᄁ︃':'landmineRender','рոᴎ':'wireRender','ᅠ̘ܛ':'trapRender'};
const closeOperation=profile.operations.find(p=>p.id==='native-disconnect-without-socket');
const closeName=acorn.parse(closeOperation.after,{ecmaVersion:'latest'}).body[0].id.name;
functions[closeName]='nativeClose';functions[roles.messageMove]='move';functions[roles.messageHandshake]='handshake';
const edits=[],placements=[],todo=[tree];while(todo.length){const n=todo.pop();if(!n||typeof n!=='object')continue;
 if(n.type==='ArrayExpression'&&nativeAnalysis.constant(n.elements[0])===14&&n.elements.length===4&&n.elements[1]?.object?.type==='MemberExpression')placements.push(n);
 if(n.type==='FunctionDeclaration')for(const [old,name]of Object.entries(functions))if(n.id.name===(name==='nativeClose'?closeName:(roles[old]||old))){
  let text=`window.__updateFunctions=window.__updateFunctions||{};window.__updateFunctions.${name}=${n.id.name};`;
  if(name==='fire')text+=`window.__updateFunctions.capturePackets=()=>{const codec=${roles['еϲᄄ']},key=${JSON.stringify(roles['ᴎ︅ހ'])},encode=codec[key],socket=${roles['І̎ܘ']},packets=[];codec[key]=p=>{packets.push(p.slice());return '';};${roles['І̎ܘ']}={send(){}};return {packets,restore(){codec[key]=encode;${roles['І̎ܘ']}=socket;}};};`;
  if(name==='nativeClose')text+=`window.__updateFunctions.exerciseNativeClose=readyState=>{const previous=${roles['І̎ܘ']};let closes=0;const socket={readyState,close(){closes++;}};${roles['І̎ܘ']}=socket;__responsiveMod.observeSocket(socket);try{${n.id.name}();return closes;}finally{${roles['І̎ܘ']}=previous;__responsiveMod.observeSocket(previous);}};`;
  edits.push({at:n.start,text});
 }
 for(const v of Object.values(n)){if(Array.isArray(v))todo.push(...v);else if(v&&typeof v==='object')todo.push(v);}
}
assert.equal(edits.length,Object.keys(functions).length,'Unique browser fixture functions required');
// Derive the idle-ping clock from the native JSON sender, without hard-coding
// obfuscated variable names. The probe exists only in this browser fixture.
const networkDefinition=body.flatMap(n=>n.type==='VariableDeclaration'?n.declarations:[]).find(n=>n.id.name===symbols['о̃༩']);
const networkBody=networkDefinition.init.callee.body.body,networkReturn=networkBody.find(n=>n.type==='ReturnStatement');
const senderEntry=networkReturn.argument.properties.find(p=>(p.key.name??p.key.value)===symbols['ᴎᚂρ']);
const senderDefinition=networkBody.find(n=>n.type==='FunctionDeclaration'&&n.id.name===senderEntry.value.name);
const assignment=senderDefinition.body.body[0].expression;
assert.ok(assignment?.type==='AssignmentExpression'&&assignment.left.type==='Identifier'&&assignment.right.type==='Identifier','Native send clock changed');
const lastActivity=assignment.left.name,nativeNow=assignment.right.name,idleMatches=[];
for(const fn of networkBody.filter(n=>n.type==='FunctionDeclaration')){
 const pending=[fn.body];while(pending.length){const n=pending.pop();if(!n||typeof n!=='object')continue;
  const limit=elapsedTimer(n,nativeNow,lastActivity);if(limit)idleMatches.push({fn,limit});
  for(const v of Object.values(n)){if(Array.isArray(v))pending.push(...v);else if(v&&typeof v==='object')pending.push(v);}
 }
}
assert.equal(idleMatches.length,1,'Unique native idle ping required');const idle=idleMatches[0];
edits.push({at:idle.fn.start,text:`window.__updateFunctions=window.__updateFunctions||{};window.__updateFunctions.idleProbe={read:()=>({now:${nativeNow},activity:${lastActivity},limit:${idle.limit}}),setNow:value=>{${nativeNow}=value},restore:value=>{${nativeNow}=value.now;${lastActivity}=value.activity},ping:()=>${idle.fn.id.name}()};`});
assert.equal(placements.length,1,'One native cursor placement expression required');
const end=tree.body[0].expression.callee.body.end-1;
edits.push({at:end,text:`window.__updateProbe={...window.__updateFunctions,keyboard:${roles.messageKeyboard},world:${symbols['еܞ︌']},network:${symbols['о̃༩']},entities:${symbols['ι‌̵']},input:${symbols['ρ̃५']},labelFactory:${roles['а̵̠']},types:${symbols['εᚇ๓']},graphics:${symbols['ᴘᚉ٦']},items:${symbols['ιᄅᴄ']},get view(){return __responsiveView},set view(value){__responsiveView=value},get ctx(){return ${symbols['а०̅']}},nativePlacement:()=>${output.slice(placements[0].start,placements[0].end)},nativeMenu:()=>${symbols['ɑᚆᴏ']}};`});
edits.push({at:tree.body[0].expression.callee.body.end-1,text:`window.__updateIntegrityProbe={read:()=>${roles.nativeIntegrityFlag},set:value=>${roles.nativeIntegrityFlag}=value,signers:[${roles.nativeIntegritySigners.join(',')}]};`});
let code=output;for(const e of edits.sort((a,b)=>b.at-a.at))code=code.slice(0,e.at)+e.text+code.slice(e.at);
(async()=>{
 const report={schema:1,status:'failed',output_sha256:hash(output),static_ast:'passed',message15_core:'byte-identical source declarations',resource_override_sha256:hash(overrideBytes),mod_contract:contract,module_sha256:moduleHashes,mod_bundle_sha256:hash(JSON.stringify(moduleHashes)),mode:'native browser fixtures; no live game session',page_errors:[]};
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
    for(const [k,v]of Object.entries({token:'fixture-original-token',tokenId:'123',userId:'2',serverVersion:'previous-version',BestModMenuConfig:JSON.stringify({mouseFov:777,zoomFactor:.8,OpenEverythingByClick:false}),'BestModMenuConfig:ilm2':'1','BestModMenuConfig:loot':JSON.stringify({steel:false})}))localStorage.setItem(k,v);
    localStorage.setItem('fixture-seeded','1');
   }
  });
  await page.route(source.page_url,r=>r.fulfill({status:200,contentType:'text/html',body:read('index.html')}));
  await page.route(source.script_url,r=>r.fulfill({status:200,contentType:'text/javascript',body:override.data[0].rules[0].file}));
  await page.route(url=>url.hostname==='raw.githubusercontent.com'&&url.pathname==='/Abricos2050934/Devast-io/updates/game.modded.js',r=>r.fulfill({status:200,contentType:'text/plain',headers:{'access-control-allow-origin':'*'},body:code}));
  await page.addInitScript('window.__verifyMessage15Aim='+require('./verify_message15_aim.cjs').verifyMessage15Aim.toString());
  await page.addInitScript('window.__verifyMessage15Extra='+require('./verify_message15_extra.cjs').verifyMessage15Extra.toString());
  await page.addInitScript('window.__verifyMessage15Transport='+require('./verify_message15_transport.cjs').verifyMessage15Transport.toString());
  await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>raf(time=>{if(!window.__numericPauseWorld)callback(time);});});
  await page.goto(source.page_url,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForFunction(()=>!!window.__updateProbe&&!!window.__devastMod?.menu,{timeout:25000});
  report.reload_identity=[];
  for(let attempt=0;attempt<3;attempt++){
   if(attempt)await page.reload({waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(key=>!!window.__devastMod?.menu&&typeof window.__updateProbe?.network[key]==='function',symbols['ᅠϲ᠍'],{timeout:25000});
   const kept=await page.evaluate(()=>({token:localStorage.getItem('token')==='fixture-original-token',tokenId:localStorage.getItem('tokenId')==='123',userId:localStorage.getItem('userId')==='2',cookie:document.cookie.includes('devast_fixture_cookie=retained'),settings:window.__devastMod.settings.mouseFov===(localStorage.getItem('DevastMessage15:aim:v1')?JSON.parse(localStorage.getItem('DevastMessage15:aim:v1')).mouseFov:696969)&&window.__devastMod.settings.zoomFactor===.8,loot:!window.__devastMod.loot.steel.acquire}));
   assert.ok(Object.values(kept).every(Boolean),'Native startup changed the saved identity or migrated settings');report.reload_identity.push(kept);
   await page.evaluate(()=>window.__devastMod.setSetting('zoomFactor',.8));
  }
  assert.equal(await page.evaluate(()=>window.__devastRemoteLoader?.state),'loaded','Resource Override loader failed');
  report.resource_override_loader='passed';
  report.client_build=await page.evaluate(()=>window.__devastMod.connectionInfo().build);
  assert.match(report.client_build.fingerprint,/^[a-f0-9]{64}$/);assert.equal(report.client_build.nativeSha256,profile.baseline_sha256);
  await page.exposeFunction('__doorClickMouse',point=>page.mouse.click(point.x,point.y,{button:'right'}));
  report.native=await page.evaluate(async ({s,r,originalAim})=>{
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
   for(const [mode,on]of [['withAim',false],['withAim',true],['always',false]]){m.menu.__folders['Best Aim Bot #1'].__controllers.find(c=>c.property==='ShowRealAngles').setValue(mode);m.setSetting('AimBotEnabled',on);e.angle=0;n.update(e);check(Math.abs(e.angle-((mode==='always'||on)?0.5:2))<1e-8,'Self angle binding failed');}
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
    m.messageAimVerification=window.__verifyMessage15Aim(m,n,s,r,originalAim);
    check(m.messageAimVerification.comparison_points>1400,'Incomplete imported source comparison');
    m.messageAimExtra=window.__verifyMessage15Extra(m,n,s,originalAim);
    m.messageTransportVerification=window.__verifyMessage15Transport(m,n,s,r);
    m.setSetting('AimBotEnabled',false);m.setSetting('JitterEnabled',false);m.setSetting('jitterActive',false);m.aim.mouseDown=false;
    const blockedSocket={readyState:1,bufferedAmount:4096};transport.packets.length=0;
    m.render(performance.now());const stableRecords=m.records,stableEntries=m.records.slice();m.render(performance.now());
    check(stableEntries.length>0&&m.records===stableRecords&&stableEntries.every((r,i)=>m.records[i]===r),'Frame collection rebuilt stable native entity records');
    const loot=[];for(const id of [10,11]){const drop=n.entities.get(0,id,1,1);Object.assign(drop,{id,x:self.x+10,y:self.y,[s['е̝ހ']]:0,[s['Іࡈ５']]:6});loot.push(drop);}
    try{
     m.setSetting('LootDataEnabled',false);m.setSetting('FAutoLootEnabled',true);
     blockedSocket.bufferedAmount=4096;m.observeSocket(blockedSocket);m.render(0);m.render(16);check(transport.packets.length===0,'Fast loot grew the socket backlog');
     m.observeSocket(null);m.render(0);m.render(16);
     check(JSON.stringify(transport.packets)===JSON.stringify([[12,10],[12,11],[12,10],[12,11]]),'Native fast loot cadence/bindings differ from ILM');
    }finally{m.setSetting('FAutoLootEnabled',false);for(const id of [10,11])n.entities.remove(0,id,1,1,0);}
    transport.packets.length=0;self.x=1234.5;self.y=5678.25;Object.assign(self,{[s['ε︁ᚂ']]:1,[s['օⲥᚁ']]:1,[s['α०ᚂ']]:3,[s['ρⲅ️']]:40,[s['ᴎ︆ࡉ']]:27});m.setSetting('AutoBuiledEnabled',true);
    try{
     m.step(0);m.step(8);check(transport.packets.length===0,'RAF duplicated native AutoBuild');
     blockedSocket.bufferedAmount=4096;m.observeSocket(blockedSocket);m.render(0);m.render(8);check(transport.packets.length===0,'AutoBuild grew the socket backlog');
     m.observeSocket(null);m.render(0);m.render(8);
     check(JSON.stringify(transport.packets)===JSON.stringify([n.nativePlacement(),n.nativePlacement()]),'AutoBuild differs from the native cursor placement cell or rotation');
     self[s['օⲥᚁ']]=0;m.render(16);check(transport.packets.length===2,'AutoBuild sent an invalid native preview');
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
   const deathCapture=n.capturePackets(),deathSettings=Object.fromEntries(['AimBotEnabled','autoFire','JitterEnabled'].map(k=>[k,m.settings[k]]));
   try{
    n.network.state=1;self.id=1;m.setSetting('AimBotEnabled',true);m.setSetting('autoFire',true);
    n.network[deathKey]=code=>{check(code===128,'Native death error code changed');deathCalls++;};n.death(new Uint8Array([5,0,2]));
    const event=m.connectionInfo().events.at(-1);
    check(event.type==='server-death'&&event.health===health,'Native death lost its pre-handler health snapshot');
    check(event.deathOpcode===5&&event.deathPacketLength===3&&event.deathPrefixHex==='05 00 02','Native death packet was not captured');
    check(deathCalls===1,'Death observation changed native handling');
    check(deathCapture.packets.length===0,'Handling server death sent a command');
    for(let i=0;i<50;i++){m.aim.refresh();m.beforeFire();}
    check(deathCapture.packets.length===0&&!m.controlsAimDirection,'Terminated session kept sending combat packets');
    check(m.connectionInfo().sessionEnded&&m.connectionInfo().awaitingPlay,'Death did not terminate session restoration');
    n.network.state=64;m.step(performance.now());
    check(n.network.state===0&&m.connectionInfo().phase==='dead','Closed socket revived restore mode after death');
    check(['token','tokenId','userId','accountToken'].every((k,i)=>localStorage.getItem(k)===identityBefore[i]),'Death recovery changed stored identity');
   }finally{deathCapture.restore();n.network[deathKey]=nativeDeath;for(const [k,v]of Object.entries(deathSettings))m.setSetting(k,v);}
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
   const doorClock=performance.now.bind(performance),doorNow=performance.now();
   const doorIdentity=[{object:self,key:'id',value:1},{object:n.network,key:'state',value:1}].map(entry=>({...entry,descriptor:Object.getOwnPropertyDescriptor(entry.object,entry.key)}));
   let hitLayer;
   try{
    // The real mouse bridge may take longer than the fixture's 1.5 s door
    // confirmation timeout. Timeout behavior is covered by door-click.test;
    // hold this unrelated clock fixed while testing DOM event delivery.
    performance.now=()=>doorNow;
    // Earlier login-recovery fixtures queue native home callbacks. Keep this
    // independent door scene alive while Playwright delivers real mouse input.
    for(const entry of doorIdentity)Object.defineProperty(entry.object,entry.key,{configurable:true,enumerable:true,get:()=>entry.value,set(){}});
    n.network.state=1;self.id=1;self[s['І๔︊']]=2;self[s['ⲟܐ༠']]=77;self[s['с̣ߏ']]=1;self[s['ࡀ︂̄']]=15;
    m.setSetting('OpenEverythingByClick',false);check(m.settings.RightClickDoors===true,'New door control inherited the disabled generic interaction setting');
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
    check(JSON.stringify(requests)==='[[15,78,1]]','A real mouse press through a game surface wrapper failed to request the hovered door: '+JSON.stringify({requests,state:n.network.state,self:self.id,feedback:m.doorInteraction.status}));
    check(door.state===0&&m.doorInteraction.status==='requested','Real mouse request faked an open door without a server update');
    // Apply the authoritative entity-state fixture after the request.
    door.state=16;check(m.doorInteraction.status==='confirmed'&&m.doorInteraction.message==='Дверь открыта','Confirmed door state did not reach the click feedback: '+JSON.stringify({feedback:m.doorInteraction,records:m.records.map(r=>({type:r.type,id:r.e.id,owner:r.e[s['ᴘ४１']],state:r.e.state,same:r.e===door})),network:n.network.state,self:self.id}));
    check(m.settings.OpenEverythingByClick===false,'Door action changed the generic interaction preference');
   }finally{
    performance.now=doorClock;
    for(const entry of doorIdentity){if(entry.descriptor)Object.defineProperty(entry.object,entry.key,entry.descriptor);else delete entry.object[entry.key];}
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
   const diagnosticNetwork={...n.network};
   try{
    check(n.exerciseNativeClose(1)===1,'Diagnostics suppressed a native close');
    const observed=m.connectionInfo().events.at(-1);
    check(observed.type==='client-close-request'&&observed.source==='native-network-close','Native close origin was not recorded');
    const beforeClosedSocket=JSON.stringify(m.connectionInfo().events);
    check(n.exerciseNativeClose(3)===1&&JSON.stringify(m.connectionInfo().events)===beforeClosedSocket,'Remote close was incorrectly recorded as a local request');
    check(m.connectionInfo().build.fingerprint.length===64,'Connection report omitted build identity');
   }finally{Object.assign(n.network,diagnosticNetwork);}
   check(!m.diagnostics.errors.length,'Mod reported errors');
   return {message15_comparison:m.messageAimVerification,message15_extra:m.messageAimExtra,message15_transport:m.messageTransportVerification,menu:true,connection_close_origin_diagnostics:true,automation_socket_backpressure:true,aim_cycle_socket_backpressure:true,server_death_sends_no_commands:true,right_click_hovered_door:true,right_click_without_native_prompt:true,right_click_real_mouse:true,independent_door_control:true,door_server_state_feedback:true,native_shared_canvas:true,initial_metadata:true,head_and_leaderboard_labels:true,packet_history:true,packet_removal:true,self_angle_modes:true,native_clan_colors_and_cache:true,native_nickname_color_and_cache:true,full_player_list_and_native_lifecycle:true,stable_frame_entity_records:true,native_fast_loot_cadence:true,native_autobuild_cursor_preview:true,native_rejoin_identity:true,native_ad_failure_recovery:true,native_death_observation:true,death_stops_restore_retries:true,mod_errors:[...m.diagnostics.errors]};
  },{s:symbols,r:roles,originalAim:reference});
  report.physical_numeric=await require('./verify_message15_physical.cjs').verifyPhysical(page,symbols);
  assert.equal(report.page_errors.length,0,'Browser page errors');report.world_visibility={status:'passed',native_renderers:3};report.integrity_compatibility={status:'passed',predicates:3};report.status='passed';
 }catch(error){report.error=error.message;process.exitCode=1;}
 finally{report.finished_at=new Date().toISOString();fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(browser)await browser.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
