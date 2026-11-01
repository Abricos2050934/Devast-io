// Exercise the exact translated installer with the canonical native test doubles.
const fs=require('node:fs'),path=require('node:path');
function candidateFixture(B,dir){
 const symbols=JSON.parse(fs.readFileSync(path.join(dir,'bindings.json'))).symbols;
 const reverse=new Map();for(const [canonical,native]of Object.entries(symbols)){
  if(reverse.has(native)&&reverse.get(native)!==canonical)throw Error('Ambiguous fixture native field '+native);
  reverse.set(native,canonical);
 }
 const cache=new WeakMap(),original=new WeakMap();
 function wrap(value){
  if(!value||typeof value!=='object')return value;
  if(cache.has(value))return cache.get(value);
  const proxy=new Proxy(value,{
   get(target,key,receiver){return wrap(Reflect.get(target,reverse.get(key)||key,receiver));},
   set(target,key,value){return Reflect.set(target,reverse.get(key)||key,original.get(value)||value);},
   has(target,key){return Reflect.has(target,reverse.get(key)||key);}
  });cache.set(value,proxy);original.set(proxy,value);return proxy;
 }
 const nativeKeys=new Set(['world','network','entities','input','types','items','graphics','renderer','karma']);
 const bridge=new Proxy(B,{get:(target,key)=>nativeKeys.has(key)?wrap(target[key]):target[key]});
 const nativeArguments=new Set(['playerLabel','preparePlayerLabel','prepareClanTag']);
 function adaptMod(mod){return new Proxy(mod,{get(target,key){const value=target[key];return nativeArguments.has(key)?(first,...args)=>value(wrap(first),...args):value;}});}
 return {B:bridge,adaptMod,source:fs.readFileSync(path.join(dir,'ilm-aim.js'),'utf8')+'\n'+fs.readFileSync(path.join(dir,'installer.fixture.js'),'utf8')};
}
module.exports={candidateFixture};
