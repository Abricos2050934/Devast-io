const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=__dirname;
const artifact='Unmodified official game JS'; const hash=null;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const started=Date.now(),elapsed=()=>Date.now()-started;
const report={schema:1,scope:'Control: unmodified official JS; live HTML, token service and game server; stationary observation; continue passive recording for 8 seconds after the death packet; no automatic rejoin after join; no page evaluation before the session ends',artifact,sha256:hash,joined:false,minutePassed:false,sockets:[],replacements:0,networkErrors:[],navigationAttempts:0};
let ws,sessionId,targetId,browserContextId,joinedAt=null,joinedSocket=null,observing=true,id=0,rootNodeId=0;
const pending=new Map(),handlers=new Map(),requests=new Map();
function say(value){console.log(JSON.stringify(value));}
function send(method,params={},session=sessionId){
 return new Promise((resolve,reject)=>{const request={id:++id,method,params};if(session)request.sessionId=session;pending.set(request.id,{resolve,reject});ws.send(JSON.stringify(request));});
}
function on(method,fn){if(!handlers.has(method))handlers.set(method,[]);handlers.get(method).push(fn);}
async function screenshot(name){const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(dir,name+'.png'),Buffer.from(r.data,'base64'));}
async function documentRoot(){if(!rootNodeId)rootNodeId=(await send('DOM.getDocument',{depth:1})).root.nodeId;return rootNodeId;}
async function node(selector){return (await send('DOM.querySelector',{nodeId:await documentRoot(),selector})).nodeId;}
async function attributes(nodeId){const a=(await send('DOM.getAttributes',{nodeId})).attributes;return Object.fromEntries(Array.from({length:a.length/2},(_,i)=>[a[2*i],a[2*i+1]]));}
async function focusReady(selector){for(let i=0;i<90;i++){try{await send('DOM.focus',{nodeId:await node(selector)});return;}catch{}await delay(1000);}throw Error('Native input remained hidden: '+selector);}
async function key(key,code,number,modifiers=0){for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key,code,windowsVirtualKeyCode:number,nativeVirtualKeyCode:number,modifiers});}
async function click(x,y){await send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,x,y});await delay(100);await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,x,y});}
async function play(){
 const m=await send('Page.getLayoutMetrics'),v=m.cssVisualViewport||m.visualViewport;
 report.viewport={width:v.clientWidth,height:v.clientHeight};
 const can=await node('#can'),box=(await send('DOM.getBoxModel',{nodeId:can})).model.content;
 const x=(box[0]+box[2])/2+4,y=(box[1]+box[5])/2-44;
 const hit=await send('DOM.getNodeForLocation',{x:Math.round(x),y:Math.round(y)});
 const info=(await send('DOM.describeNode',{backendNodeId:hit.backendNodeId})).node;
 const attrs=Object.fromEntries(Array.from({length:(info.attributes||[]).length/2},(_,i)=>[info.attributes[2*i],info.attributes[2*i+1]]));
 if(info.nodeName!=='CANVAS'||attrs.id!=='can'){say({event:'play-covered',node:info.nodeName});return false;}
 report.playCoordinates={x,y};await click(x,y);report.playClicks=(report.playClicks||0)+1;say({event:'play',at:elapsed(),clicks:report.playClicks});return true;
}
(async()=>{
 const browser=await (await fetch('http://127.0.0.1:9224/json/version')).json();
 ws=new WebSocket(browser.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 ws.onmessage=event=>{const data=JSON.parse(event.data);if(data.id){const p=pending.get(data.id);if(!p)return;pending.delete(data.id);data.error?p.reject(Error(data.error.message)):p.resolve(data.result);return;}if(data.sessionId!==sessionId)return;for(const h of handlers.get(data.method)||[])Promise.resolve(h(data.params)).catch(e=>{report.observerError=e.message;});};
 browserContextId=(await send('Target.createBrowserContext',{},null)).browserContextId;
 targetId=(await send('Target.createTarget',{url:'about:blank',browserContextId},null)).targetId;
 sessionId=(await send('Target.attachToTarget',{targetId,flatten:true},null)).sessionId;
 on('DOM.documentUpdated',()=>{rootNodeId=0;});
 on('Network.responseReceived',p=>{const u=new URL(p.response.url);if(u.hostname==='devast.io'&&u.pathname.startsWith('/js/')&&u.pathname.endsWith('.js'))report.officialJS={path:u.pathname,status:p.response.status,requestId:p.requestId};});
 on('Network.loadingFinished',async p=>{if(p.requestId!==report.officialJS?.requestId)return;const r=await send('Network.getResponseBody',{requestId:p.requestId});const b=Buffer.from(r.body,r.base64Encoded?'base64':'utf8');report.officialJS.sha256=crypto.createHash('sha256').update(b).digest('hex');report.officialJS.bytes=b.length;});
 on('Network.responseReceived',p=>{const u=new URL(p.response.url);if(p.type==='Document'&&u.hostname==='devast.io'&&u.pathname==='/')report.homeStatus=p.response.status;if(p.response.status>=400&&report.networkErrors.length<30)report.networkErrors.push({host:u.hostname,path:u.pathname,status:p.response.status});});
 on('Network.requestWillBeSent',p=>{const u=new URL(p.request.url);if(u.hostname.endsWith('devast.io'))requests.set(p.requestId,{host:u.hostname,type:p.type});});
 on('Network.loadingFailed',p=>{const r=requests.get(p.requestId);if(r&&p.type==='XHR'){report.nativeRequestFailures=report.nativeRequestFailures||[];report.nativeRequestFailures.push({...r,error:p.errorText,canceled:p.canceled,cors:p.corsErrorStatus});}});
 on('Network.webSocketCreated',p=>{const u=new URL(p.url);if(!u.hostname.endsWith('.devast.io'))return;report.sockets.push({requestId:p.requestId,host:u.hostname,createdAt:elapsed(),received:0,sent:0,closedAt:null,death:null,opcodes:{}});});
 on('Network.webSocketHandshakeResponseReceived',p=>{const x=report.sockets.find(s=>s.requestId===p.requestId);if(x)x.handshakeStatus=p.response.status;});
 on('Network.webSocketFrameError',p=>{const x=report.sockets.find(s=>s.requestId===p.requestId);if(x)x.frameErrorAt=elapsed();});
 on('Network.webSocketFrameSent',p=>{const s=report.sockets.find(s=>s.requestId===p.requestId);if(s&&observing)s.sent++;});
 on('Network.webSocketFrameReceived',p=>{const s=report.sockets.find(s=>s.requestId===p.requestId);if(!s||!observing)return;s.received++;s.lastReceiveAt=elapsed();if(p.response.opcode===8){const b=Buffer.from(p.response.payloadData,'base64');s.serverCloseFrame={at:elapsed(),code:b.length>=2?b.readUInt16BE(0):null};}if(p.response.opcode!==2)return;const b=Buffer.from(p.response.payloadData,'base64');if(!b.length)return;const op=b[0];s.opcodes[op]=(s.opcodes[op]||0)+1;if(op===52&&joinedAt===null){joinedAt=Date.now();joinedSocket=s;report.joined=true;report.playerId=b[1];say({event:'joined',host:s.host,at:elapsed(),playerId:b[1]});}if(op===27&&b.length>=3&&b.length<=5){s.death={at:elapsed(),prefix:b.subarray(0,3).toString('hex'),length:b.length};say({event:'server-death',at:elapsed(),afterJoin:joinedAt?(Date.now()-joinedAt)/1000:null});}});
 on('Network.webSocketClosed',p=>{const s=report.sockets.find(s=>s.requestId===p.requestId);if(s&&observing)s.closedAt=elapsed();});
 await send('Page.enable');await send('Network.enable');await send('DOM.enable');await send('Page.bringToFront');
 for(let attempt=0;attempt<4;attempt++){
  report.navigationAttempts++;report.homeStatus=null;
  await send('Page.navigate',{url:'https://devast.io/'});await delay(4000);
  if(report.homeStatus===200)break;say({event:'home-retry',status:report.homeStatus});if(attempt<3)await delay(15000);
 }
 if(report.homeStatus!==200)throw Error('Game home HTTP '+report.homeStatus);
 let nicknameNode,serverNode,options;
 for(let attempt=0;attempt<60;attempt++){
  try{nicknameNode=await node('#nicknameInput');serverNode=await node('#servers');if(nicknameNode&&serverNode){const html=(await send('DOM.getOuterHTML',{nodeId:serverNode})).outerHTML;options=[...html.matchAll(/<option\b([^>]*)>([^<]*)<\/option>/gi)].filter(m=>!/\bdisabled\b/i.test(m[1])).map(m=>m[2]);if(options.some(s=>/players/i.test(s)))break;}}catch{}
  await delay(1000);
 }
 if(!nicknameNode||!options?.some(s=>/players/i.test(s)))throw Error('The live server list is unavailable');
 report.optionCount=options.length;report.options=options;const chosenIndex=options.findIndex(s=>/^Frankfurt 1\s*-/.test(s.trim()));if(chosenIndex<0)throw Error('Frankfurt 1 is not listed');report.chosenLabel=options[chosenIndex];
 report.stage='nickname';nicknameNode=await node('#nicknameInput');await focusReady('#nicknameInput');await key('a','KeyA',65,2);await send('Input.insertText',{text:'Raven'+Math.floor(100+Math.random()*900)});
 report.stage='server-selection';serverNode=await node('#servers');await focusReady('#servers');await key('Home','Home',36);for(let i=0;i<chosenIndex;i++)await key('ArrowDown','ArrowDown',40);await key('Tab','Tab',9);await delay(500);
 report.stage='before-entry';await screenshot('before-entry');
 if(!await play())throw Error('The game Play button is covered');
 for(let second=0;second<125&&joinedAt===null;second++){
  if(second===45||second===90){try{const n=await node('#nicknameInput');const a=await attributes(n);if(!/visibility:\s*hidden|display:\s*none/.test(a.style||''))await play();}catch{}}
  await delay(1000);
 }
 if(joinedAt===null)throw Error('No playable server handshake arrived');
 await delay(1000);await screenshot('joined');
 for(let second=0;second<120;second++){
  if(joinedSocket.death||joinedSocket.closedAt!==null)break;


  await delay(1000);
  if(second%15===14)say({event:'observing',seconds:(Date.now()-joinedAt)/1000,received:joinedSocket.received,sent:joinedSocket.sent});
 }
 report.secondsUntilLoopEnd=(Date.now()-joinedAt)/1000;
 if(joinedSocket.death){report.postDeathObservationMs=8000;await delay(8000);}
 report.secondsAfterJoin=(Date.now()-joinedAt)/1000;
 await screenshot('final');
 // Read state only after the observation. No helper script was injected.
 const r=await send('Runtime.evaluate',{expression:'(()=>{const m=window.__devastMod;if(!m)return null;const i=m.connectionInfo();return {nativeRuntime:m.nativeRuntimeDiagnostics?.(),loaded:window.__devastClientLoaded===true,state:i.state,socketState:i.socketState,ended:i.sessionEnded,playerId:m.aim.myId(),active:m.targets.players[m.aim.myId()]?.active===true,settings:{automation:i.automationSettings,aim:i.aimSettings},modErrors:i.modErrorCount,integrityFlag:i.integrityFlag,callbacks:i.connectionCallbacks,events:i.events.map(e=>({type:e.type,code:e.code,health:e.health,flag:e.integrityFlag,source:e.transport?.localCloseSource}))};})()',returnByValue:true});
 report.final=r.result.value;
 report.minutePassed=report.secondsAfterJoin>=60&&!joinedSocket.death&&joinedSocket.closedAt===null&&report.replacements===0&&elapsed()-joinedSocket.lastReceiveAt<15000;
})().catch(async error=>{report.error=error.message;report.errorStack=error.stack;try{const r=await send('Runtime.evaluate',{expression:'(()=>{const m=window.__devastMod;if(!m)return {loaded:false};const i=m.connectionInfo();return {focused:document.hasFocus(),visible:document.visibilityState,loaded:true,state:i.state,phase:i.phase,socket:i.socketState,callbacks:i.connectionCallbacks,status:m.reconnect.status,adWaiting:i.adWaiting,nativePending:i.nativePending,errors:i.modErrorCount,runtime:m.nativeRuntimeDiagnostics?.(),events:i.events.map(e=>({type:e.type,stage:e.stage}))};})()',returnByValue:true});report.failureState=r.result.value;await screenshot('failure');}catch{}}).finally(async()=>{
 observing=false;report.elapsedMs=elapsed();
 fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');say({event:'final',joined:report.joined,minutePassed:report.minutePassed,secondsAfterJoin:report.secondsAfterJoin,error:report.error,final:report.final});
 if(ws?.readyState===1){try{if(targetId)await send('Target.closeTarget',{targetId},null);if(browserContextId)await send('Target.disposeBrowserContext',{browserContextId},null);}catch{}ws.close();}
});
