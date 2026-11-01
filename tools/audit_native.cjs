// Inspect only native interfaces in a browser initialized from saved public files.
const fs=require('fs'),zlib=require('zlib'),{chromium}=require('playwright-core'),acorn=require('./parser.cjs');
const symbols=JSON.parse(fs.readFileSync('patches/recovered-bindings.json')).symbols;
const profile=JSON.parse(fs.readFileSync('patches/recovered-current.json'));
const source=zlib.gunzipSync(fs.readFileSync('baselines/current.js.gz')).toString();
const tree=acorn.parse(source,{ecmaVersion:'latest'}),offset=tree.body[0].expression.callee.body.end-1;
const fields={'network':'о̃༩','world':'еܞ︌','entities':'ι‌̵','input':'ρ̃५','renderer':'ᴇ️̅','graphics':'ᴘᚉ٦','items':'ιᄅᴄ','types':'εᚇ๓'};
const code=source.slice(0,offset)+'window.__nativeAudit={'+Object.entries(fields).map(([k,n])=>k+':'+symbols[n]).join(',')+'};'+source.slice(offset);
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,env:{...process.env,HOME:'/tmp/devast-browser-home'},proxy:{server:process.env.HTTPS_PROXY},args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const page=await browser.newPage();await page.route('https://devast.io/',r=>r.fulfill({status:200,contentType:'text/html',body:fs.readFileSync('build/download/index.html','utf8')}));await page.route(profile.source_url,r=>r.fulfill({status:200,contentType:'text/javascript',body:code}));
 await page.goto('https://devast.io/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.__nativeAudit);
 const data=await page.evaluate(s=>{
 const n=window.__nativeAudit;
 const shape=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,typeof v==='function'?{type:'function',source:String(v)}:v===null?null:['string','number','boolean'].includes(typeof v)?v:Array.isArray(v)?{type:'array',length:v.length}:{type:typeof v}]));
 return {input:shape(n.input),network:shape(n.network),entity:shape(n.entities.create(0)),gauges:shape(n.world[s['ᴘρࡀ']]),gauge:shape(n.world[s['ᴘρࡀ']][s['ᴇ༤ᚆ']]),items:n.items.slice(0,100).map(shape)};
 },symbols);
 fs.writeFileSync('build/native-audit.json',JSON.stringify(data,null,2)+'\n');console.log('Native interface shapes and methods recorded.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
