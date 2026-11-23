function observeDeath(packet, opcode=5) {
    if (stopped) return;
    const details = {};
    // Only the reviewed three-byte death prefix is safe to include. Never log
    // arbitrary server packets, login payloads or an unbounded response body.
    if (Number.isInteger(opcode) && opcode>=0 && opcode<=255 && ArrayBuffer.isView(packet) && packet.BYTES_PER_ELEMENT === 1 && packet.length >= 3 && packet[0] === opcode) {
      details.deathOpcode = opcode;
      details.deathPacketLength = packet.byteLength;
      details.deathPrefixHex = Array.from(packet.subarray(0,3),value=>value.toString(16).padStart(2,'0')).join(' ');
    }
    connectionEvent('server-death',details);
    strafeOwnsMovement=false;
    Aimbot.onDeath();
    // A confirmed death terminates the playable session. Socket close flags
    // must not turn it into a request to restore the dead character.
    reconnect.sessionEnded=true;
    reconnect.awaitingPlay=true;
    reconnect.generation++;
    reconnect.pending=false;
    reconnect.phase='dead';
    reconnect.next=0;
    reconnect.armed=false;
    reconnect.autoBlocked=true;
    reconnect.freshRequired=true;
    reconnect.freshUsed=false;
    releaseNativePending();
  }