// Parse only: never execute the uploaded game or its obfuscation routines.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {parse} = require('./parser.cjs');
const {translate} = require('./translate_payload.cjs');
const options = {ecmaVersion: 'latest', sourceType: 'script'};
const status=JSON.parse(fs.readFileSync('dist/update-status.json'));
const symbols=status.bindings;
assert.ok(symbols,'Build bindings are required; run npm run build');
const canonical=parse(fs.readFileSync('mod/responsive.js','utf8'),options);
const pending=[canonical];
while(pending.length){
  const n=pending.pop();if(!n||typeof n!=='object')continue;
  if(n.type==='MemberExpression'&&!n.computed&&/[^\x00-\x7f]/.test(n.property.name)){
    assert.ok(Object.hasOwn(symbols,n.property.name)||['а༠٥','ᴌ५ᚂ'].includes(n.property.name),'Unmapped native property: '+n.property.name);
  }
  for(const value of Object.values(n)){if(Array.isArray(value))pending.push(...value);else if(value&&typeof value==='object')pending.push(value);}
}
const payload = translate(fs.readFileSync('mod/responsive.js', 'utf8'),symbols);
const client = fs.readFileSync('dist/game.modded.js', 'utf8');
assert.equal(require('./build_client.cjs').hash(client),status.output_sha256,'Build status does not match the compiled client');
const mod = parse(payload, options);
assert.equal(mod.body.length, 1);
assert.equal(mod.body[0].type, 'FunctionDeclaration');
assert.equal(mod.body[0].id.name, '__installDevastMod');
const tree = parse(client, options);
assert.equal(tree.body.length, 1);
assert.equal(tree.body[0].type, 'ExpressionStatement');
const body = tree.body[0].expression.callee.body.body;
const installers = body.filter(n => n.type === 'FunctionDeclaration' && n.id.name === '__installDevastMod');
assert.equal(installers.length, 1);
assert.equal(client.slice(installers[0].start, installers[0].end).trim(), payload.trim());
const bindings = body.flatMap(n => n.type === 'VariableDeclaration' ? n.declarations : [])
  .filter(n => n.id.name === '__responsiveMod');
assert.equal(bindings.length, 1);
assert.equal(bindings[0].init.callee.name, '__installDevastMod');
console.log('AST OK: full client, one installer, one bootstrap; extracted payload matches');

require('./audit_ilm_port.cjs').audit();
const aimSource=fs.readFileSync('mod/ilm-aim.js','utf8');
for(const declaration of parse(aimSource,options).body.filter(n=>n.type==='FunctionDeclaration'&&!['__ilmPatchPlayerMetadata','__ilmPatchNativeDirection','__jitterPatchNativeFire'].includes(n.id.name))) {
  const installed=body.filter(n=>n.type==='FunctionDeclaration'&&n.id.name===declaration.id.name);
  assert.equal(installed.length,1);
  assert.equal(client.slice(installed[0].start,installed[0].end),aimSource.slice(declaration.start,declaration.end));
}
console.log('Uploaded aim AST OK: active override, lifecycle, menu, source calculations; retired engines absent');
