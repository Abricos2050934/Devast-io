const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,menu,control}=require('./mod-fixture.cjs');
function rows(panel){const out=[];function walk(el){if(el.dataset?.playerId)out.push(el);for(const child of el.children||[])walk(child);}walk(panel);return out;}
function setup(){
 const f=fixture({dom:true});f.world['ﾠࡅ‍'][0]={name:'ALLY','ոᚄރ':7};f.world['ﾠࡅ‍'][1]={name:'ENEMY','ոᚄރ':8};
 Object.assign(f.world['ᴎ︃ᄉ'][1],{'а༤̘':0,'ᴌ̗ⲟ':7});Object.assign(f.world['ᴎ︃ᄉ'][2],{'а༤̘':1,'ᴌ̗ⲟ':8});
 f.mod.setSetting('PlayersListEnabled',true);return f;
}
test('player list uses the full metadata roster including distant players and empty nicknames with IDs',()=>{
 const f=setup();f.world['ᴎ︃ᄉ'][120]={'ο̏︇':'','а༤̘':-1};f.world['ᴎ︃ᄉ'][3]={'ο̏︇':0};
 f.mod.step(0);assert.equal(f.mod.records.length,0);
 const entries=rows(f.mod.playerList);assert.deepEqual(entries.map(r=>r.children[0].textContent),['#1','#2','#120']);
 assert.equal(entries[1].children[1].textContent,'Target');assert.equal(entries[2].children[1].textContent,'Без ника');f.mod.dispose();
});
test('nickname and clan colors remain independent and change through real GUI callbacks',()=>{
 const f=setup(),gui=menu(f),visual=gui.__folders.Visuals;
 control(visual,'NicknameColor').setValue('#123456');control(visual,'TeamClanColor').setValue('#33aa44');control(visual,'EnemyClanColor').setValue('#aa3344');
 f.mod.step(0);const entries=rows(f.mod.playerList);
 for(const row of entries){assert.equal(row.children[0].style.color,'#123456');assert.equal(row.children[1].style.color,'#123456');}
 assert.equal(entries[0].children[2].textContent,'[ALLY]');assert.equal(entries[0].children[2].style.color,'#33aa44');
 assert.equal(entries[1].children[2].style.color,'#aa3344');
 control(visual,'NicknameColor').setValue('#654321');f.mod.render(1);
 assert.equal(entries[1].children[1].style.color,'#654321');assert.equal(entries[1].children[2].style.color,'#aa3344');
 assert.equal(JSON.parse(f.storage.get('DevastILM:settings:v3')).NicknameColor,'#654321');f.mod.dispose();
});
test('nickname color invalidates both native name canvases and the leaderboard without rebuilding an unchanged color',()=>{
 const f=setup(),meta=f.world['ᴎ︃ᄉ'][2];f.mod.preparePlayerLabel(meta,2);
 const head={},leader={};meta['а༠٥']=head;meta['ᴘ๒︅']=leader;f.world['ᴑܓօ']=0;
 f.mod.setSetting('NicknameColor','#abcdef');assert.equal(meta['а༠٥'],null);assert.equal(meta['ᴘ๒︅'],null);assert.equal(f.world['ᴑܓօ'],1);
 meta['а༠٥']=head;meta['ᴘ๒︅']=leader;f.world['ᴑܓօ']=0;
 f.mod.setSetting('NicknameColor','#abcdef');assert.equal(meta['а༠٥'],head);assert.equal(meta['ᴘ๒︅'],leader);assert.equal(f.world['ᴑܓօ'],0);f.mod.dispose();
});
test('departed players disappear and reused or replaced metadata rejoins the roster',()=>{
 const f=setup();f.mod.step(0);f.mod.observePlayerLeave(2);f.mod.render(1);assert.deepEqual(rows(f.mod.playerList).map(r=>r.dataset.playerId),['1']);
 f.world['ᴎ︃ᄉ'][2]['ο̏︇']='Rejoined';f.mod.observePlayerSpawn(2);f.mod.render(2);assert.equal(rows(f.mod.playerList)[1].children[1].textContent,'Rejoined');
 f.mod.observePlayerLeave(2);f.world['ᴎ︃ᄉ'][2]={'ο̏︇':'New snapshot','а༤̘':-1};f.mod.render(3);
 assert.equal(rows(f.mod.playerList)[1].children[1].textContent,'New snapshot');f.mod.dispose();
});
test('native suffix is displayed as a separate ID and copying preserves hashes inside the actual nickname',async()=>{
 const f=setup();f.B.nativePlayerLabels=true;f.world['ᴎ︃ᄉ'][2]['ο̏︇']='Name#tag#2';f.mod.step(0);
 const row=rows(f.mod.playerList)[1];assert.equal(row.children[0].textContent,'#2');assert.equal(row.children[1].textContent,'Name#tag');
 await row.children[1].onclick();assert.deepEqual(f.clipboard,['Name#tag']);f.mod.dispose();
});
test('the player list preserves row nodes between frames and closes through L or its close button',()=>{
 const f=setup();menu(f);f.mod.step(0);const panel=f.mod.playerList,first=rows(panel)[0];f.mod.render(1);assert.equal(rows(panel)[0],first);
 const keyboard=[...f.listeners.get('keydown')][0];keyboard({code:'KeyL',target:{tagName:'CANVAS'}});assert.equal(panel.style.display,'none');
 keyboard({code:'KeyL',target:{tagName:'CANVAS'}});f.mod.render(2);assert.equal(panel.style.display,'flex');
 const close=panel.children[0].children[1];for(const fn of close.listeners.get('click'))fn();assert.equal(panel.style.display,'none');
 f.mod.setSetting('PlayersListEnabled',true);f.mod.render(3);f.network.state=64;f.mod.render(4);assert.equal(panel.style.display,'none');f.mod.dispose();
});
test('player list clicks do not arm gameplay mouse input and stale clans are excluded',()=>{
 const f=setup();f.world['ᴎ︃ᄉ'][2]['ᴌ̗ⲟ']=99;f.mod.step(0);const panel=f.mod.playerList,row=rows(panel)[1];
 assert.equal(row.children[2].textContent,'—');const down=[...f.listeners.get('mousedown')][0];
 down({target:row,button:0,composedPath:()=>[row,panel]});assert.equal(f.mod.aim.mouseDown,false);
 f.mod.dispose();assert.ok(!f.document.body.children.includes(panel.parent));
});
