// Runs only isolated, reviewed original ILM declarations inside the browser fixture.
function verifyOriginalIlm(m,n,s,reference) {
 const check=(value,message)=>{if(!value)throw Error(message);};
 const props=['ShowRealAngles','target','distanceCoefficient','bulletSpeedCoefficient','offsetCoefficient'];
 const folder=m.menu.__folders['Aim Bot'];
 check(JSON.stringify(folder.__controllers.map(c=>c.property))===JSON.stringify(props),'Aim menu differs from original ILM');
 check(Object.keys(folder.__folders).length===0,'Custom aim preset folder remains');
 check(!Object.hasOwn(m.settings,'ImprovedAimEnabled')&&typeof m.applyAimPreset==='undefined','Custom aim algorithm remains installed');
 const create=new Function('settings','world','send',
  'const _0x225287=()=>{throw Error("Unexpected decoder")},_0x349c=_0x225287;'+
  'const _0x2ea565=settings,_0x10898e=world,_0x4c996c=send;'+reference.blocks.map(b=>b.source).join('\n')+
  'const _0x6cc5f2=new _0x3e2cd1(),_0x41e779=new _0x4b5d6f();return {targets:_0x6cc5f2,aim:_0x41e779,tick:_0x4a7389};');
 const self=n.world[s['ᅠᏧ‍']],metadata=n.world[s['ᴎ︃ᄉ']],clans=n.world[s['ﾠࡅ‍']];
 const keys=['AimBotEnabled','autoFire','target','lockId','mouseFovEnable','mouseFov','distanceCoefficient','bulletSpeedCoefficient','offsetCoefficient','resolverType','visualizeResolving','visualizeResolvingColor','JitterEnabled'];
 const saved=Object.fromEntries(keys.map(k=>[k,m.settings[k]])),savedId=self.id,savedState=n.network.state,savedClan=clans[0];
 const savedMetadata=[1,2,3,17].map(id=>[id,metadata[id]]);
 const oldSettings={...m.settings},oldWorld={PLAYER:{id:1,team:-1},players:Array.from({length:1000},()=>({team:-1}))};
 let expected=[],connected=true,checks=0;const old=create(oldSettings,oldWorld,p=>{if(connected)expected.push(p);});
 const transport=n.capturePackets(),socket={readyState:1,bufferedAmount:0};
 const normalize=p=>p[0]===6?[6,(Math.round(p[1])%360+360)%360]:p;
 function snapshot(engine){return JSON.stringify({lastId:engine.targets.lastId,lastAngle:engine.aim.lastAngle,target:engine.aim.targetPlayer?.id,mouse:engine.targets.mouseMapCords,lines:engine.targets.lines,players:engine.targets.players.filter(p=>p.active),ghouls:engine.targets.ghouls.filter(p=>p.active)});}
 function set(key,value){m.settings[key]=oldSettings[key]=value;}
 function track(type,id,uid,x,y,active=true){
  m.trackPacket(type===13?13:0,id,uid,x,y,active);
  const target=type===13?old.targets.ghouls[uid]:old.targets.players[id];
  if(active)target.update(x,y);else target.setInactive();
 }
 function compare(label){
  old.tick();m.aim.refresh();
  check(snapshot(m)===snapshot(old),'Original ILM state differs: '+label);
  check(JSON.stringify(transport.packets)===JSON.stringify(expected.map(normalize)),'Original ILM commands differ: '+label);
  transport.packets.length=expected.length=0;checks++;
 }
 try{
  m.settings.JitterEnabled=false;n.network.state=1;self.id=1;clans[0]={[s['ոᚄރ']]:7};
  for(const id of [1,2,3,17])metadata[id]={[s['а༤̘']]:-1,[s['ᴌ̗ⲟ']]:7};
  m.observeSocket(socket);
  for(let scene=0;scene<36;scene++){
   for(const engine of [m,old]){
    for(const p of engine.targets.players)p.setInactive();for(const p of engine.targets.ghouls)p.setInactive();
    engine.targets.lastId=0;engine.aim.lastAngle=0;engine.aim.targetPlayer=null;
    engine.targets.mouseMapCords={x:1100+scene*5,y:1100};
   }
   set('AimBotEnabled',true);set('autoFire',scene%2===0);set('target',['players','ghouls','all'][scene%3]);
   set('mouseFovEnable',scene%2===0);set('mouseFov',scene%5===0?30:1800);set('lockId',scene%7===0?2:-1);
   for(let step=0;step<12;step++){
    socket.bufferedAmount=step===8?8192:0;socket.readyState=step===9?3:1;connected=socket.readyState===1;
    set('distanceCoefficient',100+(scene*31+step*47)%900);set('offsetCoefficient',(step%4)/2);
    set('bulletSpeedCoefficient',1+(scene+step)%15);set('resolverType',step%2?'smoothed':'linear');
    set('visualizeResolving',step%3!==0);set('visualizeResolvingColor',step%2?'#abcdef':'#EEEEEE');
    set('AimBotEnabled',step!==3);self.id=oldWorld.PLAYER.id=step===11?0:1;
    const ownTeam=scene%4===0?0:-1,otherTeam=step%4===0?0:-1;
    metadata[1][s['а༤̘']]=oldWorld.PLAYER.team=oldWorld.players[1].team=ownTeam;
    metadata[2][s['а༤̘']]=oldWorld.players[2].team=otherTeam;
    track(0,1,1,1000+step*2,1000+step);track(0,2,1,1100+(step%3===0?-30:step*12),1050+step*11);
    track(0,3,1,1400-step*3,1250+step);track(13,0,17,1150+step*4,1100-step*7);
    if(step===5)track(0,2,1,0,0,false);
    const line=JSON.stringify(m.targets.lines),angle=m.aim.lastAngle,before=transport.packets.length;
    m.beforeFire();check(transport.packets.length===before&&m.aim.lastAngle===angle&&JSON.stringify(m.targets.lines)===line,'Manual fire changed original ILM cadence');
    compare('scene '+scene+' step '+step);
   }
  }
  // Original line renderer draws four stored lines even when updating is disabled;
  // visualizeResolvingColor is an unused original field, not a color override.
  self.id=1;n.network.state=1;socket.readyState=1;m.settings.AimBotEnabled=true;m.settings.visualizeResolving=false;
  m.settings.visualizeResolvingColor='#abcdef';const stroke=n.ctx.stroke,colors=[];
  n.ctx.stroke=function(...args){colors.push(this.strokeStyle);return stroke.apply(this,args);};
  try{m.render();check(colors.some(c=>c.toLowerCase()==='#eeeeee')&&!colors.includes('#abcdef'),'Original ILM line rendering changed');}finally{n.ctx.stroke=stroke;}
  return {scenes:36,ticks:checks,exact_core_state:true,exact_native_commands:true,original_menu_controls:5,normal_fire_between_ticks:'unchanged',line_visibility_and_color:'original_ILM'};
 }finally{
  transport.restore();m.observeSocket(null);self.id=savedId;n.network.state=savedState;clans[0]=savedClan;
  for(const [id,value]of savedMetadata)metadata[id]=value;
  for(const [key,value]of Object.entries(saved))m.settings[key]=value;
 }
}
module.exports={verifyOriginalIlm};
