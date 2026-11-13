const test=require('node:test'),assert=require('node:assert/strict'),{analyze}=require('../tools/updater/static.cjs'),{readonlyConstants}=require('../tools/updater/semantic.cjs'),{deathDiagnosticOperations}=require('../tools/updater/death-diagnostics.cjs'),{fixture}=require('./mod-fixture.cjs');
function plan(dispatch){
 const before='function die(packet){}',after='function die(packet){if(__responsiveMod)__responsiveMod.observeDeath(packet);}',roles={};
 const source=before+'\n'+dispatch,operations=[{id:'native-observe-server-death',expected:1,before,after}];
 return {operations:deathDiagnosticOperations(readonlyConstants(analyze(source)),operations,roles),roles};
}
for(const opcode of [5,27,203])test('death diagnostics follow the actual incoming opcode '+opcode,()=>{
 const r=plan(`function receive(packet){switch(packet[0]){case ${opcode}:die(packet);break;}}`);
 assert.equal(r.roles.nativeDeathOpcode,opcode);assert.ok(r.operations[0].after.includes('observeDeath(packet,'+opcode+')'));
 const f=fixture();try{
  f.mod.observeDeath(new Uint8Array([opcode,0,2,91,92]),opcode);const event=f.mod.connectionInfo().events.at(-1);
  assert.equal(event.deathOpcode,opcode);assert.equal(event.deathPrefixHex,opcode.toString(16).padStart(2,'0')+' 00 02');assert.equal(event.deathPacketLength,5);assert.equal(f.mod.connectionInfo().awaitingPlay,true);assert.equal(f.packets.length,0);
 }finally{f.mod.dispose();}
});
test('dynamic, mismatched, missing and ambiguous death dispatches stop generation',()=>{
 for(const code of [
  'function receive(packet,other){switch(other[0]){case 27:die(packet);break;}}',
  'function receive(packet,opcode){switch(packet[0]){case opcode:die(packet);break;}}',
  'function receive(packet){switch(packet[0]){case -1:die(packet);break;}}',
  'function receive(packet){switch(packet[0]){case 256:die(packet);break;}}',
  'function receive(packet){switch(packet[0]){case 27:die(packet);break;case 28:die(packet);break;}}',
  'function receive(packet){die(packet);}'
 ])assert.throws(()=>plan(code),/death (dispatch|opcode)/);
});
test('the mapped prefix excludes unrelated packet contents and invalid expected opcodes',()=>{
 const f=fixture({saved:{token:'kept-account-secret'}});try{
  for(const opcode of [NaN,undefined,-1,256,'27']){f.mod.observeDeath(new Uint8Array([27,1,2]),opcode);assert.equal(f.mod.connectionInfo().events.at(-1).deathPrefixHex,undefined);}
  f.mod.observeDeath({0:27,1:1,2:2,length:3},27);assert.equal(f.mod.connectionInfo().events.at(-1).deathPrefixHex,undefined);
  f.mod.observeDeath(new Uint8Array([28,1,2]),27);assert.equal(f.mod.connectionInfo().events.at(-1).deathPrefixHex,undefined);
  assert.equal(f.storage.get('token'),'kept-account-secret');assert.ok(!JSON.stringify(f.mod.connectionInfo()).includes('kept-account-secret'));
 }finally{f.mod.dispose();}
});
