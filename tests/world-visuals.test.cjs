const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),zlib=require('node:zlib'),vm=require('node:vm');
const {fixture,scene}=require('./mod-fixture.cjs');

test('hover owner labels include walls, floors and sleeping bags without interaction opcodes',()=>{
 const f=fixture({dom:true});try{
  const objects=[['Wall',27,2],['Floor',62,3],['Sleeping Bag',64,120],['Door',33,2]];
  f.world['ᴎ︃ᄉ'][2]={'ο̏︇':'Builder'};f.world['ᴎ︃ᄉ'][3]={'ο̏︇':'FloorBuilder'};
  for(const [name,item]of objects)f.B.items[item]={detail:{name},width:[100],height:[100]};
  f.B.items[33]['ࡀ︂̄']=16;
  scene(f,21,objects.map(([,item,owner],id)=>({id,x:50,y:50,'αބ̞':0,'ᴀܛ٤':0,'ᴘ४１':owner,'Іࡈ５':item<<7,'е̝ހ':0})));
  [...f.listeners.get('mousemove')][0]({clientX:35,clientY:45});f.mod.step(0);
  const labels=f.dom.calls.filter(c=>c.name==='fillText'&&/^(Wall|Floor|Sleeping Bag|Door):/.test(c.args[0]));
  assert.deepEqual(labels.map(c=>c.args[0]),['Wall: Builder #2','Floor: FloorBuilder #3','Sleeping Bag: #120','Door: Builder #2']);
  assert.equal(new Set(labels.map(c=>c.args[2])).size,4,'Stacked structures need separate label rows');
  assert.equal(f.packets.length,0);
  f.dom.calls.length=0;f.mod.setSetting('ShowBuildingOwner',false);f.mod.step(20);
  assert.ok(!f.dom.calls.some(c=>c.name==='fillText'&&/^(Wall|Floor|Sleeping Bag|Door):/.test(c.args[0])));
 }finally{f.mod.dispose();}
});
test('mine markers use camera/zoom and preserve canvas state',()=>{
 const f=fixture({dom:true});try{
  const ctx=f.dom.canvas.getContext('2d');ctx.globalAlpha=.37;ctx.strokeStyle='#abcdef';
  f.B.view=()=>({x:100,y:200,scale:.5,ctx});f.mod.highlightMine({x:100,y:100});
  const arc=f.dom.calls.find(c=>c.name==='arc');assert.deepEqual(arc.args.slice(0,3),[100,150,12.5]);
  assert.equal(ctx.globalAlpha,.37);assert.equal(ctx.strokeStyle,'#abcdef');
  f.dom.calls.length=0;f.mod.setSetting('ShowMines',false);f.mod.highlightMine({x:100,y:100});assert.equal(f.dom.calls.length,0);
 }finally{f.mod.dispose();}
});

let analysis;
function nativeFixture(op){
 const {analyze}=require('../tools/updater/static.cjs');
 analysis??=analyze(zlib.gunzipSync(fs.readFileSync('baselines/current.js.gz')).toString());
 const name=/function\s+([^\s(]+)/.exec(op.before)[1],fn=analysis.functions.find(n=>n.id?.name===name);
 const globals={};for(const n of analysis.nodes)if(n.start>=fn.start&&n.end<=fn.end&&n.type==='Identifier'){
  const v=analysis.constant(n);if(['string','number','boolean'].includes(typeof v))globals[n.name]=v;
 }
 const draws=[],states=[];let markers=0;const ctx={globalAlpha:.37,save(){states.push(this.globalAlpha);},restore(){this.globalAlpha=states.pop();}};
 Object.assign(globals,{Math,оߒ̂:ctx,ρ๗༦:20,ᴄᚅ̘:30,ܐ๖̇:Math.PI/2,с२̸:0,ܐ̙ᄅ:0,ⲣ༩༢:16,
  ᴘ̃๗:{Ꮷߎ̜(...args){draws.push({args,alpha:ctx.globalAlpha});}},
  ᴘ̏٤:{і३α:{id:1,ε͢͠:-1},ﾠ᠌ܔ:[]},ᴏ९̸:{е̙̇:()=>Infinity},
  __responsiveMod:{settings:{ShowMines:true,ShowWires:true},highlightMine(){markers++;}}
 });
 const context=vm.createContext(globals);vm.runInContext(op.after+';globalThis.render='+name+';',context);
 return {context,ctx,draws,get markers(){return markers;}};
}
for(const id of ['landmine-visibility','wire-visibility','mine-visibility'])test('native '+id+' reveals distant received objects without changing entity state',()=>{
 const profile=JSON.parse(fs.readFileSync('patches/recovered-current.json')),op=profile.operations.find(p=>p.id===id);assert.ok(op);
 const f=nativeFixture(op),sprites=['sprite0','sprite1','sprite2'];
 const descriptor={ࡀ६︈:id==='wire-visibility'?'wire':sprites,hidden:sprites};
 const e={id:5,x:10000,y:12000,ρ͏१:2,state:0,ⲣᄉߐ:0};const before=JSON.stringify(e);
 f.context.render(descriptor,e,3,4,2,1);
 assert.equal(f.draws.length,1);assert.equal(f.draws[0].alpha,1);assert.equal(f.draws[0].args[3],Math.PI);
 assert.equal(f.ctx.globalAlpha,.37);assert.equal(JSON.stringify(e),before);
 assert.equal(f.markers,id==='wire-visibility'?0:1);
 f.draws.length=0;f.context.__responsiveMod.settings.ShowMines=false;f.context.__responsiveMod.settings.ShowWires=false;
 f.context.render(descriptor,e,3,4,2,1);assert.equal(f.draws.length,0,'Disabled option must retain native distance hiding');
});
