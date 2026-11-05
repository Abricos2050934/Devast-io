function verifyMessage15Extra(m,n,s,reference) {
 const check=(v,message)=>{if(!v)throw Error(message);};
 const self=n.world[s['ᅠᏧ‍']],players=n.world[s['ᴎ︃ᄉ']],clans=n.world[s['ﾠࡅ‍']];
 const savedSettings={...m.settings},savedSelf=self.id,savedState=n.network.state,savedClan=clans[0],savedMetadata=[1,2,3].map(id=>[id,players[id]]);
 const realNow=Date.now;let clock=10000;Date.now=()=>clock;
 const transport=n.capturePackets(),expected=[],settings={...m.settings},world={PLAYER:{id:1,team:-1},players:Array.from({length:1000},()=>({team:-1}))};
 const norm=p=>p[0]===6?[6,(Math.round(p[1])%360+360)%360]:p;
 const create=new Function('MOD','World','Client','window','Entitie','__ENTITIE_BULLET__','KeyboardEvent',reference.blocks.filter(b=>['GetAllTargetsCon','GetTarget','AimbotCon','JitterCon','LinesCon','_lineIntersect'].includes(b.label)).map(b=>b.source).join('\n')+'\nvar GetAllTargets=new GetAllTargetsCon(),Aimbot=new AimbotCon(),Jitter=new JitterCon();return {targets:GetAllTargets,aim:Aimbot};');
 const old=create(settings,world,{state:1,sendPacket:text=>expected.push(norm(JSON.parse(text)))},{Math,JSON,dispatchEvent(){}},{units:[],border:[]},2,KeyboardEvent);
 let comparisons=0;
 const snapshot=e=>JSON.stringify({last:e.aim.lastAngle,target:e.aim.targetPlayer?.id,dead:e.aim.dead,mouseDown:e.aim.mouseDown,lines:e.targets.lines,players:e.targets.players.filter(p=>p?.active),ghouls:e.targets.ghouls.filter(p=>p?.active)});
 function compare(label){check(snapshot(m)===snapshot(old),'Extended source state mismatch: '+label);check(JSON.stringify(transport.packets)===JSON.stringify(expected),'Extended native commands mismatch: '+label);transport.packets.length=expected.length=0;comparisons++;}
 function set(key,value){m.settings[key]=settings[key]=value;}
 function track(type,id,uid,x,y,active=true){clock+=[20,50,125,350][comparisons%4];m.trackPacket(type,id,uid,x,y,active);const target=type===13?old.targets.ghouls[uid]:old.targets.players[id];if(active)target.update(x,y);else target.setInactive();compare('sample '+type+'/'+id+'/'+uid);}
 function reset(){m.aim.onDeath();old.aim.onDeath();m.onHandshake();old.aim.dead=false;for(let i=0;i<old.targets.lines.length;i++)Object.assign(m.targets.lines[i],old.targets.lines[i]);transport.packets.length=expected.length=0;}
 try{
  n.network.state=1;self.id=1;m.onHandshake();m.observeSocket(null);clans[0]={[s['ոᚄރ']]:7};
  for(const id of [1,2,3])players[id]={[s['а༤̘']]:-1,[s['ᴌ̗ⲟ']]:7};
  const distanceValues=[10,100,300,1000],offsetValues=[0,.1,1.5,3],speedValues=[1,4,8.5,15],fovValues=[0,1,80,696969],locks=[-1,0,2,120];
  for(let scene=0;scene<96;scene++){
   reset();set('JitterEnabled',false);set('jitterActive',false);set('DodgePlayerEnabled',false);
   set('AimBotEnabled',scene%13!==0);set('autoFire',scene%3===0);set('target',['players','ghouls','all'][scene%3]);set('lockId',locks[scene%4]);
   set('resolverType',scene%2?'trygonometrical':'linear');set('distanceCoefficient',distanceValues[Math.floor(scene/2)%4]);set('offsetCoefficient',offsetValues[Math.floor(scene/3)%4]);set('bulletSpeedCoefficient',speedValues[Math.floor(scene/5)%4]);
   set('mouseFovEnable',scene%2===0);set('mouseFov',fovValues[Math.floor(scene/4)%4]);set('hideAimbotAngle',scene%5===0);set('visualizeResolving',scene%4!==1);set('ShowAimTrace',scene%3===1);
   for(const e of [m,old])e.targets.mouseMapCords={x:scene%2?0:1250,y:scene%2?0:950};
   const ownTeam=scene%7===0?0:-1,otherTeam=scene%14===0?0:-1;
   players[1][s['а༤̘']]=world.PLAYER.team=world.players[1].team=ownTeam;players[2][s['а༤̘']]=world.players[2].team=otherTeam;
   const quadrant=scene%4,signX=quadrant&1?-1:1,signY=quadrant&2?-1:1;
   for(let step=0;step<10;step++){
    const base=scene%8===0?0:1000,turn=step<4?step:step<7?4:11-step;
    track(0,1,1,base+step*2.25,base-step*.5);
    const x=base+signX*(scene%6===0?0:600+turn*35.5),y=base+signY*(scene%5===0?0:100+turn*22.25);
    track(0,2,1,x,y);track(0,3,1,base-signX*(500-step*3.5),base+signY*200);
    track(13,0,17,base+signX*(350+turn*10),base-signY*100);
    track(13,0,1,base+signX*75,base+signY*75);
    if(step===5)track(0,2,1,0,0,false);
    m.aim.refresh();old.aim.refresh();compare('boundary scene '+scene+' tick '+step);
   }
  }
  // The original linear/trigonometric formulas must receive the GUI values.
  reset();for(const [key,value]of Object.entries({AimBotEnabled:true,jitterActive:false,autoFire:false,mouseFovEnable:false,lockId:2,resolverType:'linear',visualizeResolving:true,ShowAimTrace:false,hideAimbotAngle:false}))m.setSetting(key,value);
  for(const id of [1,2,3])players[id][s['а༤̘']]=-1;
  m.trackPacket(0,1,1,1000,1000,true);m.trackPacket(0,2,1,2000,1000,true);m.trackPacket(0,2,1,2000,1100,true);
  const folder=m.menu.__folders['Best Aim Bot #1'],control=key=>folder.__controllers.find(c=>c.property===key);
  control('distanceCoefficient').setValue(10);const near=m.aim.resolve();control('distanceCoefficient').setValue(1000);const far=m.aim.resolve();check(near!==far,'DistanceCoefficient GUI does not affect source prediction');
  control('offsetCoefficient').setValue(0);const a=m.aim.resolve();control('offsetCoefficient').setValue(3);const b=m.aim.resolve();check(a!==b,'OffsetCoefficient GUI is disconnected');
  control('bulletSpeedCoefficient').setValue(1);const linear1=m.aim.resolve();control('bulletSpeedCoefficient').setValue(15);const linear15=m.aim.resolve();check(linear1===linear15,'An extra bullet-speed calculation appeared in source linear mode');
  control('resolverType').setValue('trygonometrical');control('bulletSpeedCoefficient').setValue(1);const trig1=m.aim.resolve();control('bulletSpeedCoefficient').setValue(15);const trig15=m.aim.resolve();check(trig1!==trig15,'BulletSpeedCoefficient GUI is disconnected in source trigonometric mode');
  control('resolverType').setValue('linear');control('visualizeResolving').setValue(false);m.aim.refresh();check(!m.targets.lines[0].active,'VisualizeResolving GUI is disconnected');
  control('ShowAimTrace').setValue(true);m.aim.refresh();check(m.targets.lines[2].active,'ShowAimTrace GUI is disconnected');control('ShowAimTrace').setValue(false);m.aim.refresh();check(!m.targets.lines[2].active,'ShowAimTrace GUI did not turn off');
  control('hideAimbotAngle').setValue(true);transport.packets.length=0;m.aim.refresh();check(transport.packets.filter(p=>p[0]===6).length===2,'Source HideAimbotAngle duplicate-send behavior was changed');control('hideAimbotAngle').setValue(false);
  m.trackPacket(0,2,1,2100,1100,true);m.trackPacket(0,2,1,2200,1100,true);m.trackPacket(0,2,1,2100,1100,true);control('autoFire').setValue(true);transport.packets.length=0;m.aim.refresh();check(JSON.stringify(transport.packets.map(p=>p[0]))==='[6,4,5]','AutoFire GUI does not reach native attack/release');control('autoFire').setValue(false);
  const color=m.menu.__folders.Visuals.__folders.Colors.__controllers[0];color.setValue({r:12,g:34,b:56});check(m.settings.visualizeResolvingColor==='#0c2238','Source color-object normalization failed');
  // Check the source coordinate helper through the actual canvas adapter.
  const oldView=n.view,ratioKey=s['еߎ༢'],oldRatio=n.graphics.options[ratioKey],canvas=n.ctx.canvas,rect=canvas.getBoundingClientRect();
  let coordinateChecks=0;
  try{
   m.setSetting('visualizeResolving',true);m.setSetting('ShowAimTrace',false);m.setSetting('mouseFovEnable',true);
   for(const scale of [.33,.75,1,2])for(const ratio of [1,1.25,2])for(const fraction of [.1,.5,.9]){
    n.view={x:123.25,y:-77.5,scale,ctx:n.ctx};n.graphics.options[ratioKey]=ratio;
    const event=new MouseEvent('mousemove',{clientX:rect.left+rect.width*fraction,clientY:rect.top+rect.height*(1-fraction),bubbles:true});window.dispatchEvent(event);m.render();
    const x=(event.clientX-rect.left)*canvas.width/rect.width/(scale*ratio)-123.25,y=(event.clientY-rect.top)*canvas.height/rect.height/(scale*ratio)+77.5;
    check(Math.abs(m.targets.mouseMapCords.x-x)<1e-7&&Math.abs(m.targets.mouseMapCords.y-y)<1e-7,'Canvas adapter changed the source cursor/world calculation');coordinateChecks++;
    check(m.targets.lines[0].color==='#0c2238','Source line-color renderer is disconnected');
   }
   m.setSetting('mouseFovEnable',false);const before=JSON.stringify(m.targets.mouseMapCords);window.dispatchEvent(new MouseEvent('mousemove',{clientX:5,clientY:5,bubbles:true}));m.render();check(JSON.stringify(m.targets.mouseMapCords)===before,'Disabled FOV no longer keeps source cursor semantics');
  }finally{n.view=oldView;if(oldRatio===undefined)delete n.graphics.options[ratioKey];else n.graphics.options[ratioKey]=oldRatio;}
  const bitmap=document.createElement('canvas');bitmap.width=100;bitmap.height=30;const ctx=bitmap.getContext('2d');ctx.font='16px sans-serif';
  m.setSetting('HidePlayerLabels',true);ctx.fillText('AimBot',1,20);check(!ctx.getImageData(0,0,100,30).data.some((v,i)=>i%4===3&&v),'Source label filter did not hide its exact blocked text');
  m.setSetting('HidePlayerLabels',false);ctx.fillText('AimBot',1,20);check(ctx.getImageData(0,0,100,30).data.some((v,i)=>i%4===3&&v),'Source label filter ignored its switch');
  return {status:'passed',boundary_scenes:96,comparison_points:comparisons,coordinate_cases:coordinateChecks,gui_formula_controls:true,linear_bullet_coefficient:'unused exactly as source',trigonometric_bullet_coefficient:'affects angle exactly as source',auto_fire_and_hide_angle_commands:true,color_normalization_and_line_renderer:true,label_filter_bitmap:true};
 }finally{
  Date.now=realNow;transport.restore();m.observeSocket(null);self.id=savedSelf;n.network.state=savedState;clans[0]=savedClan;
  for(const [id,meta]of savedMetadata)players[id]=meta;
  for(const [key,value]of Object.entries(savedSettings))if(Object.hasOwn(m.settings,key))m.setSetting(key,value);
 }
}
module.exports={verifyMessage15Extra};
