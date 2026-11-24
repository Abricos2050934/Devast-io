const fs=require('node:fs'),path=require('node:path'),{transpile}=require('./rust_transpile.cjs');
const root=path.resolve(__dirname,'..');
function generate(sources){
 const result=transpile(sources);
 fs.mkdirSync(path.join(root,'rust-mod/src'),{recursive:true});
 fs.writeFileSync(path.join(root,'rust-mod/src/generated.rs'),result.rust);
 fs.writeFileSync(path.join(root,'rust-mod/function-manifest.json'),JSON.stringify(result.manifest,null,2)+'\n');
 return result;
}
module.exports={generate};
if(require.main===module){const files=['mod/ilm-aim.js','mod/responsive.js','mod/bootstrap.js','resource-override/loader.js'];const result=generate(files.map(name=>({name,source:fs.readFileSync(path.join(root,name),'utf8')})));console.log(JSON.stringify({functions:result.manifest.functions.length,programs:result.manifest.programs.length,bytes:Buffer.byteLength(result.rust)}));}
