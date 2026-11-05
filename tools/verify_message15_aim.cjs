function verifyMessage15Aim(m,n,s,r,reference) {
 const check=(v,message)=>{if(!v)throw Error(message);};
 const self=n.world[s['ᅠᏧ‍']],metadata=n.world[s['ᴎ︃ᄉ']],clans=n.world[s['ﾠࡅ‍']];
 const keys=['AimBotEnabled','JitterEnabled','autoFire','target','lockId','mouseFovEnable','mouseFov','distanceCoefficient','offsetCoefficient','bulletSpeedCoefficient','resolverType','visualizeResolving','visualizeResolvingColor','ShowAimTrace','hideAimbotAngle','jitterActive','jitterOffset','stopJittersOnStop','antiAimMode','DodgePlayerEnabled'];
 const saved=Object.fromEntries(keys.map(k=>[k,m.settings[k]])),savedId=self.id,savedState=n.network.state,savedClan=clans[0];
 const savedMetadata=[1,2,3,17].map(id=>[id,metadata[id]]),transport=n.capturePackets();
 const realNow=Date.now;let clock=1000;Date.now=()=>clock;
 const expected=[],world={PLAYER:{id:1,team:-1},players:Array.from({length:1000},()=>({team:-1}))},settings={...m.settings};
 const normalize=p=>p[0]===6?[6,(Math.round(p[1])%360+360)%360]:p;
 const create=new Function('MOD','World','Client','window','Entitie','__ENTITIE_BULLET__','KeyboardEvent',reference.blocks.filter(b=>['GetAllTargetsCon','GetTarget','AimbotCon','JitterCon','LinesCon','_lineIntersect'].includes(b.label)).map(b=>b.source).join('\n')+'\nvar GetAllTargets=new GetAllTargetsCon(),Aimbot=new AimbotCon(),Jitter=new JitterCon();return {targets:GetAllTargets,aim:Aimbot,jitter:Jitter};');
 const fakeWindow={Math,JSON,dispatchEvent(){}},old=create(settings,world,{state:1,sendPacket:value=>expected.push(normalize(JSON.parse(value)))},fakeWindow,{units:[],border:[]},2,KeyboardEvent);
 let comparisons=0;
 function set(key,value){m.setSetting(key,value);settings[key]=value;}
 function state(e){return JSON.stringify({lastId:e.targets.lastId,lastAngle:e.aim.lastAngle,target:e.aim.targetPlayer?.id,dead:e.aim.dead,mouseDown:e.aim.mouseDown,lines:e.targets.lines,players:e.targets.players.filter(p=>p?.active),ghouls:e.targets.ghouls.filter(p=>p?.active)});}
 function compare(label){check(state(m)===state(old),'Uploaded aim state differs: '+label);check(JSON.stringify(transport.packets)===JSON.stringify(expected),'Uploaded aim packets differ: '+label+' actual '+JSON.stringify(transport.packets)+' expected '+JSON.stringify(expected));transport.packets.length=expected.length=0;comparisons++;}
 function track(type,id,uid,x,y,active=true){clock+=50;m.trackPacket(type,id,uid,x,y,active);const target=type===13?old.targets.ghouls[uid]:old.targets.players[id];if(active)target.update(x,y);else target.setInactive();compare('position/removal '+type+'/'+id+'/'+uid);}
 function core(){return {settings:m.settings,targets:m.targets,aim:m.aim};}
 try{
  m.setSetting('JitterEnabled',false);n.network.state=1;self.id=1;m.onHandshake();clans[0]={[s['ոᚄރ']]:7};
  for(const id of [1,2,3,17])metadata[id]={[s['а༤̘']]:-1,[s['ᴌ̗ⲟ']]:7};
  const folder=m.menu.__folders['Best Aim Bot #1'];
  check(!!folder&&!m.menu.__folders['Aim Bot']&&!m.menu.__folders.Prediction,'The former aim menu remains');
  const originalControls=reference.menu_controls;
  check(JSON.stringify(folder.__controllers.slice(0,originalControls.length).map(c=>c.property))===JSON.stringify(originalControls),'Uploaded menu order changed');
  check(m.menu.__folders.Visuals.__folders.Colors.__controllers.some(c=>c.property==='visualizeResolvingColor'),'Aim color control was not transferred');
  for(let scene=0;scene<24;scene++){
   m.aim.onDeath();old.aim.onDeath();for(let i=0;i<old.targets.lines.length;i++)Object.assign(m.targets.lines[i],old.targets.lines[i]);m.onHandshake();old.aim.dead=false;transport.packets.length=expected.length=0;
   set('AimBotEnabled',true);set('autoFire',scene%3===0);set('target',['players','ghouls','all'][scene%3]);set('lockId',scene%5===0?2:-1);
   set('mouseFovEnable',scene%2===0);set('mouseFov',scene%7===0?80:2000);set('distanceCoefficient',100+scene*20);set('offsetCoefficient',(scene%4)*.1);set('bulletSpeedCoefficient',1+scene%14);
   set('resolverType',scene%2?'trygonometrical':'linear');set('visualizeResolving',scene%3!==1);set('ShowAimTrace',scene%4===0);set('hideAimbotAngle',scene%4===1);
   set('jitterActive',scene>=18);set('jitterOffset',scene%9);set('stopJittersOnStop',scene%2===0);set('antiAimMode',['At target','Round','Round2'][scene%3]);
   for(const e of [m,old]){e.targets.mouseMapCords={x:1400,y:1100};e.targets.myLastMoveDirection=9;}
   // Keep identical source Jitter counters between repeated independent scenes.
   const ownTeam=scene%4===0?0:-1,otherTeam=scene%6===0?0:-1;
   metadata[1][s['а༤̘']]=world.PLAYER.team=world.players[1].team=ownTeam;
   metadata[2][s['а༤̘']]=world.players[2].team=otherTeam;
   for(let step=0;step<12;step++){
    track(0,1,1,1000+step*3,1000+step);
    track(0,2,1,1400+(step%3)*15,1100+step*12);
    track(0,3,1,1600-step*9,1200-step*4);
    track(13,0,17,1250+step*5,1300-step*7);
    if(step===5)track(0,2,1,0,0,false);
    // Source stationary-position behavior is compared, without correcting it.
    if(step===7){track(0,3,1,1600-step*9,1200-step*4);}
    m.aim.refresh();old.aim.refresh();compare('refresh scene '+scene+' step '+step);
   }
  }
  set('jitterActive',false);set('autoFire',false);set('lockId',2);set('resolverType','linear');set('visualizeResolving',true);set('ShowAimTrace',true);set('hideAimbotAngle',false);
  // Simulate the native transport's attack, then the exact source callbacks.
  transport.packets.length=expected.length=0;n.network[r['ᴎ༩༣']]();expected.push([4]);old.aim.mouseDown=true;old.aim.scheduleRefresh();compare('native fire callback order');
  n.release();expected.push([5]);old.aim.mouseDown=false;old.aim.scheduleRefresh();compare('native release callback order');
  set('jitterActive',true);set('stopJittersOnStop',false);set('antiAimMode','At target');
  n.network[r['ᴎ༩༣']]();expected.push([4]);expected.push(normalize([6,old.aim.resolve()]));old.aim.mouseDown=true;old.aim.scheduleRefresh();compare('native source Jitter fire callback');
  n.release();expected.push([5]);old.aim.mouseDown=false;old.aim.scheduleRefresh();compare('native source Jitter release callback');
  set('jitterActive',false);
  // Exercise the translated projectile fields and the actual native keyboard.
  const own=m.targets.players[1],bullet=n.entities.get(2,25,1,2),keyEvents=[];
  const observeKey=event=>{keyEvents.push([event.type,event.keyCode]);n.keyboard[event.type==='keydown'?r.messageKeyboardDown:r.messageKeyboardUp](event);};window.addEventListener('keydown',observeKey);window.addEventListener('keyup',observeKey);
  try{
   Object.assign(bullet,{id:25,x:own.x-100,y:own.y,[s['е̝ހ']]:0,[s['ᴘ४１']]:2,[s['ееᏧ']]:1,[s['ρᄁܔ']]:0,[s['ᴄࠂ̏']]:own.x+100,[s['ⲅ๙ࠀ']]:own.y});
   set('DodgePlayerEnabled',true);m.aim.dodgePlayer();
   check(m.aim._dodgeKeys.w&&keyEvents.some(e=>e[0]==='keydown'&&e[1]===87),'Imported DodgePlayer did not detect the native projectile');
   transport.packets.length=0;n.move();check(transport.packets.some(p=>p[0]===r.messageMoveOpcode&&p[1]===8)&&m.targets.myLastMoveDirection===8,'DodgePlayer did not reach native movement bookkeeping: '+JSON.stringify({packets:transport.packets,keys:keyEvents,direction:m.targets.myLastMoveDirection}));
   set('DodgePlayerEnabled',false);m.aim.dodgePlayer();check(keyEvents.some(e=>e[0]==='keyup'&&e[1]===87),'DodgePlayer left the native W key held');n.move();
  }finally{set('DodgePlayerEnabled',false);m.aim._releaseDodgeKeys();window.removeEventListener('keydown',observeKey);window.removeEventListener('keyup',observeKey);n.entities.remove(2,25,1,2,0);transport.packets.length=expected.length=0;}
  m.trackPacket(0,2,1,1400,1100,true);m.trackPacket(13,0,2,1400,1100,true);n.leave(2);
  check(!m.targets.players[2].active&&!m.targets.ghouls[2].active,'Native other-player death did not clear both source target collections');
  transport.packets.length=expected.length=0;
  m.aim.onDeath();old.aim.onDeath();for(let i=0;i<old.targets.lines.length;i++)Object.assign(m.targets.lines[i],old.targets.lines[i]);compare('death reset');m.onHandshake();old.aim.dead=false;compare('handshake reset');
  m.onSessionStart();old.aim.onDeath();compare('new session reset');m.onHandshake();old.aim.dead=false;compare('new session handshake');
  return {status:'passed',scenes:24,comparison_points:comparisons,history_and_formulas:'source identical',native_fire_release_order:'source identical',native_dodge_and_movement:true,native_other_player_death:true,original_menu_controls:originalControls.length};
 }finally{
  Date.now=realNow;transport.restore();self.id=savedId;n.network.state=savedState;clans[0]=savedClan;
  for(const [id,value]of savedMetadata)metadata[id]=value;
  for(const [key,value]of Object.entries(saved))m.setSetting(key,value);
 }
}
module.exports={verifyMessage15Aim};
