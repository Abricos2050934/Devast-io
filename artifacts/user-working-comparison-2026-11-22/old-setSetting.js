function setSetting(key, value) {
    if (stopped) throw new Error('Mod has been disposed');
    validateSetting(key,value);
    // dat.GUI writes MOD before onChange, so compare the last applied value.
    if(Object.prototype.hasOwnProperty.call(appliedToggles,key)){
      if(appliedToggles[key]!==value)lastSentAngle=null;
      appliedToggles[key]=value;
    }
    if (keySettings.includes(key)) {
      const conflict = value==='NoKey'?null:keySettings.find(other=>other!==key && MOD[other]===value);
      if (conflict) MOD[conflict] = MOD[key];
    }
    MOD[key] = value;
    if(key==='AdaptiveAimEnabled'){lastAdaptiveDirection=-Infinity;lastAdaptiveTarget=null;}
    if(key==='JitterEnabled'&&!value)stopJitter();
    if (key === 'NicknameColor') {
      for (let id=1;id<B.world.ᴎ̣︂.length;id++) {
        const meta=playerMeta(id);
        if (meta && typeof meta === 'object') preparePlayerLabel(meta,id);
      }
    }
    if (key === 'PlayersListEnabled' && !value && playerListPanel) playerListPanel.style.display = 'none';
    if (key === 'SpamChatEnabled') {
      chatState.status = value ? 'Waiting for game' : 'Off';
      if (value) {
        lastChat = -Infinity;
        nextChatAt = -Infinity;
      }
    }
    if (key === 'SAutoLootEnabled' && value) MOD.FAutoLootEnabled = false;
    if (key === 'FAutoLootEnabled' && value) MOD.SAutoLootEnabled = false;
    if(trafficKeys.some(name=>trafficSettings[name]!==MOD[name])){
      for(const name of trafficKeys)trafficSettings[name]=MOD[name];
      trafficChanges.push({at:Math.round(performance.now()),settings:{...trafficSettings}});
      if(trafficChanges.length>64){trafficChanges.shift();trafficDiscardedChanges++;}
    }
    persist();
    if (menu) menu.updateDisplay();
  }