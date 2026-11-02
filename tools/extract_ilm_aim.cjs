// Extract reviewed aim declarations only, not startup/access/network code.
const fs=require('node:fs'),z=require('node:zlib'),crypto=require('node:crypto'),a=require('./parser.cjs');
const names=['_0x3e2cd1','_0x218077','_0x4b5d6f','_0x391c19','_0x4a7389'];
function clean(source){
 const tree=a.parse(source,{ecmaVersion:'latest'}),todo=[tree],edits=[];
 while(todo.length){const n=todo.pop();if(!n||typeof n!=='object')continue;
  if(n.type==='VariableDeclaration'&&n.declarations.length===1&&['_0x225287','_0x349c'].includes(n.declarations[0].init?.name)){
   const name=n.declarations[0].id.name;
   // Literal decoder calls were replaced already: alias must have no remaining use.
   const matches=source.match(new RegExp('\\b'+name+'\\b','g'))||[];if(matches.length!==1)throw Error('Live decoder dependency '+name);
   edits.push(n);continue;
  }
  for(const v of Object.values(n)){if(Array.isArray(v))todo.push(...v);else if(v&&typeof v==='object')todo.push(v);}
 }
 for(const n of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,n.start)+source.slice(n.end);
 return {source,removed:edits.length};
}
function format(source){let result='',pos=0;for(const t of a.tokenizer(source,{ecmaVersion:'latest'})){result+=source.slice(pos,t.end);pos=t.end;if(['{','}',';'].includes(t.type.label))result+='\n';}return result+source.slice(pos);}
if(require.main===module){
 const src=fs.readFileSync('build/ilm-upload/decoded.js','utf8'),tree=a.parse(src,{ecmaVersion:'latest'});
 const blocks=names.map(name=>{const n=tree.body.find(n=>n.id?.name===name);if(!n)throw Error('Missing '+name);return {name,source:src.slice(n.start,n.end)};});
 const refs={upload_sha256:'65ef72c81cd54b665e95cf6954ee080ebb098fee25b2db12773a93a94dd88315',blocks};
 fs.writeFileSync('recovery/ilm-aim-reference.json.gz',z.gzipSync(JSON.stringify(refs),{level:9}));
 const nodes=[],todo=[tree];while(todo.length){const n=todo.pop();if(!n||typeof n!=='object')continue;nodes.push(n);for(const v of Object.values(n)){if(Array.isArray(v))todo.push(...v);else if(v&&typeof v==='object')todo.push(v);}}
 const folders=nodes.filter(n=>n.type==='VariableDeclaration'&&n.declarations.some(d=>d.id.name==='_0xaa24fd'));
 if(folders.length!==1)throw Error('Expected one ILM aim folder');
 const folder=folders[0],controls=nodes.filter(n=>n.type==='ExpressionStatement'&&n.start>=folder.end).sort((a,b)=>a.start-b.start)[0];
 if(!src.slice(controls.start,controls.end).startsWith('_0xaa24fd['))throw Error('Unexpected ILM aim controls');
 const renders=nodes.filter(n=>n.type==='FunctionDeclaration'&&n.id?.name==='_0x341470');
 if(renders.length!==1)throw Error('Expected one ILM aim renderer');
 const lines=renders[0].body.body.find(n=>n.type==='IfStatement');
 const menuRefs={upload_sha256:refs.upload_sha256,blocks:[{name:'menu',source:src.slice(folder.start,folder.end)+'\n'+src.slice(controls.start,controls.end)},{name:'lines',source:src.slice(lines.start,lines.end)}]};
 fs.writeFileSync('recovery/ilm-aim-menu-reference.json.gz',z.gzipSync(JSON.stringify(menuRefs),{level:9}));
 // Check that decoder aliases are unused, but retain every declaration verbatim.
 const checked=blocks.map(b=>clean(b.source));const core=blocks.map(b=>b.source).join('\n\n');
 fs.writeFileSync('build/ilm-upload/core.js',core);
 console.log(JSON.stringify({declarations:names,removed_unused_decoder_aliases:0,preserved_unused_decoder_aliases:checked.reduce((s,x)=>s+x.removed,0),sha256:crypto.createHash('sha256').update(core).digest('hex')}));
}
module.exports={names,clean};
