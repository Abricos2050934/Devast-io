const fs=require('node:fs'),path=require('node:path');
const {createResourceOverride}=require('./build_rust_client.cjs');
const URL='https://raw.githubusercontent.com/Abricos2050934/Devast-io/updates/rust/client.js';
function loader(url=URL){return `(function(){
 var url=${JSON.stringify(url)},previous=window.__devastRustRemoteLoader;
 if(window.__devastClientLoaded||previous&&(previous.state==='loading'||previous.state==='loaded'))return;
 var state=window.__devastRustRemoteLoader={state:'loading',url:url};
 try{
  var request=new XMLHttpRequest();request.open('GET',url+'?t='+Date.now(),false);request.send(null);
  if(request.status<200||request.status>=300||!request.responseText)throw Error('Rust update HTTP '+request.status);
  var code=request.responseText;
  if(code.indexOf('window.__devastRustInfo=Object.freeze(')<0||code.indexOf('Rust/WebAssembly')<0)throw Error('Invalid Rust client');
  (0,eval)(code);
  if(!window.__devastClientLoaded||!window.__devastMod||window.__devastRustInfo?.backend!=='Rust/WebAssembly')throw Error('Rust client installation failed');
  state.state='loaded';
 }catch(error){state.state='failed';state.error=String(error&&error.message||error);console.error('[Devast Rust auto-update]',state.error);}
})();`;}
function configuration(url=URL){return createResourceOverride(loader(url));}
module.exports={URL,loader,configuration};
if(require.main===module){const out=path.resolve(process.argv[2]||'resource-override/Devast-io-Rust-Auto-Update.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(configuration(),null,2)+'\n');console.log(out);}
