// Physical prediction in world units and seconds. No native game code is executed here.
function __createBallisticAim(settings, clock) {
  const tracks=new Map(), speeds=new Map(), projectiles=new Map();
  const maxAge=350, maxGap=500, maxSpeed=1800;
  const maxHistory=1250, maxObservations=32, circleHistory=600;
  // Experimental interpretation of the screenshot, not its recovered formula.
  // RTT samples must be real round trips supplied by a verified integration.
  // Until then the configured fallback is reported as configured, not measured.
  const rttSamples=[];
  function bounded(value, fallback, minimum, maximum) {
    return Number.isFinite(value)?Math.max(minimum,Math.min(maximum,value)):fallback;
  }
  function sampleRtt(milliseconds) {
    const at=clock();
    if(!Number.isFinite(milliseconds)||milliseconds<0||milliseconds>2000||!Number.isFinite(at))return false;
    if(rttSamples.length&&at<rttSamples.at(-1).at)rttSamples.length=0;
    rttSamples.push({value:milliseconds,at});
    while(rttSamples.length>250)rttSamples.shift();
    return true;
  }
  function timingInfo() {
    const at=clock(),window=Math.round(bounded(settings.videoPingSteps,125,1,250));
    while(rttSamples.length&&(rttSamples.length>window||at-rttSamples[0].at>10000||at<rttSamples[0].at))rttSamples.shift();
    const currentPing=rttSamples.at(-1)?.value??null;
    const avgPing=rttSamples.length?rttSamples.reduce((sum,item)=>sum+item.value,0)/rttSamples.length:bounded(settings.videoPingMs,90,0,500);
    const leadMs=bounded(avgPing,90,0,500);
    const totalDelayMs=Math.min(750,leadMs+bounded(settings.videoDelayMs,1,0,100)+bounded(settings.videoDelaySendMs,20,0,100)+bounded(settings.predictionLatencyMs,0,0,500));
    return {enabled:!!settings.VideoAimEnabled,avgPing,currentPing,deltaPing:currentPing===null?null:currentPing-avgPing,samples:rttSamples.length,
      source:rttSamples.length?'measured':'configured',leadMs,totalDelayMs,aimSteps:Math.round(bounded(settings.videoAimSteps,2,1,8))};
  }
  // Use an evenly spaced observation clock only when packet arrivals support
  // one. Whole-slot gaps preserve the timing of a missing observation.
  function sampleTimes(samples) {
    if (samples.length < 7) return samples;
    const intervals = [];
    for (let i = 1; i < samples.length; i++) intervals.push(samples[i].at - samples[i - 1].at);
    const typical = intervals.slice().sort((a, b) => a - b)[Math.floor((intervals.length - 1) / 2)];
    if (typical < 25 || typical > 150) return samples;

    const last = samples.at(-1).at;
    const slots = new Array(samples.length);
    slots[intervals.length] = 0;
    for (let i = intervals.length - 1; i >= 0; i--) {
      const steps = Math.round(intervals[i] / typical);
      if (steps < 1 || steps > 4) return samples;
      slots[i] = slots[i + 1] - steps;
    }

    let sumSlot = 0, sumTime = 0, sumSlot2 = 0, sumSlotTime = 0;
    for (let i = 0; i < samples.length; i++) {
      const slot = slots[i], time = samples[i].at - last;
      sumSlot += slot;
      sumTime += time;
      sumSlot2 += slot * slot;
      sumSlotTime += slot * time;
    }
    const count = samples.length;
    const period = (count * sumSlotTime - sumSlot * sumTime) / (count * sumSlot2 - sumSlot ** 2);
    const offset = (sumTime - period * sumSlot) / count;
    const residuals = samples.map((point, i) => point.at - last - offset - slots[i] * period);
    const rms = Math.sqrt(residuals.reduce((sum, value) => sum + value ** 2, 0) / count);
    if (rms < .001 || period < typical * .85 || period > typical * 1.15 ||
        rms > Math.min(10, .17 * period) || residuals.some(r => Math.abs(r) > .32 * period)) {
      return samples;
    }

    // Keep the receipt time of the newest position as the age reference.
    return samples.map(({ x, y }, i) => ({ x, y, at: last + slots[i] * period }));
  }
  function circle(samples){
    if (samples.length < 5) return null;
    const first = samples[0], last = samples.at(-1), previous = samples.at(-2);
    if (last.at - first.at < 250 - 1e-6) return null;
    const dx = previous.x - last.x, dy = previous.y - last.y;
    if (dx === 0 && dy === 0) return null;
    const collinear = samples.every(point =>
      (point.x - last.x) * dy === (point.y - last.y) * dx);
    if (collinear) return null;
    for (let count = samples.length; count >= 5; count--) {
      const fit = fitCircle(samples.slice(-count));
      if (fit) return fit;
    }
    return null;
  }
  function fitCircle(samples){
    if(samples.length<5||samples.at(-1).at-samples[0].at<250-1e-6)return null;
    const last=samples.at(-1),points=samples.map(p=>({x:p.x-last.x,y:p.y-last.y,t:(p.at-last.at)/1000})),n=points.length;
    let mx=0,my=0,mz=0;for(const p of points){mx+=p.x/n;my+=p.y/n;mz+=(p.x*p.x+p.y*p.y)/n;}
    let xx=0,xy=0,yy=0,xz=0,yz=0;
    for(const p of points){const x=p.x-mx,y=p.y-my,z=p.x*p.x+p.y*p.y-mz;xx+=x*x;xy+=x*y;yy+=y*y;xz+=x*z;yz+=y*z;}
    const det=xx*yy-xy*xy,orthogonalRms=Math.sqrt(Math.max(0,(xx+yy-Math.hypot(xx-yy,2*xy))/(2*n)));
    if(det<1e-7*(xx+yy)**2||orthogonalRms<.55)return null;
    const cx=(xz*yy-yz*xy)/(2*det),cy=(yz*xx-xz*xy)/(2*det),radius=Math.sqrt(cx*cx+cy*cy+mz-2*cx*mx-2*cy*my);
    const residualTolerance=Math.min(3,Math.max(1.5,radius*.01));
    if(!Number.isFinite(radius)||radius+residualTolerance<50||radius>5000)return null;
    let previous=null,angle=0,first=0,st=0,sa=0,stt=0,sta=0;const rates=[],angles=[];
    for(let i=0;i<n;i++){
      const p=points[i];if(Math.abs(Math.hypot(p.x-cx,p.y-cy)-radius)>residualTolerance)return null;
      const a=Math.atan2(p.y-cy,p.x-cx);
      if(previous===null)first=angle=a;
      else {const delta=Math.atan2(Math.sin(a-previous),Math.cos(a-previous)),dt=p.t-points[i-1].t;if(dt<=0)return null;angle+=delta;rates.push(delta/dt);}
      previous=a;angles.push(angle);st+=p.t;sa+=angle;stt+=p.t*p.t;sta+=p.t*angle;
    }
    const omega=(n*sta-st*sa)/(n*stt-st*st),speed=Math.abs(omega)*radius,sweep=Math.abs(angle-first);
    // Curvature must be larger than quantization noise. Nearly straight noisy
    // samples otherwise fit a large circle and produce false curved leads.
    const sagitta=radius*(1-Math.cos(sweep/2)),intercept=(sa-omega*st)/n;
    const timingError=Math.sqrt(points.reduce((sum,p,i)=>sum+(radius*(angles[i]-intercept-omega*p.t))**2,0)/n);
    if(speed<30||speed>1200||sweep<.08||sweep>Math.PI||sagitta<1.5||timingError>2.5||rates.some(r=>r*omega<=0))return null;
    return {cx:last.x+cx,cy:last.y+cy,radius,omega,angle,at:last.at};
  }
  function segmentError(rows, start, end) {
    const count = end - start;
    let sumT = 0, sumZ = 0, sumTT = 0, sumTZ = 0, sumZZ = 0;
    for (let i = start; i < end; i++) {
      const { t, z } = rows[i];
      sumT += t;
      sumZ += z;
      sumTT += t * t;
      sumTZ += t * z;
      sumZZ += z * z;
    }
    const variance = sumTT - sumT * sumT / count;
    const covariance = sumTZ - sumT * sumZ / count;
    return Math.max(0, sumZZ - sumZ * sumZ / count - (variance > 0 ? covariance ** 2 / variance : 0));
  }
  // A periodic strafe has a nearly fixed travel axis, but its velocity
  // changes sign. Anchor its displacement to the newest packet and fit
  // frequency and phase from the history, rather than extrapolating speed.
  function fitStrafe(samples) {
    const first = samples[0], last = samples.at(-1), count = samples.length;
    if (count < 6 || last.at - first.at < 420) return null;
    const previous = samples.at(-2);
    if (last.x === previous.x && last.y === previous.y) return null;

    let axisX = 0, axisY = 0, extent = 0;
    for (const point of samples) {
      const x = point.x - last.x, y = point.y - last.y, distance = Math.hypot(x, y);
      if (distance > extent) {
        axisX = x;
        axisY = y;
        extent = distance;
      }
    }
    if (extent < 13) return null;
    axisX /= extent;
    axisY /= extent;
    const rows = samples.slice(0, -1).map(point => {
      const x = point.x - last.x, y = point.y - last.y;
      return { t: (point.at - last.at) / 1000, z: x * axisX + y * axisY, orthogonal: y * axisX - x * axisY };
    });
    if (rows.some(row => Math.abs(row.orthogonal) > 2.5)) return null;

    // Compare with a linear lead through the same latest sample.
    let tt = 0, tz = 0;
    for (const { t, z } of rows) {
      tt += t * t;
      tz += t * z;
    }
    const slope = tz / tt;
    const lineError = rows.reduce((error, { t, z }) => error + (z - slope * t) ** 2, 0);
    if (lineError / count < 2.1) return null;

    let best = null;
    for (let omega = .75; omega <= 6; omega += .25) {
      const terms = rows.map(({ t, z }) => [Math.cos(omega * t) - 1, Math.sin(omega * t), z]);
      let cc = 0, cs = 0, ss = 0, cz = 0, sz = 0;
      for (const [cos, sin, z] of terms) {
        cc += cos * cos;
        cs += cos * sin;
        ss += sin * sin;
        cz += cos * z;
        sz += sin * z;
      }
      const determinant = cc * ss - cs * cs;
      if (determinant < 1e-9) continue;
      const a = (cz * ss - sz * cs) / determinant;
      const b = (sz * cc - cz * cs) / determinant;
      const amplitude = Math.hypot(a, b);
      if (amplitude < 10 || amplitude > 240 || amplitude * omega > 700) continue;

      let error = 0, peakError = 0;
      for (const [cos, sin, z] of terms) {
        const residual = Math.abs(z - a * cos - b * sin);
        error += residual * residual;
        peakError = Math.max(peakError, residual);
      }
      if (peakError > 3.25 || error / count > 1.9 ** 2 || error > lineError * .24) continue;
      // When several fits explain the observations, penalize wide swings.
      const score = error / count + .1 * (amplitude / 110) ** 2;
      if (!best || score < best.score) best = { a, b, omega, amplitude, error, score };
    }
    if (!best) return null;

    // Two straight legs with an observed change can mimic a partial wave.
    // Prefer the latest leg when this explains the history much better.
    const observed = rows.concat({ t: 0, z: 0 });
    for (let split = 3; split + 3 <= observed.length; split++) {
      const legsError = segmentError(observed, 0, split) + segmentError(observed, split, observed.length);
      if (legsError < best.error * .6) return null;
    }
    const { a, b, omega, amplitude } = best;
    return {
      name: 'strafe', speed: amplitude * omega,
      vx: axisX * b * omega, vy: axisY * b * omega,
      offset(t) {
        const distance = a * (Math.cos(omega * t) - 1) + b * Math.sin(omega * t);
        return { x: axisX * distance, y: axisY * distance };
      },
    };
  }
  // Fit forward drift plus one oscillating axis. Subtract the projection
  // onto time before solving for the sine and cosine coefficients.
  function fitDriftingStrafe(samples) {
    if (samples.length < 10) return null;
    const last = samples.at(-1);
    const previous = samples.at(-2);
    const span = (last.at - samples[0].at) / 1000;
    if (span < .65 || (last.x === previous.x && last.y === previous.y)) return null;
    const rows = samples.slice(0, -1).map(point => ({
      t: (point.at - last.at) / 1000, x: point.x - last.x, y: point.y - last.y,
    }));
    const tt = rows.reduce((sum, row) => sum + row.t ** 2, 0);
    const slopeX = rows.reduce((sum, row) => sum + row.t * row.x, 0) / tt;
    const slopeY = rows.reduce((sum, row) => sum + row.t * row.y, 0) / tt;
    const straightError = rows.reduce((sum, { t, x, y }) => sum + (x - slopeX * t) ** 2 + (y - slopeY * t) ** 2, 0);
    if (straightError < rows.length * 9) return null;

    let best = null;
    for (let omega = 2; omega <= 9; omega += .25) {
      if (omega * span < 4) continue;
      const basis = rows.map(({ t }) => ({ c: Math.cos(omega * t) - 1, s: Math.sin(omega * t) }));
      const slopeC = basis.reduce((sum, { c }, i) => sum + c * rows[i].t, 0) / tt;
      const slopeS = basis.reduce((sum, { s }, i) => sum + s * rows[i].t, 0) / tt;
      let cc = 0, cs = 0, ss = 0, cx = 0, sx = 0, cy = 0, sy = 0;
      for (let i = 0; i < rows.length; i++) {
        const { t, x, y } = rows[i];
        const c = basis[i].c - slopeC * t, s = basis[i].s - slopeS * t;
        cc += c * c; cs += c * s; ss += s * s;
        cx += c * x; sx += s * x; cy += c * y; sy += s * y;
      }
      const determinant = cc * ss - cs * cs;
      if (determinant <= 1e-6) continue;
      const ax = (cx * ss - sx * cs) / determinant, ay = (cy * ss - sy * cs) / determinant;
      const bx = (sx * cc - cx * cs) / determinant, by = (sy * cc - cy * cs) / determinant;

      const radiusA = Math.hypot(ax, ay), radiusB = Math.hypot(bx, by);
      const amplitude = Math.hypot(radiusA, radiusB);
      // A transverse strafe has a single oscillation axis. For instance,
      // an orbit has two distinct axes and should stay in the circle model.
      if (amplitude < 12 || amplitude * omega > 700 ||
          Math.abs(ax * by - ay * bx) > amplitude * 1.8) continue;
      const driftX = slopeX - slopeC * ax - slopeS * bx;
      const driftY = slopeY - slopeC * ay - slopeS * by;
      const [axisX, axisY] = radiusA > radiusB ? [ax / radiusA, ay / radiusA] : [bx / radiusB, by / radiusB];
      const transverseDrift = Math.abs(driftX * axisY - driftY * axisX);
      if (transverseDrift < 20 || Math.hypot(driftX, driftY) > 600) continue;

      let error = 0, peakError = 0;
      for (let i = 0; i < rows.length; i++) {
        const { t, x, y } = rows[i], { c, s } = basis[i];
        const residual = Math.hypot(x - driftX * t - ax * c - bx * s, y - driftY * t - ay * c - by * s);
        error += residual ** 2;
        peakError = Math.max(peakError, residual);
      }
      if (peakError > 4 || error > Math.min(4 * rows.length, .15 * straightError)) continue;
      if (!best || error < best.error) best = { ax, ay, bx, by, omega, driftX, driftY, amplitude, error };
    }
    if (!best) return null;
    const { ax, ay, bx, by, omega, driftX, driftY, amplitude } = best;
    return {
      name: 'drifting-strafe',
      speed: Math.hypot(driftX, driftY) + amplitude * omega,
      vx: driftX + bx * omega, vy: driftY + by * omega,
      offset(t) {
        const c = Math.cos(omega * t) - 1, s = Math.sin(omega * t);
        return { x: driftX * t + ax * c + bx * s, y: driftY * t + ay * c + by * s };
      },
    };
  }
  function strafe(key, motion) {
    if (motion.curve) return null;
    const track = tracks.get(key);
    if (track.strafe === undefined) {
      const samples = track.timedSamples ??= sampleTimes(track.samples);
      track.strafe = fitStrafe(samples) ?? fitDriftingStrafe(samples);
    }
    return track.strafe;
  }
  function track(key,x,y,active,meta={}) {
    if(!active){tracks.delete(key);return;}
    if(!Number.isFinite(x)||!Number.isFinite(y))return;
    const at=clock();let t=tracks.get(key),last=t?.samples.at(-1);
    if(!t || at<last.at || at-last.at>maxGap || meta.generation!==undefined&&t.generation!==undefined&&meta.generation!==t.generation){
      t={samples:[],weapon:-1,generation:meta.generation};tracks.set(key,t);last=null;
    }
    if(last && (Math.hypot(x-last.x,y-last.y)>200 || at-last.at>=8&&Math.hypot(x-last.x,y-last.y)/(at-last.at)*1000>maxSpeed)){t.samples=[];last=null;t.curve=null;}
    if(meta.weapon!==undefined)t.weapon=meta.weapon;
    if(meta.generation!==undefined)t.generation=meta.generation;
    const newObservation=!last||at-t.observationAt>=8;
    if(!newObservation)t.samples[t.samples.length-1]={x,y,at};
    else {t.samples.push({x,y,at});t.observationAt=at;}
    while(t.samples.length>maxObservations||t.samples.length>2&&at-t.samples[0].at>maxHistory+1e-6)t.samples.shift();
    t.timedSamples=undefined;
    const window=t.samples.slice(-8).filter(p=>at-p.at<=circleHistory+1e-6);
    const curve=circle(window),before=t.curve;
    t.strafe=undefined;
    // Coalesced packets refine one observation; they cannot confirm a new window.
    if(curve){curve.streak=before&&before.omega*curve.omega>0&&Math.abs(before.radius-curve.radius)<.15*curve.radius&&Math.hypot(before.cx-curve.cx,before.cy-curve.cy)<Math.max(8,.15*curve.radius)?before.streak+(newObservation?1:0):1;}
    t.curve=curve;
  }
  function motion(key,at=clock()) {
    const t=tracks.get(key),last=t?.samples.at(-1);
    if(!last || at<last.at || at-last.at>maxAge)return null;
    const s=t.timedSamples ??= sampleTimes(t.samples);let vx=0,vy=0;
    if(s.length>1){
      const p=s.at(-2),dt=(last.at-p.at)/1000;
      if(dt>0){
        const dx=last.x-p.x,dy=last.y-p.y;
        // A stop or turn should not drag an older velocity into the next shot.
        let first=Math.max(0,s.length-4);
        // Retain the latest uninterrupted leg. Checking only the newest pair
        // let pre-turn samples back into the fit one packet after a turn.
        for(let i=s.length-2;i>first;i--){
          const a=s[i-1],b=s[i],c=s[i+1],ax=b.x-a.x,ay=b.y-a.y,bx=c.x-b.x,by=c.y-b.y;
          if(ax*bx+ay*by<=0 || Math.abs(ax*by-ay*bx)>.5*Math.hypot(ax,ay)*Math.hypot(bx,by)){first=i;break;}
        }
        if(dx!==0||dy!==0){
          let st=0,sx=0,sy=0,stt=0,stx=0,sty=0,n=0;
          for(let i=first;i<s.length;i++){const p=s[i],t=(p.at-last.at)/1000;st+=t;sx+=p.x;sy+=p.y;stt+=t*t;stx+=t*p.x;sty+=t*p.y;n++;}
          const d=n*stt-st*st;
          if(d>1e-10){vx=(n*stx-st*sx)/d;vy=(n*sty-st*sy)/d;}
        }
      }
    }
    const curve=t.curve?.streak>=2?t.curve:null;
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
  function intercept(rx,ry,vx,vy,speed,muzzle=0,side=0) {
    if(![rx,ry,vx,vy,speed,muzzle,side].every(Number.isFinite)||speed<=0||muzzle<0)return null;
    return offsetIntercept(rx,ry,vx,vy,speed,muzzle,side);
  }
  function offsetIntercept(rx,ry,vx,vy,speed,muzzle,side) {
    if(![rx,ry,vx,vy,speed,muzzle,side].every(Number.isFinite)||speed<=0)return null;
    const c=rx*rx+ry*ry-muzzle*muzzle-side*side;if(c<=0)return 0;
    const a=vx*vx+vy*vy-speed*speed,b=2*(rx*vx+ry*vy-speed*muzzle);
    let roots;
    if(Math.abs(a)<1e-8*Math.max(speed*speed,1))roots=Math.abs(b)>1e-9?[-c/b]:[];
    else {const d=b*b-4*a*c;if(d<0)return null;const q=-.5*(b+(b>=0?1:-1)*Math.sqrt(d));roots=q===0?[-b/(2*a)]:[q/a,c/q];}
    const positive=roots.filter(t=>Number.isFinite(t)&&t>=0);return positive.length?Math.min(...positive):null;
  }
  function nonlinearFlight(gap, speed, targetSpeed, limit, radialMinimum=speed) {
    let lo=0, remaining=gap(0);
    if (remaining<=0) return 0;
    if (radialMinimum>=targetSpeed) {
      // The expanding reach of the bullet overtakes every position along
      // the predicted path at most once when the gap can only decrease.
      let hi=limit;
      if (gap(hi)>0) return null;
      for (let i=0;i<32;i++) {
        const mid=(lo+hi)/2;
        if (gap(mid)>0) lo=mid; else hi=mid;
      }
      return hi;
    }
    // A slower bullet may have more than one intercept. Advance only as
    // far as the maximum rate of approach permits, so an earlier crossing
    // cannot be skipped by a coarse scan or a tangent extrapolation.
    const maxClosingSpeed=speed+targetSpeed;
    for (let i=0;i<512;i++) {
      if (remaining<=.005) return lo;
      if (lo>=limit) return null;
      lo=Math.min(limit,lo+remaining/maxClosingSpeed);
      remaining=gap(lo);
    }
    return null;
  }
  function resolve(selfKey,targetKey,profile={}) {
    const now=clock(),self=motion(selfKey,now),target=motion(targetKey,now);
    if(!self||!target)return {valid:false,status:'stale-position'};
    const timing=settings.VideoAimEnabled?timingInfo():null;
    const delay=timing?timing.totalDelayMs/1000:(settings.predictionLatencyMs||0)/1000;
    const selfStrafe=strafe(selfKey,self), targetStrafe=strafe(targetKey,target);
    function future(m,model,t) {
      if (model) {
        const offset = model.offset(t);
        return { x: m.x + offset.x, y: m.y + offset.y };
      }
      if (m.curve) {
        const c=m.curve,a=c.angle+c.omega*t;
        return {x:c.cx+c.radius*Math.cos(a),y:c.cy+c.radius*Math.sin(a)};
      }
      return {x:m.x+m.vx*t,y:m.y+m.vy*t};
    }
    const origin=future(self,selfStrafe,self.age+delay),ox=origin.x,oy=origin.y;
    const position=t=>future(target,targetStrafe,target.age+delay+t);
    const initial=position(0),distance=Math.hypot(initial.x-ox,initial.y-oy);
    const model=speedFor(self.weapon,profile),muzzle=profile.forward??profile.muzzle??0,side=profile.side??0;
    const motionModel=target.curve?'circle':targetStrafe?.name??'linear';
    const unavailable={valid:false,status:'unreachable',distance,...model};
    if(!Number.isFinite(model.speed)||model.speed<=0||!Number.isFinite(muzzle)||profile.forward===undefined&&muzzle<0||!Number.isFinite(side))return unavailable;
    const limit=Math.min(3,profile.range>0?profile.range/model.speed:3);
    const exactFlight=()=>{
      if(motionModel==='linear')return offsetIntercept(initial.x-ox,initial.y-oy,target.vx,target.vy,model.speed,muzzle,side);
      const speedBound=targetStrafe?.speed??Math.hypot(target.vx,target.vy);
      const gap=t=>{
        const p=position(t);
        return Math.hypot(p.x-ox,p.y-oy)-Math.hypot(model.speed*t+muzzle,side);
      };
      const radialMinimum=side===0?model.speed:model.speed*muzzle/Math.hypot(muzzle,side);
      return nonlinearFlight(gap,model.speed,speedBound,limit,radialMinimum);
    };
    let flight,iterations=0,exactFallback=false;
    if(timing){
      // Start with stationary-target flight time, then refine the predicted
      // point. A bounded Newton step avoids unbounded fixed-point oscillation.
      let candidate=Math.max(0,(distance-muzzle)/model.speed);
      const gap=(t)=>{const p=position(t);return Math.hypot(p.x-ox,p.y-oy)-Math.hypot(model.speed*t+muzzle,side);};
      const speedBound=targetStrafe?.speed??Math.hypot(target.vx,target.vy);
      const radialMinimum=side===0?model.speed:model.speed*muzzle/Math.hypot(muzzle,side);
      if(speedBound<(motionModel==='linear'?model.speed:radialMinimum)&&candidate<=limit){
        for(let step=1;step<=timing.aimSteps;step++){
          iterations++;
          const residual=gap(candidate),h=.0001;
          const lo=Math.max(0,candidate-h),hi=candidate+h;
          const derivative=(gap(hi)-gap(lo))/(hi-lo);
          if(!Number.isFinite(derivative)||derivative>=-1e-6)break;
          const next=candidate-residual/derivative;
          if(!Number.isFinite(next)||next<0||next>limit)break;
          candidate=next;
        }
        // A tiny residual certifies accuracy on the predicted path, not a
        // server hit. Fall back to the existing solver for ambiguous roots.
        flight=Math.abs(gap(candidate))<=.01?candidate:null;
      }else flight=null;
      if(flight===null){exactFallback=true;flight=exactFlight();}
    }else flight=exactFlight();
    if(flight===null || flight>limit)return unavailable;
    const {x,y}=position(flight),radians=Math.atan2(y-oy,x-ox)-Math.atan2(side,model.speed*flight+muzzle),angle=radians*180/Math.PI;
    // A lateral hand offset changes both the launch point and the direction.
    // Keep the legacy origin convention unless the new side profile is used.
    const launch=profile.side===undefined&&profile.forward===undefined?{x:ox,y:oy}:{x:ox+Math.cos(radians)*muzzle-Math.sin(radians)*side,y:oy+Math.sin(radians)*muzzle+Math.cos(radians)*side};
    const velocity=(m,strafe)=>({x:strafe?.vx??m.vx,y:strafe?.vy??m.vy});
    return {valid:true,status:'tracking',angle,x,y,ox:launch.x,oy:launch.y,distance,flight,motionModel,...model,
      selfVelocity:velocity(self,selfStrafe),targetVelocity:velocity(target,targetStrafe),...(timing?{video:{...timing,iterations,exactFallback}}:{})};
  }
  return {track,motion,projectile,speedFor,resolve,intercept,sampleRtt,timingInfo,resetTiming(){rttSamples.length=0;},reset(){tracks.clear();projectiles.clear();rttSamples.length=0;}};
}

