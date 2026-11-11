// Decode the reviewed symbol table + four-round byte transform from data.
// No downloaded decoder function is evaluated.
function decodeStringTable(tree,nodes,analysis){
 const aliases=nodes.filter(n=>n.type==='VariableDeclaration'&&n.declarations.length>100&&n.declarations.every(d=>d.init?.type==='MemberExpression'&&d.init.object.type==='Identifier'&&d.init.property.type==='Literal'));
 const decodeIsolated=()=>{
  if(aliases.length!==1||!analysis)throw Error('Ambiguous encoded string table');
  return require('./data-table.cjs').decodeDataTable(analysis,nodes,aliases[0]);
 };
 const arrays=nodes.filter(n=>n.type==='VariableDeclarator'&&n.init?.type==='ArrayExpression'&&n.init.elements.length>100&&n.init.elements.every(e=>e?.type==='Literal'&&typeof e.value==='string'&&e.value.length));
 // The permutation, rather than a fixed Unicode range, defines the alphabet.
 // Rotating between variation selectors, private-use and fullwidth symbols
 // changes the representation only; downloaded decoder code is never executed.
 const substitutions=nodes.filter(n=>n.type==='ObjectExpression'&&[16,256].includes(n.properties.length)&&n.properties.every(p=>p.type==='Property'&&p.key.type==='Literal'&&Number.isInteger(p.key.value)&&p.key.value>127&&p.key.value<=65535&&!(p.key.value>=0xd800&&p.key.value<=0xdfff)&&p.value.type==='Literal'&&Number.isInteger(p.value.value)));
 if(analysis)substitutions.push(...require('./affine-alphabet.cjs').affineAlphabets(nodes,analysis));
 const candidates=[];
 for(const array of arrays)for(const map of substitutions){
  if(map.end>=array.start)continue;
  const alphabet=new Set(map.properties.map(p=>p.key.value));
  // The historical encoder intersperses lowercase ASCII filler, which its
  // decoder ignores. Require real alphabet symbols in every encoded entry.
  if(array.init.elements.every(e=>[...e.value].some(c=>alphabet.has(c.charCodeAt(0)))&&[...e.value].every(c=>alphabet.has(c.charCodeAt(0))||/^[a-z]$/.test(c))))candidates.push({array,map});
 }
 if(!candidates.length){
  if(!arrays.length||!aliases.length)return new Map();
  return decodeIsolated();
 }
 if(candidates.length!==1)throw Error('Ambiguous encoded string table');
 const {array,map}=candidates[0],maps=[map];
 const keys=nodes.filter(n=>n.type==='ArrayExpression'&&n.end<array.start&&n.elements.length===4&&n.elements.every(x=>x?.type==='Literal'&&Number.isInteger(x.value)&&x.value>=0&&x.value<=255));
 // A 16/256-symbol alphabet identifies the packing, not the byte cipher.
 // New clients reuse that packing with a stream cipher and no four-byte key.
 // Resolve the actual construction loop in the bounded data interpreter;
 // never guess a key or execute the downloaded decoder in the host runtime.
 if(keys.length!==1)return decodeIsolated();
 const width=maps[0].properties.length,symbols=new Map(maps[0].properties.map(p=>[p.key.value,p.value.value])),key=keys[0].elements.map(x=>x.value);
 if(symbols.size!==width||new Set(symbols.values()).size!==width||[...symbols.values()].some(n=>n<0||n>=width))throw Error('Invalid symbol table');
 const decoded=array.init.elements.map(({value})=>{
  const digits=[...value].map(c=>symbols.get(c.charCodeAt(0))).filter(x=>x!==undefined);if(width===16&&digits.length%2)throw Error('Invalid table byte count');
  const bytes=width===256?digits:[];if(width===16)for(let i=0;i<digits.length;i+=2)bytes.push(digits[i]*16+digits[i+1]);
  const plain=[];for(let i=0;i<bytes.length;i+=2){let l=bytes[i],r=bytes[i+1]||0;for(let k=3;k>=0;k--)[l,r]=[r^((l*key[k]+key[k])&255),l];plain.push(l);if(i+1<bytes.length)plain.push(r);}
  const pad=plain.at(-1);if(pad>=1&&pad<=2&&plain.length>=pad)plain.length-=pad;
  const length=(plain[0]<<8)|plain[1];if(length>plain.length-2)throw Error('Invalid decoded table length');
  const b64=String.fromCharCode(...plain.slice(2,2+length));if(!/^[A-Za-z\d+/]*={0,2}$/.test(b64))throw Error('Invalid decoded table data');
  return Buffer.from(b64,'base64').toString('latin1');
 });
 const aliasGroups=nodes.filter(n=>n.type==='VariableDeclaration'&&n.start>array.end&&n.declarations.length>100&&n.declarations.every(d=>d.init?.type==='MemberExpression'&&d.init.object.type==='Identifier'&&d.init.property.type==='Literal'));
 if(aliasGroups.length!==1)throw Error('Unknown string alias table');const name=aliasGroups[0].declarations[0].init.object.name;
 if(!aliasGroups[0].declarations.every(d=>d.init.object.name===name))throw Error('Mixed string alias tables');
 const table=analysis?(analysis.binding(aliasGroups[0].declarations[0].init.object)||'global:'+name):name;
 return new Map([[table,decoded]]);
}
module.exports={decodeStringTable};
