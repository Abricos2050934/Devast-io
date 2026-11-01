// Prefer the lockfile dependency. The managed Node distribution also contains
// Acorn; use that trusted local copy when the package registry is unavailable.
try {
  module.exports=require('acorn');
} catch(error) {
  if(error.code!=='MODULE_NOT_FOUND')throw error;
  const source=process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'];
  if(!source)throw Error('Acorn unavailable; run npm ci --ignore-scripts');
  const moduleObject={exports:{}};
  require('node:vm').runInNewContext(source,{exports:moduleObject.exports,module:moduleObject},{timeout:1000});
  module.exports=moduleObject.exports;
  console.error('Using trusted Node-bundled Acorn '+module.exports.version+' (registry dependency unavailable)');
}
