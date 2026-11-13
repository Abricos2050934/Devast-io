const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {deobfuscate}=require('../tools/updater/decoder.cjs'),{hash}=require('../tools/updater/static.cjs');
test('native decoder cache retains parsed output and its input/recipe evidence',()=>{
 const cacheDir=fs.mkdtempSync(path.join(os.tmpdir(),'devast-native-cache-'));
 try{const source='const data="process.exit(9)";',first=deobfuscate(source,{cacheDir}),second=deobfuscate(source,{cacheDir});assert.deepEqual(second,first);const meta=JSON.parse(fs.readFileSync(path.join(cacheDir,hash(source)+'.json')));assert.equal(meta.input_sha256,hash(source));assert.equal(meta.output_sha256,hash(source));assert.match(meta.recipe,/^[a-f0-9]{64}$/);}finally{fs.rmSync(cacheDir,{recursive:true,force:true});}
});
test('corrupt decoded bytes, wrong input hash and stale recipes are rebuilt from the native input',()=>{
 const cacheDir=fs.mkdtempSync(path.join(os.tmpdir(),'devast-native-cache-')),source='const data=1;',prefix=path.join(cacheDir,hash(source));
 try{
  deobfuscate(source,{cacheDir});fs.writeFileSync(prefix+'.js','const data=2;');assert.equal(deobfuscate(source,{cacheDir}).source,source);
  for(const field of ['recipe','input_sha256']){const meta=JSON.parse(fs.readFileSync(prefix+'.json'));meta[field]='0';fs.writeFileSync(prefix+'.json',JSON.stringify(meta));assert.equal(deobfuscate(source,{cacheDir}).source,source);assert.notEqual(JSON.parse(fs.readFileSync(prefix+'.json'))[field],'0');}
 }finally{fs.rmSync(cacheDir,{recursive:true,force:true});}
});
