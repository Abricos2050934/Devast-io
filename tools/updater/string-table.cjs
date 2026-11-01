// Decode the reviewed variation-selector + four-round byte transform from data.
// No downloaded decoder function is evaluated.
function decodeStringTable(tree,nodes){
 const arrays=nodes.filter(n=>n.type==='VariableDeclarator'&&n.init?.type==='ArrayExpression'&&n.init.elements.length>100&&n.init.elements.every(e=>e?.type==='Literal'&&typeof e.value==='string'&&/[\ufe00-\ufe0f]/.test(e.value)));
 if(!arrays.length)return new Map();if(arrays.length!==1)throw Error('Ambiguous encoded string table');const array=arrays[0];
 const maps=nodes.filter(n=>n.type==='ObjectExpression'&&n.end<array.start&&n.properties.length===16&&n.properties.every(p=>p.key.type==='Literal'&&p.key.value>=0xfe00&&p.key.value<=0xfe0f&&p.value.type==='Literal'&&Number.isInteger(p.value.value)));
 const keys=nodes.filter(n=>n.type==='ArrayExpression'&&n.end<array.start&&n.elements.length===4&&n.elements.every(x=>x?.type==='Literal'&&Number.isInteger(x.value)&&x.value>=0&&x.value<=255));
 if(maps.length!==1||keys.length!==1)throw Error('Unknown string table cipher');
 const nibble=new Map(maps[0].properties.map(p=>[p.key.value,p.value.value])),key=keys[0].elements.map(x=>x.value);
 if(new Set(nibble.values()).size!==16||[...nibble.values()].some(n=>n<0||n>15))throw Error('Invalid nibble table');
 const decoded=array.init.elements.map(({value})=>{
  const digits=[...value].map(c=>nibble.get(c.charCodeAt(0))).filter(x=>x!==undefined);if(digits.length%2)throw Error('Invalid table byte count');
  const bytes=[];for(let i=0;i<digits.length;i+=2)bytes.push(digits[i]*16+digits[i+1]);
  const plain=[];for(let i=0;i<bytes.length;i+=2){let l=bytes[i],r=bytes[i+1]||0;for(let k=3;k>=0;k--)[l,r]=[r^((l*key[k]+key[k])&255),l];plain.push(l);if(i+1<bytes.length)plain.push(r);}
  const pad=plain.at(-1);if(pad>=1&&pad<=2&&plain.length>=pad)plain.length-=pad;
  const length=(plain[0]<<8)|plain[1];if(length>plain.length-2)throw Error('Invalid decoded table length');
  const b64=String.fromCharCode(...plain.slice(2,2+length));if(!/^[A-Za-z\d+/]*={0,2}$/.test(b64))throw Error('Invalid decoded table data');
  return Buffer.from(b64,'base64').toString('latin1');
 });
 const aliasGroups=nodes.filter(n=>n.type==='VariableDeclaration'&&n.start>array.end&&n.declarations.length>100&&n.declarations.every(d=>d.init?.type==='MemberExpression'&&d.init.object.type==='Identifier'&&d.init.property.type==='Literal'));
 if(aliasGroups.length!==1)throw Error('Unknown string alias table');const name=aliasGroups[0].declarations[0].init.object.name;
 if(!aliasGroups[0].declarations.every(d=>d.init.object.name===name))throw Error('Mixed string alias tables');
 return new Map([[name,decoded]]);
}
module.exports={decodeStringTable};
