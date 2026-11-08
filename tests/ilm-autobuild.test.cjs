const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,menu,control}=require('./mod-fixture.cjs');
function preview(f,rotation=3,y=22,x=11){Object.assign(f.world['ᅠᏧ‍'],{'ε︁ᚂ':1,'օⲥᚁ':1,'α०ᚂ':rotation,'ρⲅ️':y,'ᴎ︆ࡉ':x});}
test('AutoBuild sends the latest native cursor cell and rotation independently of player position',()=>{
 const f=fixture();try{f.B.synchronizedRender=true;preview(f,7,88,99);Object.assign(f.world['ᅠᏧ‍'],{x:1134.5,y:2299.25});
  f.mod.setSetting('AutoBuiledEnabled',true);f.mod.render(0);assert.deepEqual(f.packets,[[14,7,88,99]]);
  Object.assign(f.world['ᅠᏧ‍'],{x:5000,y:6000});f.mod.render(8);assert.equal(f.packets.length,1);
  preview(f,1,24,32);f.mod.render(16);assert.equal(f.packets.length,1);f.mod.render(50);assert.deepEqual(f.packets.at(-1),[14,1,24,32]);
 }finally{f.mod.dispose();}
});
test('high-FPS AutoBuild is bounded, uses current preview, and does not replay skipped frames',()=>{
 const f=fixture();try{f.B.synchronizedRender=true;f.mod.setSetting('AutoBuiledEnabled',true);const sentAt=[];
  for(let i=0;i<120;i++){preview(f,i%4,Math.floor(i/3),i%7);const count=f.packets.length;f.mod.step(i*8);f.mod.step(i*8);assert.equal(f.packets.length,count);f.mod.render(i*8);
   if(f.packets.length>count){assert.equal(f.packets.length,count+1);assert.deepEqual(f.packets.at(-1),[14,i%4,Math.floor(i/3),i%7]);sentAt.push(i*8);}}
  assert.equal(sentAt.length,18);assert.ok(sentAt.slice(1).every((at,i)=>at-sentAt[i]>=50));
  const count=f.packets.length;preview(f,2,80,90);f.mod.render(10000);assert.equal(f.packets.length,count+1);assert.deepEqual(f.packets.at(-1),[14,2,80,90]);
 }finally{f.mod.dispose();}
});
test('AutoBuild honors preview validity, selected building, session, and toggle across transitions',()=>{
 const f=fixture();try{f.B.synchronizedRender=true;
  const trace=[[0,true,1,1,1,1],[60,true,1,0,1,1],[61,true,1,1,0,1],[62,false,1,1,1,1],[70,true,64,1,1,1],[80,true,1,1,1,2],[90,true,0,1,1,2],[140,true,1,1,1,3]];
  for(const [now,enabled,state,selected,valid,count]of trace){preview(f,3,22,11);f.mod.setSetting('AutoBuiledEnabled',enabled);f.network.state=state;Object.assign(f.world['ᅠᏧ‍'],{'ε︁ᚂ':selected,'օⲥᚁ':valid});f.mod.render(now);assert.equal(f.packets.length,count,'At '+now);}
 }finally{f.mod.dispose();}
});
test('AutoBuild GUI and KeyB binding change the next native frame',()=>{
 const f=fixture({dom:true});try{preview(f);f.B.synchronizedRender=true;const gui=menu(f),build=control(gui.__folders.Automation,'AutoBuiledEnabled');
  f.mod.render(0);assert.equal(f.packets.length,0);build.setValue(true);f.mod.render(1);assert.deepEqual(f.packets,[[14,3,22,11]]);
  [...f.listeners.get('keydown')][0]({code:'KeyB',target:{tagName:'CANVAS'},preventDefault(){}});f.mod.render(2);assert.equal(f.packets.length,1);assert.equal(f.mod.settings.AutoBuiledEnabled,false);
 }finally{f.mod.dispose();}
});
test('standalone fallback builds on its bounded step and never adds a sender in overlay render',()=>{
 const f=fixture();try{preview(f);f.mod.setSetting('AutoBuiledEnabled',true);f.mod.step(0);f.mod.render(0);assert.deepEqual(f.packets,[[14,3,22,11]]);f.mod.step(8);assert.equal(f.packets.length,1);f.mod.step(50);assert.equal(f.packets.length,2);f.mod.render(51);assert.equal(f.packets.length,2);}finally{f.mod.dispose();}
});
test('AutoBuild rejects nonfinite preview data and stops outside a living session or after disposal',()=>{
 const f=fixture();try{f.B.synchronizedRender=true;preview(f);f.mod.setSetting('AutoBuiledEnabled',true);const me=f.world['ᅠᏧ‍'];
  me['ρⲅ️']=NaN;f.mod.render(0);assert.equal(f.packets.length,0);preview(f);me.id=0;f.mod.render(1);assert.equal(f.packets.length,0);
  me.id=1;f.mod.render(2);assert.equal(f.packets.length,1);f.mod.dispose();f.mod.render(3);assert.equal(f.packets.length,1);
 }finally{f.mod.dispose();}
});
