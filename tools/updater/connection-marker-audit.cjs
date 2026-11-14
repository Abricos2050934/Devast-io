// Read-only fixture extraction. This module never changes the emitted client.
const assert=require('node:assert/strict'),{hash}=require('./static.cjs');
function connectionMarkerProbe(a,networkName){
 const marker='__autoPortAimbotPacketTransport',tables=[];
 for(const n of a.nodes){
  if(n.type!=='ArrayExpression'||!n.elements.length||n.elements.length>128||!n.elements.some(row=>row?.type==='ArrayExpression'&&row.elements.length===marker.length))continue;
  const values=n.elements.map(row=>row?.type==='ArrayExpression'?row.elements.map(a.constant):[]);
  if(!values.every(row=>row.length&&row.every(v=>Number.isInteger(v)&&v>=0&&v<=255)))continue;
  for(let key=0;key<256;key++)if(values.some(row=>row.length===marker.length&&String.fromCharCode(...row.map(v=>v^key))===marker))tables.push({node:n,key,names:values.map(row=>String.fromCharCode(...row.map(v=>v^key)))});
 }
 assert.equal(tables.length,1,'Unique native connection marker table required');
 const table=tables[0];let fn=table.node;while(fn&&!/Function/.test(fn.type))fn=a.parent.get(fn);
 assert.equal(fn?.type,'FunctionDeclaration');
 const gates=fn.body.body.flatMap(n=>n.declarations||[]).filter(d=>d.init?.type==='ConditionalExpression'&&a.constant(d.init.consequent)===0&&a.constant(d.init.alternate)===1);
 assert.equal(gates.length,1,'Unique native connection check result required');
 const gate=gates[0],aliases=new Map(),windowNames=new Set(),storageNames=new Set();
 for(const n of a.nodes){
  if(n.start<fn.start||n.end>gate.end)continue;
  if(n.type==='MemberExpression'&&(n.computed?a.constant(n.property):n.property.name)==='getItem'&&n.object.type==='Identifier')storageNames.add(n.object.name);
  if(n.type!=='Identifier')continue;
  const b=a.binding(n),p=a.parent.get(n);
  if(b?.node&&b.node.start>=fn.start&&b.node.end<=fn.end)continue;
  if(p.type==='MemberExpression'&&!p.computed&&p.property===n||p.type==='Property'&&!p.computed&&p.key===n)continue;
  const v=a.constant(n);if(v!==undefined)aliases.set(n.name,v);
  if(b?.init?.type==='Identifier'&&b.init.name==='window')windowNames.add(n.name);
 }
 assert.equal(windowNames.size,1);assert.equal(storageNames.size,1);
 const selected=fn.body.body[0].declarations[0].init;
 assert.equal(selected.type,'MemberExpression');
 const key=selected.computed?a.constant(selected.property):selected.property.name;
 assert.equal(typeof key,'string');
 const setup=[...aliases].map(([k,v])=>'const '+k+'='+JSON.stringify(v)+';').join('')+
  [...windowNames].map(k=>'const '+k+'=window;').join('')+
  [...storageNames].map(k=>'const '+k+'=localStorage;').join('')+
  'const '+networkName+'={'+JSON.stringify(key)+':[67,0,0,1,"fixture",20,0,[443],0]};';
 const prefix=a.source.slice(fn.start,gate.end);
 return {code:setup+prefix+';return '+gate.id.name+';}return '+fn.id.name+'();',evidence:{scope:'Unchanged connection-check prefix with resolved outer constants and synthetic server data; no socket construction',native_sha256:hash(a.source),function_sha256:hash(a.source.slice(fn.start,fn.end)),prefix_sha256:hash(prefix),function_start:fn.start,function_end:fn.end,global_names:table.names,xor_key:table.key}};
}
module.exports={connectionMarkerProbe};
