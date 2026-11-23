function observeSocket(socket) {
    if (socket !== connectionSocket) {
      lastSentAngle = null;
      if (socket && reconnect.phase === 'connecting') reconnect.deadline = performance.now() + 12000;
    }
    removeSocketObservers();
    connectionSocket = socket;
    socketTrace=socket?{id:++socketSerial,openedAt:socket.readyState===1?performance.now():null,lastReceiveAt:null,receivedMessages:0,lastSendAt:null,sentMessages:0,sentBytes:0,localCloseSource:null}:null;
    const observedTrace=socketTrace;
    if (typeof socket?.addEventListener !== 'function') return;
    const handlers = {
      open:() => {if(!stopped&&socket===connectionSocket)socketTrace.openedAt=performance.now();},
      message:() => {if(!stopped&&socket===connectionSocket){socketTrace.lastReceiveAt=performance.now();socketTrace.receivedMessages++;}},
      close:event => { if (!stopped && observedTrace === socketTrace) connectionEvent('socket-close',
        {code:Number.isInteger(event.code) ? event.code : null,clean:event.wasClean === true,localCloseObserved:socketTrace.localCloseSource!==null}); },
      error:() => { if (!stopped && socket === connectionSocket) connectionEvent('socket-error'); }
    };
    for (const [name,handler] of Object.entries(handlers)) socket.addEventListener(name,handler);
    removeSocketObservers = () => {
      for (const [name,handler] of Object.entries(handlers)) socket.removeEventListener?.(name,handler);
    };
  }