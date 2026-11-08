// Compare the installed adapter with independently extracted, unchanged source statements.
async function verifyUntitledAim(m,n,s,reference,advance=()=>{},roles={}){
 const check=(v,t)=>{if(!v)throw Error(t);},world=n.world,self=world[s['ᅠᏧ‍']],meta=world[s['ᴎ︃ᄉ']],clans=world[s['ﾠࡅ‍']];
 const saved={...m.settings},oldId=self.id,oldState=n.network.state,oldEnded=m.reconnect.sessionEnded,oldReconnect={...m.reconnect},oldMeta=[1,2,3].map(id=>[id,meta[id]]),oldClans=[clans[0],clans[1]],oldHeld=window.__heldItemDef;
 const dateNow=Date.now,performanceNow=performance.now;let clock=100000;Date.now=()=>clock;performance.now=()=>clock;advance(clock);
 const expected=[],capture=n.capturePackets(),settings={...m.settings};
 const excluded=new Set([3,55,58,59,60,61,62,69]);
 const core=reference.exact_block_indices.filter(i=>!excluded.has(i)).map(i=>reference.statements[i].source).join('\n');
 const create=new Function('MOD','window','document','globalThis','__aimHub','Date','performance','setTimeout','clearTimeout','requestAnimationFrame','var AimbotStrafe,GetAllTargets,Aimbot,AimbotJitter,AimbotAntiAim,AimbotSpin,AimbotSelfPredict,AimbotResolver;\n'+core+'\nreturn {aim:Aimbot,targets:GetAllTargets,Target,selfPredict:AimbotSelfPredict,jitter:AimbotJitter,spin:AimbotSpin,antiAim:AimbotAntiAim,strafe:AimbotStrafe,obstacles:Obstacles,autoFire:AutoFire,tick:aimbotTick,weaponParams,solveIntercept,smoothLineState};');
 const ref=create(settings,{Math,JSON,addEventListener(){}},{activeElement:null},{get __heldItemDef(){return window.__heldItemDef;}},{transport:p=>expected.push(p.slice())},{now:()=>clock},{now:()=>clock},()=>1,()=>{},()=>1);
 ref.aim.isTeammate=id=>{if(settings.TargetTeammate)return false;const team=pid=>{const p=meta[pid],index=p?.[s['а༤̘']],clan=clans[index];return Number.isInteger(index)&&index>=0&&clan&&p[s['ᴌ̗ⲟ']]===clan[s['ոᚄރ']]?index:-1;};const own=team(1);return own!==-1&&team(id)===own;};
 let comparisons=0;
 function set(k,v){m.setSetting(k,v);settings[k]=v;}
 function snapshot(e){return JSON.stringify({angle:e.aim.lastAngle,sent:e.aim.lastSent,target:e.aim.currentTarget?[(e.targets.players[e.aim.currentTarget.id]===e.aim.currentTarget?'player':'ghoul'),e.aim.currentTarget.id]:null,cache:[e.aim._cacheTime,e.aim._cacheAngle],mouseDown:e.aim.mouseDown,refreshing:e.aim.refreshing,players:e.targets.players.filter(p=>p?.active),ghouls:e.targets.ghouls.filter(p=>p?.active),lines:e.targets.lines,predict:e.selfPredict,spin:e.spin,jitter:e.jitter,detected:e===ref?settings.detectedWeapon:m.settings.detectedWeapon});}
 function compare(label){const actual=snapshot(m.aimModule),wanted=snapshot(ref);check(actual===wanted,'Untitled state mismatch '+label+'\nactual '+actual+'\nsource '+wanted);check(JSON.stringify(capture.packets)===JSON.stringify(expected),'Untitled outgoing commands differ '+label+': '+JSON.stringify({actual:capture.packets,source:expected}));capture.packets.length=expected.length=0;comparisons++;}
 async function track(type,id,x,y,active=true){clock+=50;advance(clock);m.trackPacket(type===13?13:(n.playerType??0),type===13?0:id,type===13?id:1,x,y,active);const t=type===13?ref.targets.getGhoulByUid(id):ref.targets.getPlayerById(id);if(active)t.update(x,y);else t.setInactive();if(type!==13&&id===1&&active){ref.targets.selfPosition={x,y};ref.targets.selfFromPacket=clock;ref.aim.dead=false;}await Promise.resolve();compare('packet '+type+'/'+id);}
 try{
  n.network.state=1;self.id=1;m.reconnect.sessionEnded=false;m.observeSocket(null);clans[0]={[s['ոᚄރ']]:7};clans[1]={[s['ոᚄރ']]:8};
  for(let scene=0;scene<32;scene++){
   m.onSessionStart();m.onHandshake();ref.aim.onDeath();
   for(const e of [m.aimModule,ref]){
    Object.assign(e.aim,{dead:false,lastAngle:0,lastSent:-1,currentTarget:null,selfId:1,mouseDown:false,refreshing:false,_cacheTime:0,_cacheAngle:0,_instantQueued:false});
    Object.assign(e.selfPredict,{x:0,y:0,vx:0,vy:0,last:{x:0,y:0},predicted:{x:0,y:0}});e.spin.angle=0;e.jitter.flip=false;Object.assign(e.antiAim,{angle:0,counter:1,step:0});e.strafe.last=-1;e.strafe.i=0;e.obstacles.clear();
    for(const id of [1,2,3])e.targets.players[id]=new e.Target(id);e.targets.ghouls[17]=new e.Target(17);
    for(const line of e.targets.lines){line.reset();delete line._s;delete line._st;}
    e.targets.selfFromPacket=0;e.targets.selfPosition={x:0,y:0};e.targets.cameraCenter={x:0,y:0};e.targets.mouseMapCords={x:1400,y:1100};
   }
   for(const [k,v]of Object.entries({AimBotEnabled:scene%8!==7,AntiAimbot:scene%8===7,autoFire:scene%5===0,target:['players','ghouls','all'][scene%3],lockId:scene%4===0?2:-1,mouseFovEnable:scene%2===0,mouseFov:12345,resolverType:scene%4===0?'none':'linear',instantAim:scene%6!==0,trigAim:scene%3!==0,trigIterations:scene%9,smoothLine:scene%4!==0,smoothLineMs:scene%4*30,aimAlongLine:scene%5!==0,selfPredictEnabled:scene%3!==1,selfPredictAffectsAim:scene%4!==2,selfPredictCoefficient:scene%4,AntiAntiAim:scene%2===0,stickyTarget:scene%2===0,stickyRadius:400,jitterActive:scene%8===5,spinActive:scene%8===6,spinSpeed:15,spinStopOnFire:scene%2===0,turboAim:true,hideAimbotAngle:scene%4===1,weaponMode:scene%3===0?'Custom for all':'Auto per weapon',distanceCoefficient:100+scene*5,offsetCoefficient:scene%4*.1,bulletSpeedCoefficient:1+scene%5}))set(k,v);
   window.__heldItemDef={detail:{name:['AK47','Sniper','Spear','Laser SMG'][scene%4]}};
   for(const id of [1,2,3]){const team=scene%7===0&&id<3?0:-1;meta[id]={[s['а༤̘']]:team,[s['ᴌ̗ⲟ']]:7};}
   capture.packets.length=expected.length=0;
   for(let step=0;step<12;step++){
    await track(0,1,1000+step*5,1000+step*2);await track(0,2,1400+(step%3)*15,1100+step*12);await track(0,3,1600-step*9,1200-step*4);await track(13,17,1250+step*5,1300-step*7);
    clock+=8;advance(clock);m.aim.refresh();ref.tick();compare('tick '+scene+'/'+step);
    if(step===6){m.afterFire();if(settings.AimBotEnabled)ref.aim.sendAngle(ref.aim.resolve(true),true);ref.aim.mouseDown=true;ref.aim.scheduleRefresh();compare('native fire '+scene);m.afterRelease();ref.aim.mouseDown=false;ref.aim.scheduleRefresh();compare('native release '+scene);}
   }
  }
  m.onSessionStart();m.onHandshake();
  for(const[k,v]of Object.entries({AimBotEnabled:true,AntiAimbot:false,spinActive:false,jitterActive:false,autoFire:true,autoFireCheckObstacles:true,hideAimbotAngle:false,selfPredictEnabled:false,smoothLine:false,mouseFovEnable:false,lockId:2}))m.setSetting(k,v);
  m.aimModule.obstacles.clear();m.trackPacket(n.playerType??0,1,1,1000,1000,true);m.trackPacket(n.playerType??0,2,1,1500,1000,true);
  capture.packets.length=0;const socket={readyState:1,bufferedAmount:8192};m.observeSocket(socket);m.aim.refresh();check(capture.packets.length===0,'Blocked transport accepted uploaded combat commands');
  for(const bytes of [1,16,128,1024,4095]){socket.bufferedAmount=bytes;capture.packets.length=0;m.aim.refresh();check(JSON.stringify(capture.packets.map(p=>p[0]))==='[6,6,4,5]','Small queue changed the complete uploaded autoFire cycle: '+bytes);}
  capture.packets.length=0;let queueReads=0;Object.defineProperty(socket,'bufferedAmount',{configurable:true,get(){queueReads++;return capture.packets.length?4096:0;}});m.aim.refresh();check(queueReads===1&&JSON.stringify(capture.packets.map(p=>p[0]))==='[6,6,4,5]','Uploaded attack/release pair was split by queue growth');
  const count=capture.packets.length;m.aim.refresh();check(capture.packets.length===count,'Aim grew a blocked socket backlog');
  for(const state of [0,2,3]){socket.readyState=state;capture.packets.length=0;m.aim.refresh();check(capture.packets.length===0,'Uploaded engine sent on a non-open socket');}
  let nativeTransforms=false,nativeMovement=false;
  if(n.directionProbes?.length){
   socket.readyState=1;Object.defineProperty(socket,'bufferedAmount',{value:0,configurable:true});m.observeSocket(socket);
   for(const[k,v]of Object.entries({autoFire:false,resolverType:'none',selfPredictEnabled:false,smoothLine:false,spinActive:false,AntiAimbot:false,hidePlayerAngle:false}))m.setSetting(k,v);
   for(const probe of n.directionProbes){capture.packets.length=0;probe(Math.PI/2);check(JSON.stringify(capture.packets)==='[[6,0]]','Native pointer did not use uploaded aim');}
   m.setSetting('AimBotEnabled',false);m.setSetting('hidePlayerAngle',true);
   for(const probe of n.directionProbes){capture.packets.length=0;probe(Math.PI/2);check(JSON.stringify(capture.packets)==='[[6,270]]','HidePlayerAngle did not transform the real native pointer');}
   m.setSetting('AntiAimbot',true);m.setSetting('antiAimMode','Static');m.setSetting('antiAimCoefficient',100);
   for(const probe of n.directionProbes){capture.packets.length=0;probe(Math.PI/2);check(JSON.stringify(capture.packets)==='[[6,100]]','Uploaded Anti-Aim did not transform native direction');}
   m.setSetting('AimBotEnabled',true);m.setSetting('AntiAimbot',false);m.setSetting('spinActive',true);m.setSetting('spinStopOnFire',false);m.aimModule.spin.angle=135;
   for(const probe of n.directionProbes){capture.packets.length=0;probe(Math.PI/2);check(JSON.stringify(capture.packets)==='[[6,135]]','Uploaded Spin did not transform native direction');}
   m.setSetting('spinActive',false);m.setSetting('hidePlayerAngle',false);nativeTransforms=true;
   if(n.keyboard&&roles.messageKeyboardDown&&roles.messageKeyboardUp){
    const onMove=m.onMove,masks=[];m.onMove=mask=>{masks.push(mask);return onMove(mask);};
    try{
     m.setSetting('AimBotEnabled',false);m.setSetting('AntiAimbot',true);m.setSetting('strafeBlockRealMove',true);m.setSetting('strafeMode','W/S');
     n.keyboard[roles.messageKeyboardDown](new KeyboardEvent('keydown',{keyCode:87}));capture.packets.length=0;n.move();check(masks.length>0&&capture.packets.length===0,'Native WASD was not blocked by uploaded Strafe');
     const activity=n.idleProbe.read().activity;m.aimModule.strafe.tick();check(capture.packets.some(p=>p[0]===2),'Uploaded Strafe did not send movement');check(n.idleProbe.read().activity===activity,'Automatic Strafe reset the native idle clock');nativeMovement=true;
    }finally{m.onMove=onMove;m.setSetting('AntiAimbot',false);n.keyboard[roles.messageKeyboardUp](new KeyboardEvent('keyup',{keyCode:87}));n.move();m.aimModule.strafe.tick();}
   }
  }
  socket.readyState=1;Object.defineProperty(socket,'bufferedAmount',{value:0,configurable:true});capture.packets.length=0;m.observeDeath([5,0,2]);m.aim.refresh();m.afterFire();m.afterRelease();await Promise.resolve();check(capture.packets.length===0,'Death generated uploaded combat packets');
  return {status:'passed',source_sha256:reference.source_sha256,scenes:32,comparison_points:comparisons,exact_tick_packets:true,source_prediction_and_lines:true,per_weapon_and_trigonometric:true,instant_target_updates:true,native_lifecycle:true,native_direction_transforms:nativeTransforms,native_movement_hooks:nativeMovement,whole_auto_fire_cycle:true,small_queue_admission:true,server_death_sends_no_commands:true,self_prediction:true,spin_jitter_anti_aim:true};
 }finally{
  capture.restore();m.observeSocket(null);Object.assign(m.reconnect,oldReconnect);Date.now=dateNow;performance.now=performanceNow;window.__heldItemDef=oldHeld;m.setSetting('AimBotEnabled',false);m.onSessionStart();m.onHandshake();self.id=oldId;n.network.state=oldState;m.reconnect.sessionEnded=oldEnded;for(const[id,value]of oldMeta)meta[id]=value;clans[0]=oldClans[0];clans[1]=oldClans[1];for(const[k,v]of Object.entries(saved))m.setSetting(k,v);
 }
}
module.exports={verifyUntitledAim};
