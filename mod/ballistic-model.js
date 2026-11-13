// Physical prediction in world units and seconds. No native game code is executed here.
function __createBallisticAim(settings, clock) {
  const tracks=new Map(), speeds=new Map(), projectiles=new Map();
  const maxAge=350, maxGap=500, maxSpeed=1800;
  function circle(samples){
    if(samples.length<7||samples.at(-1).at-samples[0].at<250-1e-6)return null;
    const last=samples.at(-1),points=samples.map(p=>({x:p.x-last.x,y:p.y-last.y,t:(p.at-last.at)/1000})),n=points.length;
    let mx=0,my=0,mz=0;for(const p of points){mx+=p.x/n;my+=p.y/n;mz+=(p.x*p.x+p.y*p.y)/n;}
    let xx=0,xy=0,yy=0,xz=0,yz=0;
    for(const p of points){const x=p.x-mx,y=p.y-my,z=p.x*p.x+p.y*p.y-mz;xx+=x*x;xy+=x*y;yy+=y*y;xz+=x*z;yz+=y*z;}
    const det=xx*yy-xy*xy;if(det<1e-7*(xx+yy)**2)return null;
    const cx=(xz*yy-yz*xy)/(2*det),cy=(yz*xx-xz*xy)/(2*det),radius=Math.sqrt(cx*cx+cy*cy+mz-2*cx*mx-2*cy*my);
    if(!Number.isFinite(radius)||radius<50||radius>5000)return null;
    let previous=null,angle=0,first=0,st=0,sa=0,stt=0,sta=0;const rates=[];
    for(let i=0;i<n;i++){
      const p=points[i];if(Math.abs(Math.hypot(p.x-cx,p.y-cy)-radius)>Math.min(3,Math.max(1.5,radius*.01)))return null;
      const a=Math.atan2(p.y-cy,p.x-cx);
      if(previous===null)first=angle=a;
      else {const delta=Math.atan2(Math.sin(a-previous),Math.cos(a-previous)),dt=p.t-points[i-1].t;if(dt<=0)return null;angle+=delta;rates.push(delta/dt);}
      previous=a;st+=p.t;sa+=angle;stt+=p.t*p.t;sta+=p.t*angle;
    }
    const omega=(n*sta-st*sa)/(n*stt-st*st),speed=Math.abs(omega)*radius,sweep=Math.abs(angle-first);
    if(speed<30||speed>1200||sweep<.08||sweep>1.2||rates.some(r=>r*omega<=0||Math.abs(r-omega)>.35*Math.abs(omega)))return null;
    return {cx:last.x+cx,cy:last.y+cy,radius,omega,angle,at:last.at};
  }
  function track(key,x,y,active,meta={}) {
    if(!active){tracks.delete(key);return;}
    if(!Number.isFinite(x)||!Number.isFinite(y))return;
    const at=clock();let t=tracks.get(key),last=t?.samples.at(-1);
    if(!t || at<last.at || at-last.at>maxGap || meta.generation!==undefined&&t.generation!==undefined&&meta.generation!==t.generation){
      t={samples:[],weapon:-1,generation:meta.generation};tracks.set(key,t);last=null;
    }
    if(last && at>last.at && (Math.hypot(x-last.x,y-last.y)>200 || at-last.at>=8&&Math.hypot(x-last.x,y-last.y)/(at-last.at)*1000>maxSpeed)){t.samples=[];last=null;t.curve=null;}
    if(meta.weapon!==undefined)t.weapon=meta.weapon;
    if(meta.generation!==undefined)t.generation=meta.generation;
    if(last&&at-last.at<8)t.samples[t.samples.length-1]={x,y,at};
    else t.samples.push({x,y,at});
    while(t.samples.length>8||t.samples.length>2&&at-t.samples[0].at>400+1e-6)t.samples.shift();
    const curve=circle(t.samples),before=t.curve;
    if(curve){curve.streak=before&&before.omega*curve.omega>0&&Math.abs(before.radius-curve.radius)<.15*curve.radius&&Math.hypot(before.cx-curve.cx,before.cy-curve.cy)<Math.max(8,.15*curve.radius)?before.streak+1:1;}
    t.curve=curve;
  }
  function motion(key,at=clock()) {
    const t=tracks.get(key),last=t?.samples.at(-1);
    if(!last || at<last.at || at-last.at>maxAge)return null;
    const s=t.samples;let vx=0,vy=0;
    if(s.length>1){
      const p=s.at(-2),dt=(last.at-p.at)/1000;
      if(dt>0){
        const dx=last.x-p.x,dy=last.y-p.y;
        // A stop or turn should not drag an older velocity into the next shot.
        let first=Math.max(0,s.length-4);
        if(s.length>2){const q=s.at(-3),px=p.x-q.x,py=p.y-q.y;
          if(dx*px+dy*py<=0 || Math.abs(dx*py-dy*px)>.5*Math.hypot(dx,dy)*Math.hypot(px,py))first=s.length-2;
        }
        if(dx!==0||dy!==0){
          let st=0,sx=0,sy=0,stt=0,stx=0,sty=0,n=0;
          for(let i=first;i<s.length;i++){const p=s[i],t=(p.at-last.at)/1000;st+=t;sx+=p.x;sy+=p.y;stt+=t*t;stx+=t*p.x;sty+=t*p.y;n++;}
          const d=n*stt-st*st;
          if(d>1e-10){vx=(n*stx-st*sx)/d;vy=(n*sty-st*sy)/d;}
        }
      }
    }
    const curve=t.curve?.streak>=2&&at-last.at<=200?t.curve:null;
    if(curve){vx=-curve.radius*curve.omega*Math.sin(curve.angle);vy=curve.radius*curve.omega*Math.cos(curve.angle);}
    return {x:last.x,y:last.y,vx,vy,age:(at-last.at)/1000,weapon:t.weapon,samples:s.length,curve};
  }
  function projectile(key,weapon,speed,nominal) {
    const at=clock();
    if(projectiles.has(key)||!Number.isInteger(weapon)||weapon<0||!Number.isFinite(speed)||speed<100||speed>20000)return;
    projectiles.set(key,at);
    while(projectiles.size>256)projectiles.delete(projectiles.keys().next().value);
    // A packet for a projectile fired before a weapon switch must not teach the
    // newly equipped weapon a radically different speed.
    if(nominal>0&&Math.abs(speed-nominal)>.3*nominal)return;
    let sample=speeds.get(weapon);if(!sample){sample=[];speeds.set(weapon,sample);}
    sample.push({speed,at});if(sample.length>9)sample.shift();
    if(speeds.size>128)speeds.delete(speeds.keys().next().value);
  }
  function speedFor(weapon,profile={}) {
    const samples=(speeds.get(weapon)||[]).filter(s=>clock()-s.at<300000);
    if(settings.predictionAutoSpeed && samples.length){
      const values=samples.map(s=>s.speed).sort((a,b)=>a-b),trim=values.length>=5?1:0;
      const kept=values.slice(trim,values.length-trim);
      return {speed:kept.reduce((a,b)=>a+b,0)/kept.length,source:'server-projectiles',samples:samples.length};
    }
    if(settings.predictionAutoSpeed && profile.speed>0)return {speed:profile.speed,source:'native-weapon',samples:0};
    return {speed:settings.bulletSpeedCoefficient*1000,source:'configured',samples:0};
  }
  function intercept(rx,ry,vx,vy,speed,muzzle=0) {
    if(![rx,ry,vx,vy,speed,muzzle].every(Number.isFinite)||speed<=0||muzzle<0)return null;
    const c=rx*rx+ry*ry-muzzle*muzzle;if(c<=0)return 0;
    const a=vx*vx+vy*vy-speed*speed,b=2*(rx*vx+ry*vy-speed*muzzle);
    let roots;
    if(Math.abs(a)<1e-8*Math.max(speed*speed,1))roots=Math.abs(b)>1e-9?[-c/b]:[];
    else {const d=b*b-4*a*c;if(d<0)return null;const q=-.5*(b+(b>=0?1:-1)*Math.sqrt(d));roots=q===0?[-b/(2*a)]:[q/a,c/q];}
    const positive=roots.filter(t=>Number.isFinite(t)&&t>=0);return positive.length?Math.min(...positive):null;
  }
  function resolve(selfKey,targetKey,profile={}) {
    const now=clock(),self=motion(selfKey,now),target=motion(targetKey,now);
    if(!self||!target)return {valid:false,status:'stale-position'};
    const delay=(settings.predictionLatencyMs||0)/1000;
    function future(m,t){if(m.curve){const c=m.curve,a=c.angle+c.omega*t;return {x:c.cx+c.radius*Math.cos(a),y:c.cy+c.radius*Math.sin(a)};}return {x:m.x+m.vx*t,y:m.y+m.vy*t};}
    const origin=future(self,self.age+delay),ox=origin.x,oy=origin.y,initial=future(target,target.age+delay),tx=initial.x,ty=initial.y;
    const distance=Math.hypot(tx-ox,ty-oy),model=speedFor(self.weapon,profile);
    let flight=intercept(tx-ox,ty-oy,target.vx,target.vy,model.speed,profile.muzzle||0),motionModel='linear';
    if(target.curve&&model.speed>Math.hypot(target.vx,target.vy)*1.05){
      let lo=0,hi=Math.min(3,profile.range>0?profile.range/model.speed:3);
      const gap=t=>{const p=future(target,target.age+delay+t);return Math.hypot(p.x-ox,p.y-oy)-model.speed*t-(profile.muzzle||0);};
      if(gap(hi)>0)flight=null;
      else{for(let i=0;i<32;i++){const mid=(lo+hi)/2;if(gap(mid)>0)lo=mid;else hi=mid;}flight=(lo+hi)/2;motionModel='circle';}
    }
    if(flight===null || flight>3 || profile.range>0&&model.speed*flight>profile.range)return {valid:false,status:'unreachable',distance,...model};
    const point=motionModel==='circle'?future(target,target.age+delay+flight):{x:tx+target.vx*flight,y:ty+target.vy*flight},x=point.x,y=point.y,angle=Math.atan2(y-oy,x-ox)*180/Math.PI;
    return {valid:true,status:'tracking',angle,x,y,ox,oy,distance,flight,motionModel,...model,selfVelocity:{x:self.vx,y:self.vy},targetVelocity:{x:target.vx,y:target.vy}};
  }
  return {track,motion,projectile,speedFor,resolve,intercept,reset(){tracks.clear();projectiles.clear();}};
}

