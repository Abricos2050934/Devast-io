function connectionInfo() {
    function copyEvent(event) {
      const copy = {
        ...event,
        transport: event.transport ? { ...event.transport } : null,
        commandsInLast2s: { ...event.commandsInLast2s },
        browserFailures: { ...event.browserFailures },
      };
      if (event.pickupRequestsBeforeEnd) {
        copy.pickupRequestsBeforeEnd = event.pickupRequestsBeforeEnd.map(entry => ({ ...entry }));
      }
      return copy;
    }
    const stored = {};
    for (const key of ['token','tokenId','userId','accountToken']) {
      try { stored[key] = !!localStorage.getItem(key); } catch (_) { stored[key] = null; }
    }
    const build=typeof __devastClientBuild==='undefined'?null:{...__devastClientBuild};
    return {schema:3,recoveryVersion:5,auditBuild:'integrity-autoupdate-v1',build,integrityCompatibility:B.integrityPatched?.()===true,
      legacySettingsMigration:{...legacySettingsMigration},
      integrityFlag:typeof B.integrity?.()==='number'?B.integrity():null,state:B.network.state,phase:reconnect.phase,
      sessionEnded:reconnect.sessionEnded,awaitingPlay:reconnect.awaitingPlay,normalJoinRequired:reconnect.freshRequired,automaticRecoveryBlocked:reconnect.autoBlocked,
      nativeReady:typeof B.network[B.loginKey] === 'function',
      nativePending:B.pendingKey ? !!B.network[B.pendingKey] : false,
      adWaiting:!!B.adWaiting?.(),socketState:connectionSocket?.readyState ?? null,
      socketBufferedBytes:Number.isFinite(connectionSocket?.bufferedAmount)?connectionSocket.bufferedAmount:null,
      transport:socketTraffic(),
      nativeWireTraffic:wireTrafficInfo(),pickupRequests:pickupRequestInfo(),
      combatNow:combatCommands(),
      animationTiming:animationTiming(),
      modCommandsByOpcode:{...diagnostics.commandsByOpcode},
      automationSettings:{autoBuild:MOD.AutoBuiledEnabled,fastLoot:MOD.FAutoLootEnabled,slowLoot:MOD.SAutoLootEnabled,autoTake:MOD.AutoTakeEnabled,spamChat:MOD.SpamChatEnabled},
      automationTransport:{deferred:{...automationDeferrals},aimHighWaterBytes:AIM_BUFFER_HIGH_WATER},
      automationLimits:{fastLootIntervalMs:FAST_LOOT_INTERVAL,fastLootBurst:FAST_LOOT_BURST,autoBuildIntervalMs:AUTO_BUILD_INTERVAL},
      modTraffic:trafficInfo(),
      connectionCallbacks:{...callbackTraffic},
      aimTransport:{...aimTransport,nativeSenderAvailable:typeof B.aimSend==='function',sourceTickRateMs:50,deduplicatedDirections:diagnostics.deduplicatedAngles},
      aimSettings:{enabled:MOD.AimBotEnabled,spear:MOD.AimbotSpearEnabled,hidePlayerAngle:MOD.hidePlayerAngle,hideAimbotAngle:MOD.hideAimbotAngle,source:'message27-bby',adaptive:MOD.AdaptiveAimEnabled,jitter:MOD.JitterEnabled,jitterSpeed:MOD.JitterSpeed,strafe:MOD.AntiAimbot,autoFire:MOD.autoFire,target:MOD.target,lockId:MOD.lockId,distanceCoefficient:MOD.distanceCoefficient,offsetCoefficient:MOD.offsetCoefficient},
      lastFailureCode:reconnect.lastFailureCode,serverListRefreshFailures:reconnect.refreshFailures,gatewayRecoveries:reconnect.gatewayRecoveries,initialHomeRecoveries:reconnect.initialHomeRecoveries,
      stored,modErrorCount:diagnostics.errors.length,browserFailures:{...browserFailures},
      firstServerDeath:firstServerDeath?copyEvent(firstServerDeath):null,firstConnectionEnd:firstConnectionEnd?copyEvent(firstConnectionEnd):null,events:connectionEvents.map(copyEvent)};
  }