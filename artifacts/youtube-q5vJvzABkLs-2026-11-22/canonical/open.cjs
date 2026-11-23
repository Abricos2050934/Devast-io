const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright-core');
(async()=>{
 const out=__dirname,report={checked_at:new Date().toISOString(),requested_url:'https://www.youtube.com/watch?v=q5vJvzABkLs',mode:'actual Chromium browser; inherited managed proxy and normal TLS verification',responses:[],failed_requests:[]};let browser,page;
 try{
  browser=await chromium.launch({executablePath:'/tmp/devast-update-browsers/chromium-1234/chrome-linux64/chrome',headless:true,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox','--disable-dev-shm-usage'],env:{...process.env,XDG_CONFIG_HOME:'/tmp/devast-youtube-config',XDG_CACHE_HOME:'/tmp/devast-youtube-cache'}});
  report.browser_version=browser.version();
  page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on('response',r=>{if(r.request().isNavigationRequest())report.responses.push({url:r.url(),status:r.status()});});
  page.on('requestfailed',r=>{if(r.isNavigationRequest())report.failed_requests.push({url:r.url(),error:r.failure()?.errorText});});
  try{const response=await page.goto(report.requested_url,{waitUntil:'domcontentloaded',timeout:30000});report.http=response?.status();}catch(e){report.navigation_error=e.message.slice(0,1000);}
  report.final_url=page.url();report.title=await page.title().catch(()=>'');report.text=(await page.locator('body').innerText({timeout:3000}).catch(()=>'' )).slice(0,2500);
  report.video=await page.locator('video').evaluateAll(nodes=>nodes.map(n=>({readyState:n.readyState,duration:Number.isFinite(n.duration)?n.duration:null,currentTime:n.currentTime,paused:n.paused,error:n.error?.message||null}))).catch(()=>[]);
  await page.screenshot({path:path.join(out,'page.png'),fullPage:true}).catch(e=>{report.screenshot_error=e.message.slice(0,200);});
 }catch(e){report.browser_error=e.message.slice(0,1400);}
 finally{if(browser)await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
})();
