const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),{fixture}=require('./mod-fixture.cjs'),{analyze}=require('../tools/updater/static.cjs'),{aimTransportOperation}=require('../tools/updater/aim-transport.cjs');
function plan(source){const a=analyze(source);return aimTransportOperation(a,{'ᴎᚂρ':'jsonSend'},{'еϲᄄ':'codec','ᴎ︅ހ':'encode'},new Set(a.functions));}
const source='function sender(text){activity=now;wire(codec.encode(JSON.parse(text)));}const network={jsonSend:sender};';
test('reviewed combat bridge preserves codec/socket arguments while keeping native input activity separate',()=>{
 const op=plan(source),received=[],c={activity:0,now:100,wire:p=>received.push(p),codec:{encode:p=>p}};
 vm.runInNewContext(op.after+';sender.__devastAimTransport([6,42]);',c);assert.equal(c.activity,0);assert.equal(JSON.stringify(received),'[[6,42]]');
 vm.runInNewContext('sender("[4]")',c);assert.equal(c.activity,100);assert.equal(JSON.stringify(received),'[[6,42],[4]]');
});
test('changed native transport contracts stop generation',()=>{
 for(const changed of [source.replace('JSON.parse(text)','text'),source.replace('codec.encode','codec.decode'),source.replace('activity=now;','activity++;'),source.replace('wire(codec','wire(1,codec')])assert.throws(()=>plan(changed),/contract changed/);
 const a=analyze(source);assert.throws(()=>aimTransportOperation(a,{'ᴎᚂρ':'jsonSend'},{'еϲᄄ':'codec','ᴎ︅ހ':'encode'},new Set()),/not independently reviewed/);
});
test('installed aim uses the dedicated bridge; other features retain the ordinary sender',()=>{
 const f=fixture(),wire=[];try{f.B.aimSend=p=>{wire.push(p.slice());p[0]=99;};for(const [k,v]of Object.entries({mouseFovEnable:false,lockId:2,AimBotEnabled:false}))f.mod.setSetting(k,v);f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,1,1500,1100,true);f.mod.setSetting('AimBotEnabled',true);f.setClock(2000);(f.mod.aimModule.refreshTargets(),f.mod.aim.refresh());assert.equal(f.packets.length,0);assert.equal(wire[0][0],6);assert.equal(f.mod.connectionInfo().modCommandsByOpcode[6],1);assert.equal(f.mod.connectionInfo().aimTransport.nativeSenderAvailable,true);
 f.mod.setSetting('AntiKickEnabled',true);f.mod.step(2000);f.mod.step(10000);assert.ok(f.packets.some(p=>p[0]===0));assert.equal(wire.filter(p=>p[0]===0).length,0);
 }finally{f.mod.dispose();}
});
