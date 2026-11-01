// Simulate the extension's fileOverride, but fetch the published client by real XHR.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{chromium}=require('playwright-core');
const config=JSON.parse(fs.readFileSync('resource-override/Devast-io-GitHub-Resource-Override.json','utf8'));
const loader=config.data[0].rules[0].file;
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,env:{...process.env,HOME:process.env.DEVAST_BROWSER_HOME||'/tmp/devast-browser-home'},proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={mode:'Resource Override replacement and real cross-origin published JS; no game-server login',requests:[],page_errors:[]};const bodies=[];
 try{
  const page=await browser.newPage();page.on('pageerror',e=>report.page_errors.push(e.message));
  page.on('response',response=>{if(response.url().startsWith('https://raw.githubusercontent.com/Abricos2050934/Devast-io/updates/game.modded.js?')){
   const item={url:response.url(),http:response.status(),allow_origin:response.headers()['access-control-allow-origin']};report.requests.push(item);bodies.push(response.body().then(body=>{item.sha256=crypto.createHash('sha256').update(body).digest('hex');}).catch(e=>{item.body_error=e.message;}));
  }});
  await page.route(url=>url.hostname==='devast.io'&&url.pathname.startsWith('/js/')&&url.pathname.endsWith('.js'),route=>route.fulfill({status:200,contentType:'text/javascript; charset=utf-8',body:loader}));
  await page.goto('https://devast.io/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__devastRemoteLoader?.state==='loaded'&&!!window.__devastMod?.menu,{timeout:30000});
  report.first=await page.evaluate(()=>({state:window.__devastRemoteLoader.state,menu:!!window.__devastMod.menu,errors:[...window.__devastMod.diagnostics.errors],removed_gauges:!Object.hasOwn(window.__devastMod.settings,'ShowGauges')}));
  await page.evaluate(code=>(0,eval)(code),loader);
  assert.equal(report.requests.length,1,'Duplicate loader fetched the client again');
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>window.__devastRemoteLoader?.state==='loaded'&&!!window.__devastMod?.menu,{timeout:30000});
  await Promise.all(bodies);assert.equal(report.requests.length,2);assert.ok(report.requests.every(r=>r.http===200&&r.allow_origin==='*'));assert.notEqual(report.requests[0].url,report.requests[1].url);assert.equal(report.page_errors.length,0);assert.equal(report.first.errors.length,0);
  report.result='passed';report.reload_fetches_latest=true;report.duplicate_guard=true;
 }catch(error){report.result='failed';report.failure=error.message;process.exitCode=1;}
 finally{fs.mkdirSync('build/resource-override',{recursive:true});fs.writeFileSync('build/resource-override/browser.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));await browser.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
