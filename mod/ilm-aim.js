// ILM 1.0 declarations from the supplied JSON; see recovery/ilm-aim-reference.json.gz.
// Every stored declaration is copied verbatim; native adaptation lives outside the core.
function __createIlmAim(settings, world, send) {
const _0x2ea565=settings, _0x10898e=world, _0x4c996c=send;
// All string lookups in the stored reference are already decoded. The original
// aliases are retained verbatim; fail if a new live decoder dependency appears.
const _0x225287=()=>{throw new Error('Unexpected live ILM string decoder');},_0x349c=_0x225287;
// BEGIN ORIGINAL ILM CORE
class _0x3e2cd1{constructor(){var _0x90eb58=_0x349c;this["players"]=Array["from"]({'length':0x79},(_0x38ba4d,_0x36bec7)=>new _0x218077(_0x36bec7)),this["ghouls"]=Array['from']({'length':0x3e7},(_0x58e32a,_0x3ea701)=>new _0x218077(_0x3ea701)),this['obstacles']=[],this["lines"]=[new _0x391c19(0.6,0x1,"#EEEEEE"),new _0x391c19(0.8,0x3,"#FF0000"),new _0x391c19(0.8,0x3,'#00FF00'),new _0x391c19(0.8,0x2,'#0000FF')],this['mousePosition']={'x':0x0,'y':0x0},this['mouseMapCords']={'x':0x0,'y':0x0},this["tappedForLast140mills"]=![],this["shifting"]=![],this['menuActive']=![],this["menuX"]=0x0,this["menuY"]=0x0,this["menuWidth"]=0x0,this['menuHeight']=0x0,this["lastId"]=0x0,this["myLastMoveDirection"]=0x0;}["getPlayerById"](_0x4a05d2){var _0x520482=_0x225287;return this["players"][_0x4a05d2];}["getGhoulByUid"](_0x232cd5){var _0x462efd=_0x225287;return this["ghouls"][_0x232cd5];}["resetLines"](){var _0x4cd25b=_0x225287;this["lines"]["forEach"](_0x177dce=>_0x177dce["reset"]());}}

class _0x218077{constructor(_0x3f7d89){var _0x44040d=_0x225287;this['id']=_0x3f7d89,this['x']=-0x1,this['y']=-0x1,this["prevX"]=Array(0x3)["fill"](-0x1),this["prevY"]=Array(0x3)["fill"](-0x1),this["active"]=![],this["weapon"]=-0x1,this['gear']=-0x1;}["update"](_0x16c549,_0x39f961){var _0x1b8e5f=_0x225287;this["active"]=!![],this['prevX']=[this['x'],...this["prevX"]["slice"](0x0,0x2)],this["prevY"]=[this['y'],...this["prevY"]["slice"](0x0,0x2)],this['x']=_0x16c549,this['y']=_0x39f961;}["setInactive"](){var _0x124c64=_0x225287;this['x']=-0x1,this['y']=-0x1,this["prevX"]["fill"](-0x1),this["prevY"]["fill"](-0x1),this["active"]=![],_0x6cc5f2['resetLines']();}}

class _0x4b5d6f{constructor(){var _0x3d596d=_0x225287;this["lastAngle"]=0x0,this["targetPlayer"]=null;}["wannaFire"](_0x51d67e=this["targetPlayer"]){var _0x2fdb94=_0x225287;if(!_0x51d67e)return![];const [_0x4c3eaf,_0x4d399f,_0x54230e]=_0x51d67e['prevX'],[_0x440651,_0x3f96,_0x2d4ab1]=_0x51d67e["prevY"];return _0x51d67e['x']-_0x4c3eaf>0x0!==_0x4c3eaf-_0x4d399f>0x0||_0x51d67e['y']-_0x440651>0x0!==_0x440651-_0x3f96>0x0;}['resolve'](){var _0x53e549=_0x225287;const _0x302a15=_0x6cc5f2['getPlayerById'](_0x10898e['PLAYER']['id']);let _0x32f84a;_0x2ea565["lockId"]>-0x1?_0x32f84a=_0x6cc5f2["getPlayerById"](_0x2ea565["lockId"]):_0x32f84a=_0x2ea565["mouseFovEnable"]?this["findNearestPlayerTo"](_0x6cc5f2["mouseMapCords"],_0x2ea565["mouseFov"]):this['findNearestPlayerTo'](_0x302a15,0x9c4);this["targetPlayer"]=_0x32f84a;if(!_0x32f84a)return this["lastAngle"];const _0x294d42=Math["hypot"](_0x302a15['x']-_0x32f84a['x'],_0x302a15['y']-_0x32f84a['y']),_0x545191=_0x294d42/_0x2ea565["distanceCoefficient"]+_0x2ea565['offsetCoefficient'],_0x116788=_0x32f84a["prevX"][0x0]===-0x1?_0x32f84a['x']:_0x32f84a['x']+_0x545191*(_0x32f84a['x']-_0x32f84a["prevX"][0x0]),_0x5af3a6=_0x32f84a['prevY'][0x0]===-0x1?_0x32f84a['y']:_0x32f84a['y']+_0x545191*(_0x32f84a['y']-_0x32f84a['prevY'][0x0]),_0x3f6465=Math["atan2"](_0x5af3a6-_0x302a15['y'],_0x116788-_0x302a15['x'])*(0xb4/Math['PI']);return this['lastAngle']=_0x3f6465,_0x2ea565["visualizeResolving"]&&_0x6cc5f2['lines'][0x0]["reset"](_0x302a15['x'],_0x302a15['y'],_0x116788,_0x5af3a6),Math['round'](_0x3f6465);}["findNearestPlayerTo"](_0x1b0ea4,_0x27daba){var _0x3912f1=_0x225287;let _0x54dddc=null,_0x3dfe2b=_0x27daba;const _0x44dc5a=_0x4d9bd2=>{var _0x1eea76=_0x349c;for(let _0x53f889 of _0x4d9bd2){if(_0x53f889['active']&&_0x53f889['id']!==_0x10898e['PLAYER']['id']&&(_0x10898e["players"][_0x53f889['id']]["team"]!==_0x10898e["PLAYER"]["team"]||_0x10898e["PLAYER"]["team"]===-0x1)){const _0xed1853=Math['hypot'](_0x1b0ea4['x']-_0x53f889['x'],_0x1b0ea4['y']-_0x53f889['y']);_0xed1853<_0x3dfe2b&&(_0x54dddc=_0x53f889,_0x3dfe2b=_0xed1853);}}};return(_0x2ea565["target"]==='players'||_0x2ea565["target"]==='all')&&_0x44dc5a(_0x6cc5f2["players"]),(_0x2ea565["target"]==="ghouls"||_0x2ea565["target"]==="all")&&_0x44dc5a(_0x6cc5f2["ghouls"]),_0x54dddc;}}

class _0x391c19{constructor(_0x4c599e,_0x14ea80,_0x57b06a){var _0x27af89=_0x225287;this['x1']=-0xa,this['x2']=-0xa,this['y1']=-0xa,this['y2']=-0xa,this["alpha"]=_0x4c599e,this["width"]=_0x14ea80,this["color"]=_0x57b06a;}["reset"](_0x4a15e2,_0x2d9e21,_0x3151bb,_0x340401){this['x1']=_0x4a15e2,this['y1']=_0x2d9e21,this['x2']=_0x3151bb,this['y2']=_0x340401;}}

function _0x4a7389(){var _0xd88efc=_0x225287;if(_0x10898e["PLAYER"]['id']===0x0){if(_0x6cc5f2["lastId"]!==0x0){_0x6cc5f2["lastId"]=0x0;for(let _0x2b8de3 of _0x6cc5f2["players"])_0x2b8de3["setInactive"]();}return;}_0x6cc5f2["lastId"]=_0x10898e["PLAYER"]['id'],_0x2ea565["AimBotEnabled"]&&(_0x4c996c([0x6,_0x41e779["resolve"]()]),_0x2ea565["autoFire"]&&_0x41e779["wannaFire"]()&&(_0x4c996c([0x4]),_0x4c996c([0x5])));}

// END ORIGINAL ILM CORE
const _0x6cc5f2=new _0x3e2cd1(), _0x41e779=new _0x4b5d6f();
return {targets:_0x6cc5f2,aim:_0x41e779,tick:_0x4a7389,Target:_0x218077};
}

// Keep the native zero sentinel for unused player slots. Decorate raw server names only.
function __ilmPlayerNickname(value,id) {
  return typeof value==='string' ? value+'#'+id : value;
}

// The current game's metadata constructor is in a native decoded block.
// Match one reviewed assignment; preserve the native numeric empty-slot sentinel.
function __ilmPatchPlayerMetadata(source) {
  const before='this.ο३︀ = ο३︀';
  if(source.split(before).length!==2) throw new Error('Unsupported native player metadata constructor');
  return source.replace(before,'this.ο३︀ = __ilmPlayerNickname(ο३︀,ᴘ५٢)');
}

// Patch only the reviewed direction functions inside the native decoded block.
function __ilmPatchNativeDirection(source,index) {
  const rules=[["function օ︃２( ){ if( ( ᴉ̡̂-ѕܓ́)>εࡀߌ) {var ᴑɑࡂ=(( ( ((ㅤ๘މ[ѕ̋̃]-ⲅᚂߌ ) *0xb4)/Math[ո᠋а])%0x168)+0x168 )%0x168; if (ᴑɑࡂ>ᅠ̡๕ ) {ﾠࠂ̶=ᴉ̡̂ ; ѕܓ́ =ᴉ̡̂; ⲅᚂߌ=ㅤ๘މ[ ѕ̋̃ ] ;ᴑɑࡂ =Math[ᴇߌ̄ ](( ( ((ㅤ๘މ[ᴉᄇ︂]*0xb4 ) /Math[ո᠋а ]) %360)  + 360 ) %0550) ;ιܕ︅(еϲᄄ.ᴎ︅ހ([06 , ᴑɑࡂ ] ));}}}","function օ︃２( ){ if( ( ᴉ̡̂-ѕܓ́)>εࡀߌ) {var ᴑɑࡂ=(( ( ((ㅤ๘މ[ѕ̋̃]-ⲅᚂߌ ) *0xb4)/Math[ո᠋а])%0x168)+0x168 )%0x168; if (ᴑɑࡂ>ᅠ̡๕ ) {ﾠࠂ̶=ᴉ̡̂ ; ѕܓ́ =ᴉ̡̂; ⲅᚂߌ=ㅤ๘މ[ ѕ̋̃ ] ;ᴑɑࡂ =Math[ᴇߌ̄ ](( ( ((ㅤ๘މ[ᴉᄇ︂]*0xb4 ) /Math[ո᠋а ]) %360)  + 360 ) %0550) ;((!__responsiveMod||!(__responsiveMod.settings.AimBotEnabled||__responsiveMod.settings.JitterEnabled))&&ιܕ︅(еϲᄄ.ᴎ︅ހ([06 , ᴑɑࡂ ] )));}}}"],["function ᴄ९ܐ( ){if ( (ᴉ̡̂ - ѕܓ́)>ᴎᄉࡁ){ var ᴑɑࡂ=( (( ( (ㅤ๘މ [ᴉᄇ︂]-ⲅᚂߌ)* 0Xb4) /Math [ⲥᄇօ] ) %360 )+0x168)%360;if(ᴑɑࡂ > 2 ) { ﾠࠂ̶ =ᴉ̡̂; ѕܓ́=ᴉ̡̂ ;ⲅᚂߌ = ㅤ๘މ[ѕ̋̃ ];ᴑɑࡂ =Math [ ᴇߌ̄]((((( ㅤ๘މ[еϲ̇]*0xB4 ) /Math[ɑ︀ܛ] ) %0550 )+0x168)%360) ; ιܕ︅(еϲᄄ.ᴎ︅ހ([6, ᴑɑࡂ]));}}}","function ᴄ९ܐ( ){if ( (ᴉ̡̂ - ѕܓ́)>ᴎᄉࡁ){ var ᴑɑࡂ=( (( ( (ㅤ๘މ [ᴉᄇ︂]-ⲅᚂߌ)* 0Xb4) /Math [ⲥᄇօ] ) %360 )+0x168)%360;if(ᴑɑࡂ > 2 ) { ﾠࠂ̶ =ᴉ̡̂; ѕܓ́=ᴉ̡̂ ;ⲅᚂߌ = ㅤ๘މ[ѕ̋̃ ];ᴑɑࡂ =Math [ ᴇߌ̄]((((( ㅤ๘މ[еϲ̇]*0xB4 ) /Math[ɑ︀ܛ] ) %0550 )+0x168)%360) ; ((!__responsiveMod||!(__responsiveMod.settings.AimBotEnabled||__responsiveMod.settings.JitterEnabled))&&ιܕ︅(еϲᄄ.ᴎ︅ހ([6, ᴑɑࡂ])));}}}"]];
  const rule=rules[index];
  if(!rule || source.split(rule[0]).length!==2) throw new Error("Unsupported native direction handler");
  return source.replace(rule[0],rule[1]);
}

// Align a shot before the native codec processes its attack command.
function __jitterPatchNativeFire(source) {
  const before='function ᴎ༩༣( ) {ﾠࠂ̶=ᴉ̡̂;';
  if(source.split(before).length!==2) throw new Error('Unsupported native fire handler');
  return source.replace(before,before+'if(typeof __responsiveMod!=="undefined"&&__responsiveMod)__responsiveMod.beforeFire();');
}

// Original aim GUI only; the surrounding mod keeps its own folders and persistence.
function __installIlmAimMenu(root,settings) {
const _0x2a1bff=root,_0x2ea565=settings;
// BEGIN ORIGINAL ILM AIM MENU
const _0xaa24fd=_0x2a1bff["addFolder"]("Aim Bot");
_0xaa24fd["add"](_0x2ea565,"ShowRealAngles",["always","withAim"])["name"]("ShowRealAngles"),_0xaa24fd['add'](_0x2ea565,"target",["players",'ghouls',"all"])['name']("Target"),_0xaa24fd["add"](_0x2ea565,'distanceCoefficient',0xa,0x3e8,0xa)["name"]("DistanceCoefficient"),_0xaa24fd['add'](_0x2ea565,"bulletSpeedCoefficient",0x1,0xf,0.25)["name"]("BulletSpeedCoefficient"),_0xaa24fd['add'](_0x2ea565,'offsetCoefficient',0x0,0x3,0.1)["name"]("OffsetCoefficient");
// END ORIGINAL ILM AIM MENU
return _0xaa24fd;
}

// Original prediction lines; the caller supplies the current native view/canvas.
function __renderIlmAimLines(settings,targets,ctx,view) {
const _0x2ea565=settings,_0x6cc5f2=targets,_0x3bfd3a=ctx,_0x555618=view.scale,_0x4212a3=view.x,_0x260b24=view.y;
// BEGIN ORIGINAL ILM AIM LINES
if(_0x2ea565["AimBotEnabled"]){let _0xb2b2ae=_0x3bfd3a["globalAlpha"],_0x2d0da4=_0x3bfd3a["lineWidth"];for(var _0x55bf6b=0x0;_0x55bf6b<_0x6cc5f2["lines"]["length"];_0x55bf6b++){let _0x47ac71=_0x6cc5f2["lines"][_0x55bf6b];var _0x4e7ab6={'x':_0x555618*(_0x47ac71['x1']+_0x4212a3),'y':_0x555618*(_0x47ac71['y1']+_0x260b24)},_0xfdef36={'x':_0x555618*(_0x47ac71['x2']+_0x4212a3),'y':_0x555618*(_0x47ac71['y2']+_0x260b24)};_0x3bfd3a["lineWidth"]=_0x47ac71["width"],_0x3bfd3a["globalAlpha"]=_0x47ac71['alpha'],_0x3bfd3a["strokeStyle"]=_0x47ac71['color'],_0x3bfd3a["beginPath"](),_0x3bfd3a["moveTo"](_0x4e7ab6['x'],_0x4e7ab6['y']),_0x3bfd3a["lineTo"](_0xfdef36['x'],_0xfdef36['y']),_0x3bfd3a['stroke']();}_0x3bfd3a["globalAlpha"]=_0xb2b2ae,_0x3bfd3a["lineWidth"]=_0x2d0da4;}
// END ORIGINAL ILM AIM LINES
}

// Optional prediction extension. The original ILM declarations above stay intact.
function __createAdaptiveAim(clock) {
  const samples=new WeakMap();
  function observe(target) {
    const now=clock(),last=samples.get(target);
    if (!last) {samples.set(target,{x:target.x,y:target.y,time:now,vx:0,vy:0,dt:0,ready:false,px:target.x,py:target.y,pt:now});return;}
    const dt=now-last.time,dx=target.x-last.x,dy=target.y-last.y;
    let vx=0,vy=0,ready=dt>=8&&dt<=500&&Math.hypot(dx,dy)<=Math.max(400,dt*2);
    if (ready) {
      vx=dx/dt;vy=dy/dt;
      // Pool two consistent intervals to reduce packet-arrival jitter. A stop,
      // reversal or sharp turn uses only the newest movement immediately.
      const oldDt=last.time-last.pt,oldVx=oldDt>0?(last.x-last.px)/oldDt:0,oldVy=oldDt>0?(last.y-last.py)/oldDt:0;
      const speed=Math.hypot(vx,vy),oldSpeed=Math.hypot(oldVx,oldVy);
      if (last.ready&&oldDt>=8&&speed>0&&oldSpeed>0&&vx*oldVx+vy*oldVy>.98*speed*oldSpeed&&speed/oldSpeed>.8&&speed/oldSpeed<1.25) {
        vx=(target.x-last.px)/(now-last.pt);vy=(target.y-last.py)/(now-last.pt);
      }
    }
    last.px=last.x;last.py=last.y;last.pt=last.time;
    last.x=target.x;last.y=target.y;last.time=now;last.vx=vx;last.vy=vy;last.rawVx=ready?dx/dt:0;last.rawVy=ready?dy/dt:0;last.dt=dt;last.ready=ready;
  }
  function velocity(sample,now) {
    return sample?.ready&&now>=sample.time&&now-sample.time<=Math.min(250,Math.max(100,sample.dt*2));
  }
  function resolve(aim,targets,selfId,settings,nativeSpeed,legacy) {
    const target=aim.targetPlayer,self=targets.players[selfId];
    if (!target?.active||!self?.active) return legacy;
    const sample=samples.get(target);if(!sample)return legacy;
    const now=clock(),moving=velocity(sample,now),smooth=settings.resolverType==='smoothed';
    const vx=moving?(smooth?sample.vx:sample.rawVx):0,vy=moving?(smooth?sample.vy:sample.rawVy):0;
    if(!settings.ImprovedAimEnabled||!(nativeSpeed>0)||!Number.isFinite(nativeSpeed)){
      if(!smooth||!moving)return legacy;
      const lead=(Math.hypot(target.x-self.x,target.y-self.y)/settings.distanceCoefficient+settings.offsetCoefficient)*4/settings.bulletSpeedCoefficient;
      const x=target.x+vx*sample.dt*lead,y=target.y+vy*sample.dt*lead;
      const angle=Math.atan2(y-self.y,x-self.x)*180/Math.PI;if(!Number.isFinite(angle))return legacy;
      aim.lastAngle=angle;if(settings.visualizeResolving)targets.lines[0].reset(self.x,self.y,x,y);
      return Math.round(angle);
    }
    const own=samples.get(self),ownMoving=velocity(own,now),delay=settings.offsetCoefficient*50;
    const sx=self.x+(ownMoving?(smooth?own.vx:own.rawVx)*(now-own.time+delay):0),sy=self.y+(ownMoving?(smooth?own.vy:own.rawVy)*(now-own.time+delay):0);
    const age=moving?now-sample.time:0;
    let x=target.x+vx*(age+delay),y=target.y+vy*(age+delay);
    const speed=nativeSpeed*(settings.bulletSpeedCoefficient/4)*(settings.distanceCoefficient/300);
    if (!(speed>0)||!Number.isFinite(speed))return legacy;
    const rx=x-sx,ry=y-sy,a=vx*vx+vy*vy-speed*speed,b=2*(rx*vx+ry*vy),c=rx*rx+ry*ry;
    let time=0;
    if (Math.abs(a)<1e-10) {if(b<0)time=-c/b;}
    else {
      const discriminant=b*b-4*a*c;
      if(discriminant>=0){
        const q=-.5*(b+(b>=0?1:-1)*Math.sqrt(discriminant)),t1=q/a,t2=q!==0?c/q:-1;
        time=t1>0&&t2>0?Math.min(t1,t2):Math.max(t1,t2,0);
      }
    }
    if(Number.isFinite(time)&&time<=3000){x+=vx*time;y+=vy*time;}
    const angle=Math.atan2(y-sy,x-sx)*180/Math.PI;if(!Number.isFinite(angle))return legacy;
    aim.lastAngle=angle;
    if(settings.visualizeResolving)targets.lines[0].reset(sx,sy,x,y);
    return Math.round(angle);
  }
  return {observe,forget:target=>samples.delete(target),resolve};
}

// Values are selected by tools/calibrate_aim.cjs using separate held-out scenes.
function __aimWeaponPresets() {
  return {
  "ak47_close": {
    "label": "AK-47: ближняя",
    "settings": {
      "ImprovedAimEnabled": true,
      "resolverType": "linear",
      "distanceCoefficient": 330,
      "bulletSpeedCoefficient": 4,
      "offsetCoefficient": 0.1,
      "mouseFovEnable": true,
      "mouseFov": 250,
      "target": "players",
      "lockId": -1
    }
  },
  "ak47_far": {
    "label": "AK-47: дальняя",
    "settings": {
      "ImprovedAimEnabled": true,
      "resolverType": "linear",
      "distanceCoefficient": 300,
      "bulletSpeedCoefficient": 4,
      "offsetCoefficient": 0.8,
      "mouseFovEnable": true,
      "mouseFov": 450,
      "target": "players",
      "lockId": -1
    }
  },
  "laser_close": {
    "label": "Лазерная SMG: ближняя",
    "settings": {
      "ImprovedAimEnabled": true,
      "resolverType": "smoothed",
      "distanceCoefficient": 330,
      "bulletSpeedCoefficient": 4,
      "offsetCoefficient": 0.1,
      "mouseFovEnable": true,
      "mouseFov": 250,
      "target": "players",
      "lockId": -1
    }
  },
  "laser_far": {
    "label": "Лазерная SMG: дальняя",
    "settings": {
      "ImprovedAimEnabled": true,
      "resolverType": "smoothed",
      "distanceCoefficient": 330,
      "bulletSpeedCoefficient": 4,
      "offsetCoefficient": 1.6,
      "mouseFovEnable": true,
      "mouseFov": 450,
      "target": "players",
      "lockId": -1
    }
  }
};
}
