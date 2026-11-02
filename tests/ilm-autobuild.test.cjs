const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),z=require('node:zlib'),vm=require('node:vm');
const {fixture,menu,control}=require('./mod-fixture.cjs');
const reference=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-autobuild-reference.json.gz')));
function oracle(){
 const packets=[],settings={AutoBuiledEnabled:false},player={x:0,y:0},network={state:1,SendWsMessage:p=>packets.push(JSON.parse(JSON.stringify(p)))};
 const context=vm.createContext({_0x2ea565:settings,_0x10898e:{PLAYER:player},_0x2e4a2b:network});
 // Only the reviewed build expression and its original state guard execute.
 vm.runInContext('function frame(){if('+reference.guard+'){'+reference.source+'}}',context,{timeout:1000});
 return {packets,settings,player,network,frame(){vm.runInContext('frame()',context,{timeout:1000});}};
}
test('ILM AutoBuild fixes rotation to zero and uses player y/x coordinates independently of cursor preview',()=>{
 const f=fixture(),original=oracle();f.B.synchronizedRender=true;
 Object.assign(f.world['ᅠᏧ‍'],{x:1134.5,y:2299.25,'ε︁ᚂ':0,'օⲥᚁ':0,'α०ᚂ':7,'ρⲅ️':88,'ᴎ︆ࡉ':99});
 f.mod.setSetting('AutoBuiledEnabled',true);original.settings.AutoBuiledEnabled=true;
 Object.assign(original.player,{x:1134.5,y:2299.25});f.mod.render(0);original.frame();
 assert.deepEqual(f.packets,original.packets);assert.deepEqual(f.packets,[[14,0,22.9925,11.345]]);f.mod.dispose();
});
test('native render owns AutoBuild cadence without a 120 ms delay, deduplication or a second RAF sender',()=>{
 const f=fixture(),original=oracle();f.B.synchronizedRender=true;
 f.mod.setSetting('AutoBuiledEnabled',true);original.settings.AutoBuiledEnabled=true;
 for(let i=0;i<120;i++){
  const now=i*8;const point={x:1000+(i%7)*2.5,y:2000+Math.floor(i/3)*3.25};
  Object.assign(f.world['ᅠᏧ‍'],point);Object.assign(original.player,point);
  f.mod.step(now);f.mod.step(now);assert.equal(f.packets.length,i);
  f.mod.render(now);original.frame();assert.deepEqual(f.packets,original.packets);
 }
 // The original also sends again when position and timestamp are unchanged.
 f.mod.render(952);original.frame();assert.deepEqual(f.packets,original.packets);assert.equal(f.packets.length,121);f.mod.dispose();
});
test('AutoBuild follows the original state and toggle over deterministic frame traces',()=>{
 const f=fixture(),original=oracle();f.B.synchronizedRender=true;
 for(let i=0;i<240;i++){
  const enabled=i%9<5,state=[1,1,64,0][i%4],point={x:350+(i%31)*12.25,y:2550-(i%47)*7.5};
  f.mod.setSetting('AutoBuiledEnabled',enabled);original.settings.AutoBuiledEnabled=enabled;
  f.network.state=state;original.network.state=state;Object.assign(f.world['ᅠᏧ‍'],point);Object.assign(original.player,point);
  f.mod.render(i*16);original.frame();assert.deepEqual(f.packets,original.packets,'Frame '+i);
 }
 f.mod.dispose();
});
test('AutoBuild GUI and the ILM KeyB binding change the next native frame',()=>{
 const f=fixture({dom:true});f.B.synchronizedRender=true;const gui=menu(f),build=control(gui.__folders.Automation,'AutoBuiledEnabled');
 f.mod.render(0);assert.equal(f.packets.length,0);build.setValue(true);f.mod.render(1);assert.equal(f.packets.length,1);
 const keyboard=[...f.listeners.get('keydown')][0];keyboard({code:'KeyB',target:{tagName:'CANVAS'},preventDefault(){}});
 f.mod.render(2);assert.equal(f.packets.length,1);assert.equal(f.mod.settings.AutoBuiledEnabled,false);f.mod.dispose();
});
test('standalone fallback builds once per step and does not build from overlay render',()=>{
 const f=fixture();f.mod.setSetting('AutoBuiledEnabled',true);f.mod.step(0);f.mod.render(0);
 assert.deepEqual(f.packets,[[14,0,0,0]]);f.mod.step(8);assert.equal(f.packets.length,2);f.mod.dispose();
});
test('AutoBuild rejects invalid coordinates and stops outside a living session or after disposal',()=>{
 const f=fixture();f.B.synchronizedRender=true;f.mod.setSetting('AutoBuiledEnabled',true);
 f.world['ᅠᏧ‍'].x=NaN;f.mod.render(0);assert.equal(f.packets.length,0);
 f.world['ᅠᏧ‍'].x=0;f.world['ᅠᏧ‍'].id=0;f.mod.render(1);assert.equal(f.packets.length,0);
 f.world['ᅠᏧ‍'].id=1;f.mod.render(2);assert.equal(f.packets.length,1);f.mod.dispose();f.mod.render(3);assert.equal(f.packets.length,1);
});
