// Real browser test in a fresh profile. No game JS is executed in Node.
const {chromium}=require('playwright-core');
const fs=require('node:fs');
const acorn=require('./parser.cjs');
const {hash}=require('./build_client.cjs');
const menuOnly=process.argv.includes('--menu-only');
const symbols=JSON.parse(fs.readFileSync('patches/recovered-bindings.json')).symbols;
const profile=JSON.parse(fs.readFileSync('patches/recovered-current.json'));
const output=fs.readFileSync('dist/game.modded.js','utf8');
const tree=acorn.parse(output,{ecmaVersion:'latest'});
const offset=tree.body[0].expression.callee.body.end-1;
let instrumented=output.slice(0,offset)+`window.__probe={network:${symbols['о̃༩']},world:${symbols['еܞ︌']},entities:${symbols['ι‌̵']}};`+output.slice(offset);
const networkDefinition=tree.body[0].expression.callee.body.body.flatMap(n=>n.type==='VariableDeclaration'?n.declarations:[]).find(n=>n.id.name===symbols['о̃༩']);
const networkReturn=networkDefinition.init.callee.body.body.find(n=>n.type==='ReturnStatement');
instrumented=instrumented.slice(0,networkReturn.start)+'window.__networkSocketForTest=()=>І̎ܘ;'+instrumented.slice(networkReturn.start);

async function main(){
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,
    env:{...process.env,HOME:process.env.DEVAST_BROWSER_HOME||'/tmp/devast-browser-home'},
    proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,
    args:['--no-sandbox','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  await context.addCookies([{name:'devast_rejoin_check',value:'kept',domain:'devast.io',path:'/',secure:true,sameSite:'Lax'}]);
  const page=await context.newPage();const errors=[],samples=[],socket_errors=[];
  const report={started_at:new Date().toISOString(),baseline_sha256:profile.baseline_sha256,output_sha256:hash(output),errors,samples,
    source:'dist/game.modded.js substituted for the native script before initialization',tls_verification:true,socket_errors};
  page.on('websocket',ws=>ws.on('socketerror',e=>{if(socket_errors.length<20)socket_errors.push({host:new URL(ws.url()).hostname,error:String(e).slice(0,250)});}));
  page.on('pageerror',e=>{if(errors.length<20)errors.push(String(e.message).slice(0,250));});
  await page.route(profile.source_url,route=>route.fulfill({status:200,contentType:'text/javascript',body:instrumented}));
  if(menuOnly)await page.route('https://devast.io/',route=>route.fulfill({status:200,contentType:'text/html',body:fs.readFileSync('build/download/index.html','utf8')}));
  async function sample(label){const s=await page.evaluate(({player,meta})=>({
    state:window.__probe?.network.state,player_id:window.__probe?.world[player]?.id,
    menu:!!window.__devastMod?.menu,mod_errors:[...(window.__devastMod?.diagnostics.errors||[])],
    records:window.__devastMod?.records.length,tracked_players:window.__devastMod?.targets.players.filter(p=>p?.active).length,
    frames:window.__devastMod?.diagnostics.frames,commands:window.__devastMod?.diagnostics.commands,
    metadata_present:Array.isArray(window.__probe?.world[meta]),
  }),{player:symbols['ᅠᏧ‍'],meta:symbols['ᴎ︃ᄉ']});samples.push({label,at:new Date().toISOString(),...s});console.log(JSON.stringify(samples.at(-1)));return s;}
  async function join(){
    await page.waitForFunction(()=>document.querySelector('#servers')?.options.length>1,{timeout:30000});
    await page.waitForFunction(()=>typeof window.__probe?.network['Ꮷіܖ']==='function',{timeout:30000});
    // The game's image loading and menu initialization finish after the server list appears.
    await page.waitForTimeout(5000);
    await page.locator('#nicknameInput').fill('DevastTest');
    const selected=process.env.DEVAST_SERVER?await page.locator('#servers option').evaluateAll((opts,name)=>opts.find(o=>!o.disabled&&o.textContent.toLowerCase().includes(name.toLowerCase()))?.value,process.env.DEVAST_SERVER):undefined;
    if(selected!==undefined)await page.locator('#servers').selectOption(selected);
    report.server_options=await page.locator('#servers option').evaluateAll(opts=>opts.map(o=>({label:o.textContent,disabled:o.disabled,selected:o.selected})));
    if(process.env.DEVAST_SERVER&&selected===undefined)throw Error('Requested server is absent from enabled options');
    await page.mouse.click(640,357);
    const prop=symbols['ᅠᏧ‍'];
    await page.waitForFunction(p=>window.__probe?.network.state===1&&window.__probe.world[p]?.id>0,prop,{timeout:45000});
  }
  try{
    const response=await page.goto('https://devast.io/',{waitUntil:'domcontentloaded',timeout:45000});report.homepage_http=response.status();
    if(response.status()!==200)throw Error('Homepage HTTP '+response.status()+'; no server-entry test is possible');
    await page.waitForFunction(()=>!!window.__devastMod?.menu,{timeout:20000});
    await sample('menu');await page.screenshot({path:'build/browser-menu.png'});
    if(menuOnly){
      report.adapter_fixture=await page.evaluate(s=>{
        const {world,network,entities}=window.__probe,mod=window.__devastMod;
        const self=world[s['ᅠᏧ‍']],players=world[s['ᴎ︃ᄉ']];
        const previous={state:network.state,id:self.id,x:self.x,y:self.y,meta:players[1]};
        let entity;
        try{
          entity=entities.get(1,0,1,0);
          Object.assign(entity,{id:0,x:1000,y:1000,[s['ᴘ४１']]:1,[s['ոᚄރ']]:1,[s['е̝ހ']]:0});
          players[1]={[s['ο̏︇']]:'Adapter fixture',[s['а༤̘']]:-1};
          Object.assign(self,{id:1,x:1000,y:1000});network.state=1;
          mod.trackPacket(0,1,1,1000,1000,true);mod.step(1000);
          const result={records:mod.records.length,tracked:mod.targets.players[1].active,errors:[...mod.diagnostics.errors]};
          if(!result.records||!result.tracked||result.errors.length)throw Error('Native adapter fixture failed: '+JSON.stringify(result));
          return result;
        }finally{
          network.state=previous.state;Object.assign(self,{id:previous.id,x:previous.x,y:previous.y});players[1]=previous.meta;
          if(entity)entities.remove(1,0,1,0,0);
          mod.trackPacket(0,1,1,0,0,false);
        }
      },symbols);
      report.result=errors.length?'menu_and_adapter_passed_with_resource_errors':'menu_and_adapter_passed';
      report.mode='saved HTML and native object fixtures; no live server test';return;
    }
    await join();await sample('joined');
    const identityKeys=['token','tokenId','userId'];
    const originalIdentity=await page.evaluate(keys=>keys.map(key=>localStorage.getItem(key)),identityKeys);
    report.initial_identity_present=originalIdentity.every(value=>typeof value==='string'&&value.length>0);
    if(!report.initial_identity_present)throw Error('Server did not save a complete identity');
    await page.evaluate(()=>{window.__savedTokenForTest=localStorage.getItem('token');});
    await page.keyboard.down('KeyW');await page.waitForTimeout(1000);await page.keyboard.up('KeyW');
    await page.evaluate(()=>{const m=window.__devastMod;m.setSetting('AimBotEnabled',true);m.setSetting('ShowPlayerHitbox',true);m.setSetting('XrayBuildings',true);m.setSetting('zoomFactor',0.8);});
    for(let i=1;i<=6;i++){await page.waitForTimeout(10000);const s=await sample('connected-'+i*10+'s');if(s.state!==1||!s.player_id||s.mod_errors.length)throw Error('Connection or mod failed during observation');if(i===2)await page.evaluate(()=>window.__devastMod.setSetting('AimBotEnabled',false));}
    await page.screenshot({path:'build/browser-playing.png'});
    await page.evaluate(()=>window.__networkSocketForTest().close());
    await page.waitForFunction(()=>window.__probe.network.state!==1,{timeout:5000});
    await page.waitForFunction(p=>window.__probe.network.state===1&&window.__probe.world[p]?.id>0,symbols['ᅠᏧ‍'],{timeout:45000});
    await sample('same-page-reconnected');
    report.same_page_reconnect='passed';
    report.identity_kept_on_reconnect=await page.evaluate(()=>window.__savedTokenForTest===localStorage.getItem('token')&&document.cookie.includes('devast_rejoin_check=kept'));
    if(!report.identity_kept_on_reconnect)throw Error('Identity or cookie was lost during reconnect');
    report.reloads=[];
    const reloadCount=Math.max(1,Math.min(5,Number(process.env.DEVAST_RELOADS)||1));
    for(let attempt=1;attempt<=reloadCount;attempt++){
      await page.reload({waitUntil:'domcontentloaded',timeout:45000});await join();await page.waitForTimeout(10000);const s=await sample('rejoined-after-reload-'+attempt);
      if(s.state!==1||!s.player_id||s.mod_errors.length||errors.length)throw Error('Rejoin or browser errors');
      const currentIdentity=await page.evaluate(keys=>keys.map(key=>localStorage.getItem(key)),identityKeys);
      const kept={attempt,token:currentIdentity[0]===originalIdentity[0],tokenId:currentIdentity[1]===originalIdentity[1],userId:currentIdentity[2]===originalIdentity[2],cookie:await page.evaluate(()=>document.cookie.includes('devast_rejoin_check=kept'))};
      report.reloads.push(kept);
      if(!kept.token||!kept.tokenId||!kept.userId||!kept.cookie)throw Error('Saved identity or cookie changed after reload');
    }
    report.cookie_kept_on_reload=report.reloads.every(r=>r.cookie);
    report.result='passed';report.observed_session_seconds=60;report.reload_rejoin='passed';
  }catch(e){report.result='failed';report.failure=String(e.message);await sample('failure').catch(()=>{});await page.screenshot({path:'build/browser-failure.png'}).catch(()=>{});process.exitCode=1;}
  finally{report.finished_at=new Date().toISOString();fs.writeFileSync(menuOnly?'build/browser-menu-report.json':'build/browser-report.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
