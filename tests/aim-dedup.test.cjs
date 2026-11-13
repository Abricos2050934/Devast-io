const test=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('./mod-fixture.cjs');
test('dense scenes cannot multiply identical directions in either predictor; shot alignment is retained',()=>{
 const f=fixture();f.B.types={1:{curveWeapons:{}}};const s=Object.fromEntries(['ᅠᏧ‍','ᴎ︃ᄉ','а༤̘','curveWeapons','curveBulletSpeed'].map(k=>[k,k]));
 try{const r=require('../tools/verify_aim_dedup.cjs').verifyAimDedup(f.mod,{...f.B,playerType:1,setClock:f.setClock,capturePackets:()=>({packets:f.packets,restore(){}})},s);assert.equal(r.dense_cases,6);assert.equal(r.results.find(r=>!r.adaptive&&r.players===24).identicalRemoved,920);}finally{f.mod.dispose();}
});
test('disconnect report retains the predictor and rotation flags without account values',()=>{
 const f=fixture({saved:{token:'private-test-token'}});try{for(const k of ['AdaptiveAimEnabled','JitterEnabled','AntiAimbot'])f.mod.setSetting(k,true);f.mod.observeDeath(new Uint8Array([5,0,2]));f.mod.setSetting('AdaptiveAimEnabled',false);const r=f.mod.connectionInfo();assert.equal(r.aimSettings.adaptive,false);assert.equal(r.events.at(-1).adaptiveAim,true);assert.equal(r.events.at(-1).jitter,true);assert.equal(r.events.at(-1).strafe,true);assert.ok(r.modTraffic.settingsChanges.some(e=>e.settings.AdaptiveAimEnabled));assert.ok(!JSON.stringify(r).includes('private-test-token'));}finally{f.mod.dispose();}
});
