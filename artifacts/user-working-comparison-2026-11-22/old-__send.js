function __send(value, forceAngle = false, sourceAngle = false) {
    if (!playing()) return false;
    const packet = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(packet) || packet.length === 0 || packet.some(x => typeof x !== 'number' || !Number.isFinite(x))) return false;
    if (packet[0] === 6) {
      if (packet.length !== 2) return false;
      packet[1] = normalizeAimAngle(sourceAngle?packet[1]:Math.round(packet[1]));
      if (!forceAngle && packet[1] === lastSentAngle && lastSentPlayer === B.world.ᴑᴏᏧ.id) {
        diagnostics.deduplicatedAngles++;
        return true;
      }
    }
    if([2,4,5,6].includes(packet[0])&&typeof B.aimSend==='function')B.aimSend(packet.slice());
    else originalSender(JSON.stringify(packet));
    if ([4,5,6].includes(packet[0])) {
      recentCombatCommands.push({at:performance.now(),op:packet[0]});
      if (recentCombatCommands.length > 180) recentCombatCommands.shift();
    }
    if (packet[0] === 6) {lastSentAngle = packet[1];lastSentPlayer = B.world.ᴑᴏᏧ.id;automaticDirection=sourceAngle||jitter.spinning;}
    recordCommand(packet[0]);
    return true;
  }