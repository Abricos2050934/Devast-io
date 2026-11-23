function automate(now) {
    const me = B.world.ᴑᴏᏧ;
    if (!B.synchronizedRender && MOD.FAutoLootEnabled) scanFastLoot(now);
    if (MOD.SAutoLootEnabled && !MOD.FAutoLootEnabled && now - lastLoot >= 200 && automationReady('loot')) {
      lastLoot = now;
      const loot = records.filter(r => r.type === B.categories.loot && (r.e.x - me.x) ** 2 + (r.e.y - me.y) ** 2 < 50000 && lootAllowed(r.e));
      loot.sort((a, b) => (a.e.x - me.x) ** 2 + (a.e.y - me.y) ** 2 - ((b.e.x - me.x) ** 2 + (b.e.y - me.y) ** 2));
      for (const {e} of loot.slice(0, 1)) if(__send([12,e.id]))recordPickupRequest(e);
    }
    if (MOD.AutoTakeEnabled && Aimbot.mouseDown && me.ⲣ٣༨ === 1 && now - lastTake >= 200 && automationReady('take')) {
      const slots = me.ﾠܐࡅ, count = me.ᴎࠁᴘ;
      if (Array.isArray(slots) && Number.isInteger(count)) {
        const slot = slots.findIndex((item,index)=>index < count && Array.isArray(item) && Number.isFinite(item[0]) && item[0] > 0);
        if (slot >= 0) __send([27, slot]);
      }
      lastTake = now;
    }
    if (MOD.AntiKickEnabled && now - lastKeepAlive >= 7000 && automationReady('keepAlive')) {
      __send([0]);
      lastKeepAlive = now;
    }
    updateChat(now);
  }