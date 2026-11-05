// Optional circular-motion interception. Target selection and the ILM core stay original.
function __createCurvedAim(clock) {
  const history=new WeakMap(),capacity=12;
  let mode='ilm';
  function clear(s) {s.count=0;s.head=0;s.model=null;s.streak=0;s.checked=-1;}
  function observe(target) {
    const now=clock();if(!Number.isFinite(now)||!Number.isFinite(target.x)||!Number.isFinite(target.y))return;
    let s=history.get(target);
    if(!s){s={points:new Float64Array(capacity*3),count:0,head:0,revision:0,checked:-1,model:null,streak:0};history.set(target,s);}
    if(s.count){
      const i=(s.head+capacity-1)%capacity*3,dt=now-s.points[i+2],distance=Math.hypot(target.x-s.points[i],target.y-s.points[i+1]);
      if(dt<8||dt>400||distance<.01||distance>Math.max(400,dt*1.5))clear(s);
      else if(s.count>=2){
        const j=(s.head+capacity-2)%capacity*3,ax=s.points[i]-s.points[j],ay=s.points[i+1]-s.points[j+1];
        if(ax*(target.x-s.points[i])+ay*(target.y-s.points[i+1])<.25*Math.hypot(ax,ay)*distance)clear(s);
      }
    }
    const i=s.head*3;s.points[i]=target.x;s.points[i+1]=target.y;s.points[i+2]=now;
    s.head=(s.head+1)%capacity;s.count=Math.min(capacity,s.count+1);s.revision++;
  }
  function fit(s) {
    if(s.checked===s.revision)return s.streak>=2?s.model:null;
    s.checked=s.revision;
    let n=s.count;const at=i=>((s.head+capacity-n+i)%capacity)*3,p=s.points;
    while(n>=7&&p[(s.head+capacity-1)%capacity*3+2]-p[at(0)+2]>1200)n--;
    function reject(){s.model=null;s.streak=0;return null;}
    if(n<7)return reject();
    const latest=p[at(n-1)+2],span=latest-p[at(0)+2];
    if(span<180||span>1200)return reject();
    let mx=0,my=0;
    for(let i=0;i<n;i++){const j=at(i);mx+=p[j];my+=p[j+1];}mx/=n;my/=n;
    let xx=0,xy=0,yy=0,bx=0,by=0;
    for(let i=0;i<n;i++){const j=at(i),x=p[j]-mx,y=p[j+1]-my,z=(x*x+y*y)/2;xx+=x*x;xy+=x*y;yy+=y*y;bx+=x*z;by+=y*z;}
    const det=xx*yy-xy*xy;
    if(!(det>1e-5*(xx+yy)*(xx+yy)))return reject();
    const cx=mx+(bx*yy-by*xy)/det,cy=my+(by*xx-bx*xy)/det;
    let radius=0;
    for(let i=0;i<n;i++){const j=at(i);radius+=Math.hypot(p[j]-cx,p[j+1]-cy);}radius/=n;
    if(!Number.isFinite(radius)||radius<40||radius>1800)return reject();
    // Unwrap angles, then regress them against actual packet arrival times.
    let previous=0,angle=0,st=0,sa=0,stt=0,sta=0;
    const angles=new Float64Array(n);
    for(let i=0;i<n;i++){
      const j=at(i),raw=Math.atan2(p[j+1]-cy,p[j]-cx),t=p[j+2]-latest;
      if(i===0)angle=raw;else angle+=Math.atan2(Math.sin(raw-previous),Math.cos(raw-previous));
      previous=raw;angles[i]=angle;st+=t;sa+=angle;stt+=t*t;sta+=t*angle;
    }
    const denominator=n*stt-st*st;if(!(denominator>0))return reject();
    const omega=(n*sta-st*sa)/denominator,theta=(sa-omega*st)/n,sweep=Math.abs(omega)*span,speed=Math.abs(omega)*radius;
    if(sweep<.25||Math.abs(omega)>.02||speed<.03||speed>1.2)return reject();
    let error=0;
    for(let i=0;i<n;i++){const j=at(i),a=theta+omega*(p[j+2]-latest);error+=(p[j]-cx-radius*Math.cos(a))**2+(p[j+1]-cy-radius*Math.sin(a))**2;}
    const rms=Math.sqrt(error/n);
    if(rms>Math.max(2,radius*.035))return reject();
    const prior=s.model;
    const stable=prior&&prior.omega*omega>0&&Math.abs(prior.radius-radius)<radius*.3&&
      Math.hypot(prior.cx-cx,prior.cy-cy)<radius*.3&&Math.abs(prior.omega-omega)<Math.abs(omega)*.35;
    s.streak=stable?s.streak+1:1;
    s.model={cx,cy,radius,omega,theta,time:latest,interval:span/(n-1),sweep};
    return s.streak>=2?s.model:null;
  }
  function resolve(aim,targets,selfId,settings,weapon,legacy) {
    mode='ilm';
    const target=aim.targetPlayer,self=targets.players[selfId];
    if(!settings.CurvedAimEnabled||!target?.active||!self?.active||!(weapon?.speed>0)||!(weapon?.range>0))return legacy;
    const s=history.get(target);if(!s)return legacy;
    const model=fit(s);if(!model)return legacy;
    const age=clock()-model.time;
    if(age<0||age>Math.min(300,Math.max(120,model.interval*2.5)))return legacy;
    const speed=weapon.speed;
    if(!(speed>Math.abs(model.omega)*model.radius*1.05)||!Number.isFinite(speed))return legacy;
    // Estimate the shooter's position only up to the firing time, not during
    // flight. A fired projectile does not continue to follow its owner.
    let sx=self.x,sy=self.y;
    const own=history.get(self);
    if(own?.count>=2){
      const i=(own.head+capacity-1)%capacity*3,j=(own.head+capacity-2)%capacity*3;
      const ownAge=clock()-own.points[i+2],dt=own.points[i+2]-own.points[j+2];
      if(ownAge>=0&&ownAge<=Math.min(250,Math.max(100,dt*2.5))&&dt>=8){
        const circle=fit(own);
        if(circle){const a=circle.theta+circle.omega*ownAge;sx=circle.cx+circle.radius*Math.cos(a);sy=circle.cy+circle.radius*Math.sin(a);}
        else {sx+=((own.points[i]-own.points[j])/dt)*ownAge;sy+=((own.points[i+1]-own.points[j+1])/dt)*ownAge;}
      }
    }
    const delay=age+settings.offsetCoefficient*50,maxTime=weapon.range/speed;
    function point(t){const a=model.theta+model.omega*(delay+t);return {x:model.cx+model.radius*Math.cos(a),y:model.cy+model.radius*Math.sin(a)};}
    function gap(t){const p=point(t);return Math.hypot(p.x-sx,p.y-sy)-speed*t;}
    if(gap(maxTime)>0)return legacy;
    let lo=0,hi=maxTime;
    // With projectile speed above target speed, gap decreases monotonically.
    for(let i=0;i<18;i++){const mid=(lo+hi)/2;if(gap(mid)>0)lo=mid;else hi=mid;}
    const time=(lo+hi)/2;
    if(Math.abs(model.omega)*(time+delay)>Math.min(Math.PI,model.sweep*1.5))return legacy;
    const p=point(time),angle=Math.atan2(p.y-sy,p.x-sx)*180/Math.PI;
    if(!Number.isFinite(angle))return legacy;
    aim.lastAngle=angle;
    if(settings.visualizeResolving)targets.lines[0].reset(sx,sy,p.x,p.y);
    mode='curve';return Math.round(angle);
  }
  return {observe,forget:target=>history.delete(target),resolve,get mode(){return mode;}};
}
