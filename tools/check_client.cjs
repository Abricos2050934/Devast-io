// Parse only: never execute the uploaded game or its obfuscation routines.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {parse} = require('./parser.cjs');
const {translate} = require('./translate_payload.cjs');
const options = {ecmaVersion: 'latest', sourceType: 'script'};
const symbols=JSON.parse(fs.readFileSync('patches/recovered-bindings.json')).symbols;
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
for(const declaration of parse(aimSource,options).body) {
  const installed=body.filter(n=>n.type==='FunctionDeclaration'&&n.id.name===declaration.id.name);
  assert.equal(installed.length,1);
  assert.equal(client.slice(installed[0].start,installed[0].end),aimSource.slice(declaration.start,declaration.end));
}
console.log('ILM AST OK: all four original classes and tick; compiled module matches source');
