function persist() {
    refreshLootFilter();
    lastFastLoot=-Infinity;
    const saved = {};
    for (const key of Object.keys(defaults)) if (!transient.has(key)) saved[key] = MOD[key];
    try {
      localStorage.setItem(AIM_SAVE,JSON.stringify(Object.fromEntries(aimKeys.map(key=>[key,MOD[key]]))));
      // Preserve earlier engine settings for rollback; this engine has its own key.
      const previousAim=JSON.parse(localStorage.getItem(SAVE)||'{}');
      for(const key of aimKeys){if(Object.hasOwn(previousAim,key))saved[key]=previousAim[key];else delete saved[key];}
      localStorage.setItem(SAVE, JSON.stringify(saved));
      localStorage.setItem(SAVE + ':ilm2', '1');
      localStorage.setItem(SAVE + ':loot', JSON.stringify(Object.fromEntries(Object.entries(LootData).map(([k, v]) => [k, v.acquire]))));
    } catch (_) {}
  }