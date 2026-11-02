// Execute only the readable extracted mod against fixtures, never the game bundle.
const test = require('node:test');
const assert = require('node:assert/strict');

const {fixture,scene,player,menu,control}=require('./mod-fixture.cjs');

test('settings persist, transient account fields are excluded, loot modes exclude each other', () => {
  const f = fixture();
  f.mod.setSetting('SAutoLootEnabled', true);
  f.mod.setSetting('FAutoLootEnabled', true);
  assert.equal(f.mod.settings.SAutoLootEnabled, false);
  const saved = JSON.parse(f.storage.get('DevastILM:settings:v3'));
  assert.equal(saved.FAutoLootEnabled, true);
  for (const key of ['Token', 'token', 'tokenId', 'userId']) assert.equal(Object.hasOwn(saved, key), false);
  assert.throws(() => f.mod.setSetting('mouseFov', NaN));
  assert.throws(() => f.mod.setSetting('missing', true));
  f.mod.dispose();
});

test('packet history drives the same prediction line and angle; offset changes the result', () => {
  const f = fixture();
  f.mod.trackPacket(1, 1, 0, 10, 20, true);
  f.mod.trackPacket(1, 2, 0, 100, 20, true);
  f.mod.trackPacket(1, 2, 0, 110, 30, true);
  f.mod.setSetting('lockId', 2);
  const angle = f.mod.aim.resolve();
  const line = f.mod.targets.lines[0];
  assert.equal(angle, Math.round(Math.atan2(line.y2 - line.y1, line.x2 - line.x1) * 180 / Math.PI));
  const before = line.y2;
  f.mod.setSetting('offsetCoefficient', 2);
  f.mod.aim.resolve();
  assert.notEqual(line.y2, before);
  f.mod.dispose();
});

test('disabled aim and disconnected state send no aim packets', () => {
  const f = fixture();
  f.mod.trackPacket(1, 1, 0, 10, 20, true);
  f.mod.trackPacket(1, 2, 0, 110, 30, true);
  f.mod.setSetting('lockId', 2);
  f.mod.aim.refresh();
  assert.equal(f.packets.length, 0);
  f.mod.setSetting('AimBotEnabled', true);
  f.mod.aim.refresh();
  assert.equal(f.packets.length, 1);
  assert.equal(f.packets[0][0], 6);
  f.network.state = 64;
  f.mod.aim.refresh();
  assert.equal(f.packets.length, 1);
  f.mod.dispose();
});

test('hotkeys ignore text input and toggle outside text fields', () => {
  const f = fixture();
  const keydown = [...f.listeners.get('keydown')][0];
  keydown({code: 'Space', target: {tagName: 'INPUT'}});
  assert.equal(f.mod.settings.AimBotEnabled, false);
  keydown({code: 'Space', target: {tagName: 'CANVAS'}});
  assert.equal(f.mod.settings.AimBotEnabled, true);
  f.mod.dispose();
});

test('dispose removes timers, frame callbacks and registered event handlers', () => {
  const f = fixture();
  assert.equal(f.timers.size, 1);
  assert.equal(f.frames.size, 1);
  f.mod.dispose();
  assert.equal(f.timers.size, 0);
  assert.equal(f.frames.size, 0);
  assert.equal([...f.listeners.values()].reduce((n,s) => n+s.size, 0), 0);
});

test('ILM retains last angle without a target; native input resumes after disabling and dispose',()=>{
  const g=fixture();const wrapper=g.network['ѕ᠋༢'];
  g.mod.trackPacket(1,1,0,10,20,true);g.mod.setSetting('AimBotEnabled',true);g.mod.aim.refresh();
  assert.deepEqual(g.packets,[[6,0]]);
  g.network['ѕ᠋༢']();assert.equal(g.nativeCalls,1);
  g.mod.setSetting('AimBotEnabled',false);g.network['ѕ᠋༢']();assert.equal(g.nativeCalls,2);
  g.mod.dispose();assert.equal(g.network['ѕ᠋༢'],wrapper);
  g.network['ѕ᠋༢']();assert.equal(g.nativeCalls,3);
});

test('ILM fast loot sends all in-range drops each frame without the native selected-item restriction',()=>{
 const f=fixture();scene(f,2,[
  ...[10,11,12].map(id=>({id,x:20,y:0,'е̝ހ':0,'Іࡈ５':6})),
  {id:13,x:Math.sqrt(41000),y:1,'е̝ހ':0,'Іࡈ５':6},
  {id:14,x:20,y:0,'е̝ހ':1,'Іࡈ５':6}
 ]);
 Object.assign(f.world['ᅠᏧ‍'],{'І๔︊':-1,'ιᄁ८':999});
 f.mod.setSetting('FAutoLootEnabled',true);
 for(const at of [0,16,32]){f.mod.render(at);assert.deepEqual(f.packets.slice(-3),[[12,10],[12,11],[12,12]]);}
 assert.equal(f.packets.length,9);
 scene(f,2,[{id:11,x:20,y:0,'е̝ހ':0,'Іࡈ５':6}]);f.mod.render(48);assert.deepEqual(f.packets.slice(9),[[12,11]]);
 f.mod.setSetting('FAutoLootEnabled',false);f.mod.render(64);assert.equal(f.packets.length,10);
 f.mod.setSetting('FAutoLootEnabled',true);f.network.state=64;f.mod.render(80);assert.equal(f.packets.length,10);f.mod.dispose();
});

test('fast loot menu filter applies immediately to every drop, independently of cursor interaction',()=>{
 const f=fixture({dom:true}),gui=menu(f),automation=gui.__folders.Automation;
 control(automation,'FAutoLootEnabled').setValue(true);control(automation,'LootDataEnabled').setValue(true);
 const steel=automation.__folders['Loot filter'].__controllers.find(c=>c.object===f.mod.loot.steel);
 steel.setValue(false);scene(f,2,[{id:10,x:10,y:0,'е̝ހ':0,'Іࡈ５':6}]);
 f.mod.render(0);assert.equal(f.packets.length,0);steel.setValue(true);
 f.mod.render(16);assert.deepEqual(f.packets,[[12,10]]);
 f.mod.loot.steel.acquire=false;f.mod.setSetting('LootDataEnabled',false);f.mod.render(32);assert.deepEqual(f.packets,[[12,10],[12,10]]);f.mod.dispose();
});

test('zoom persists across reload; invalid ranges and choices are rejected; conflicting key bindings swap',()=>{
 const f=fixture();f.mod.setSetting('zoomFactor',.5);f.mod.setSetting('AimbotKey','KeyH');
 assert.equal(f.mod.settings.ModMenuKey,'Space');
 assert.throws(()=>f.mod.setSetting('distanceCoefficient',0));assert.equal(f.mod.settings.distanceCoefficient,300);
 assert.throws(()=>f.mod.setSetting('target','unknown'));assert.throws(()=>f.mod.setSetting('lockId',1.5));
 const g=fixture({saved:Object.fromEntries(f.storage)});assert.equal(g.mod.settings.zoomFactor,.5);assert.equal(g.mod.settings.AimbotKey,'KeyH');assert.equal(g.mod.settings.ModMenuKey,'Space');
 f.mod.dispose();g.mod.dispose();
});

test('mouse wheel updates the saved zoom setting through the same setter',()=>{
 const f=fixture({dom:true});const callback=[...f.dom.canvas.listeners.get('wheel')][0];
 callback({ctrlKey:false,deltaY:100,deltaMode:0,preventDefault(){},stopImmediatePropagation(){}});
 assert.ok(f.mod.settings.zoomFactor<1);assert.equal(JSON.parse(f.storage.get('DevastILM:settings:v3')).zoomFactor,f.mod.settings.zoomFactor);f.mod.dispose();
});

test('map names, ID 120, clan/name colors, gauges, hitboxes and real-angle display use real fixture data',()=>{
 const f=fixture({dom:true});
 f.world['ᴎ︃ᄉ'][120]={'ο̏︇':'','а༤̘':0,'ᴌ̗ⲟ':7};f.world['ﾠࡅ‍'][0]={name:'CLAN','ոᚄރ':7};
 f.world['ᴘρࡀ']={'ᴇ༤ᚆ':{value:75},'ոߎᚉ':{value:60},'օᴑ̸':{value:40},'ᴏ︀ރ':{value:20}};
 const self=player(1);self.angle=Math.PI/2;scene(f,1,[self,player(120,100,0)]);
 f.mod.setSetting('NicknameColor','#123456');f.mod.setSetting('EnemyClanColor','#654321');
 f.mod.setSetting('ShowPlayerHitbox',true);f.mod.setSetting('ShowRealAngles','always');f.mod.setSetting('PlayersListEnabled',true);f.mod.step(0);
 assert.ok(f.dom.calls.some(c=>c.name==='fillText'&&c.args[0]==='#120'&&c.fill==='#123456'));
 assert.ok(f.dom.calls.some(c=>c.name==='fillText'&&c.args[0]==='[CLAN]'&&c.fill==='#654321'));
 assert.ok(!f.dom.calls.some(c=>c.name==='fillText'&&/HP:|Food:|Water:|Warmth:|Stamina:/.test(String(c.args[0]))));
 assert.ok(f.dom.calls.some(c=>c.name==='arc'&&c.args[2]===38));
 assert.ok(!f.dom.calls.some(c=>c.name==='lineTo'),'ILM real angles change the native sprite, without extra rays');
 assert.equal(f.mod.playerList.style.display,'flex');
 f.dom.calls.length=0;f.mod.setSetting('ShowNamesOnMap',false);f.mod.setSetting('PlayersListEnabled',false);f.mod.setSetting('ShowRealAngles','withAim');f.mod.setSetting('ShowPlayerHitbox',false);f.mod.render(100);
 assert.ok(!f.dom.calls.some(c=>c.name==='fillText'&&(String(c.args[0]).includes('#120')||String(c.args[0]).includes('HP:'))));
 assert.ok(!f.dom.calls.some(c=>c.name==='arc'||c.name==='lineTo'));f.mod.dispose();
});

test('original ILM line color reaches the canvas; removal resets lines and aim owns native input while enabled',()=>{
 const f=fixture({dom:true});scene(f,1,[player(1),player(2,100,0)]);
 f.mod.trackPacket(1,1,0,0,0,true);f.mod.trackPacket(1,2,0,100,0,true);f.mod.setSetting('visualizeResolvingColor','#abcdef');f.mod.setSetting('mouseFovEnable',false);f.mod.setSetting('AimBotEnabled',true);f.mod.aim.refresh();f.mod.step(0);
 assert.ok(f.dom.calls.some(c=>c.name==='stroke'&&c.stroke==='#EEEEEE'));f.network['ѕ᠋༢']();assert.equal(f.nativeCalls,1);
 f.mod.trackPacket(1,2,0,0,0,false);f.mod.aim.refresh();assert.equal(f.mod.targets.lines[0].x1,undefined);f.network['ѕ᠋༢']();assert.equal(f.nativeCalls,2);f.mod.dispose();
});

test('ILM auto fire repeats on each 50 ms tick while direction-change history remains true',()=>{
 const f=fixture();f.mod.trackPacket(1,1,0,0,0,true);for(const x of [80,90,80])f.mod.trackPacket(1,2,0,x,0,true);
 f.mod.setSetting('AimBotEnabled',true);f.mod.setSetting('autoFire',true);f.mod.setSetting('lockId',2);f.mod.aim.refresh();f.mod.aim.refresh();
 assert.equal(f.packets.filter(p=>p[0]===4).length,2);assert.equal(f.packets.filter(p=>p[0]===5).length,2);f.mod.dispose();
});

test('container take sends only when enabled, with native permission flags and nonempty slots',()=>{
 const f=fixture();Object.assign(f.world['ᅠᏧ‍'],{'ᴉᄁ͏':1,'ᴘϲ๓':[[0],[6,1],[7,2]],'ᅠܓ̃':3});
 f.mod.setSetting('AutoTakeEnabled',true);f.mod.aim.mouseDown=true;f.mod.step(0);f.mod.step(200);
 assert.deepEqual(f.packets.filter(p=>p[0]===27),[[27,1]]);
 f.mod.setSetting('AutoTakeEnabled',false);const count=f.packets.length;f.mod.step(500);assert.equal(f.packets.length,count);f.mod.dispose();
});

test('cursor interaction uses camera coordinates and requires the native eligible target; never fakes a door state',()=>{
 const f=fixture({dom:true});f.B.view=()=>({x:-100,y:-200,scale:2,ctx:f.dom.canvas.getContext('2d')});
 const door={id:20,x:150,y:300,'е̝ހ':0,'Іࡈ５':33<<7,'ᴘ४１':2,'αބ̞':1,'ᴀܛ٤':3,state:0};
 f.B.items[33]={'ࡀ︂̄':16};scene(f,3,[door]);f.mod.step(0);
 [...f.listeners.get('mousemove')][0]({clientX:60,clientY:120});
 assert.equal(f.mod.openUnderMouse(),false);
 Object.assign(f.world['ᅠᏧ‍'],{'І๔︊':2,'ⲟܐ༠':20,'с̣ߏ':2,'ࡀ︂̄':16});
 assert.equal(f.mod.openUnderMouse(),true,JSON.stringify({mouse:f.mod.targets.mouseMapCords,records:f.mod.records,self:f.world['ᅠᏧ‍'],descriptor:f.B.items[33]}));assert.deepEqual(f.packets,[[16,20,2]]);assert.equal(door.state,0);
 f.mod.setSetting('OpenEverythingByClick',false);assert.equal(f.mod.openUnderMouse(),false);f.mod.dispose();
});

test('chat obeys native cooldown, stops when disabled, and pauses during typing',()=>{
 const f=fixture(),sent=[];let wait=1000;f.network['іߐ̸']=text=>{sent.push(text);return wait;};
 f.mod.setSetting('SpamChatText',' first\nmessage ');f.mod.setSetting('SpamChatEnabled',true);f.mod.step(0);f.mod.step(500);assert.deepEqual(sent,['first message']);
 wait=0;f.mod.step(1200);assert.equal(sent.length,2);assert.equal(f.mod.chat.sent,1);
 f.mod.step(2000);assert.equal(sent.length,2);f.B.chatActive=()=>true;f.mod.step(7000);assert.equal(sent.length,2);assert.match(f.mod.chat.status,/Paused/);
 f.mod.setSetting('SpamChatEnabled',false);f.B.chatActive=()=>false;f.mod.step(8000);assert.equal(sent.length,2);f.mod.dispose();
});

test('nickname copy uses the requested ID and reports clipboard refusal or missing player',async()=>{
 const f=fixture();assert.equal(await f.mod.copyNickname(2),true);assert.deepEqual(f.clipboard,['Target']);assert.equal(await f.mod.copyNickname(999),false);
 f.navigator.clipboard.writeText=async()=>{throw Error('Permission denied');};assert.equal(await f.mod.copyNickname(2),false);assert.match(f.mod.clipboard.status,/denied/);
 const fake=fixture({dom:true});menu(fake);fake.mod.setSetting('PlayerId','2');await control(fake.mod.menu.__folders.Players,'CopyNick').object.CopyNick();assert.deepEqual(fake.clipboard,['Target']);
 f.mod.dispose();fake.mod.dispose();
});

test('reconnect preserves a newly selected server and uses a fresh deadline after an asynchronous refresh',()=>{
 function pending(){const f=fixture();const row=['a',0,0,0,'region',0,'mode'];let callback,rejoins=0;f.network['ԁᴄࡃ']=row;f.network['ոߒ४']=[row];f.network['ⲅ︊ᄃ']=(_,cb)=>{callback=cb;};f.B.reconnect=()=>{rejoins++;};f.mod.step(0);f.network.state=64;f.mod.step(1);f.mod.step(1001);return {f,row,callback,get rejoins(){return rejoins;}};}
 const a=pending();a.f.network['ԁᴄࡃ']=['b',0,0,0,'other',0,'mode'];a.callback();assert.equal(a.rejoins,0);assert.equal(a.f.network['ԁᴄࡃ'][0],'b');a.f.mod.dispose();
 const b=pending();b.f.setClock(10000);b.callback();assert.equal(b.rejoins,1);assert.equal(b.f.mod.reconnect.deadline,22000);b.f.mod.dispose();b.callback();assert.equal(b.rejoins,1);
});

test('all exposed action paths stop after dispose',()=>{
 const f=fixture({dom:true});scene(f,2,[{id:10,x:10,y:0,'е̝ހ':0,'Іࡈ５':6}]);Object.assign(f.world['ᅠᏧ‍'],{'І๔︊':0,'ιᄁ८':10});f.mod.setSetting('FAutoLootEnabled',true);
 f.mod.dispose();f.mod.step(1000);f.mod.render(1000);f.mod.aim.refresh();assert.equal(f.mod.openUnderMouse(),false);assert.equal(f.packets.length,0);assert.throws(()=>f.mod.setSetting('AimBotEnabled',true),/disposed/);
});

test('restore rejection falls back to a normal join once while cookies and stored identity remain unchanged',()=>{
 const saved={token:'guest-identity',tokenId:'session-id',userId:'22',nickname:'Saved name',skin:'0'};
 const f=fixture({saved});let cookieWrites=0;Object.defineProperty(f.document,'cookie',{get:()=> 'probe=kept',set:()=>{cookieWrites++;}});
 const row=['lobby',0,0,0,'region',0,'mode'];const callbacks=[],joins=[];
 f.B.loginKey='nativeLogin';f.B.restoreFailureKey='nativeRestoreRejected';
 f.network.nativeLogin=function(){joins.push({state:this.state,identity:['token','tokenId','userId'].map(k=>f.storage.get(k))});};
 f.network.nativeRestoreRejected=function(){this.state=256;};
 f.network['ԁᴄࡃ']=row;f.network['ոߒ४']=[row];f.network['ⲅ︊ᄃ']=(_,cb)=>callbacks.push(cb);
 f.B.reconnect=()=>f.network.nativeLogin();
 f.mod.step(0);f.network.state=64;f.mod.step(1);f.mod.step(1001);callbacks.shift()();
 assert.equal(joins.length,1);assert.equal(joins[0].state,64);
 f.network.nativeRestoreRejected();assert.equal(f.mod.reconnect.freshRequired,true);
 // Native close can return from rejection state 256 to idle 0 before the next frame.
 f.network.state=0;f.mod.step(1002);f.mod.step(2002);callbacks.shift()();
 assert.equal(joins.length,2);assert.equal(joins[1].state,0);assert.deepEqual(joins[1].identity,joins[0].identity);
 f.network.nativeRestoreRejected();f.mod.step(50000);assert.equal(joins.length,2);assert.equal(f.mod.reconnect.autoBlocked,true);
 for(const [key,value] of Object.entries(saved))assert.equal(f.storage.get(key),value);
 assert.equal(cookieWrites,0);assert.equal(f.document.cookie,'probe=kept');f.mod.dispose();
});

test('manual Play calls are serialized before the native asynchronous handshake starts',()=>{
 const f=fixture();let joins=0;f.B.loginKey='nativeLogin';const native=()=>{joins++;};f.network.nativeLogin=native;f.network.state=0;f.mod.step(0);
 f.network.nativeLogin();f.network.nativeLogin();assert.equal(joins,1);
 f.setClock(14000);f.mod.step(14000);f.network.nativeLogin();assert.equal(joins,2);
 f.mod.dispose();assert.equal(f.network.nativeLogin,native);
});

test('ordinary version or authorization rejections never trigger cookie clearing or automatic fresh joins',()=>{
 for(const state of [8,16,512,1024]){
  const f=fixture({saved:{token:'kept'}});let joins=0;f.B.reconnect=()=>joins++;f.mod.step(0);f.network.state=state;f.mod.step(1);f.mod.step(100000);
  assert.equal(joins,0);assert.equal(f.network.state,state);assert.equal(f.storage.get('token'),'kept');f.mod.dispose();
 }
});

test('changing the selected server cancels a delayed automatic retry until Play is pressed again',()=>{
 const f=fixture();let refresh,joins=0;f.B.reconnect=()=>joins++;f.network['ԁᴄࡃ']=['old',0,0,0,'r',0,'m'];f.network['ⲅ︊ᄃ']=(_,cb)=>refresh=cb;
 f.mod.step(0);f.network.state=64;f.mod.step(1);f.mod.step(1001);f.network['ԁᴄࡃ']=['new',0,0,0,'r2',0,'m'];refresh();f.mod.step(100000);
 assert.equal(joins,0);assert.equal(f.mod.reconnect.armed,false);f.mod.dispose();
});

test('a stale native login preflight callback cannot start a second connection after a newer Play attempt',()=>{
 const f=fixture();let started=0;const callbacks=[];
 f.B.loginKey='nativeLogin';f.B.preflightKey='nativePreflight';
 f.network.nativePreflight=(_,cb)=>callbacks.push(cb);f.network.nativeLogin=function(){this.nativePreflight('/version',()=>started++);};
 f.network.state=0;f.mod.step(0);f.network.nativeLogin();
 f.setClock(14000);f.mod.step(14000);f.network.nativeLogin();assert.equal(callbacks.length,2);
 callbacks[0]();assert.equal(started,0);callbacks[1]();assert.equal(started,1);f.mod.dispose();
});

test('ILM mouse fields and FOV selection follow the canvas transform; clan generations and extended IDs adapt safely',()=>{
 const f=fixture({dom:true});f.B.view=()=>({x:-100,y:-200,scale:2,ctx:f.dom.canvas.getContext('2d')});
 const move=[...f.listeners.get('mousemove')][0];move({clientX:60,clientY:70});f.mod.step(0);
 assert.equal(f.mod.targets.mousePosition.x,60);assert.equal(f.mod.targets.mousePosition.y,70);
 assert.equal(f.mod.targets.mouseMapCords.x,150);assert.equal(f.mod.targets.mouseMapCords.y,250);
 f.world['ﾠࡅ‍'][0]={'ոᚄރ':7};
 f.world['ᴎ︃ᄉ'][1]['а༤̘']=0;f.world['ᴎ︃ᄉ'][1]['ᴌ̗ⲟ']=7;
 f.world['ᴎ︃ᄉ'][2]['а༤̘']=0;f.world['ᴎ︃ᄉ'][2]['ᴌ̗ⲟ']=7;
 f.mod.trackPacket(1,1,0,0,0,true);f.mod.trackPacket(1,2,0,150,250,true);f.mod.trackPacket(1,121,0,155,250,true);
 assert.equal(f.mod.targets.players[0].id,0);assert.equal(f.mod.targets.players[121].id,121);
 f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer.id,121);
 f.world['ᴎ︃ᄉ'][2]['ᴌ̗ⲟ']=6;f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer.id,2);
 f.mod.setSetting('target','ghouls');f.mod.trackPacket(13,0,999,150,250,true);f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer.id,999);f.mod.dispose();
});

test('native decorated names copy raw names with internal hashes preserved and never duplicate own overlay IDs',async()=>{
 const f=fixture();f.B.nativePlayerLabels=true;f.world['ᴎ︃ᄉ'][2]['ο̏︇']='Name#tag#2';
 assert.equal(f.mod.playerLabel(f.world['ᴎ︃ᄉ'][2],2),'Name#tag#2');await f.mod.copyNickname(2);assert.deepEqual(f.clipboard,['Name#tag']);f.mod.dispose();
});

test('legacy settings migrate separately from account storage and preserve customized aim and loot',()=>{
 const saved={token:'original',tokenId:'17',userId:'2',serverVersion:'old',BestModMenuConfig:JSON.stringify({mouseFov:777,EnemyClanColor:'#123456',token:'must-not-overwrite'}),'BestModMenuConfig:ilm2':'1','BestModMenuConfig:loot':JSON.stringify({steel:false})};
 const f=fixture({saved});assert.equal(f.mod.settings.mouseFov,777);assert.equal(f.mod.loot.steel.acquire,false);
 f.mod.setSetting('zoomFactor',.7);for(const [k,v]of Object.entries(saved))assert.equal(f.storage.get(k),v);
 const g=fixture({saved:Object.fromEntries(f.storage)});assert.equal(g.mod.settings.mouseFov,777);assert.equal(g.mod.settings.zoomFactor,.7);assert.equal(g.mod.loot.steel.acquire,false);
 assert.equal(g.storage.get('token'),'original');assert.equal(g.storage.get('tokenId'),'17');assert.equal(g.storage.get('userId'),'2');f.mod.dispose();g.mod.dispose();
});

test('manual fire retains the angle and line from the last ILM tick without an extra resolve',()=>{
 const f=fixture({fireKey:'nativeFire'});f.mod.trackPacket(1,1,0,0,0,true);f.mod.trackPacket(1,2,0,100,0,true);
 f.mod.setSetting('lockId',2);f.mod.setSetting('AimBotEnabled',true);f.mod.aim.refresh();f.packets.length=0;
 const before=JSON.stringify(f.mod.targets.lines);f.mod.trackPacket(1,2,0,100,100,true);f.network.nativeFire();
 assert.deepEqual(f.packets,[[4]]);assert.equal(JSON.stringify(f.mod.targets.lines),before);
 f.mod.aim.refresh();assert.equal(f.packets.at(-1)[0],6);assert.notEqual(JSON.stringify(f.mod.targets.lines),before);
 f.mod.setSetting('AimBotEnabled',false);f.packets.length=0;f.network.nativeFire();assert.deepEqual(f.packets,[[4]]);
 f.mod.dispose();f.packets.length=0;f.network.nativeFire();assert.deepEqual(f.packets,[[4]]);
});

test('native synchronized rendering picks drops once per game frame without a second RAF scan',()=>{
 const f=fixture({dom:true});f.B.synchronizedRender=true;
 scene(f,2,[{id:10,x:10,y:0,'е̝ހ':0,'Іࡈ５':6}]);f.mod.setSetting('FAutoLootEnabled',true);
 f.mod.step(0);assert.equal(f.packets.length,0);f.mod.render(0);assert.deepEqual(f.packets,[[12,10]]);
 f.mod.step(16);assert.equal(f.packets.length,1);f.mod.render(16);assert.deepEqual(f.packets,[[12,10],[12,10]]);
 scene(f,2,[]);f.mod.render(32);assert.equal(f.packets.length,2);f.mod.dispose();
});
