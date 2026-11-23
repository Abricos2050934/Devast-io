function connectionEvent(type, details = {}) {
    const now=performance.now();
    const health = B.health?.();
    const event={type,at:Math.round(now),state:B.network.state,
      integrityFlag:typeof B.integrity?.()==='number'?B.integrity():null,
      aim:MOD.AimBotEnabled,adaptiveAim:MOD.AdaptiveAimEnabled,jitter:MOD.JitterEnabled,strafe:MOD.AntiAimbot,autoFire:MOD.autoFire,
      spear:MOD.AimbotSpearEnabled,hidePlayerAngle:MOD.hidePlayerAngle,hideAimbotAngle:MOD.hideAimbotAngle,
      autoBuild:MOD.AutoBuiledEnabled,fastLoot:MOD.FAutoLootEnabled,slowLoot:MOD.SAutoLootEnabled,autoTake:MOD.AutoTakeEnabled,spamChat:MOD.SpamChatEnabled,
      socketState:connectionSocket?.readyState??null,socketBufferedBytes:Number.isFinite(connectionSocket?.bufferedAmount)?connectionSocket.bufferedAmount:null,
      transport:socketTraffic(now),pageHidden:!!document.hidden,
      frameGapMs:previousAnimationFrame===null?null:Math.max(0,Math.round(now-previousAnimationFrame)),
      health:Number.isFinite(health) ? health : null,commandsInLast2s:combatCommands(),...details};
    if(['server-death','socket-close','native-network-error'].includes(type)){
      const recent=pickupRequests.filter(entry=>entry.socket===event.transport?.id&&event.at-entry.at>=0&&event.at-entry.at<10000).slice(-32);
      if(recent.length)event.pickupRequestsBeforeEnd=recent.map(entry=>({...entry}));
    }
    connectionEvents.push(event);
    if(type==='server-death'&&firstServerDeath===null)firstServerDeath=event;
    if(firstConnectionEnd===null&&event.transport?.receivedMessages>0&&(type==='server-death'||type==='socket-close'||type==='native-network-error'&&event.failureCode>0))firstConnectionEnd=event;
    if (connectionEvents.length > 12) connectionEvents.shift();
  }