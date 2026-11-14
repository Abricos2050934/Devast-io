// The real native preflight stage and its original failure callback run against
// held HTTP responses and a fixture socket; no game-server connection is opened.
function verifyNativePreflightErrors(m,n,s){
 const check=(v,t)=>{if(!v)throw Error(t);},key=s['ᅠϲ᠍'],original=n.network[key],oldPerformance=performance.now;
 const identity=['token','tokenId','userId','accountToken'].map(k=>localStorage.getItem(k));
 let clock=performance.now(),closes=0,restoreSocket;
 const snapshot=m.connectionInfo().connectionCallbacks;
 try{
  performance.now=()=>clock;window.__updateHeldPreflights=[];window.__holdNativePreflight=true;
  for(const name of ['AimBotEnabled','AimbotSpearEnabled','JitterEnabled','AntiAimbot','autoFire','FAutoLootEnabled','SAutoLootEnabled','AutoBuiledEnabled','AutoTakeEnabled','SpamChatEnabled','AntiKickEnabled'])m.settings[name]=false;
  n.network.state=0;m.reconnect.awaitingPlay=false;m.reconnect.sessionEnded=false;m.reconnect.pending=false;
  n.network[key]=()=>n.nativePreflightStage('https://audit.invalid/',()=>{});
  m.step(clock);n.network[key]();const first=window.__updateHeldPreflights[0];check(typeof first?.failure==='function','Actual native failure callback was not captured');
  clock+=12001;m.step(clock);clock+=1000;check(m.beginPlay(),'New manual attempt unavailable after old preflight timeout');n.network[key]();check(window.__updateHeldPreflights.length===2,'Fixture did not create two real native preflight stages');
  const socket={readyState:1,bufferedAmount:0,close(){closes++;this.readyState=3;}};
  restoreSocket=n.setNativePreflightSocket(socket);m.observeSocket(socket);n.world[s['ᅠᏧ‍']].id=1;n.network.state=1;m.step(++clock);
  const rejected=m.connectionInfo().connectionCallbacks.rejectedWhileConnected;first.failure();
  check(closes===0&&socket.readyState===1&&n.network.state===1,'Late native error closed the newer active connection');
  check(m.connectionInfo().connectionCallbacks.rejectedWhileConnected===rejected+1,'Late failure was not rejected by its request generation');
  // A current attempt must still execute the same native failure callback.
  n.network.state=0;m.reconnect.pending=false;m.reconnect.phase='idle';n.network[key]();const current=window.__updateHeldPreflights.at(-1);socket.readyState=0;current.failure();
  check(closes===1&&socket.readyState===3&&n.network.state===64,'Current native failure was suppressed');
  check(['token','tokenId','userId','accountToken'].every((k,i)=>localStorage.getItem(k)===identity[i]),'Preflight error ownership changed saved identity');
  return {status:'passed',scope:'actual native failure callback; held HTTP replies and fixture socket; no live server',native_stages:window.__updateHeldPreflights.length,late_failure_close_calls:0,live_connection_preserved:true,current_failure_close_calls:closes,stale_error_rejected:true,saved_identity_unchanged:true,features_disabled:true,callbacks_before:snapshot,callbacks_after:m.connectionInfo().connectionCallbacks};
 }finally{window.__holdNativePreflight=false;window.__updateHeldPreflights=[];restoreSocket?.();n.network[key]=original;performance.now=oldPerformance;m.observeSocket(null);}
}
module.exports={verifyNativePreflightErrors};
