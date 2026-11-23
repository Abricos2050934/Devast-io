const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('/workspace/Devast-io/node_modules/playwright-core');

const dir = __dirname;
const crypto=require('node:crypto');
const artifact='/workspace/Devast-io/artifacts/typescript-2026-11-22/Devast-io-TypeScript.json';
const config=JSON.parse(fs.readFileSync(artifact,'utf8'));
const bytes=Buffer.from(config.data[0].rules[0].file,'utf8');
const meta={output_sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
assert.equal(meta.output_sha256,'a918c29c52b5c02f11a27eb8e086712862a3d9ba56af3c75648e648ba94dcd9b');
const automation = ['AimBotEnabled','AimbotSpearEnabled','autoFire','spearAutoThrow','JitterEnabled','AntiAimbot',
  'hideAimbotAngle','hidePlayerAngle','AutoBuiledEnabled','SAutoLootEnabled','FAutoLootEnabled','AutoTakeEnabled',
  'SpamChatEnabled','AntiKickEnabled','AutoOpenSlotsInv','OpenEverythingByClick','RightClickDoors'];
const say = (entry) => console.log(JSON.stringify(entry));
function safeError(message) {
  return String(message).replace(/https?:\/\/\S+/g,'[URL]').replace(/[A-Za-z0-9_-]{36,}/g,'[value]').slice(0,180);
}

async function run(browser, modified, server, index) {
  const name = (modified ? 'windowed-mod' : 'windowed-stock') + '-' + index;
  const context=browser.contexts()[0];
  const page = await context.newPage();await page.setViewportSize({width:1280,height:800});
  const browserMode=await page.evaluate(()=>({webdriver:navigator.webdriver,visibility:document.visibilityState}));
  const started = Date.now();
  const entry = { name, requestedServer: server, scriptHash: modified ? meta.output_sha256 : null,
    browserMode,loaded: false, joined: false, sockets: [], errors: [], failedRequests: {}, resourceErrors: 0, samples: [] };
  const elapsed = () => Date.now()-started;
  let substitutions = 0, joinedAt = null, observing=true;
  try {
    if (modified) await page.route(url=>url.hostname==='devast.io'&&/^\/js\/[^/]+\.js$/.test(url.pathname), async route=>{
      substitutions++;entry.replacedUrl=route.request().url();
      await route.fulfill({ body: bytes, contentType: 'application/javascript; charset=utf-8' });
    });
    page.on('pageerror', error => {
      if(entry.errors.length<30) entry.errors.push({ at: elapsed(), name:error.name, message:safeError(error.message) });
    });
    page.on('requestfailed', request => {
      const kind = request.resourceType();
      entry.failedRequests[kind] = (entry.failedRequests[kind] || 0)+1;
      entry.failedRequestDetails=entry.failedRequestDetails||[];if(entry.failedRequestDetails.length<80&&new URL(request.url()).hostname.endsWith('devast.io')){const u=new URL(request.url());entry.failedRequestDetails.push({host:u.hostname,path:u.pathname,kind,error:safeError(request.failure()?.errorText)});}
    });
    page.on('response', response => {
      if(response.status()>=400){entry.resourceErrors++;entry.httpErrors=entry.httpErrors||[];if(entry.httpErrors.length<24){const u=new URL(response.url());entry.httpErrors.push({host:u.hostname,path:u.pathname,status:response.status()});}}
    });
    page.on('websocket', ws => {
      const host=new URL(ws.url()).hostname;
      if(!host.endsWith('.devast.io')) return;
      const socket={host,openedAt:elapsed(),received:0,sent:0,closedAt:null,error:false,death:null,receivedOpcodes:{},textMetadata:[]};
      entry.sockets.push(socket);
      ws.on('framesent',()=>socket.sent++);
      ws.on('framereceived', ({payload})=>{
        socket.received++;
        if(typeof payload==='string'&&socket.textMetadata.length<8){let info={bytes:Buffer.byteLength(payload)};try{const data=JSON.parse(payload);info.kind=Array.isArray(data)?'array':typeof data;if(Array.isArray(data)){info.items=data.length;if(Number.isInteger(data[0])&&data[0]>=0&&data[0]<=4096)info.opcode=data[0];}else if(data&&typeof data==='object')info.keys=Object.keys(data).filter(k=>/^(?:error|status|message|reason|code|type|data|n|l|p)$/.test(k));}catch{info.kind='non-JSON'}socket.textMetadata.push(info);}if(Buffer.isBuffer(payload)&&payload.length){const op=payload[0];socket.receivedOpcodes[op]=(socket.receivedOpcodes[op]||0)+1;}
        if(Buffer.isBuffer(payload) && payload.length>=3 && payload.length<=5 && payload[0]===27) {
          socket.death={ at:elapsed(), prefix:payload.subarray(0,3).toString('hex'),length:payload.length };
        }
      });
      ws.on('close',()=>{if(observing)socket.closedAt=elapsed();});
      ws.on('socketerror',()=>socket.error=true);
    });

    let response;for(let attempt=0;attempt<3;attempt++){response=await page.goto('https://devast.io/',{waitUntil:'domcontentloaded',timeout:40000});if(response.status()===200)break;if(response.status()!==503)break;console.log(JSON.stringify({event:'homepage-unavailable',status:response.status(),attempt:attempt+1}));if(attempt<2)await page.waitForTimeout(15000);}
    if(response.status()!==200)entry.httpFailure=(await response.text()).slice(0,600);
    entry.homeStatus=response.status();
    assert.equal(response.status(),200);
    const input=page.locator('#nicknameInput');
    await input.waitFor({state:'visible',timeout:25000});
    await page.waitForFunction(()=>Array.from(document.querySelector('#servers')?.options||[]).some(o=>o.textContent.trim().startsWith('Atlanta 1 -')),null,{timeout:30000});
    if(modified) {
      await page.waitForFunction(()=>!!window.__devastMod?.connectionInfo,null,{timeout:20000});
      entry.modProof=await page.evaluate(()=>{const m=window.__devastMod;return {clientLoaded:window.__devastClientLoaded===true,menu:!!m.menu,menus:document.querySelectorAll('.dg.main').length,build:m.connectionInfo().build,aimSettings:m.connectionInfo().aimSettings};});
      assert.equal(entry.modProof.clientLoaded,true);assert.equal(entry.modProof.menu,true);assert.equal(entry.modProof.menus,1);
      await page.evaluate(()=>window.__devastMod.setSetting('AntiKickEnabled',true));
      entry.modProof.keepAliveEnabled=await page.evaluate(()=>window.__devastMod.settings.AntiKickEnabled);
      entry.keepAliveEnabled=true;
      assert.equal(substitutions,1);
    } else assert.equal(await page.evaluate(()=>!!window.__devastMod),false);
    entry.loaded=true;
    await input.fill('Guest' + Math.random().toString(36).slice(2,7).toUpperCase());
    const selected=await page.locator('#servers').evaluate((select,prefix)=>{
      const option=Array.from(select.options).find(option=>option.textContent.trim().startsWith(prefix+' -'));
      return option?{value:option.value,label:option.textContent.trim()}:null;
    },server);
    assert.ok(selected,'Requested region is unavailable');
    await page.locator('#servers').selectOption({value:selected.value});
    entry.selected=selected.label;
    await page.evaluate(()=>{
      document.activeElement?.blur();
      window.scrollTo(0,0);
    });
    await page.waitForFunction(()=>{
      const box=document.getElementById('nicknameInput').getBoundingClientRect();
      return box.y>200&&box.y<285&&getComputedStyle(document.body).marginTop==='0px';
    },null,{timeout:20000});
    await page.waitForTimeout(700);
    await page.screenshot({path:path.join(dir,name+'-menu.png'),timeout:10000});
    const hit=await page.evaluate(()=>document.elementFromPoint(644,356)?.id);
    assert.equal(hit,'can','Play is covered by another element');
    await page.mouse.move(644,356);
    await page.waitForTimeout(250);
    await page.mouse.click(644,356);
    entry.clickedAt=elapsed();
    say({name,event:'play',server:selected.label});

    async function inspect() {
      return page.evaluate(()=>{
        const input=document.getElementById('nicknameInput');
        const menu=!!input?.getClientRects().length&&getComputedStyle(input).visibility!=='hidden';
        const mod=window.__devastMod;
        if(!mod)return {menu};
        const info=mod.connectionInfo();
        return {
          menu,state:info.state,socketState:info.socketState,playerAssigned:mod.aim.myId()>0,
          playerId:mod.aim.myId(),ownActive:mod.targets.players[mod.aim.myId()]?.active===true,ended:info.sessionEnded,integrityFlag:info.integrityFlag,modErrorCount:info.modErrorCount,
          failureCode:info.lastFailureCode,automation:info.automationSettings,
          combat:info.combatNow,wireTraffic:info.nativeWireTraffic.totals,aimSettings:info.aimSettings,self:mod.aim.getSelf(),
          events:info.events.map(e=>({
            type:e.type,at:e.at,health:e.health,state:e.state,code:e.code,clean:e.clean,
            flag:e.integrityFlag,failureCode:e.failureCode,deathOpcode:e.deathOpcode,
            deathPrefix:e.deathPrefixHex,deathLength:e.deathPacketLength,
            localCloseSource:e.transport?.localCloseSource,
            received:e.transport?.receivedMessages,sent:e.transport?.sentMessages,
            commands:e.commandsInLast2s
          }))
        };
      });
    }
    for(let second=0;second<35;second++){
      const state=await inspect();
      if(modified?state.state===1&&state.socketState===1&&state.playerAssigned&&!state.ended:
          !state.menu&&entry.sockets.some(s=>s.received>=10&&s.closedAt===null)) {
        entry.joined=true;joinedAt=Date.now();
        entry.samples.push({at:elapsed(),...state});
        break;
      }
      await page.waitForTimeout(1000);
    }
    say({name,event:'joined',joined:entry.joined,sockets:entry.sockets});
    await page.screenshot({path:path.join(dir,name+'-joined.png'),timeout:10000});
    if(entry.joined) {
      for(let second=0;second<80;second++){
        await page.mouse.move(640+160*Math.cos(second/3),400+160*Math.sin(second/3));
        if(false){
          const key=second%20===0?'d':'w';await page.keyboard.down(key);await page.waitForTimeout(400);await page.keyboard.up(key);
          entry.manualMovementInputs=(entry.manualMovementInputs||0)+1;
        }
        await page.waitForTimeout(1000);
        const state=await inspect();
        if(second%5===4 || state.ended)entry.samples.push({at:elapsed(),...state});
        if(second%15===14)say({name,event:'observing',secondsAfterJoin:(Date.now()-joinedAt)/1000,state:state.state,socketState:state.socketState,received:entry.sockets[0]?.received,sent:entry.sockets[0]?.sent});
        if(modified?(state.ended||state.socketState!==1||state.state!==1):
            entry.sockets.some(s=>s.death||s.closedAt!==null))break;
      }
    }
    entry.final=await inspect();
    entry.secondsAfterJoin=joinedAt?(Date.now()-joinedAt)/1000:null;
    entry.stockMinutePassed=entry.joined&&entry.secondsAfterJoin>=60&&entry.sockets.length===1&&!entry.sockets[0].death&&entry.sockets[0].closedAt===null;
    entry.minutePassed=entry.joined&&entry.secondsAfterJoin>=60&&entry.final?.state===1&&entry.final?.ownActive&&entry.final?.playerId===entry.samples[0]?.playerId&&entry.final?.socketState===1&&!entry.final?.ended&&entry.sockets.length===1&&!entry.sockets[0].death&&entry.sockets[0].closedAt===null;
    await page.screenshot({path:path.join(dir,name+'-final.png'),timeout:10000});
  } catch(error) {
    entry.error=safeError(error.message);
    try{entry.failureState=await page.evaluate(()=>({servers:Array.from(document.querySelector('#servers')?.options||[]).map(o=>o.textContent),modLoaded:!!window.__devastMod,nicknameVisible:!!document.querySelector('#nicknameInput')?.getClientRects().length,canvasSize:[document.querySelector('#can')?.width,document.querySelector('#can')?.height]}));await page.screenshot({path:path.join(dir,name+'-failed.png'),timeout:10000});}catch{}
  } finally {
    entry.elapsedMs=elapsed();
    fs.writeFileSync(path.join(dir,name+'.json'),JSON.stringify(entry,null,2)+'\n');
    say({name,event:'final',joined:entry.joined,secondsAfterJoin:entry.secondsAfterJoin,
      sockets:entry.sockets,error:entry.error,errors:entry.errors.length,final:entry.final});
    observing=false;await page.close();
  }
  return entry;
}
(async()=>{
  const browser=await chromium.connectOverCDP('http://127.0.0.1:9224');
  try{
    const pairs=[];
    for(const [index,server] of ['Atlanta 1'].entries()){
      pairs.push(await run(browser,false,server,index+1));
    }
    fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify({scope:'Current delivered mod with its existing keep-alive setting enabled; standing still for up to 75 seconds; live guest entry',artifact,script_sha256:meta.output_sha256,results:pairs},null,2)+'\n');
  } finally{await browser.close();}
})().catch(error=>{console.error(safeError(error.message));process.exitCode=1;});
