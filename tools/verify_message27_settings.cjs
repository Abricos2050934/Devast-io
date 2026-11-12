// Exercise real GUI controllers against controlled live engine scenes. No aim
// formula is duplicated here: measurements come from the installed source.
function verifyMessage27Settings(m,n,s){
 const check=(v,t)=>{if(!v)throw Error(t);},w=n.world,self=w[s['ᅠᏧ‍']],metadata=w[s['ᴎ︃ᄉ']],clans=w[s['ﾠࡅ‍']];
 const old={settings:{...m.settings},id:self.id,state:n.network.state,ended:m.reconnect.sessionEnded,now:Date.now,meta:[1,2,3].map(id=>[id,metadata[id]]),clan:clans[0]};
 let clock=20000;const results=[],controls=[];
 function collect(folder){controls.push(...folder.__controllers);for(const child of Object.values(folder.__folders))collect(child);}collect(m.menu);
 function set(key,value){const c=controls.find(c=>c.property===key);check(c,'Missing GUI setting '+key);c.setValue(value);check(m.settings[key]===value,'GUI value is detached from aim: '+key);}
 function time(){n.setClock?.(clock);}
 function packet(id,x,y,packed=0){m.trackPacket(n.playerType??0,id,1,x,y,true,0,packed);}
 function setup(){
  m.settings.AimBotEnabled=false;m.settings.AntiAimbot=false;m.settings.JitterEnabled=false;m.onSessionStart();m.onHandshake();clock+=1000;time();
  Object.assign(m.settings,{AimBotEnabled:false,AimbotSpearEnabled:false,autoFire:false,mouseFovEnable:false,mouseFov:900,target:'players',TargetTeammate:false,lockId:-1,distanceCoefficient:100,offsetCoefficient:1,aimSmooth:1,leadCap:500,aimStick:0,aimHoldMs:0,aimMaxRange:2400,spearSpeed:46.5,spearMaxRange:560,spearHandFwd:22,spearHandSide:-39,spearStabDeg:2.5});
  for(const id of [1,2,3])metadata[id]={[s['а༤̘']]:-1,[s['ᴌ̗ⲟ']]:7};clans[0]={[s['ոᚄރ']]:7};packet(1,1000,1000);
 }
 function measurement(){const p=m.aim.targetPlayer;return {target:p?(m.targets.players[p.id]===p?'players:':'ghouls:')+p.id:null,angle:m.aim.lastAngle,point:[m.targets.lines[0].x2,m.targets.lines[0].y2]};}
 function compare(key,values,scene,metric){const samples=values.map(value=>{setup();set(key,value);scene(value);return {value,result:metric?metric():measurement()};});check(JSON.stringify(samples[0].result)!==JSON.stringify(samples[1].result),'GUI setting has no expected effect: '+key);results.push({key,samples});}
 try{
  Date.now=()=>clock;n.network.state=1;self.id=1;m.reconnect.sessionEnded=false;m.observeSocket(null);
  const moving=()=>{packet(2,1400,1000);m.settings.AimBotEnabled=true;m.aimModule.refreshTargets();for(let i=1;i<=3;i++){clock+=50;time();packet(2,1400,1000+i*30);}};
  for(const[key,values]of [['distanceCoefficient',[10,1000]],['offsetCoefficient',[0,3]],['leadCap',[40,500]],['aimSmooth',[.05,1]]])compare(key,values,moving);
  compare('aimStick',[0,800],()=>{packet(2,1400,1000);packet(3,1300,1000);m.aim.targetPlayer=m.targets.players[2];m.settings.AimBotEnabled=true;m.aimModule.refreshTargets();},()=>measurement().target);
  compare('aimHoldMs',[0,600],()=>{packet(2,1400,1000);m.settings.AimBotEnabled=true;m.aimModule.refreshTargets();clock+=50;time();packet(3,1200,1000);},()=>measurement().target);
  compare('mouseFov',[100,900],()=>{packet(2,1400,1000);m.targets.mouseMapCords={x:1000,y:1000};m.settings.mouseFovEnable=true;m.settings.AimBotEnabled=true;m.aimModule.refreshTargets();},()=>measurement().target);
  compare('mouseFovEnable',[false,true],()=>{packet(2,1400,1000);m.targets.mouseMapCords={x:1000,y:1000};m.settings.mouseFov=100;m.settings.AimBotEnabled=true;m.aimModule.refreshTargets();},()=>measurement().target);
  compare('lockId',[-1,2],()=>{packet(2,1400,1000);packet(3,1200,1000);m.settings.AimBotEnabled=true;m.aimModule.refreshTargets();},()=>measurement().target);
  compare('TargetTeammate',[false,true],()=>{metadata[1][s['а༤̘']]=metadata[2][s['а༤̘']]=0;packet(2,1200,1000);packet(3,1400,1000);m.settings.AimBotEnabled=true;m.aimModule.refreshTargets();},()=>measurement().target);
  compare('target',['players','ghouls'],()=>{packet(2,1400,1000);m.trackPacket(13,0,17,1200,1000,true);m.settings.AimBotEnabled=true;m.aimModule.refreshTargets();},()=>measurement().target);
  const spear=()=>{packet(1,1000,1000,5<<8);packet(2,1450,1000);for(let i=1;i<=3;i++){clock+=50;time();packet(2,1450,1000+20*i);}m.settings.AimbotSpearEnabled=true;m.aim.refresh();};
  for(const[key,values]of [['spearSpeed',[20,60]],['spearMaxRange',[200,600]],['spearHandFwd',[-60,60]],['spearHandSide',[-60,60]],['spearStabDeg',[.5,10]]])compare(key,values,spear,()=>({target:measurement().target,angle:m.aim.lastAngle,point:[m.targets.lines[1].x2,m.targets.lines[1].y2]}));
  return {status:'passed',gui_controls_live:true,checked:results.length,results,conditional_settings:{mouseFov:'requires mouseFovEnable; source values above 1600 use 900',prediction:'distance/offset need target velocity to change lead',spear:'spear fields require spear mode and weapon 5'}};
 }finally{Date.now=old.now;m.settings.AimBotEnabled=false;m.settings.AntiAimbot=false;m.settings.JitterEnabled=false;m.onSessionStart();m.onHandshake();self.id=old.id;n.network.state=old.state;m.reconnect.sessionEnded=old.ended;for(const[id,value]of old.meta)metadata[id]=value;clans[0]=old.clan;Object.assign(m.settings,old.settings);m.setSetting('AimBotEnabled',old.settings.AimBotEnabled);}
}
module.exports={verifyMessage27Settings};
