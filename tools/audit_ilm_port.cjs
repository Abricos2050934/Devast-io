const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{parse}=require('./parser.cjs');
function reference(){return JSON.parse(z.gunzipSync(fs.readFileSync('recovery/message27-aim-reference.json.gz')));}
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function audit(source=fs.readFileSync('mod/ilm-aim.js','utf8'),payload=fs.readFileSync('mod/responsive.js','utf8')){
 const r=reference();assert.equal(r.upload_sha256,'f3001e45554d86505e89532faaa2aff5be69dec90b713e7966428273d2b1abd0');
 for(const b of r.blocks){assert.equal(hash(b.source),b.sha256);assert.ok(source.includes(b.source),'Missing exact uploaded block '+b.name);}
 for(const name of ['_0x3e2cd1','_0x218077','_0x4b5d6f','_0x391c19','__createCurvedAim','solveIntercept','__createUntitledAim','__createMessage15Aim'])assert.ok(!(source+'\n'+payload).includes(name),'Retired aim returned: '+name);
 const pending=[parse(source,{ecmaVersion:'latest'})],classes=[];
 while(pending.length){const n=pending.pop();if(n.type==='ClassDeclaration')classes.push(n);for(const v of Object.values(n))if(Array.isArray(v))pending.push(...v.filter(x=>x?.type));else if(v?.type)pending.push(v);}
 assert.deepEqual(classes.map(n=>n.id.name).sort(),['AimbotCon','GetAllTargetsCon','GetTarget','JitterCon','LinesCon']);
 return {status:'passed',upload_sha256:r.upload_sha256,active_override:'__BBY',classes:classes.length,exact_blocks:r.blocks.length,source_parity:'verbatim',additional_predictors:0};
}
module.exports={audit,reference};if(require.main===module)console.log(JSON.stringify(audit()));
