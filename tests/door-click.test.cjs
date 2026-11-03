const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),{parse}=require('../tools/parser.cjs');
const {fixture,scene}=require('./mod-fixture.cjs');

function setup(){
 const f=fixture({dom:true});
 f.B.view=()=>({x:-100,y:-300,scale:2,ctx:f.dom.canvas.getContext('2d')});
 const door={id:20,x:150,y:350,'е̝ހ':0,'Іࡈ５':33<<7,'ᴘ४１':1,'αބ̞':1,'ᴀܛ٤':3,state:0};
 const container={...door,id:8,'Іࡈ５':34<<7};
 const descriptor=f.B.items[33]={'ࡀ︂̄':15};f.B.items[34]={'ࡀ︂̄':16};
 Object.assign(f.world['ᅠᏧ‍'],{x:150,y:350,'І๔︊':2,'ⲟܐ༠':8,'с̣ߏ':1,'ࡀ︂̄':16});
 f.B.isManualDoor=d=>d===descriptor;
 let eligible=true,calls=0;f.B.canUseDoor=(d,e)=>{assert.equal(d,descriptor);assert.equal(e,door);calls++;return eligible;};
 scene(f,3,[container,door,{...door,id:21,'αބ̞':2,x:250}]);f.mod.step(0);
 function press(options={}){
  let prevented=false,stopped=false;
  const event={button:2,clientX:60,clientY:70,target:f.dom.canvas,preventDefault(){prevented=true;},stopImmediatePropagation(){stopped=true;},...options};
  for(const fn of f.listeners.get('mousedown'))fn(event);
  return {prevented,stopped};
 }
 return {f,door,press,get calls(){return calls;},set eligible(value){eligible=value;}};
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
  f.packets.length=0;press({button:0});assert.equal(f.mod.aim.mouseDown,true);assert.equal(f.packets.length,0);
 }finally{f.mod.dispose();}
});
test('right click ignores UI, typing, disabled controls and other tiles',()=>{
 const state=setup(),{f,press}=state;try{
  for(const target of [{tagName:'INPUT',closest(){return null;}},{closest(){return {};}}]){
   assert.deepEqual(press({target}),{prevented:false,stopped:false});
  }
  press({clientX:260});assert.equal(state.calls,0);
  f.B.chatActive=()=>true;press();assert.equal(state.calls,0);f.B.chatActive=()=>false;
  f.mod.setSetting('OpenEverythingByClick',false);press();assert.equal(state.calls,0);
  f.mod.setSetting('OpenEverythingByClick',true);f.network.state=0;press();assert.equal(state.calls,0);
  assert.equal(f.packets.length,0);
 }finally{f.mod.dispose();}
});
test('ineligible hovered door cannot fall back to a stale selected door',()=>{
 const state=setup(),{f,press}=state;try{
  state.eligible=false;Object.assign(f.world['ᅠᏧ‍'],{'ⲟܐ༠':20,'ࡀ︂̄':15});
  assert.deepEqual(press(),{prevented:false,stopped:false});assert.equal(state.calls,1);assert.equal(f.packets.length,0);
 }finally{f.mod.dispose();}
});
test('native eligibility adapter restores selection and nearest distance on success, refusal and error',()=>{
 const op=JSON.parse(fs.readFileSync('patches/recovered-current.json')).operations.find(o=>o.id==='native-hovered-door-eligibility');
 const symbols=JSON.parse(fs.readFileSync('patches/recovered-bindings.json')).symbols;
 const reverse=Object.fromEntries(Object.entries(symbols).map(([key,value])=>[value,key]));
 const source=require('../tools/translate_payload.cjs').translate(op.after,reverse),tree=parse(source,{ecmaVersion:'latest'});
 const node=tree.body.find(n=>n.type==='ExpressionStatement'&&n.expression.type==='AssignmentExpression'&&n.expression.left.name==='__responsiveDoorEligibility').expression.right;
 const me={'І๔︊':2,'ⲟܐ༠':8,'с̣ߏ':1,'ࡀ︂̄':16,'օ᠌օ':{hint:'original'}};
 const saved={...me},ctx=vm.createContext({еܞ︌:{'ᅠᏧ‍':me},nativeNearestInteraction:0,nativeInteractionRange:12000});
 ctx.nativeSelectInteraction=(d,e,ownOnly)=>{
  assert.equal(ctx.nativeNearestInteraction,12000);assert.equal(ownOnly,e['ᴘ४１']===0?0:1);
  Object.assign(me,{'ࡀ︂̄':15,'ⲟܐ༠':20,'с̣ߏ':2,'ӧᄀ':9,'οࡃ̝':1,'І๔︊':2,'օ᠌օ':{hint:'door'}});ctx.nativeNearestInteraction=99;
  if(d.error)throw Error('selector failed');return d.allowed;
 };
 const eligible=vm.runInContext('('+source.slice(node.start,node.end)+')',ctx);
 for(const allowed of [0,1]){assert.equal(eligible({allowed},{'ᴘ४１':allowed}),allowed===1);assert.deepEqual(me,saved);assert.equal(ctx.nativeNearestInteraction,0);}
 assert.throws(()=>eligible({error:true},{'ᴘ४１':2}),/selector failed/);assert.deepEqual(me,saved);assert.equal(ctx.nativeNearestInteraction,0);
});
