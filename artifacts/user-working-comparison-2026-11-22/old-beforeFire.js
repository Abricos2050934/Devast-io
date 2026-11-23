function beforeFire(){
    if(!playing()||reconnect.sessionEnded||Aimbot.dead)return false;
    if(!MOD.JitterEnabled&&!gunAimActive()&&!automaticDirection)return true;
    jitter.fireUntil=performance.now()+150;stopJitter();
    if(!automationReady('aim'))return false;
    if(gunAimActive()){
      const angle=MOD.AimbotSpearEnabled&&GetAllTargets.selfWeapon===5?Aimbot.spearResolve():Aimbot.resolve();
      if(!invalidAimState())return __send([6,angle],true,true);
    }
    // Target loss must not shoot along the last idle rotation or hidden angle.
    return Number.isFinite(B.input?.angle)?__send([6,B.input.angle*180/Math.PI],true):true;
  }