function watchConnectionHandlers() {
    const n = B.network;
    for (const [key,kind] of [[B.loginKey,'login'],[B.restoreFailureKey,'restoreFailure'],[B.preflightKey,'preflight'],[B.errorKey,'error']]) {
      if (!key || typeof n[key] !== 'function' || n[key] === connectionWrappers.get(key)) continue;
      const original = n[key];
      originals[key] = original;
      const wrapper = kind === 'preflight' ? function (...args) {
        if (!nativeLoginDepth) return original.apply(this,args);
        for(const index of [1,2])if(typeof args[index]==='function')args[index]=guardHandshakeCallback(args[0],args[index]);
        return original.apply(this,args);
      } : kind === 'error' ? function (...args) {
        if (!stopped) {
          reconnect.lastFailureCode = Number.isInteger(args[0]) ? args[0] : (Number.isInteger(n.state)?n.state:0);
          connectionEvent('native-network-error',{failureCode:reconnect.lastFailureCode});
          reconnect.pending = false;
          reconnect.phase = reconnect.awaitingPlay?'dead':'idle';
          reconnect.generation++;
          releaseNativePending();
          reconnect.status = reconnect.awaitingPlay?'Персонаж погиб; нажмите Play для нового входа с прежним токеном':'Игра не завершила вход; можно повторить без сброса cookies';
          // The native close handler can replace this rejection with restore
          // state 64. Keep the rejection latched until an explicit Play.
          if((reconnect.lastFailureCode&(8|16|512|1024))!==0){
            reconnect.armed=false;
            reconnect.autoBlocked=true;
            reconnect.next=0;
            reconnect.status='Соединение завершено игрой; нажмите Play для входа';
          }
        }
        return original.apply(this,args);
      } : kind === 'restoreFailure' ? function (...args) {
        const result = original.apply(this,args);
        if (!stopped) markRestoreFailure();
        return result;
      } : function (...args) {
        if (stopped) return original.apply(this,args);
        const now = performance.now();
        if (n.state === 1 || (n.state & 2) !== 0 || reconnect.pending && reconnect.phase === 'joining' && now < reconnect.deadline) return;
        if (!automaticJoin) {
          reconnect.generation++;
          reconnect.pending = false;
          reconnect.attempts = 0;
          reconnect.refreshFailures=0;
          reconnect.next = 0;
          reconnect.autoBlocked = false;
          reconnect.freshUsed = false;
          reconnect.armed = true;
        }
        reconnect.awaitingPlay=false;
        if (n.state === 256 || reconnect.sessionEnded) reconnect.freshRequired = true;
        prepareNormalJoin();
        reconnect.pending = true;
        reconnect.phase = 'joining';
        reconnect.deadline = now + 12000;
        reconnect.status = 'Connecting; saved login kept';
        nativeLoginDepth++;
        try { return original.apply(this,args); }
        catch (error) {
          reconnect.pending = false;
          reconnect.phase = 'idle';
          reconnect.generation++;
          releaseNativePending();
          reconnect.status = 'Не удалось начать вход; повторите Play без сброса cookies';
          throw error;
        }
        finally { nativeLoginDepth--; }
      };
      connectionWrappers.set(key,wrapper);
      n[key] = wrapper;
    }
  }