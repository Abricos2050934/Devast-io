const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,scene}=require('./mod-fixture.cjs');

function setup(options={}){
 const f=fixture({dom:true,...options});
 f.B.view=()=>({x:-100,y:-300,scale:2,ctx:f.dom.canvas.getContext('2d')});
 const door={id:20,x:150,y:350,'е̝ހ':0,'Іࡈ５':33<<7,'ᴘ४１':1,'αބ̞':1,'ᴀܛ٤':3,state:0};
 const container={...door,id:8,'Іࡈ５':34<<7};
 const descriptor=f.B.items[33]={'ࡀ︂̄':15};f.B.items[34]={'ࡀ︂̄':16};
 Object.assign(f.world['ᅠᏧ‍'],{x:150,y:350,'І๔︊':2,'ⲟܐ༠':8,'с̣ߏ':1,'ࡀ︂̄':16});
 f.B.isManualDoor=d=>d===descriptor;
 f.B.canUseDoor=()=>{throw Error('Right click must not consult the native E selector');};
 scene(f,3,[container,door,{...door,id:21,'αބ̞':2,x:250}]);f.mod.step(0);
 function press(options={}){
  let prevented=false,stopped=false;
  const event={button:2,clientX:60,clientY:70,target:f.dom.canvas,preventDefault(){prevented=true;},stopImmediatePropagation(){stopped=true;},...options};
  for(const fn of f.listeners.get('mousedown'))fn(event);
  return {prevented,stopped};
 }
 return {f,door,press};
}
test('right click opens the hovered door over a selected container, once, using click coordinates and zoom',()=>{
 const {f,door,press}=setup();try{
  const selection=JSON.stringify(f.world['ᅠᏧ‍']);
  assert.deepEqual(press(),{prevented:true,stopped:true});
  assert.deepEqual(f.packets,[[15,20,1]]);assert.equal(door.state,0);
  assert.equal(JSON.stringify(f.world['ᅠᏧ‍']),selection);
  // Contextmenu follows the same press: it only hides the browser menu.
  for(const fn of f.dom.canvas.listeners.get('contextmenu'))fn({preventDefault(){}});
  assert.equal(f.packets.length,1);
  f.packets.length=0;press({button:0});assert.equal(f.mod.aim.mouseDown,false,'The uploaded engine learns attack from native [4], not a canvas click');assert.equal(f.packets.length,0);f.mod.afterFire();assert.equal(f.mod.aim.mouseDown,true);
 }finally{f.mod.dispose();}
});
test('right click ignores UI, typing, disabled controls and other tiles',()=>{
 const state=setup(),{f,press}=state;try{
  for(const target of [{tagName:'INPUT',closest(){return null;}},{closest(){return {};}}]){
   assert.deepEqual(press({target}),{prevented:false,stopped:false});
  }
  press({clientX:260});
  f.B.chatActive=()=>true;press();f.B.chatActive=()=>false;
  f.mod.setSetting('OpenEverythingByClick',false);f.mod.setSetting('RightClickDoors',false);press();
  f.mod.setSetting('RightClickDoors',true);f.network.state=0;press();
  assert.equal(f.packets.length,0);
 }finally{f.mod.dispose();}
});
test('door request is independent of E, nearest selection, client range and owner filtering',()=>{
 const {f,door,press}=setup();try{
  for(const state of [-1,0,1,2]){
   Object.assign(f.world['ᅠᏧ‍'],{'І๔︊':state,'ⲟܐ༠':99,'с̣ߏ':9,'ࡀ︂̄':16,x:10000,y:10000});
   const before=JSON.stringify(f.world['ᅠᏧ‍']);
   f.packets.length=0;assert.equal(press().prevented,true);assert.deepEqual(f.packets,[[15,20,1]]);
   assert.equal(JSON.stringify(f.world['ᅠᏧ‍']),before);assert.equal(door.state,0);
  }
  door['ᴘ४１']=2;f.packets.length=0;press();assert.deepEqual(f.packets,[[15,20,2]]);assert.equal(door.state,0);
 }finally{f.mod.dispose();}
});
test('cursor picks the second adjacent door rather than the door with the E prompt',()=>{
 const {f,press}=setup();try{
  Object.assign(f.world['ᅠᏧ‍'],{'І๔︊':2,'ⲟܐ༠':20,'с̣ߏ':1,'ࡀ︂̄':15});
  assert.deepEqual(press({clientX:160}),{prevented:true,stopped:true});assert.deepEqual(f.packets,[[15,21,1]]);
  f.packets.length=0;
  assert.equal(press({target:f.dom.document.body}).prevented,true,'A game surface wrapper must not swallow the click');
  assert.deepEqual(f.packets,[[15,20,1]]);
  f.packets.length=0;press({clientX:9});assert.equal(f.packets.length,0,'Clicks outside the game surface are ignored');
 }finally{f.mod.dispose();}
});

test('door control defaults on independently of a disabled saved generic interaction setting',()=>{
 const {f,press}=setup({saved:{BestModMenuConfig:JSON.stringify({OpenEverythingByClick:false})}});try{
  assert.equal(f.mod.settings.OpenEverythingByClick,false);assert.equal(f.mod.settings.RightClickDoors,true);
  assert.equal(press().prevented,true);assert.deepEqual(f.packets,[[15,20,1]]);
  f.mod.setSetting('RightClickDoors',false);f.packets.length=0;press();assert.equal(f.packets.length,0);
 }finally{f.mod.dispose();}
});
test('door feedback waits for the requested entity state instead of faking an open door',()=>{
 const {f,door,press}=setup();try{
  press();assert.equal(door.state,0);assert.equal(f.mod.doorInteraction.status,'requested');
  f.dom.calls.length=0;f.mod.step(10);
  assert.ok(f.dom.calls.some(c=>c.name==='fillText'&&c.args[0]==='Запрос двери отправлен'));
  door.state=16;f.setClock(1100);f.mod.step(20);assert.equal(f.mod.doorInteraction.status,'confirmed');
  assert.equal(f.mod.doorInteraction.message,'Дверь открыта');assert.equal(f.mod.doorInteraction.pending,false);
  press();assert.equal(door.state,16);door.state=0;f.setClock(1200);f.mod.step(40);
  assert.equal(f.mod.doorInteraction.message,'Дверь закрыта');
 }finally{f.mod.dispose();}
});
test('a different door update cannot confirm the request; timeout is visible and sends nothing again',()=>{
 const {f,door,press}=setup();try{
  press({clientX:160});door.state=16;f.mod.step(10);assert.equal(f.mod.doorInteraction.status,'requested');
  f.setClock(2600);f.mod.step(1600);assert.equal(f.mod.doorInteraction.status,'unconfirmed');
  assert.equal(f.mod.doorInteraction.message,'Нет подтверждения от двери');assert.deepEqual(f.packets,[[15,21,1]]);
 }finally{f.mod.dispose();}
});
