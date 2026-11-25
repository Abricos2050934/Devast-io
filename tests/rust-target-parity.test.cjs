const test=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./mod-fixture.cjs');
function pair(options){
 const previousRust=process.env.DEVAST_RUST_MOD,previousCandidate=process.env.DEVAST_TEST_CANDIDATE;
 try{
  delete process.env.DEVAST_TEST_CANDIDATE;delete process.env.DEVAST_RUST_MOD;const js=fixture(options);
  process.env.DEVAST_RUST_MOD='rust-mod';return[js,fixture(options)];
 }finally{
  if(previousRust===undefined)delete process.env.DEVAST_RUST_MOD;else process.env.DEVAST_RUST_MOD=previousRust;
  if(previousCandidate===undefined)delete process.env.DEVAST_TEST_CANDIDATE;else process.env.DEVAST_TEST_CANDIDATE=previousCandidate;
 }
}
test('optimized Rust eligibility matches source across activity, metadata and clan changes',()=>{
 const previousRust=process.env.DEVAST_RUST_MOD,previousCandidate=process.env.DEVAST_TEST_CANDIDATE;
 let js,rust;
 try{
  delete process.env.DEVAST_TEST_CANDIDATE;delete process.env.DEVAST_RUST_MOD;js=fixture();
  process.env.DEVAST_RUST_MOD='rust-mod';rust=fixture();
 }finally{
  if(previousRust===undefined)delete process.env.DEVAST_RUST_MOD;else process.env.DEVAST_RUST_MOD=previousRust;
  if(previousCandidate===undefined)delete process.env.DEVAST_TEST_CANDIDATE;else process.env.DEVAST_TEST_CANDIDATE=previousCandidate;
 }
 try{
  for(const f of [js,rust]){f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,2,1200,1000,true);}
  let cases=0;
  for(const allow of [false,true])for(const selfTeam of [-1,0])for(const targetTeam of [-1,0,1])
   for(const membership of [undefined,7,8])for(const clan of [null,{}, {'ոᚄރ':7}])
    for(const active of [false,true])for(const x of [1200,-1,NaN,Infinity,'1200',null]){
     const outputs=[];
     for(const f of [js,rust]){
      f.mod.settings.TargetTeammate=allow;
      f.world['ᴎ︃ᄉ'][1]={'ο̏︇':'Self','а༤̘':selfTeam,'ᴌ̗ⲟ':7};
      f.world['ᴎ︃ᄉ'][2]={'ο̏︇':'Target','а༤̘':targetTeam,'ᴌ̗ⲟ':membership};
      f.world['ﾠࡅ‍'][0]=clan;
      const p=f.mod.targets.players[2];Object.assign(p,{active,x,y:1000});
      outputs.push(f.mod.aim.isPlayerCandidate(p));
     }
     assert.equal(outputs[1],outputs[0],JSON.stringify({allow,selfTeam,targetTeam,membership,clan,active,x}));cases++;
     const selected=[];
     for(const f of [js,rust]){f.mod.aim.targetPlayer=null;f.mod.aim._heldTarget=null;f.mod.aim._heldUntil=0;selected.push(f.mod.aim.findNearestPlayerTo({x:1000,y:1000},2400)?.id??null);}
     assert.equal(selected[1],selected[0],'selection '+JSON.stringify({allow,selfTeam,targetTeam,membership,clan,active,x}));
    }
  assert.equal(cases,1296);
  for(const f of [js,rust]){
   f.world['ᴎ︃ᄉ'][2]=undefined;assert.equal(f.mod.aim.isPlayerCandidate(f.mod.targets.players[2]),false);
   assert.equal(f.mod.aim.isPlayerCandidate(f.mod.targets.players[1]),false);
  }
 }finally{js.mod.dispose();rust.mod.dispose();}
});
test('lazy Rust player projection and colors preserve labels, hitboxes and karma drawing',()=>{
 const fixtures=pair({dom:true});
 try{
  const {scene,player}=require('./mod-fixture.cjs');
  for(const f of fixtures){f.B.synchronizedRender=true;scene(f,1,[player(1,100,100),player(2,150,200)]);}
  for(const native of [false,true])for(const hitboxes of [false,true])for(const karma of [false,true]){
   const logs=[];
   for(const f of fixtures){
    f.B.nativePlayerLabels=native;Object.assign(f.mod.settings,{ShowNamesOnMap:true,ShowPlayerHitbox:hitboxes,KarmaAboveHead:karma});
    const sprites=[];f.B.karma[1]={sprite:'karma'};f.world['ᴎ︃ᄉ'][2]['ᴑᴄ̉']=1;
    f.B.graphics['ᴑ̸ᴘ']=(sprite,...args)=>sprites.push([sprite.sprite,...args]);
    f.dom.calls.length=0;f.mod.render(1000);
    logs.push(JSON.stringify({sprites,draw:f.dom.calls.filter(c=>['fillText','strokeText','arc','strokeRect'].includes(c.name))}));
   }
   assert.equal(logs[1],logs[0],JSON.stringify({native,hitboxes,karma}));
  }
 }finally{for(const f of fixtures)f.mod.dispose();}
});
test('Rust scoring retains source range, floored-distance ties, stick and hold choices',()=>{
 const fixtures=pair();let seed=0x56ace;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 try{
  for(const f of fixtures){f.mod.trackPacket(1,1,1,1000,1000,true);for(let id=2;id<=24;id++)f.world['ᴎ︃ᄉ'][id]={'ο̏︇':'P'+id,'а༤̘':-1};}
  for(let round=0;round<320;round++){
   const points=Array.from({length:23},(_,i)=>({id:i+2,x:1000+(random()-.5)*1600,y:1000+(random()-.5)*1600,active:random()>.15}));
   // Equal floored distance and points just either side of a range boundary.
   points[0]={id:2,x:1100,y:1000.001,active:true};points[1]={id:3,x:1100,y:1000.002,active:true};
   const anchor={x:1000+(random()-.5)*100,y:1000+(random()-.5)*100},fov=[100,300,900][round%3],outputs=[];
   for(const f of fixtures){
    Object.assign(f.mod.settings,{aimMaxRange:round%2?500:2400,aimStick:round%4*80,aimHoldMs:200,target:round%5?'players':'all'});
    for(const p of points)Object.assign(f.mod.targets.players[p.id],p);
    const held=round%3?f.mod.targets.players[2]:null;
    f.mod.aim.targetPlayer=held;f.mod.aim._heldTarget=held;f.mod.aim._heldUntil=round%2?1200:0;
    const result=f.mod.aim.findNearestPlayerTo(anchor,fov);
    outputs.push(result?.id??null);
   }
   assert.equal(outputs[1],outputs[0],'round '+round);
  }
 }finally{for(const f of fixtures)f.mod.dispose();}
});
test('sparse high UIDs retain numeric tie order without changing target results',()=>{
 const fixtures=pair();
 try{
  const outputs=[];
  for(const f of fixtures){
   f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,2,1100,1000,true);
   f.mod.trackPacket(13,0,65535,1100,1000,true);f.mod.trackPacket(13,0,40000,1100,1000,true);
   Object.assign(f.mod.settings,{target:'all',aimStick:0,aimHoldMs:0});
   f.mod.aim.targetPlayer=null;f.mod.aim._heldTarget=null;f.mod.aim._heldUntil=0;
   const result=f.mod.aim.findNearestPlayerTo({x:1000,y:1000},900);
   outputs.push(result===f.mod.targets.players[2]?'p2':'g'+result?.id);
  }
  assert.deepEqual(outputs,['p2','p2']);
  for(const f of fixtures){f.mod.settings.target='ghouls';f.mod.aim.targetPlayer=null;f.mod.aim._heldTarget=null;f.mod.aim._heldUntil=0;}
  assert.equal(fixtures[0].mod.aim.findNearestPlayerTo({x:1000,y:1000},900).id,40000);
  assert.equal(fixtures[1].mod.aim.findNearestPlayerTo({x:1000,y:1000},900).id,40000);
 }finally{for(const f of fixtures)f.mod.dispose();}
});
