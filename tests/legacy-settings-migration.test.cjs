const test=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('./mod-fixture.cjs');
const old='BestModMenuConfig',current='DevastILM:settings:v3',backup=current+':legacy-backup:v1';
const saved={token:'keep',tokenId:'17',userId:'2',[old]:JSON.stringify({zoomFactor:.7,EnemyClanColor:'#123456'}),[old+':loot']:JSON.stringify({steel:false}),[old+':ilm2']:'1'};
test('legacy settings are retired only after verified current copies and an exact archive',()=>{
 const f=fixture({saved});try{assert.deepEqual({...f.mod.connectionInfo().legacySettingsMigration},{status:'migrated',moved:3});const archived=JSON.parse(f.storage.get(backup));for(const suffix of ['',':loot',':ilm2']){assert.equal(f.storage.has(old+suffix),false);assert.ok(archived.some(row=>row.key===old+suffix&&row.value===saved[old+suffix]));}assert.equal(f.mod.settings.zoomFactor,.7);assert.equal(f.mod.loot.steel.acquire,false);assert.equal(f.storage.get('token'),'keep');assert.equal(f.storage.get('tokenId'),'17');assert.equal(f.storage.get('userId'),'2');const before=f.storage.get(backup);const g=fixture({saved:Object.fromEntries(f.storage)});try{assert.equal(g.mod.connectionInfo().legacySettingsMigration.status,'not-needed');assert.equal(g.storage.get(backup),before);assert.equal(g.mod.settings.zoomFactor,.7);}finally{g.mod.dispose();}}finally{f.mod.dispose();}
});
test('existing current settings win and old settings are archived unchanged',()=>{
 const value=JSON.stringify({zoomFactor:.9}),f=fixture({saved:{...saved,[current]:value}});try{assert.equal(f.mod.settings.zoomFactor,.9);assert.equal(JSON.parse(f.storage.get(current)).zoomFactor,.9);assert.ok(JSON.parse(f.storage.get(backup)).some(row=>row.key===old&&row.value===saved[old]));}finally{f.mod.dispose();}
});
for(const target of [backup,current,current+':loot'])test('migration keeps original data if writing '+target+' fails',()=>{
 const f=fixture({saved,storageWriteFailure:key=>key===target});try{assert.equal(f.mod.connectionInfo().legacySettingsMigration.status,'failed');for(const suffix of ['',':loot',':ilm2'])assert.equal(f.storage.get(old+suffix),saved[old+suffix]);assert.equal(f.storage.get('token'),'keep');}finally{f.mod.dispose();}
});
test('malformed historical settings are retained instead of replacing current data',()=>{
 const f=fixture({saved:{...saved,[old]:'{invalid'}});try{assert.equal(f.mod.connectionInfo().legacySettingsMigration.status,'failed');assert.equal(f.storage.get(old),'{invalid');assert.equal(f.storage.has(backup),false);}finally{f.mod.dispose();}
});
