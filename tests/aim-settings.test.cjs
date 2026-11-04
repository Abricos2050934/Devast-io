// Exercise the five original GUI controls and the remaining original configuration fields.
const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,scene,player,menu,control}=require('./mod-fixture.cjs');
function aimScene(){
 const f=fixture({dom:true}),gui=menu(f),aim=gui.__folders['Aim Bot'];
 const set=(key,value)=>f.mod.setSetting(key,value),setGui=(key,value)=>control(aim,key).setValue(value);
 scene(f,1,[player(1),player(2,100,100),player(3,500,500)]);
 f.mod.trackPacket(1,1,0,0,0,true);
 f.mod.trackPacket(1,2,0,90,70,true);f.mod.trackPacket(1,2,0,100,100,true);
 f.mod.trackPacket(1,3,0,500,500,true);f.mod.trackPacket(13,0,17,40,40,true);
 set('mouseFovEnable',false);
 return Object.assign(f,{gui,set,setGui});
}

test('AimBotEnabled setting changes whether the 50 ms callback sends a direction',()=>{
 const f=aimScene(),tick=[...f.timers.values()][0];
 tick();assert.equal(f.packets.length,0);f.set('AimBotEnabled',true);tick();assert.equal(f.packets[0][0],6);
 f.set('AimBotEnabled',false);tick();assert.equal(f.packets.length,1);f.mod.dispose();
});

test('target GUI control switches players, ghouls and mixed selection',()=>{
 const f=aimScene(),selected=[];
 for(const mode of ['players','ghouls','all']){f.setGui('target',mode);f.mod.aim.resolve();selected.push(f.mod.aim.targetPlayer.id);}
 assert.deepEqual(selected,[2,17,17]);f.mod.dispose();
});

test('mouseFovEnable setting changes the selection origin from self to cursor',()=>{
 const f=aimScene();f.mod.targets.mouseMapCords={x:500,y:500};
 f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer.id,2);
 f.set('mouseFovEnable',true);f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer.id,3);f.mod.dispose();
});

test('mouseFov setting changes range only when cursor selection is active and no ID is locked',()=>{
 const f=aimScene();f.mod.targets.mouseMapCords={x:0,y:0};f.set('mouseFovEnable',true);
 f.set('mouseFov',140);f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer,null);
 f.set('mouseFov',150);f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer.id,2);
 f.set('mouseFovEnable',false);f.set('mouseFov',1);f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer.id,2);f.mod.dispose();
});

test('lockId setting overrides target category and FOV exactly as original ILM does',()=>{
 const f=aimScene();f.set('target','ghouls');f.set('mouseFovEnable',true);f.set('mouseFov',1);
 f.set('lockId',3);f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer.id,3);
 f.set('lockId',2);f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer.id,2);
 f.set('lockId',-1);f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer,null);f.mod.dispose();
});

for(const [key,a,b] of [['distanceCoefficient',100,1000],['offsetCoefficient',0,3]]){
 test(key+' GUI control changes predicted coordinates and the sent angle for a moving target',()=>{
  const f=aimScene();f.set('lockId',2);f.set('AimBotEnabled',true);
  f.setGui(key,a);f.mod.aim.refresh();const before={x:f.mod.targets.lines[0].x2,y:f.mod.targets.lines[0].y2,angle:f.packets.at(-1)[1]};
  f.setGui(key,b);f.mod.aim.refresh();const after={x:f.mod.targets.lines[0].x2,y:f.mod.targets.lines[0].y2,angle:f.packets.at(-1)[1]};
  assert.notEqual(after.x,before.x);assert.notEqual(after.y,before.y);assert.notEqual(after.angle,before.angle);f.mod.dispose();
 });
}

test('autoFire setting changes attack packets when the original direction-change condition is met',()=>{
 const f=aimScene();for(const x of [80,90,80])f.mod.trackPacket(1,2,0,x,0,true);
 f.set('lockId',2);f.set('AimBotEnabled',true);f.mod.aim.refresh();assert.deepEqual(f.packets.map(p=>p[0]),[6]);
 const first=f.packets.length;f.set('autoFire',true);f.mod.aim.refresh();assert.deepEqual(f.packets.slice(first).map(p=>p[0]),[4,5]);
 f.set('autoFire',false);const n=f.packets.length;f.mod.aim.refresh();assert.equal(f.packets.length,n);
 f.mod.trackPacket(1,2,0,140,100,true);f.mod.aim.refresh();assert.equal(f.packets.length,n+1);assert.equal(f.packets.at(-1)[0],6);f.mod.dispose();
});

test('aim with autoFire disabled sends only finite native direction packets over repeated moving-target ticks',()=>{
 const f=aimScene();f.set('lockId',2);f.set('AimBotEnabled',true);f.set('autoFire',false);
 const tick=[...f.timers.values()][0],expected=[];
 for(let i=0;i<100;i++){
  f.setClock(i*50);f.mod.trackPacket(1,2,0,100+(i%2)*30,50+Math.floor(30*Math.sin(i)),true);tick();
  const angle=(Math.round(f.mod.aim.lastAngle)%360+360)%360;if(expected.at(-1)?.[1]!==angle)expected.push([6,angle]);
 }
 assert.deepEqual(f.packets,expected);
 for(const packet of f.packets){assert.equal(packet.length,2);assert.equal(packet[0],6);assert.ok(Number.isInteger(packet[1])&&packet[1]>=0&&packet[1]<360);}
 f.set('AimBotEnabled',false);tick();assert.equal(f.packets.length,expected.length);f.mod.dispose();
});

test('visualizeResolving hides the old prediction line while retaining its last coordinates',()=>{
 const f=aimScene();try{
  f.set('lockId',2);f.set('AimBotEnabled',true);f.mod.aim.resolve();const previous=JSON.stringify(f.mod.targets.lines[0]);
  f.set('visualizeResolving',false);f.mod.trackPacket(1,2,0,130,170,true);f.mod.aim.resolve();f.mod.step(0);
  assert.equal(JSON.stringify(f.mod.targets.lines[0]),previous);
  assert.ok(!f.dom.calls.some(c=>c.name==='stroke'&&c.stroke==='#EEEEEE'));
 }finally{f.mod.dispose();}
});

test('visualizeResolvingColor changes drawing without changing the aim angle',()=>{
 const f=aimScene();try{
  f.set('lockId',2);f.set('AimBotEnabled',true);const angle=f.mod.aim.resolve();
  for(const color of ['#abcdef','#123456']){
   f.dom.calls.length=0;f.set('visualizeResolvingColor',color);f.mod.render(20);
   assert.ok(f.dom.calls.some(c=>c.name==='stroke'&&c.stroke===color));assert.equal(f.mod.aim.resolve(),angle);
  }
 }finally{f.mod.dispose();}
});

test('AimbotKey is reassigned through the keyboard menu and the new key toggles aim packets',()=>{
 const f=aimScene(),c=control(f.gui.__folders.Keyboard,'AimbotKey'),input=c.domElement.querySelector('input');
 for(const fn of input.listeners.get('click'))fn();
 const keydown=[...f.listeners.get('keydown')][0];
 keydown({code:'KeyZ',target:{tagName:'CANVAS'},preventDefault(){},stopImmediatePropagation(){}});
 assert.equal(f.mod.settings.AimbotKey,'KeyZ');assert.equal(f.mod.settings.AimBotEnabled,false);
 keydown({code:'Space',target:{tagName:'CANVAS'}});assert.equal(f.mod.settings.AimBotEnabled,false);
 keydown({code:'KeyZ',target:{tagName:'CANVAS'}});f.mod.aim.refresh();assert.equal(f.packets.at(-1)[0],6);f.mod.dispose();
});

test('classic prediction uses bullet speed coefficient and validates the velocity model',()=>{
 const f=aimScene();try{
  f.set('lockId',2);f.set('ImprovedAimEnabled',false);
  const capture=()=>f.mod.aim.resolve();f.setGui('bulletSpeedCoefficient',4);const normal=capture();
  f.setGui('bulletSpeedCoefficient',1);assert.notEqual(capture(),normal);
  f.setGui('bulletSpeedCoefficient',15);assert.notEqual(capture(),normal);
  assert.throws(()=>f.set('resolverType','other-test-value'),/Invalid choice/);
 }finally{f.mod.dispose();}
});

test('Aim Bot preserves the original numeric controls and exposes every active tuning control',()=>{
 const fs=require('node:fs'),z=require('node:zlib'),vm=require('node:vm');
 const source=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-aim-menu-reference.json.gz'))).blocks.find(b=>b.name==='menu').source;
 const f=aimScene();try{
  const root=new f.dom.GUI(),settings=JSON.parse(JSON.stringify(f.mod.settings));
  vm.runInNewContext('const _0x2a1bff=root,_0x2ea565=settings;'+source,{root,settings},{timeout:1000});
  const describe=folder=>JSON.parse(JSON.stringify(folder.__controllers.filter(c=>['ShowRealAngles','target','distanceCoefficient','bulletSpeedCoefficient','offsetCoefficient'].includes(c.property)).map(c=>({property:c.property,label:c.label,range:c.range}))));
  assert.deepEqual(describe(f.gui.__folders['Aim Bot']),describe(root.__folders['Aim Bot']));
  assert.equal(f.gui.__folders['Aim Bot'].__controllers.length,14);assert.equal(control(f.gui.__folders['Aim Bot'],'ImprovedAimEnabled').object.ImprovedAimEnabled,true);
  assert.equal(f.gui.__folders['Aim bot'],undefined);
  control(f.gui.__folders['Aim Bot'],'ShowRealAngles').setValue('always');assert.equal(f.mod.settings.ShowRealAngles,'always');
  assert.equal(JSON.parse(f.storage.get('DevastILM:settings:v3')).ShowRealAngles,'always');
 }finally{f.mod.dispose();}
});

test('line visibility and color controls affect the installed renderer without changing prediction',()=>{
 const f=aimScene();try{
  f.set('AimBotEnabled',true);f.set('lockId',2);const angle=f.mod.aim.resolve();
  f.set('visualizeResolving',false);f.mod.render(0);assert.ok(!f.dom.calls.some(c=>c.name==='stroke'));
  f.dom.calls.length=0;f.set('visualizeResolving',true);f.set('visualizeResolvingColor','#abcdef');f.mod.render(20);
  assert.ok(f.dom.calls.some(c=>c.name==='stroke'&&c.stroke==='#abcdef'));assert.equal(f.mod.aim.resolve(),angle);
  assert.equal(f.mod.targets.lines[0].color,'#EEEEEE','Rendering must not rewrite the core line object');
 }finally{f.mod.dispose();}
});
