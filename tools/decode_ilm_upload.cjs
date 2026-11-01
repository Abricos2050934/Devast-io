// Decode only the isolated literal string table and its bounded rotation routine.
// Never execute the uploaded game bundle, startup handlers, or network requests.
const fs=require('fs'),vm=require('vm'),a=require('./parser.cjs');
const src=fs.readFileSync('build/ilm-upload/root_data_0_rules_0_file.js','utf8');const tree=a.parse(src,{ecmaVersion:'latest'});
const table=tree.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='_0x2c45');
const decoder=tree.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='_0x349c');
const literals=table.body.body[0].declarations[0].init;
if(literals.type!=='ArrayExpression'||!literals.elements.every(n=>n.type==='Literal'&&typeof n.value==='string'))throw Error('Unexpected ILM table');
if(decoder.end-decoder.start!==217||tree.body[1].end-tree.body[1].start!==581)throw Error('Unexpected decoder shape');
const pure=[table,decoder,tree.body[1]].map(n=>src.slice(n.start,n.end)).join('\n');
const strings=vm.runInNewContext(pure+'\n_0x2c45().slice();',Object.create(null),{timeout:1000});
const aliases=new Set(['_0x349c']);const nodes=[];const todo=[tree];while(todo.length){const n=todo.pop();if(!n||typeof n!=='object')continue;nodes.push(n);for(const v of Object.values(n)){if(Array.isArray(v))todo.push(...v);else if(v&&typeof v==='object')todo.push(v);}}
for(let i=0;i<10;i++)for(const n of nodes)if(n.type==='VariableDeclarator'&&n.init?.type==='Identifier'&&aliases.has(n.init.name))aliases.add(n.id.name);
const edits=[];for(const n of nodes)if(n.type==='CallExpression'&&n.callee.type==='Identifier'&&aliases.has(n.callee.name)&&n.arguments.length===1&&n.arguments[0].type==='Literal'&&Number.isInteger(n.arguments[0].value)){
 const value=strings[n.arguments[0].value-0x1a5];if(typeof value!=='string')throw Error('Decoder index out of range');edits.push({start:n.start,end:n.end,text:JSON.stringify(value)});
}
let decoded=src;for(const e of edits.sort((a,b)=>b.start-a.start))decoded=decoded.slice(0,e.start)+e.text+decoded.slice(e.end);
a.parse(decoded,{ecmaVersion:'latest'});fs.writeFileSync('build/ilm-upload/decoded.js',decoded);
let pretty='',pos=0,indent=0;for(const t of a.tokenizer(decoded,{ecmaVersion:'latest'})){
 pretty+=decoded.slice(pos,t.end);pos=t.end;if(t.type.label==='{'||t.type.label===';')pretty+='\n';if(t.type.label==='}')pretty+='\n';
}
pretty+=decoded.slice(pos);fs.writeFileSync('build/ilm-upload/readable.js',pretty);
console.log('Decoded',edits.length,'string references from',strings.length,'literal entries; entire bundle not executed');
