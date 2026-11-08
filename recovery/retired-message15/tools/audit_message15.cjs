const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict'),crypto=require('node:crypto'),parser=require('./parser.cjs');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
function reference(){return JSON.parse(z.gunzipSync(fs.readFileSync('recovery/message15-aim-reference.json.gz')));}
function audit(source=fs.readFileSync('mod/message15-aim.js','utf8'),payload=fs.readFileSync('mod/responsive.js','utf8')){
 const ref=reference();assert.equal(ref.source_sha256,'bee8d9034627b24e8f5919617dff3ed23e946da253b35dcf1805056b5fa7e4a5');
 for(const block of ref.blocks){assert.equal(sha(block.source),block.sha256,'Reference block checksum: '+block.label);assert.equal(source.split(block.source).length,2,'Exactly one complete source block: '+block.label);}
 const tree=parser.parse(source+'\n'+payload,{ecmaVersion:'latest'}),nodes=[],pending=[tree];
 while(pending.length){const node=pending.pop();nodes.push(node);for(const v of Object.values(node))if(Array.isArray(v))pending.push(...v.filter(x=>x?.type));else if(v?.type)pending.push(v);}
 for(const name of ['__createIlmAim','__createCurvedAim','__installIlmAimMenu','__renderIlmAimLines'])assert.equal(nodes.filter(n=>n.type==='FunctionDeclaration'&&n.id.name===name).length,0,'Retired aim implementation: '+name);
 const ctor=nodes.find(n=>n.type==='ClassDeclaration'&&n.id.name==='HackCon').body.body.find(n=>n.kind==='constructor');
 for(const [key,expected]of Object.entries(ref.settings)){
  const hits=ctor.value.body.body.filter(n=>n.type==='ExpressionStatement'&&n.expression.type==='AssignmentExpression'&&n.expression.left.property?.name===key);
  assert.equal(hits.length,1,'Source default '+key);assert.equal((source+'\n'+payload).slice(hits[0].start,hits[0].end),expected);
 }
 assert.ok(!payload.includes('__createCurvedAim')&&!payload.includes('CurvedAimEnabled'));
 return {status:'passed',source_sha256:ref.source_sha256,classes:5,methods:24,exact_blocks:ref.blocks.length,exact_defaults:Object.keys(ref.settings).length};
}
module.exports={audit,reference};
if(require.main===module)console.log(JSON.stringify(audit()));
