async function verifyPhysical(page,symbols) {
 const assert=require('node:assert/strict'),results=[];
 await page.evaluate(s=>{
  window.__numericPauseWorld=true;
  const m=window.__devastMod,n=window.__updateProbe;
  const self=n.world[s['ᅠᏧ‍']];
  for(const [object,key,value]of [[self,'id',1],[n.network,'state',1]])Object.defineProperty(object,key,{configurable:true,enumerable:true,get:()=>value,set(){}});
  window.__numericTransport=n.capturePackets();
  for(const [key,value]of Object.entries({AimBotEnabled:true,JitterEnabled:false,jitterActive:false,DodgePlayerEnabled:false,autoFire:false,mouseFovEnable:false,lockId:2,resolverType:'linear',visualizeResolving:true,distanceCoefficient:100,offsetCoefficient:.1,bulletSpeedCoefficient:4}))m.setSetting(key,value);
  m.reconnect.sessionEnded=false;m.onHandshake();m.observeSocket(null);m.aim.onDeath();m.onHandshake();
  n.world[s['ᴎ︃ᄉ']][1]={[s['а༤̘']]:-1};n.world[s['ᴎ︃ᄉ']][2]={[s['а༤̘']]:-1};
  m.trackPacket(0,1,1,1000,1000,true);m.trackPacket(0,2,1,2000,1000,true);m.trackPacket(0,2,1,2000,1100,true);
  m.menu.open();m.menu.domElement.style.display='';m.menu.domElement.style.zIndex='2147483647';m.menu.__folders['Best Aim Bot #1'].open();
  for(const c of m.menu.__folders['Best Aim Bot #1'].__controllers){const input=c.domElement.querySelector('input');if(input)input.dataset.aimNumericTest=c.property;const slider=c.domElement.querySelector('.slider');if(slider)slider.dataset.aimSliderTest=c.property;}
 },symbols);
 async function sample(label,key){const r=await page.evaluate(({label,key})=>{const m=window.__devastMod;m.aim.refresh();const line=m.targets.lines[0],packet=window.__numericTransport.packets.filter(p=>p[0]===6).at(-1);return {label,key,input:document.querySelector('[data-aim-numeric-test="'+key+'"]').value,value:m.settings[key],type:typeof m.settings[key],mode:m.settings.resolverType,angle:m.aim.lastAngle,line:{x:line.x2,y:line.y2},native_angle:packet?.[1],saved:JSON.parse(localStorage.getItem('DevastMessage15:aim:v1'))[key]};},{label,key});results.push(r);return r;}
 async function type(key,value,commit){const locator=page.locator('[data-aim-numeric-test="'+key+'"]');await locator.scrollIntoViewIfNeeded();await locator.click();await locator.press('ControlOrMeta+A');await locator.pressSequentially(String(value),{delay:25});if(commit)await locator.press(commit);return sample('typed '+value+' '+(commit||'uncommitted'),key);}
 const original=await sample('initial','distanceCoefficient');
 const uncommitted=await type('distanceCoefficient',10,null);assert.equal(uncommitted.value,10,'Typing did not apply immediately');assert.equal(uncommitted.saved,10);
 const entered=await type('distanceCoefficient',10,'Enter');assert.equal(entered.value,10);assert.equal(entered.saved,10);
 const tabbed=await type('distanceCoefficient',1000,'Tab');assert.equal(tabbed.value,1000);assert.equal(tabbed.saved,1000);assert.notEqual(entered.angle,tabbed.angle);assert.notDeepEqual(entered.line,tabbed.line);assert.notEqual(entered.native_angle,tabbed.native_angle);
 const offset0=await type('offsetCoefficient',0,'Enter');const offset3=await type('offsetCoefficient',3,'Tab');assert.equal(offset0.value,0);assert.equal(offset3.value,3);assert.notEqual(offset0.angle,offset3.angle);
 // Drag the actual slider, including move/up delivery through the menu.
 const slider=page.locator('[data-aim-slider-test="distanceCoefficient"]');await slider.scrollIntoViewIfNeeded();const bounds=await slider.boundingBox();assert.ok(bounds);
 for(const [fraction,label]of [[.02,'slider left'],[.98,'slider right']]){await page.mouse.move(bounds.x+bounds.width*.5,bounds.y+bounds.height*.5);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*fraction,bounds.y+bounds.height*.5,{steps:5});await page.mouse.up();await sample(label,'distanceCoefficient');}
 const left=results.find(r=>r.label==='slider left'),right=results.find(r=>r.label==='slider right');assert.notEqual(left.value,right.value);assert.notEqual(left.angle,right.angle);
 const comma=await type('offsetCoefficient','0,5',null);assert.equal(comma.value,.5);assert.equal(comma.input,'0.5');
 const linear1=await type('bulletSpeedCoefficient',1,'Enter'),linear15=await type('bulletSpeedCoefficient',15,'Tab');assert.equal(linear1.angle,linear15.angle);
 const mode=page.locator('.dg select').filter({has:page.locator('option[value="trygonometrical"]')});await mode.selectOption('trygonometrical');
 const trig1=await type('bulletSpeedCoefficient',1,'Enter'),trig15=await type('bulletSpeedCoefficient',15,'Tab');assert.equal(trig1.mode,'trygonometrical');assert.notEqual(trig1.angle,trig15.angle);assert.notEqual(trig1.native_angle,trig15.native_angle);
 for(const [key,value]of [['mouseFov',696969],['mouseFov',0],['lockId',-1],['lockId',120],['jitterOffset',360],['DodgeDetectRadius',800]]){const r=await type(key,value,'Enter');assert.equal(r.value,value,'Numeric boundary not applied '+key);}
 await page.evaluate(()=>{window.__numericTransport.restore();window.__devastMod.setSetting('AimBotEnabled',false);});
 const saved=await page.evaluate(()=>Object.fromEntries(['resolverType','distanceCoefficient','offsetCoefficient','bulletSpeedCoefficient','mouseFov','lockId','jitterOffset','DodgeDetectRadius'].map(key=>[key,window.__devastMod.settings[key]])));
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.__devastMod?.menu);
 const restored=await page.evaluate(keys=>Object.fromEntries(keys.map(key=>[key,window.__devastMod.settings[key]])),Object.keys(saved));assert.deepEqual(restored,saved,'Numeric settings changed after reload');
 return {status:'passed',saved_after_reload:restored,physical_text_entry:true,enter_and_tab_commit:true,slider_drag:true,native_angle_changes:true,uncommitted_input_changes_setting:uncommitted.value!==original.value,samples:results};
}
module.exports={verifyPhysical};
