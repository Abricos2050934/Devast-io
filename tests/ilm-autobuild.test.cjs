const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,menu,control}=require('./mod-fixture.cjs');
function preview(f,rotation=3,y=22,x=11){Object.assign(f.world['ᅠᏧ‍'],{'ε︁ᚂ':1,'օⲥᚁ':1,'α०ᚂ':rotation,'ρⲅ️':y,'ᴎ︆ࡉ':x});}
test('AutoBuild uses native cursor-preview cell and rotation independently of player position',()=>{
 const f=fixture();try{f.B.synchronizedRender=true;preview(f,7,88,99);Object.assign(f.world['ᅠᏧ‍'],{x:1134.5,y:2299.25});
  f.mod.setSetting('AutoBuiledEnabled',true);f.mod.render(0);assert.deepEqual(f.packets,[[14,7,88,99]]);
  Object.assign(f.world['ᅠᏧ‍'],{x:5000,y:6000});f.mod.render(8);assert.deepEqual(f.packets.at(-1),[14,7,88,99]);
  preview(f,1,24,32);f.mod.render(16);assert.deepEqual(f.packets.at(-1),[14,1,24,32]);
 }finally{f.mod.dispose();}
});
test('native render sends one current cursor placement per frame without a second RAF sender',()=>{
 const f=fixture();try{f.B.synchronizedRender=true;f.mod.setSetting('AutoBuiledEnabled',true);
  for(let i=0;i<120;i++){preview(f,i%4,Math.floor(i/3),i%7);f.mod.step(i*8);f.mod.step(i*8);assert.equal(f.packets.length,i);f.mod.render(i*8);assert.deepEqual(f.packets.at(-1),[14,i%4,Math.floor(i/3),i%7]);}
  f.mod.render(952);assert.equal(f.packets.length,121);
 }finally{f.mod.dispose();}
});
test('AutoBuild obeys native preview validity, selected-building state, session and toggle across frame traces',()=>{
 const f=fixture();try{f.B.synchronizedRender=true;let count=0;
  for(let i=0;i<240;i++){const enabled=i%9<5,state=[1,1,64,0][i%4];preview(f,i%4,i%31,i%47);f.mod.setSetting('AutoBuiledEnabled',enabled);f.network.state=state;
   const me=f.world['ᅠᏧ‍'];me['ε︁ᚂ']=i%5===0?0:1;me['օⲥᚁ']=i%7===0?0:1;f.mod.render(i*16);
   if(enabled&&state===1&&me['ε︁ᚂ']===1&&me['օⲥᚁ']===1)count++;assert.equal(f.packets.length,count,'Frame '+i);
  }
 }finally{f.mod.dispose();}
});
test('AutoBuild GUI and KeyB binding change the next native frame',()=>{
 const f=fixture({dom:true});try{preview(f);f.B.synchronizedRender=true;const gui=menu(f),build=control(gui.__folders.Automation,'AutoBuiledEnabled');
  f.mod.render(0);assert.equal(f.packets.length,0);build.setValue(true);f.mod.render(1);assert.deepEqual(f.packets,[[14,3,22,11]]);
  [...f.listeners.get('keydown')][0]({code:'KeyB',target:{tagName:'CANVAS'},preventDefault(){}});f.mod.render(2);assert.equal(f.packets.length,1);assert.equal(f.mod.settings.AutoBuiledEnabled,false);
 }finally{f.mod.dispose();}
});
test('standalone fallback builds once per step from the cursor preview and never from overlay render',()=>{
 const f=fixture();try{preview(f);f.mod.setSetting('AutoBuiledEnabled',true);f.mod.step(0);f.mod.render(0);assert.deepEqual(f.packets,[[14,3,22,11]]);f.mod.step(8);assert.equal(f.packets.length,2);}finally{f.mod.dispose();}
});
test('AutoBuild rejects nonfinite preview data and stops outside a living session or after disposal',()=>{
 const f=fixture();try{f.B.synchronizedRender=true;preview(f);f.mod.setSetting('AutoBuiledEnabled',true);const me=f.world['ᅠᏧ‍'];
  me['ρⲅ️']=NaN;f.mod.render(0);assert.equal(f.packets.length,0);preview(f);me.id=0;f.mod.render(1);assert.equal(f.packets.length,0);
  me.id=1;f.mod.render(2);assert.equal(f.packets.length,1);f.mod.dispose();f.mod.render(3);assert.equal(f.packets.length,1);
 }finally{f.mod.dispose();}
});
