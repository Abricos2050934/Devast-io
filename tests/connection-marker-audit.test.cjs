const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {analyze}=require('../tools/updater/static.cjs');
const {readonlyConstants}=require('../tools/updater/semantic.cjs');
const {connectionMarkerProbe}=require('../tools/updater/connection-marker-audit.cjs');
test('native marker fixture preserves computed server selection and detects the historical storage marker',()=>{
 const table=[...'__autoPortAimbotPacketTransport'].map(c=>c.charCodeAt(0)^29);
 const source=`const browser=window,storage=localStorage;
 function connect(){
  var server=network[(()=>['selected','Server'].join(''))()];
  var table=[${JSON.stringify(table)}];
  var flag=!(browser[table[0].map(c=>String.fromCharCode(c^29)).join('')]||storage.getItem('BestModMenuConfig'))?0:1;
  throw Error('Do not construct a socket in this fixture');
 }`;
 const probe=connectionMarkerProbe(readonlyConstants(analyze(source)),'network');
 let saved=null;
 const context={window:{},localStorage:{getItem:()=>saved}};
 const run=()=>vm.runInNewContext('(function(){'+probe.code+'})()',context);
 assert.equal(run(),0);
 saved='{}';assert.equal(run(),1);
 saved=null;assert.equal(run(),0);
 context.window.__autoPortAimbotPacketTransport={};assert.equal(run(),1);
 assert.equal(probe.evidence.xor_key,29);
 assert.ok(!probe.code.includes('Do not construct a socket'));
});
test('native marker fixture keeps a prologue and nested branch before the result',()=>{
 const table=[...'__autoPortAimbotPacketTransport'].map(c=>c.charCodeAt(0)^29);
 const source=`const browser=window,storage=localStorage;function connect(){const enabled=1;if(enabled===1){var server=network.selected;var table=[${JSON.stringify(table)}];var flag=!(browser[table[0].map(c=>String.fromCharCode(c^29)).join('')]||storage.getItem('BestModMenuConfig'))?0:1;throw Error('Socket must never be constructed');}}`;
 const probe=connectionMarkerProbe(readonlyConstants(analyze(source)),'network');let saved=null;const context={window:{},localStorage:{getItem:()=>saved}};
 assert.equal(vm.runInNewContext('(function(){'+probe.code+'})()',context),0);
 saved='{}';assert.equal(vm.runInNewContext('(function(){'+probe.code+'})()',context),1);
 assert.ok(!probe.code.includes('Socket must never be constructed'));
});
test('an ambiguous native marker result is still rejected',()=>{
 const table=[...'__autoPortAimbotPacketTransport'].map(c=>c.charCodeAt(0)^29);
 const source=`const browser=window,storage=localStorage;function connect(){var table=[${JSON.stringify(table)}];var first=browser.mark?0:1;var second=storage.getItem('marker')?0:1;}`;
 assert.throws(()=>connectionMarkerProbe(readonlyConstants(analyze(source)),'network'),/Unique native connection check result/);
});
test('a mutated 0/1 loop state is not confused with the stable native result',()=>{
 const table=[...'__autoPortAimbotPacketTransport'].map(c=>c.charCodeAt(0)^29);
 const source=`const browser=window,storage=localStorage;function connect(){var table=[${JSON.stringify(table)}];let state=browser.skip?0:1;do{state=2;}while(state<2);var flag=!(browser[table[0].map(c=>String.fromCharCode(c^29)).join('')]||storage.getItem('BestModMenuConfig'))?0:1;throw Error('Socket must never be constructed');}`;
 const probe=connectionMarkerProbe(readonlyConstants(analyze(source)),'network');
 let saved=null;const context={window:{},localStorage:{getItem:()=>saved}};
 const run=()=>vm.runInNewContext('(function(){'+probe.code+'})()',context);
 assert.equal(run(),0);saved='{}';assert.equal(run(),1);
 assert.ok(!probe.code.includes('Socket must never be constructed'));
});
