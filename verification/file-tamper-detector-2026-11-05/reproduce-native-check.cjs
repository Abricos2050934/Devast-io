const fs=require('fs'),{chromium,firefox}=require('playwright-core'),block=fs.readFileSync(__dirname+'/native-function-check.js','utf8');
(async()=>{const rows=[];
for(const engine of ['chromium','firefox']){
 const browser=await (engine==='chromium'?chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],env:{...process.env,HOME:'/tmp/devast-browser-home'}}):firefox.launch({headless:true}));
 try{for(const mode of ['clean','comment_only','forwarding_toString','forwarding_imul']){
  const page=await browser.newPage();await page.setContent('<!doctype html><html><body></body></html>');
  if(mode==='forwarding_toString')await page.evaluate(()=>{const original=Function.prototype.toString;Function.prototype.toString=function(...args){return Reflect.apply(original,this,args);};});
  if(mode==='forwarding_imul')await page.evaluate(()=>{const original=Math.imul;Math.imul=function(...args){return Reflect.apply(original,this,args);};});
  await page.addScriptTag({content:(mode==='comment_only'?'// Added script text, no changed API\n':'')+'var ᴄࡇ९=window,ѕ०̊=0;'+block+';window.__nativeSourceResult={flag:ѕ०̊,source:Function.prototype.toString.call(Function.prototype.toString)};'});
  const result=await page.evaluate(()=>window.__nativeSourceResult);rows.push({engine,version:browser.version(),mode,...result});console.log(JSON.stringify(rows.at(-1)));await page.close();
 }}finally{await browser.close();}
}
const report={scope:'Exact extracted Function.prototype.toString validation block; no game session and no manual integrity flag injection',source:'new-native.full.js:3087-3146',rows};
for(const engine of ['chromium','firefox']){const get=mode=>rows.find(r=>r.engine===engine&&r.mode===mode).flag;if(get('clean')!==0||get('comment_only')!==0||get('forwarding_toString')!==1||get('forwarding_imul')!==0)throw Error('Unexpected control outcome '+engine);}
report.passed=true;fs.writeFileSync(__dirname+'/native-source-matrix.json',JSON.stringify(report,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
