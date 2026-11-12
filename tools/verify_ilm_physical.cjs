async function verifyPhysical(page,symbols) {
 const assert=require('node:assert/strict'),results=[];
 await page.evaluate(s=>{
  window.__numericPauseWorld=true;window.__numericClock=10000;Date.now=()=>window.__numericClock;
  const m=window.__devastMod,n=window.__updateProbe,self=n.world[s['ᅠᏧ‍']];
  for(const[object,key,value]of [[self,'id',1],[n.network,'state',1]])Object.defineProperty(object,key,{configurable:true,enumerable:true,get:()=>value,set(){}});
  window.__numericTransport=n.capturePackets();m.reconnect.sessionEnded=false;m.observeSocket(null);
  n.world[s['ᴎ︃ᄉ']][1]={[s['а༤̘']]:-1};n.world[s['ᴎ︃ᄉ']][2]={[s['а༤̘']]:-1};
  for(const[key,value]of Object.entries({AimBotEnabled:true,autoFire:false,jitterActive:false,AntiAimbot:false,AimbotSpearEnabled:false,mouseFovEnable:false,lockId:2,visualizeResolving:true}))m.setSetting(key,value);
  m.menu.open();m.menu.domElement.style.display='';m.menu.domElement.style.zIndex='2147483647';
  function mark(folder){folder.open();for(const c of folder.__controllers){if(typeof m.settings[c.property]!=='number')continue;const input=c.domElement.querySelector('input');if(input)input.dataset.aimNumericTest=c.property;const slider=c.domElement.querySelector('.slider');if(slider)slider.dataset.aimSliderTest=c.property;}for(const child of Object.values(folder.__folders))mark(child);}mark(m.menu);
 },symbols);
 async function sample(label,key){
  const r=await page.evaluate(({label,key})=>{
   const m=window.__devastMod;m.settings.AimBotEnabled=false;m.onSessionStart();m.onHandshake();window.__numericClock+=500;
   m.trackPacket(0,1,1,1000,1000,true);m.trackPacket(0,2,1,2000,1000,true);m.settings.AimBotEnabled=true;m.aimModule.refreshTargets();
   for(let step=1;step<=3;step++){window.__numericClock+=50;m.trackPacket(0,2,1,2000,1000+100*step,true);}
   const line=m.targets.lines[0],packet=window.__numericTransport.packets.filter(p=>p[0]===6).at(-1),saved=JSON.parse(localStorage.getItem('DevastMessage27:aim:v1'));
   return {label,key,input:document.querySelector('[data-aim-numeric-test="'+key+'"]').value,value:m.settings[key],type:typeof m.settings[key],angle:m.aim.lastAngle,line:{x:line.x2,y:line.y2},native_angle:packet?.[1],saved:saved?.[key]};
  },{label,key});results.push(r);return r;
 }
 async function type(key,value,commit){const locator=page.locator('[data-aim-numeric-test="'+key+'"]');await locator.scrollIntoViewIfNeeded();await locator.click();await locator.press('ControlOrMeta+A');await locator.pressSequentially(String(value),{delay:20});if(commit)await locator.press(commit);return sample('typed '+value+' '+(commit||'uncommitted'),key);}
 const uncommitted=await type('distanceCoefficient',10,null);assert.equal(uncommitted.value,10);assert.equal(uncommitted.saved,10);
 const entered=await type('distanceCoefficient',10,'Enter'),tabbed=await type('distanceCoefficient',1000,'Tab');assert.equal(tabbed.saved,1000);assert.notEqual(entered.angle,tabbed.angle);assert.notDeepEqual(entered.line,tabbed.line);assert.notEqual(entered.native_angle,tabbed.native_angle);
 const offset0=await type('offsetCoefficient',0,'Enter'),offset3=await type('offsetCoefficient',3,'Tab');assert.equal(offset3.value,3);assert.notEqual(offset0.angle,offset3.angle);
 const smooth0=await type('aimSmooth',.05,'Enter'),smooth1=await type('aimSmooth',1,'Tab');assert.notEqual(smooth0.angle,smooth1.angle);
 const cap40=await type('leadCap',40,'Enter'),cap500=await type('leadCap',500,'Tab');assert.notEqual(cap40.angle,cap500.angle);
 const slider=page.locator('[data-aim-slider-test="distanceCoefficient"]');await slider.scrollIntoViewIfNeeded();const bounds=await slider.boundingBox();assert.ok(bounds);
 for(const fraction of [.02,.98]){await page.mouse.move(bounds.x+bounds.width*.5,bounds.y+bounds.height*.5);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*fraction,bounds.y+bounds.height*.5,{steps:5});await page.mouse.up();await sample('slider '+fraction,'distanceCoefficient');}
 assert.notEqual(results.at(-2).value,results.at(-1).value);assert.notEqual(results.at(-2).angle,results.at(-1).angle);
 const keys=['distanceCoefficient','offsetCoefficient','aimStick','aimSmooth','leadCap','aimHoldMs','mouseFov','mouseFovEnable','lockId'];
 await page.evaluate(()=>{window.__numericTransport.restore();const m=window.__devastMod;for(const[key,value]of Object.entries({AimBotEnabled:false,distanceCoefficient:100,offsetCoefficient:.1,aimStick:140,aimSmooth:.62,leadCap:220,mouseFov:600,mouseFovEnable:false}))m.setSetting(key,value);});
 const saved=await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,window.__devastMod.settings[k]])),keys);
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.__devastMod?.menu);
 const restored=await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,window.__devastMod.settings[k]])),keys);assert.deepEqual(restored,saved);
 return {status:'passed',engine:'message27-bby',physical_text_entry:true,enter_and_tab_commit:true,slider_drag:true,native_angle_changes:true,explicit_saved_values:true,saved_after_reload:restored,samples:results};
}
module.exports={verifyPhysical};
