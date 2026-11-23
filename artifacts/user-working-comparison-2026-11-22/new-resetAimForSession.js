function resetAimForSession() {
    strafeOwnsMovement=false;
    lastSentAngle=null;automaticDirection=false;
    stopJitter();jitter.fireUntil=-Infinity;
    Aimbot.onDeath();
    Aimbot.targetPlayer=null;
    // A new handshake can finish before the source's next 50 ms id=0 tick.
    // Clear both entity histories before accepting positions from that session.
    for(const group of [GetAllTargets.players,GetAllTargets.ghouls])for(const target of group)if(target?.active)target.setInactive();
  }