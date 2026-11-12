// Browser/isolated-fixture oracle: execute the separately stored uploaded
// declarations, not the installed factory or a reimplementation of its maths.
function verifyMessage27Aim(m,n,s,reference){
 const check=(v,t)=>{if(!v)throw Error(t);},w=n.world,self=w[s['ᅠᏧ‍']],metadata=w[s['ᴎ︃ᄉ']],clans=w[s['ﾠࡅ‍']];
 const old={id:self.id,state:n.network.state,settings:{...m.settings},ended:m.reconnect.sessionEnded,meta:[1,2,3,120].map(id=>[id,metadata[id]]),clan:clans[0],now:Date.now};
 const capture=n.capturePackets(),expected=[],settings={...reference.defaults},source=name=>reference.blocks.find(b=>b.name===name).source;
 let clock=10000,ref,phase='aim',points=0,mouseCases=0;
 function valid(e,rotation=false){const own=e.targets.players[1],target=e.aim.targetPlayer;return own?.active&&[own.x,own.y].every(Number.isFinite)&&(rotation||target?.active&&[target.x,target.y].every(Number.isFinite)&&!(e.targets.players[target.id]===target&&target.id===1));}
 function receive(packet){if(packet[0]===2||ref&&valid(ref,phase==='jitter'))expected.push(packet.slice());}
 const metaView=[],clanView=[];
 const world={PLAYER:{id:1,x:1000,y:1000,εᴎ༩:-1},players:metaView,ⲣ８ߌ:clanView};
 const make=new Function('MOD','World','window','globalThis','Date','__gk','setTimeout','clearTimeout','setInterval',
  'const օ̖̏="id",x="x",y="y",AIM_RAD=180/Math.PI,SPEAR_IDX=5;const ո︀̜={ε٣︀:p=>globalThis.__autoPortAimbotPacketTransport(JSON.parse(p))},аρ３={ᴉࡃϲ:ո︀̜.ε٣︀};'+source('active-core')+
  '\nvar GetAllTargets=__BBY.G,Aimbot=__BBY.A,Jitter=__BBY.J,AimbotRefresh=__BBY.R;'+source('integration')+'\n'+['__aimShotAllowed','aimbotTick','anti-move-state','routineAntiAimbot','external-jitter-state','external-jitter'].map(source).join('\n')+
  '\nfunction fire(){'+source('native-fire-tail')+'}return {targets:GetAllTargets,aim:Aimbot,tick:aimbotTick,refresh:AimbotRefresh,jitter:routineJitter,anti:routineAntiAimbot,fire,Jitter};');
 const clockDate={now:()=>clock},win={Math,JSON,addEventListener(){},setInterval(){return 1;}};
 function create(){return make(settings,world,win,{__autoPortAimbotPacketTransport:receive},clockDate,v=>v,()=>1,()=>{},()=>1);}
 const kind=(e,t)=>t?(e.targets.players[t.id]===t?'players:':'ghouls:')+t.id:null;
 function state(e){return JSON.stringify({angle:e.aim.lastAngle,smooth:Number.isFinite(e.aim._smoothAngle)?e.aim._smoothAngle:null,target:kind(e,e.aim.targetPlayer),held:kind(e,e.aim._heldTarget),until:e.aim._heldUntil||0,lines:e.targets.lines,players:e.targets.players.filter(t=>t?.active),ghouls:e.targets.ghouls.filter(t=>t?.active)});}
 function compare(label){const actual=state(m),wanted=state(ref);if(actual!==wanted){const a=JSON.parse(actual),b=JSON.parse(wanted),key=Object.keys(a).find(k=>JSON.stringify(a[k])!==JSON.stringify(b[k]));throw Error('Uploaded aim state differs '+label+' in '+key+': '+JSON.stringify({actual:a[key],expected:b[key]}));}check(JSON.stringify(capture.packets)===JSON.stringify(expected),'Uploaded aim packets differ '+label+': '+JSON.stringify({actual:capture.packets,expected}));capture.packets.length=expected.length=0;points++;}
 function track(type,id,px,py,packed=0,active=true){
  m.trackPacket(type===13?13:n.playerType??0,type===13?0:id,type===13?id:1,px,py,active,17,packed);
  const target=(type===13?ref.targets.ghouls:ref.targets.players)[id];
  if(active){if(type!==13){target.weaponIdx=(packed>>8)&255;if(id===1)ref.targets.selfWeapon=target.weaponIdx;}target.update(px,py,17);if(type!==13&&id===1){ref.aim.selfId=id;ref.targets.selfPosition={x:px,y:py};ref.targets.selfFromPacket=clock;ref.aim.dead=false;}}
  else target.setInactive();
  compare('packet '+type+'/'+id);
 }
 try{
  Date.now=()=>clock;n.setClock?.(clock);n.network.state=1;self.id=1;m.reconnect.sessionEnded=false;m.observeSocket(null);
  for(let scene=0;scene<32;scene++){
   m.settings.AimBotEnabled=false;m.onSessionStart();m.onHandshake();
   Object.assign(settings,reference.defaults);ref=create();ref.aim.onDeath();ref.aim.dead=false;
   ref.targets.lines.forEach((line,i)=>{line.color=m.targets.lines[i].color;});
   const ownTeam=scene%4===0?0:-1;world.PLAYER.εᴎ༩=ownTeam;clans[0]={[s['ոᚄރ']]:7};clanView[0]={ᴎ०︁:7};
   for(const id of [1,2,3,120]){const team=id===1?ownTeam:(id===2&&scene%4===0?0:-1),membership=scene%8===0&&id===2?8:7;metadata[id]={[s['а༤̘']]:team,[s['ᴌ̗ⲟ']]:membership};metaView[id]={εᴎ༩:team,і٥ࠂ:membership};}
   const configured={AimBotEnabled:scene%7!==0,autoFire:scene%3===0,target:['players','ghouls','all'][scene%3],lockId:[-1,2,120,1][scene%4],mouseFovEnable:scene%2===0,mouseFov:scene%5===0?50:900,distanceCoefficient:[10,80,300,1000][scene%4],offsetCoefficient:(scene%4)*.8,aimStick:[0,120,240,800][scene%4],aimHoldMs:[0,100,200,600][scene%4],leadCap:[40,120,280,500][scene%4],aimSmooth:[.05,.5,.74,1][scene%4],TargetTeammate:scene%6===0,hideAimbotAngle:scene%5===0,hidePlayerAngle:scene%3===0,visualizeResolving:scene%3!==1,visualizeResolvingColor:'#aabbcc',AimbotSpearEnabled:scene%8===0};
   Object.assign(m.settings,configured);Object.assign(settings,configured);m.targets.mouseMapCords={x:1400,y:1100};ref.targets.mouseMapCords={x:1400,y:1100};capture.packets.length=expected.length=0;
   for(let step=0;step<10;step++){
    clock+=20+(step%4)*30;
    n.setClock?.(clock);
    track(0,1,1000+20*Math.cos(step),1000+20*Math.sin(step),scene%8===0?5<<8:0);
    track(0,2,1400+100*Math.cos(step*.4),1100+100*Math.sin(step*.4));track(0,3,1700-step*20,1200+step*10);track(0,120,2000,1100);track(13,17,1300+50*Math.sin(step),1300);
    m.aim.refresh();ref.tick();compare('source timer '+scene+'/'+step);
    if(step===4){m.afterFire();ref.fire();m.afterRelease();ref.aim.mouseDown=false;compare('native fire/release');}
    if(step===6){track(0,2,0,0,0,false);}
   }
  }
  if(typeof n.view==='object'&&n.ctx&&n.graphics){
   const previousView=n.view,options=n.graphics.options,ratioKey=s['еߎ༢'],previousRatio=options[ratioKey];
   const draw=new Function('MOD','GetAllTargets','ctx','view','const ᴏܘ๐=ctx,ㅤο９=view.x,ᴉᚉ̷=view.y,о༨ε=view.scale;'+source('render')+';AimbotDraw();');
   try{
    for(const ratio of [1,2])for(const scale of [.5,1,2])for(const point of [{x:0,y:0},{x:123,y:234},{x:620,y:450}]){
     const view={x:-500,y:-700,scale,ctx:n.ctx};n.view=view;options[ratioKey]=ratio;
     window.dispatchEvent(new MouseEvent('mousemove',{clientX:point.x,clientY:point.y}));m.render();
     ref.targets.mousePosition={...point};const ctx={canvas:n.ctx.canvas,globalAlpha:1,lineWidth:1,beginPath(){},moveTo(){},lineTo(){},stroke(){}};draw(settings,ref.targets,ctx,view);
     check(JSON.stringify(m.targets.mouseMapCords)===JSON.stringify(ref.targets.mouseMapCords),'Uploaded screen-to-world coordinates differ');
     check(JSON.stringify(m.targets.cameraCenter)===JSON.stringify(ref.targets.cameraCenter),'Uploaded camera center differs');
     m.aimModule.refreshTargets();ref.refresh();compare('native mouse '+ratio+'/'+scale);mouseCases++;
    }
   }finally{n.view=previousView;options[ratioKey]=previousRatio;}
  }
  // Cover the alternate internal resolver branch, not exposed by its source GUI.
  m.settings.resolverType=settings.resolverType=1;m.aimModule.refreshTargets();ref.refresh();compare('resolver type 1');
  m.settings.resolverType=settings.resolverType='linear';
  // Compare source Jitter and strafe calculations, including the independent
  // source switch and pause-on-stop branch. No new spin implementation is used.
  for(const mode of ['At target','Round','Round2'])for(const offset of [0,85,360]){
   m.settings.antiAimMode=settings.antiAimMode=mode;m.settings.jitterOffset=settings.jitterOffset=offset;
   for(let i=0;i<10;i++){const a=m.aimModule.Jitter.getJitterAngle(),b=ref.Jitter.getJitterAngle();check(Object.is(a,b),'Uploaded jitter angle differs');points++;}
  }
  m.settings.AntiAimbot=settings.AntiAimbot=true;phase='anti';for(let i=0;i<24;i++){m.aimModule.antiTick();ref.anti();compare('strafe '+i);}phase='aim';
  if(n.directionProbes?.length){
   for(const enabled of [false,true])for(const hidden of [false,true])for(const target of [null,m.targets.players[2]])for(const angle of [-179.8,0,179.9,361.2]){
    m.settings.AimBotEnabled=enabled;m.settings.hidePlayerAngle=hidden;m.aim.targetPlayer=target;m.aim.lastAngle=angle;
    const expectedAngle=enabled&&target?((Math.floor(angle)%360)+360)%360:hidden?270:90;
    capture.packets.length=0;n.directionProbes[0](Math.PI/2);check(JSON.stringify(capture.packets)===JSON.stringify([[6,expectedAngle]]),'Source primary native packet angle differs');
    capture.packets.length=0;n.directionProbes[1](Math.PI/2);check(JSON.stringify(capture.packets)==='[[6,90]]','Secondary native angle was changed');points++;
   }
  }
  m.settings.AimBotEnabled=false;m.settings.autoFire=false;m.settings.AntiAimbot=false;m.settings.jitterActive=false;
  m.onSessionStart();m.onHandshake();check(!m.targets.players.some(t=>t?.active)&&!m.targets.ghouls.some(t=>t?.active),'Previous session history survived');
  capture.packets.length=0;m.settings.AimBotEnabled=true;m.settings.autoFire=true;m.observeDeath([5,0,2]);m.aim.refresh();m.afterFire();check(capture.packets.length===0,'Server death emitted aim commands');
  return {status:'passed',upload_sha256:reference.upload_sha256,active_override:'__BBY',scenes:32,comparison_points:points,exact_states:true,exact_raw_packets:true,source_timing:true,spear:true,jitter:true,strafe:true,native_angles:!!n.directionProbes?.length,mouse_cases:mouseCases,valid_target_admission:true,session_target_reset:true,server_death_sends_no_commands:true};
 }finally{
  Date.now=old.now;capture.restore();m.observeSocket(null);m.settings.AimBotEnabled=false;m.settings.autoFire=false;m.onSessionStart();m.onHandshake();self.id=old.id;n.network.state=old.state;m.reconnect.sessionEnded=old.ended;
  for(const[id,value]of old.meta)metadata[id]=value;clans[0]=old.clan;Object.assign(m.settings,old.settings);
 }
}
module.exports={verifyMessage27Aim};
