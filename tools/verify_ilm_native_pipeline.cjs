// Compare the adapter's camera input and actual native server-angle path with
// isolated original ILM declarations; never execute the uploaded client startup.
function verifyIlmMouse(m,n,s,reference,hooks){
 const check=(v,t)=>{if(!v)throw Error(t);},self=n.world[s['ᅠᏧ‍']],metadata=n.world[s['ᴎ︃ᄉ']];
 const saved={...m.settings},oldId=self.id,oldState=n.network.state,oldReconnect={...m.reconnect},oldMeta=[1,2,3].map(id=>[id,metadata[id]]);
 const oldView=n.view,ratioKey=s['еߎ༢'],oldRatio=n.graphics.options[ratioKey],capture=n.capturePackets(),expected=[];
 const canvas=n.ctx.canvas,oldRect=canvas.getBoundingClientRect,oldWidth=canvas.width,oldHeight=canvas.height;
 const settings={...m.settings},world={PLAYER:{id:1,team:-1},players:Array.from({length:1000},()=>({team:-1}))};
 const code='const _0x225287=()=>{throw Error("Live decoder")},_0x349c=_0x225287,_0x507242=_0x225287;const _0x2ea565=settings,_0x10898e=world,_0x4c996c=send;'+reference.blocks.map(b=>b.source).join('\n')+';const _0x6cc5f2=new _0x3e2cd1(),_0x41e779=new _0x4b5d6f();let _0x555618=1,_0x4212a3=0,_0x260b24=0;const _0x3bfd3a={globalAlpha:1,lineWidth:1,beginPath(){},moveTo(){},lineTo(){},stroke(){}};'+hooks.filter(b=>['_0x341470','_0x4b25f3'].includes(b.name)).map(b=>b.source).join('\n')+';return {targets:_0x6cc5f2,aim:_0x41e779,tick:_0x4a7389,frame(v){_0x555618=v.scale;_0x4212a3=v.x;_0x260b24=v.y;_0x341470();}};';
 const original=new Function('settings','world','send',code)(settings,world,p=>expected.push(p[0]===6?[6,(Math.round(p[1])%360+360)%360]:p.slice()));
 let cases=0;
 try{
  n.network.state=1;self.id=1;m.reconnect.sessionEnded=false;m.observeSocket(null);m.onHandshake();
  for(const id of [1,2,3])metadata[id]={[s['а༤̘']]:-1};
  for(const [k,v]of Object.entries({AimBotEnabled:true,autoFire:false,lockId:-1,mouseFovEnable:true,mouseFov:12345,target:'players',visualizeResolving:true})){m.setSetting(k,v);settings[k]=v;}
  for(const group of [m.targets.players,m.targets.ghouls])for(const p of group)if(p.active)p.setInactive();
  for(const [id,x,y]of [[1,1000,1000],[2,1400,1000],[3,1200,1100]]){m.trackPacket(n.playerType??0,id,1,x,y,true);original.targets.players[id].update(x,y);}
  for(const scale of [.5,1,2])for(const ratio of [.5,1,2])for(const shifted of [false,true]){
   n.view={x:-1000,y:-1000,scale};n.graphics.options[ratioKey]=ratio;
   canvas.width=800;canvas.height=600;canvas.getBoundingClientRect=()=>({left:shifted?80:0,top:shifted?40:0,width:shifted?400:800,height:shifted?300:600});
   Object.assign(m.targets.mousePosition,{x:400,y:0});Object.assign(original.targets.mousePosition,{x:400,y:0});
   m.render(0);original.frame(n.view);
   check(JSON.stringify(m.targets.mouseMapCords)===JSON.stringify(original.targets.mouseMapCords),'ILM camera/mouse coordinates differ: '+JSON.stringify({scale,ratio,shifted,actual:m.targets.mouseMapCords,original:original.targets.mouseMapCords}));
   capture.packets.length=expected.length=0;m.aim.refresh();original.tick();
   check(m.aim.targetPlayer?.id===original.aim.targetPlayer?.id&&m.aim.lastAngle===original.aim.lastAngle,'ILM cursor chose a different target or turn');
   check(JSON.stringify(capture.packets)===JSON.stringify(expected),'ILM cursor angle sent a different native packet');cases++;
  }
  // With FOV disabled, both keep the previous source mouse-map coordinate.
  m.setSetting('mouseFovEnable',false);settings.mouseFovEnable=false;
  Object.assign(m.targets.mousePosition,{x:50,y:70});Object.assign(original.targets.mousePosition,{x:50,y:70});
  n.view={x:-200,y:-300,scale:1.5};m.render(0);original.frame(n.view);
  check(JSON.stringify(m.targets.mouseMapCords)===JSON.stringify(original.targets.mouseMapCords),'Disabled FOV changed source coordinates');
  return {status:'passed',cases,source_camera_coordinates:true,exact_target_and_sent_angle:true,disabled_fov_retains_coordinates:true};
 }finally{
  capture.restore();canvas.getBoundingClientRect=oldRect;canvas.width=oldWidth;canvas.height=oldHeight;n.view=oldView;n.graphics.options[ratioKey]=oldRatio;
  self.id=oldId;n.network.state=oldState;Object.assign(m.reconnect,oldReconnect);m.onHandshake();
  for(const[id,v]of oldMeta)metadata[id]=v;for(const[k,v]of Object.entries(saved))m.setSetting(k,v);
 }
}

function verifyIlmServerAngle(m,n,s,r,reference){
 const check=(v,t)=>{if(!v)throw Error(t);},self=n.world[s['ᅠᏧ‍']],oldId=self.id,oldState=n.network.state,oldInput=n.input.angle;
 const saved={...m.settings},oldReconnect={...m.reconnect},capture=n.capturePackets();
 const code='const _0x225287=()=>{throw Error("Live decoder")},_0x349c=_0x225287,_0x119af5=_0x225287;const _0x57b222='+reference.angle_period_expression+';const _0x2ea565=settings,_0x10898e=world,_0x51a9fc=input;const _0x21b009=0,_0x82e2ba=1000,_0x2da663=1000,_0x2a622b={__TILE_SIZE__:100};const _0x4c45bf={fastDist:(x,y,xx,yy)=>(xx-x)**2+(yy-y)**2};'+reference.blocks.map(b=>b.source).join('\n')+';const _0x2f21c0={reduceAngle:_0x4046e9,lerp:_0x48f251};return {reduce:_0x4046e9,update:_0x1f227b};';
 const original=new Function('settings','world','input','window',code)(m.settings,{PLAYER:{id:1}},{angle:2.3},{Math});
 let cases=0,frames=0;
 function packet(byte){const b=new ArrayBuffer(22),u8=new Uint8Array(b),u16=new Uint16Array(b);u8[2]=1;u8[3]=1;u8[4]=byte;u8[5]=0;u16[3]=1;u16[5]=u16[6]=u16[7]=u16[8]=1000;n.packet(b,u8,0);}
 try{
  n.network.state=1;self.id=1;m.reconnect.sessionEnded=false;m.onHandshake();m.observeSocket(null);m.setSetting('autoFire',false);n.input.angle=2.3;
  packet(0);const e=n.entities.get(1,0,1,0),nativeLerp=n.types[0][r['ᴎ٨ߍ']];
  m.trackPacket(0,0,0,1100,1000,true);m.trackPacket(13,0,0,1100,1000,true);
  check(!m.targets.players[0].active&&!m.targets.ghouls[0].active,'Zero position sentinel became an ILM target');
  check(nativeLerp===reference.player_lerp,'Native player interpolation rate differs from original ILM');
  for(const [mode,enabled]of [['withAim',false],['withAim',true],['always',false]]){
   m.setSetting('ShowRealAngles',mode);m.setSetting('AimBotEnabled',enabled);
   for(const start of [-.01,Math.PI-.01,Math.PI*2-.01])for(const byte of [0,1,64,127,128,191,254,255]){
    e.angle=start;packet(byte);e[r['ᴎ٨ߍ']]=nativeLerp;
    const target=original.reduce(start,byte*2*Math.PI/255),old={angle:start,nangle:target,lerp:reference.player_lerp,pid:1,id:0,x:1000,y:1000,rx:1000,ry:1000,nx:1000,ny:1000,speed:0,angleX:0,angleY:0};
    check(Math.abs(e[r['ᴑ٧ߓ']]-target)<1e-10,'Native server angle differs from original ILM decoding');
    for(let frame=0;frame<4;frame++){n.update(e);original.update(old);check(Number.isFinite(e.angle)&&Math.abs(e.angle-old.angle)<1e-10,'Native displayed turn differs from original ILM: '+JSON.stringify({mode,enabled,start,byte,frame,actual:e.angle,original:old.angle}));frames++;}
    cases++;
   }
  }
  // A native manual attack between original 50 ms ticks keeps the source's
  // already transmitted direction; it must not substitute the pointer angle.
  m.setSetting('AimBotEnabled',true);m.setSetting('lockId',2);m.setSetting('mouseFovEnable',false);
  m.trackPacket(0,1,1,1000,1000,true);m.trackPacket(0,2,1,1400,1100,true);m.aim.refresh();
  const before=capture.packets.filter(p=>p[0]===6).at(-1)?.[1];capture.packets.length=0;n.fire();
  check(Number.isFinite(before)&&JSON.stringify(capture.packets)==='[[4]]','Manual fire changed original ILM timer direction');
  return {status:'passed',cases,frames,native_player_lerp:nativeLerp,zero_position_sentinels_ignored:true,actual_server_packet_angle:true,source_wrap_and_interpolation:true,manual_fire_keeps_source_direction:true};
 }finally{
  capture.restore();self.id=oldId;n.network.state=oldState;n.input.angle=oldInput;Object.assign(m.reconnect,oldReconnect);m.onHandshake();for(const[k,v]of Object.entries(saved))m.setSetting(k,v);
 }
}
module.exports={verifyIlmMouse,verifyIlmServerAngle};
