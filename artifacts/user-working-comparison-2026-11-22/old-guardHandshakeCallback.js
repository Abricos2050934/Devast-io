function guardHandshakeCallback(url, callback) {
    if (!nativeLoginDepth || typeof callback !== 'function') return callback;
    const generation = reconnect.generation;
    callbackTraffic.wrapped++;
    // Gate the native HTTP response before it can overwrite the current
    // connection's cryptographic state, not only its final start callback.
    return function (...args) {
      if(stopped){callbackTraffic.rejectedAfterDispose++;return;}
      // Native entry can finish before the next frame retires this generation.
      const connected = (B.network.state & 1) !== 0;
      if(generation!==reconnect.generation || connected){
        callbackTraffic.rejectedStale++;
        if(connected)callbackTraffic.rejectedWhileConnected++;
        return;
      }
      callbackTraffic.accepted++;
      // Native preflight can issue its next HTTP round from this callback.
      // Carry ownership into that round before the original stack returns.
      nativeLoginDepth++;
      try { return callback.apply(this,args); } finally { nativeLoginDepth--; }
    };
  }