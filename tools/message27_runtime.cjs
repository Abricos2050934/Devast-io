// Host bindings only. Imported calculations and source lifecycle blocks are
// inserted without rewriting their statements or numeric constants.
function generate(reference,nativeHelpers){
 const block=name=>reference.blocks.find(b=>b.name===name).source;
 return `// Active __BBY aim from message (27).txt, SHA256 ${reference.upload_sha256}.
// Source blocks are byte-for-byte audited against the compressed reference.
function __createMessage27Core(MOD,environment) {
 let stopped=false,started=false,depth=0,phase='aim',jitterTimer=null,jitterShotUntil=0,preparingShot=false,lastRotationAt=-Infinity,lastRotationAngle=null;
 const timers=new Map(),removers=[];
 function cycle(fn,kind=phase){const previous=phase;phase=kind;if(depth++===0)environment.beginCycle(kind);try{return fn();}finally{if(--depth===0)environment.endCycle();phase=previous;}}
 function emit(packet){if(stopped)return false;if(packet[0]===4&&MOD.jitterActive)prepareJitterShot();const result=depth?environment.send(packet,{kind:phase}):cycle(()=>environment.send(packet,{kind:phase}));if(result&&packet[0]===6&&phase==='jitter'){lastRotationAt=Date.now();lastRotationAngle=packet[1];}return result;}
 function timer(method,fn,delay){let id;const interval=method==='setInterval',jitter=fn.name==='routineJitter';if(interval&&jitter&&jitterTimer!==null)clear(jitterTimer);const wrapped=()=>{if(!interval)timers.delete(id);if(!stopped&&!(jitter&&pauseJitter()))cycle(fn,jitter?'jitter':fn.name==='routineAntiAimbot'?'anti':'aim');};id=environment.window[method](wrapped,delay);timers.set(id,interval);if(interval&&jitter)jitterTimer=id;return id;}
 function clear(id){const interval=timers.get(id);if(interval===undefined)return;environment.window[interval?'clearInterval':'clearTimeout'](id);timers.delete(id);}
 const setInterval=(fn,delay)=>timer('setInterval',fn,delay),setTimeout=(fn,delay)=>timer('setTimeout',fn,delay),clearTimeout=clear,clearInterval=clear;
 const window={Math,JSON,setInterval,setTimeout,clearInterval,clearTimeout,addEventListener(type,fn,options){environment.window.addEventListener(type,fn,options);removers.push(()=>environment.window.removeEventListener(type,fn,options));}};
 const document=new Proxy(environment.document,{get(target,key){if(key==='addEventListener')return (type,fn,options)=>{target.addEventListener(type,fn,options);removers.push(()=>target.removeEventListener(type,fn,options));};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
 const օܓߋ=window;
 const localStorage={getItem:()=>JSON.stringify(Object.fromEntries(Object.keys(__ilmAimDefaults()).map(key=>[key,MOD[key]]))),setItem(){environment.persist();}};
 const globalThis={__autoPortAimbotPacketTransport:emit};
 const __gk=value=>value; // Imported integration passes plain booleans/numbers.
 const World=environment.world,օ̖̏='id',x='x',y='y';
 const network={ε٣︀:value=>emit(JSON.parse(value)),ᴉࡃϲ:value=>emit(JSON.parse(value))},ո︀̜=network,аρ３=network;
 const AIM_RAD=180/Math.PI,SPEAR_IDX=5;
 ${block('AimbotLoadConfig')}
 // The host has already loaded and validated its versioned aim namespace.
 // Running the old BestModMenuConfig migration here would replace deliberate
 // values such as 100/.1/.62/220 and re-enable a saved disabled mouse FOV.
 ${block('active-core')}
 var GetAllTargets=__BBY.G,Aimbot=__BBY.A,Jitter=__BBY.J,AimbotRefresh=__BBY.R;
 ${block('integration')}
 // Host arbitration: keep the uploaded prediction maths, but never let an
 // idle rotation overwrite an attack, or correct its angle after the attack.
 function spearActive(){return !!MOD.AimbotSpearEnabled&&GetAllTargets.selfWeapon===SPEAR_IDX;}
 function gunActive(){return !!MOD.AimBotEnabled||spearActive();}
 function pauseJitter(){return !!(Aimbot.mouseDown||Date.now()<jitterShotUntil||(MOD.autoFire&&gunActive()&&__aimShotAllowed()));}
 function prepareJitterShot(){
  if(!MOD.jitterActive||preparingShot)return;
  jitterShotUntil=Date.now()+150;
  preparingShot=true;
  try{const angle=gunActive()?(spearActive()?Aimbot.spearResolve():Aimbot.resolve()):null;if(gunActive()&&__aimShotAllowed()&&Number.isFinite(angle))emit([6,angle]);else{const manual=environment.manualAngle?.();if(Number.isFinite(manual))cycle(()=>emit([6,manual]),'jitter');}}finally{preparingShot=false;}
 }
 const resolveSource=Aimbot.resolve;
 Aimbot.resolve=function(){const angle=resolveSource.call(this);if(MOD.jitterActive&&pauseJitter()&&!preparingShot&&phase!=='jitter'&&gunActive()&&__aimShotAllowed()&&Number.isFinite(angle))emit([6,angle]);return angle;};
 function recentRotation(){const age=Date.now()-lastRotationAt;return age>=0&&age<150;}
 function ownsJitterDirection(){return !!MOD.jitterActive&&(pauseJitter()?(gunActive()&&__aimShotAllowed()):recentRotation());}
 ${block('aim-input')}
 ${block('self-player-helper')}
 ${block('__aimShotAllowed')}
 ${block('aimbotTick')}
 ${block('anti-move-state')}
 ${block('routineAntiAimbot')}
 ${block('external-jitter-state')}
 ${block('external-jitter')}
 function afterFire(){${block('native-fire-tail')}}
 function start(){if(started||stopped)return;started=true;setInterval(routineJitter,100);${block('source-loops')}}
 function render(ctx,view,pixelScale=1){
  // The host resets the native canvas transform before overlays. Convert only
  // draw coordinates to backing pixels; source mouse/camera maths stay logical.
  if(!(pixelScale>0)||!Number.isFinite(pixelScale))pixelScale=1;
  const surface=pixelScale===1?ctx:new Proxy(ctx,{get(target,key){if(key==='moveTo'||key==='lineTo')return (px,py)=>target[key](px*pixelScale,py*pixelScale);if(key==='lineWidth')return target.lineWidth/pixelScale;const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;},set(target,key,value){return Reflect.set(target,key,key==='lineWidth'?value*pixelScale:value,target);}});
  const ᴏܘ๐=surface,ㅤο９=view.x,ᴉᚉ̷=view.y,о༨ε=view.scale;${block('render')}AimbotDraw();}
 ${block('AimbotSaveConfig')}
 ${block('AimbotHookSave')}
 ${block('AimbotMenuSetupKey')}
 function installMenu(menu){${block('aim-menu')}
 ${block('aim-keyboard')}
 aimFolder.open();
 const folders=[aimFolder,spearFolder,antiFolder,lineFolder];for(const folder of [...folders,keyFolder])AimbotHookSave(folder);return {folders,controllers:folders.flatMap(folder=>folder.__controllers)};
 }
 return {targets:GetAllTargets,aim:Aimbot,Target:GetAllTargets.players[1].constructor,Jitter,
   start,installMenu,render,tick:()=>cycle(aimbotTick),refreshTargets:()=>cycle(AimbotRefresh),
   position(kind,id,px,py,weapon,packed){return cycle(()=>{const target=GetAllTargets[kind][id];if(kind==='players'&&Number.isFinite(packed)){target.weaponIdx=(packed>>8)&255;if(id===World.PLAYER.id)GetAllTargets.selfWeapon=target.weaponIdx;}target.update(px,py,weapon);if(kind==='players'&&id===World.PLAYER.id){Aimbot.selfId=id;GetAllTargets.selfPosition={x:px,y:py};GetAllTargets.selfFromPacket=Date.now();Aimbot.dead=false;}});},
   beforeFire:()=>cycle(prepareJitterShot),afterFire:()=>cycle(()=>{if(MOD.jitterActive){Aimbot.mouseDown=true;Aimbot.scheduleRefresh();}else afterFire();}),afterRelease(){Aimbot.mouseDown=false;jitterShotUntil=Date.now()+50;},onMove(mask){GetAllTargets.myLastMoveDirection=mask;return true;},
   ownsJitterDirection,jitterRenderAngle:()=>MOD.jitterActive&&!pauseJitter()&&recentRotation()?lastRotationAngle*Math.PI/180:null,
   jitterTick:()=>!pauseJitter()&&cycle(routineJitter,'jitter'),antiTick:()=>cycle(routineAntiAimbot,'anti'),
   onHandshake(){Aimbot.dead=false;jitterShotUntil=0;lastRotationAt=-Infinity;lastRotationAngle=null;},onOtherDie(id){GetAllTargets.players[id]?.setInactive();},sync(){},
   ensure(id){if(id>0){for(const group of [GetAllTargets.players,GetAllTargets.ghouls])if(!group[id])group[id]=new this.Target(id);}},
   dispose(){if(stopped)return;stopped=true;for(const id of [...timers.keys()])clear(id);for(const remove of removers)remove();Aimbot.mouseDown=false;}
 };
}
// Existing Resource Override installations recognize this entrypoint name.
// It forwards to the uploaded engine and contains no previous aim mechanics.
function __createIlmAim(settings,environment){return __createMessage27Core(settings,environment);}
function __createIlmAdapter(settings,environment){
 const pendingKeys=new Set();
 const sourceSettings=new Proxy(settings,{get(target,key){return pendingKeys.has(key)?'...':target[key];},set(target,key,value){if(['AimbotKey','AntiAimbotKey','JitterKey','HideAngleKey','ModMenuKey'].includes(key)){if(value==='...'){pendingKeys.add(key);return true;}if(pendingKeys.has(key)){pendingKeys.delete(key);environment.setKey(key,value);return true;}}target[key]=value;return true;}});
 const metadata=new Proxy([],{get(target,key){if(typeof key==='string'&&/^\\d+$/.test(key)){const id=+key;if(!environment.playerInfo(id).exists)return undefined;if(!target[id])target[id]={get εᴎ༩(){return environment.playerInfo(id).team;},get і٥ࠂ(){return environment.playerInfo(id).membership;}};}return target[key];}});
 const clans=new Proxy([],{get(target,key){if(typeof key==='string'&&/^\\d+$/.test(key)){const id=+key;if(!environment.clanInfo(id).exists)return undefined;if(!target[id])target[id]={get ᴎ०︁(){return environment.clanInfo(id).membership;}};}return target[key];}});
 const self={get id(){return environment.selfId();},get x(){return environment.selfPosition().x;},get y(){return environment.selfPosition().y;},get εᴎ༩(){return environment.playerInfo(environment.selfId()).team;}};
 const core=__createIlmAim(sourceSettings,{...environment,world:{PLAYER:self,players:metadata,ⲣ８ߌ:clans}}),originalEnsure=core.ensure.bind(core);
 Object.defineProperty(core,'waitingForKey',{get:()=>pendingKeys.size>0});
 core.ensure=originalEnsure;
 return core;
}
function __ilmAimDefaults(){return ${JSON.stringify(reference.defaults)};}
function __ilmAimConstraints(){return {limits:{mouseFov:[0,12345],distanceCoefficient:[10,1000],offsetCoefficient:[0,3],aimStick:[0,800],aimHoldMs:[0,600],leadCap:[40,500],aimSmooth:[.05,1],lockId:[-1,120],aimMaxRange:[1,20000],spearSpeed:[20,60],spearMaxRange:[200,600],spearHandFwd:[-60,60],spearHandSide:[-60,60],spearStabDeg:[.5,10],antiAimCoefficient:[10,500],jitterOffset:[0,360]},choices:{target:['players','ghouls','all'],resolverType:['linear'],ShowRealAngles:['never','always','withAim'],antiAimMode:['At target','Round','Round2']}};}
function __ilmMouseToWorld(point,view){return {x:point.x/view.scale-view.x,y:point.y/view.scale-view.y};}
${nativeHelpers.join('\n\n')}
`;
}
module.exports={generate};
