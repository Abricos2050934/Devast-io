const test=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./mod-fixture.cjs'),{oracle}=require('./ilm-oracle.cjs');
function pair(){
 const f=fixture({dom:true,fireKey:'nativeFire'});f.mod.setSetting('ImprovedAimEnabled',false);f.mod.setSetting('resolverType','linear');const old=oracle(f.mod.settings);
 f.dom.canvas.getBoundingClientRect=()=>({left:0,top:0,width:800,height:600});
 let now=0,view={x:0,y:0,scale:1},wireAngle=null,wireFramePlayer=0;
 f.B.view=()=>({...view,ctx:f.dom.canvas.getContext('2d')});
 const snapshot=()=>JSON.parse(JSON.stringify({lastId:f.mod.targets.lastId,lastAngle:f.mod.aim.lastAngle,target:f.mod.aim.targetPlayer?.id,mouse:f.mod.targets.mouseMapCords,lines:f.mod.targets.lines,players:f.mod.targets.players.filter(p=>p.active),ghouls:f.mod.targets.ghouls.filter(p=>p.active)}));
 function equal(label){
  assert.deepEqual(snapshot(),old.snapshot(),label+' state');
  // Keep exact core-state parity. The transport intentionally omits only
  // redundant angle messages; attack/release and changed directions survive.
  const expected=old.drain().filter(packet=>{if(packet[0]!==6)return true;if(packet[1]===wireAngle)return false;wireAngle=packet[1];return true;});
  assert.deepEqual(JSON.parse(JSON.stringify(f.packets)),expected,label+' coalesced wire packets');f.packets.length=0;
 }
 return {
  f,old,equal,
  set(k,v){if(k==='AimBotEnabled'&&f.mod.settings[k]!==v)wireAngle=null;f.mod.setSetting(k,v);old.set(k,v);},
  team(id,team){f.world['ᴎ︃ᄉ'][id]??={'ο̏︇':'Player '+id};Object.assign(f.world['ᴎ︃ᄉ'][id],{'а༤̘':team,'ᴌ̗ⲟ':7});if(team>=0)f.world['ﾠࡅ‍'][team]={'ոᚄރ':7};old.team(id,team);},
  self(id){if(f.world['ᅠᏧ‍'].id!==id)wireAngle=null;f.world['ᅠᏧ‍'].id=id;old.self(id);},
  state(state){if(state!==1)wireAngle=null;f.network.state=state;old.connected(state===1);},
  packet(data){f.mod.trackPacket(data.type===13?13:1,data.id??2,data.uid??1,data.x??0,data.y??0,data.active??true);old.packet(data);},
  move(x,y){for(const fn of f.listeners.get('mousemove'))fn({clientX:x,clientY:y});old.move(x,y);},
  frame(next=view){
   const active=f.network.state===1?f.world['ᅠᏧ‍'].id:0;
   if(!active||active!==wireFramePlayer)wireAngle=null;wireFramePlayer=active;
   view=next;f.setClock(now+=16);f.mod.step(now);old.frame(view);
  },
  tick(){assert.equal(f.timerPeriods.values().next().value,50);for(const tick of f.timers.values())tick();old.tick();},
  fire(){f.network.nativeFire();old.fire();},
  dispose(){f.mod.dispose();}
 };
}
function initial(p){
 p.packet({id:1,x:1000,y:1000});p.packet({id:2,x:1100,y:1050});
 p.packet({type:13,id:0,uid:17,x:1150,y:1100});
 p.set('mouseFovEnable',false);p.set('AimBotEnabled',true);p.frame();p.tick();
}
test('installed mod matches original ILM across toggles, manual fire, disconnect, ID changes and death',()=>{
 const p=pair();try{
  initial(p);p.equal('initial');
  p.packet({id:2,x:1080,y:1100});p.fire();p.equal('click between 50 ms ticks');
  p.set('AimBotEnabled',false);p.equal('disabled retains original state');
  p.packet({id:2,x:1060,y:1140});p.tick();p.equal('disabled tick');
  p.set('AimBotEnabled',true);p.tick();p.equal('enabled again');
  p.state(64);p.frame();p.equal('temporary disconnect preserves history');
  p.tick();p.equal('offline tick preserves ILM calculation without wire sends');
  p.state(1);p.frame();p.tick();p.equal('resume without repeated position packets');
  p.packet({id:3,x:1200,y:1200});p.self(3);p.frame();p.equal('new self packet before next frame');
  p.tick();p.equal('new ID does not discard received history');
  p.self(0);p.state(0);p.frame();p.equal('death before timer');
  p.tick();p.equal('ILM death resets players, retaining original ghoul behavior');
  p.state(1);p.self(1);p.packet({id:1,x:1000,y:1000});p.packet({id:2,x:1100,y:1050});p.frame();p.tick();p.equal('respawn');
  p.packet({id:0,active:false});p.equal('zero-slot removal resets lines');
 }finally{p.dispose();}
});
test('FOV mouse initialization, disabled frames and camera changes match the original render hook',()=>{
 const p=pair();try{
  p.frame({x:-100,y:-200,scale:2});p.equal('before first mouse event');
  p.move(400,300);p.frame();p.equal('mousemove');
  p.set('mouseFovEnable',false);p.move(50,70);p.frame({x:-200,y:-300,scale:1.5});p.equal('FOV disabled does not replace saved aim coordinates');
  p.set('mouseFovEnable',true);p.equal('toggle waits for next game frame');
  p.frame();p.equal('FOV resumed');
 }finally{p.dispose();}
});
test('complete installed mod agrees with original ILM receiver and timer over 36 deterministic event traces',()=>{
 for(let scene=0;scene<36;scene++){
  const p=pair();try{
   initial(p);p.set('target',['players','ghouls','all'][scene%3]);p.set('autoFire',scene%2===0);
   for(let n=0;n<60;n++){
    p.packet({id:1,x:1000+n*2,y:1000+n});
    p.packet({id:2,x:1200+Math.floor(80*Math.sin(n+scene)),y:1100+Math.floor(60*Math.cos(n*.7))});
    p.packet({id:3,x:1300+Math.floor(120*Math.sin(n*.5)),y:1250+n});
    p.packet({type:13,id:0,uid:17,x:1120+n*3,y:1080+n*2});
    if(n%5===0)p.set('lockId',n%10===0?2:-1);
    if(n%7===0){p.set('distanceCoefficient',100+(scene*7+n)%900);p.set('offsetCoefficient',(n%4)/2);}
    if(n%9===0){p.set('mouseFovEnable',n%18===0);p.set('mouseFov',300+(scene+n)*5);}
    if(n%11===0)p.team(2,n%22===0?0:-1);
    p.team(1,scene%4===0?0:-1);
    p.move(300+n*2,200+n);p.frame({x:-800+n,y:-700,scale:1+(scene%3)/2});
    if(n===20)p.state(64);if(n===23)p.state(1);
    if(n===30)p.set('AimBotEnabled',false);if(n===33)p.set('AimBotEnabled',true);
    p.tick();if(n%4===0&&p.f.network.state===1)p.fire();
    if(n%13===0)p.packet({id:2,active:false});
    p.equal('scene '+scene+', event '+n);
   }
  }finally{p.dispose();}
 }
});
