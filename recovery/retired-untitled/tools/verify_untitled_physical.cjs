async function verifyPhysical(page,symbols) {
 const assert=require('node:assert/strict'),results=[];
 await page.evaluate(s=>{
  window.__numericPauseWorld=true;
  const m=window.__devastMod,n=window.__updateProbe;
  const self=n.world[s['ᅠᏧ‍']];
  for(const [object,key,value]of [[self,'id',1],[n.network,'state',1]])Object.defineProperty(object,key,{configurable:true,enumerable:true,get:()=>value,set(){}});
  window.__numericTransport=n.capturePackets();
  for(const [key,value]of Object.entries({AimBotEnabled:true,jitterActive:false,spinActive:false,AntiAimbot:false,selfPredictEnabled:false,smoothLine:false,instantAim:false,perWeaponEnabled:false,weaponMode:"Custom for all",aimTickRate:10,turboAim:false,autoFire:false,mouseFovEnable:false,lockId:2,resolverType:'linear',visualizeResolving:true,distanceCoefficient:100,offsetCoefficient:.1,bulletSpeedCoefficient:4}))m.setSetting(key,value);
  m.reconnect.sessionEnded=false;m.onHandshake();m.observeSocket(null);m.aim.onDeath();m.onHandshake();
  n.world[s['ᴎ︃ᄉ']][1]={[s['а༤̘']]:-1};n.world[s['ᴎ︃ᄉ']][2]={[s['а༤̘']]:-1};
  m.trackPacket(0,1,1,1000,1000,true);m.trackPacket(0,2,1,2000,1000,true);m.trackPacket(0,2,1,2000,1100,true);
  m.menu.open();m.menu.domElement.style.display='';m.menu.domElement.style.zIndex='2147483647';m.menu.__folders['Aimbot'].open();
  function mark(folder){folder.open();for(const c of folder.__controllers){if(typeof m.settings[c.property]!=='number')continue;const input=c.domElement.querySelector('input');if(input)input.dataset.aimNumericTest=c.property;const slider=c.domElement.querySelector('.slider');if(slider)slider.dataset.aimSliderTest=c.property;}for(const child of Object.values(folder.__folders))mark(child);}mark(m.menu);
 },symbols);
 async function sample(label,key){await page.waitForTimeout(60);const r=await page.evaluate(({label,key})=>{const m=window.__devastMod;m.aim.refresh();const line=m.targets.lines[0],packet=window.__numericTransport.packets.filter(p=>p[0]===6).at(-1);return {label,key,input:document.querySelector('[data-aim-numeric-test="'+key+'"]').value,value:m.settings[key],type:typeof m.settings[key],mode:m.settings.resolverType,angle:m.aim.lastAngle,line:{x:line.x2,y:line.y2},native_angle:packet?.[1],saved:JSON.parse(localStorage.getItem('DevastUntitledV4:aim:v1'))[key]};},{label,key});results.push(r);return r;}
 async function type(key,value,commit){const locator=page.locator('[data-aim-numeric-test="'+key+'"]');await locator.scrollIntoViewIfNeeded();await locator.click();await locator.press('ControlOrMeta+A');await locator.pressSequentially(String(value),{delay:25});if(commit)await locator.press(commit);return sample('typed '+value+' '+(commit||'uncommitted'),key);}
 const original=await sample('initial','distanceCoefficient');
 const uncommitted=await type('distanceCoefficient',10,null);assert.equal(uncommitted.value,10,'Typing did not apply immediately');assert.equal(uncommitted.saved,10);
 const entered=await type('distanceCoefficient',10,'Enter');assert.equal(entered.value,10);assert.equal(entered.saved,10);
 const tabbed=await type('distanceCoefficient',1000,'Tab');assert.equal(tabbed.value,1000);assert.equal(tabbed.saved,1000);assert.notEqual(entered.angle,tabbed.angle);assert.notDeepEqual(entered.line,tabbed.line);assert.notEqual(entered.native_angle,tabbed.native_angle);
 const offset0=await type('offsetCoefficient',0,'Enter'),offset2=await type('offsetCoefficient',2,'Tab');assert.equal(offset2.value,2);assert.notEqual(offset0.angle,offset2.angle);
 const speed1=await type('bulletSpeedCoefficient',1,'Enter'),speed20=await type('bulletSpeedCoefficient',20,'Tab');assert.equal(speed20.value,20);assert.notEqual(speed1.angle,speed20.angle);
 const slider=page.locator('[data-aim-slider-test="distanceCoefficient"]');await slider.scrollIntoViewIfNeeded();const bounds=await slider.boundingBox();assert.ok(bounds);
 for(const fraction of [.02,.98]){await page.mouse.move(bounds.x+bounds.width*.5,bounds.y+bounds.height*.5);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*fraction,bounds.y+bounds.height*.5,{steps:5});await page.mouse.up();await sample('slider '+fraction,'distanceCoefficient');}
 const dragged=results.slice(-2);assert.notEqual(dragged[0].value,dragged[1].value);assert.notEqual(dragged[0].angle,dragged[1].angle);
 for(const[key,value]of [['mouseFov',12345],['mouseFov',50],['lockId',-1],['lockId',120],['jitterOffset',180],['smoothLineMs',0],['smoothLineMs',200],['aimTickRate',50]])assert.equal((await type(key,value,'Enter')).value,value);
 await page.evaluate(()=>{window.__numericTransport.restore();window.__devastMod.setSetting('AimBotEnabled',false);});
 const keys=['distanceCoefficient','offsetCoefficient','bulletSpeedCoefficient','mouseFov','lockId','jitterOffset','smoothLineMs','aimTickRate'];
 const saved=await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,window.__devastMod.settings[k]])),keys);
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.__devastMod?.menu);
 const restored=await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,window.__devastMod.settings[k]])),keys);assert.deepEqual(restored,saved);
 return {status:'passed',engine:'untitled-v4',physical_text_entry:true,enter_and_tab_commit:true,slider_drag:true,native_angle_changes:true,saved_after_reload:restored,samples:results};
}
module.exports={verifyPhysical};
