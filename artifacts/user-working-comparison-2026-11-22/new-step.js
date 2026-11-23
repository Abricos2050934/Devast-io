function step(now = performance.now()) {
    if (stopped) return;
    diagnostics.frames++;
    updateReconnect(now);
    if (!playing()) {
      lastSentAngle = null;
      Aimbot.mouseDown = false;
      if (previousPlayer) {
        previousPlayer = 0;
        records.length = 0;
        playerRecords.length = 0;
        _players_list.length = 0;
      }
      chatState.status = MOD.SpamChatEnabled ? 'Waiting for game' : 'Off';
      draw();
      return;
    }
    if (previousPlayer !== B.world.ᴑᴏᏧ.id) {
      lastSentAngle = null;
      previousPlayer = B.world.ᴑᴏᏧ.id;
      lastLoot = lastTake = now;
      lastChat = nextChatAt = -Infinity;
      lastKeepAlive = now;
    }
    if(!MOD.AntiAimbot)restoreNativeMovement();
    if (!B.synchronizedRender) {
      autoBuildFrame(now);
      records = collect();
      updateTargets();
      updateMouse();
    }
    updateJitter(now);
    automate(now);
    if (!B.synchronizedRender) draw();
  }