const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),z=require('node:zlib'),vm=require('node:vm');
const {audit}=require('../tools/audit_ilm_port.cjs');
const ref=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-aim-reference.json.gz')));
function instance(original){
 const ctx=vm.createContext({});
 const setup=`var packets=[];var settings={AimBotEnabled:true,autoFire:true,target:'players',lockId:-1,mouseFovEnable:false,mouseFov:12345,distanceCoefficient:300,offsetCoefficient:.1,visualizeResolving:true};var world={PLAYER:{id:1,team:-1},players:Array.from({length:1000},()=>({team:-1}))};`;
 const code=original?`const _0x225287=()=>{throw Error('Live decoder')},_0x349c=_0x225287;const _0x2ea565=settings,_0x10898e=world,_0x4c996c=p=>packets.push(p);${ref.blocks.map(b=>b.source).join('\n')}const _0x6cc5f2=new _0x3e2cd1(),_0x41e779=new _0x4b5d6f();var engine={targets:_0x6cc5f2,aim:_0x41e779,tick:_0x4a7389};`:fs.readFileSync('mod/ilm-aim.js','utf8')+'\nvar engine=__createIlmAim(settings,world,p=>packets.push(p));';
 vm.runInContext(setup+code,ctx,{timeout:1000});return ctx;
}
const snap=`JSON.stringify({packets,settings,target:engine.aim.targetPlayer?.id,lastAngle:engine.aim.lastAngle,lines:engine.targets.lines,players:engine.targets.players.filter(t=>t.active),ghouls:engine.targets.ghouls.filter(t=>t.active),lastId:engine.targets.lastId,keys:Object.keys(engine.targets)})`;
test('every original ILM declaration and local variable survives verbatim and AST comparison',()=>{const r=audit();assert.equal(r.classes,4);assert.equal(r.removed_unused_decoder_aliases,0);assert.equal(r.preserved_unused_decoder_aliases,14);assert.equal(r.ast_parity,'exact');assert.equal(r.source_parity,'verbatim_stored_decoded_declarations');});
test('original upload and transplanted aim agree over 180 deterministic scenes and six ticks per scene',()=>{
 const original=instance(true),ported=instance(false);
 for(let i=0;i<180;i++){
  const script=`engine.targets.players.forEach(p=>p.setInactive());engine.targets.ghouls.forEach(p=>p.setInactive());world.PLAYER.id=1;world.PLAYER.team=${i%3===0?2:-1};world.players[2].team=${i%4===0?2:3};world.players[3].team=-1;
  Object.assign(settings,{target:${JSON.stringify(['players','ghouls','all'][i%3])},mouseFovEnable:${i%2===0},mouseFov:${i%5===0?50:2000},lockId:${i%7===0?2:i%11===0?120:-1},distanceCoefficient:${100+i},offsetCoefficient:${i%4/3},autoFire:${i%3!==0},visualizeResolving:${i%2===0}});
  engine.targets.mouseMapCords={x:${i*3},y:${i*-2}};
  engine.targets.players[1].update(${i},${-i});
  for(const [id,group] of [[2,'players'],[3,'players'],[120,'players'],[17,'ghouls'],[998,'ghouls']])for(let j=0;j<4;j++)engine.targets[group][id].update(id+j*${i%2?-10:10},id+j*j*${i%3?-5:5});
  engine.tick();engine.tick();engine.targets.players[2].update(0,0);engine.tick();settings.AimBotEnabled=false;engine.tick();world.PLAYER.id=0;engine.tick();world.PLAYER.id=1;settings.AimBotEnabled=true;engine.tick();`;
  vm.runInContext(script,original,{timeout:1000});vm.runInContext(script,ported,{timeout:1000});
  assert.equal(vm.runInContext(snap,ported),vm.runInContext(snap,original),'Scene '+i);
 }
});
test('native labels append exactly one client suffix and keep unused zero sentinel',()=>{
 const ctx=vm.createContext({});vm.runInContext(fs.readFileSync('mod/ilm-aim.js','utf8'),ctx);
 for(const [name,id,expected] of [['Pilot',2,'Pilot#2'],['',120,'#120'],['Name#tag',3,'Name#tag#3'],['Name#3',3,'Name#3#3'],[0,4,0]]){
  ctx.name=name;ctx.id=id;assert.equal(vm.runInContext('__ilmPlayerNickname(name,id)',ctx),expected);
 }
});

test('thirteen ILM aim defaults retain their original values and the resolver defaults to the restored pooled predictor',()=>{
 const a=require('../tools/parser.cjs');
 const ref=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-integration-reference.json.gz'))).find(x=>x.name==='_0x3ff00c');
 const own=fs.readFileSync('mod/responsive.js','utf8');
 const original=a.parse(ref.source,{ecmaVersion:'latest'}).body[0];
 const current=a.parse(own,{ecmaVersion:'latest'}).body[0].body.body.find(n=>n.id?.name==='HackCon');
 function values(n,out={}){
  if(!n||typeof n!=='object')return out;
  function value(n){if(n.type==='Literal')return n.value;if(n.type==='ArrayExpression')return [];if(n.type==='UnaryExpression'){const v=value(n.argument);if(n.operator==='!')return !v;if(n.operator==='-')return -v;}throw Error('Nonliteral setting');}
  if(n.type==='AssignmentExpression'&&n.left.object?.type==='ThisExpression')out[n.left.computed?n.left.property.value:n.left.property.name]=value(n.right);
  for(const v of Object.values(n))if(Array.isArray(v))v.forEach(x=>values(x,out));else if(v&&typeof v==='object')values(v,out);return out;
 }
 const expected=values(original),actual=values(current);
 for(const key of ['AimbotKey','ShowRealAngles','AimBotEnabled','target','mouseFovEnable','resolverType','distanceCoefficient','bulletSpeedCoefficient','offsetCoefficient','visualizeResolving','visualizeResolvingColor','autoFire','lockId','mouseFov'])assert.equal(actual[key],expected[key],key);
});

test('native metadata constructor patch matches only its reviewed assignment and preserves all other native code',()=>{
 const ctx=vm.createContext({});vm.runInContext(fs.readFileSync('mod/ilm-aim.js','utf8'),ctx);
 const src=z.gunzipSync(fs.readFileSync('baselines/current-metadata.js.gz')).toString();ctx.native=src;
 const patched=vm.runInContext('__ilmPatchPlayerMetadata(native)',ctx);
 assert.equal(patched,src.replace('this.ο३︀ = ο३︀','this.ο३︀ = __ilmPlayerNickname(ο३︀,ᴘ५٢)'));
 ctx.native='changed native constructor';assert.throws(()=>vm.runInContext('__ilmPatchPlayerMetadata(native)',ctx),/Unsupported/);
});
