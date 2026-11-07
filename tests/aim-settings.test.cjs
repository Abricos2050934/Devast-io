const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,menu,control}=require('./mod-fixture.cjs'),{reference}=require('../tools/audit_message15.cjs');
function setup(){const f=fixture({dom:true});f.gui=menu(f);f.folder=f.gui.__folders['Best Aim Bot #1'];f.mod.setSetting('AimBotEnabled',true);f.mod.setSetting('mouseFovEnable',false);f.mod.setSetting('lockId',2);f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,1,2000,1000,true);f.mod.trackPacket(1,2,1,2000,1100,true);return f;}
test('the complete imported menu retains source order, choices and editable numeric values',()=>{
 const f=setup();try{assert.deepEqual(f.folder.__controllers.map(c=>c.property),reference().menu_controls);assert.equal(f.gui.__folders['Aim Bot'],undefined);assert.equal(f.gui.__folders.Prediction,undefined);assert.ok(f.gui.__folders.Visuals.__folders.Colors);assert.equal(f.mod.settings.AimbotKey,'KeyZ');}finally{f.mod.dispose();}
});
for(const [key,a,b]of [['distanceCoefficient',10,1000],['offsetCoefficient',0,3]])test(key+' changes the source prediction and native angle through the menu',()=>{
 const f=setup();try{f.setClock(2000);control(f.folder,key).setValue(a);f.mod.aim.refresh();const first=f.packets.at(-1)[1];f.setClock(2050);control(f.folder,key).setValue(b);f.mod.aim.refresh();assert.notEqual(f.packets.at(-1)[1],first);}finally{f.mod.dispose();}
});
test('bullet coefficient keeps its source semantics in linear and trigonometric modes',()=>{
 const f=setup();try{const read=value=>{control(f.folder,'bulletSpeedCoefficient').setValue(value);return f.mod.aim.resolve();};assert.equal(read(1),read(15));control(f.folder,'resolverType').setValue('trygonometrical');assert.notEqual(read(1),read(15));}finally{f.mod.dispose();}
});
test('typed numeric values apply immediately, accept a decimal comma and persist separately',()=>{
 const f=setup();try{const input=control(f.folder,'offsetCoefficient').domElement.querySelector('input');input.value='0,5';for(const fn of input.listeners.get('input'))fn();assert.equal(f.mod.settings.offsetCoefficient,.5);assert.equal(input.value,'0.5');assert.equal(JSON.parse(f.storage.get('DevastMessage15:aim:v1')).offsetCoefficient,.5);const g=fixture({saved:Object.fromEntries(f.storage)});try{assert.equal(g.mod.settings.offsetCoefficient,.5);}finally{g.mod.dispose();}}finally{f.mod.dispose();}
});
