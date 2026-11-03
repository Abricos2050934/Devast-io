// Port only structurally unchanged native contracts; ambiguous changes are errors.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),acorn=require('./parser.cjs');
const {analyze,canonical,isFunction,obfuscated,hash}=require('./updater/static.cjs');
const {deobfuscate}=require('./updater/decoder.cjs');
const {integrityOperations}=require('./updater/integrity.cjs');
const {translate}=require('./translate_payload.cjs'),{assemble}=require('./build_client.cjs');
const root=path.resolve(__dirname,'..');
function port(reference,candidate,profile,bindings,payload,bootstrap,aim,gui){
 if(hash(reference)!==profile.baseline_sha256)throw Error('Reference baseline checksum mismatch');
 const decodedOld=deobfuscate(reference),decodedNew=reference===candidate?decodedOld:deobfuscate(candidate);
 const old=analyze(decodedOld.source),cur=analyze(decodedNew.source),oldCanon=new Map(),curCanon=new Map();
 const group=(a,cache)=>{const map=new Map();for(const n of a.functions){if(n.end-n.start>80000)continue;const c=canonical(a,n);cache.set(n,c);if(!map.has(c.hash))map.set(c.hash,[]);map.get(c.hash).push(n);}return map;};
 const og=group(old,oldCanon),ng=group(cur,curCanon),pairs=new Map(),votes=new Map();
 const propose=(a,b)=>{if(!a||!b)return;if(!votes.has(a))votes.set(a,new Set());votes.get(a).add(b);};
 function prop(a,n){if(n.type==='MemberExpression')return n.computed?a.constant(n.property):n.property.name;if(n.type==='Property')return n.computed?a.constant(n.key):n.key.name??n.key.value;}
 function learn(oc,nc){const local=new Map();function add(a,b){if(a===undefined||b===undefined)return;if(local.has(a)&&local.get(a)!==b)throw Error('Inconsistent structural binding '+a);local.set(a,b);propose(a,b);}
  for(const [p,n]of oc.entries){const m=nc.entries.get(p);if(!m)continue;
   if(n.type==='Identifier'&&m.type==='Identifier'&&
      (old.constant(n)===undefined||old.binding(n)?.node===n)&&
      (cur.constant(m)===undefined||cur.binding(m)?.node===m))add(n.name,m.name);
   if(n.type===m.type&&['MemberExpression','Property'].includes(n.type)){const a=prop(old,n),b=prop(cur,m);if(typeof a==='string'&&typeof b==='string')add(a,b);}
  }return local;
 }
 for(const [key,list]of og){const next=ng.get(key);if(list.length===1&&next?.length===1){pairs.set(list[0],next[0]);learn(oldCanon.get(list[0]),curCanon.get(next[0]));}}
 // These data-only fields live outside the small native functions matched above.
 // Require both reviewed weapon anchors and speed values before exposing them.
 function weaponFields(a){
  const found=[];
  for(const [sound,speed]of [['audio/ak47-shot.mp3',1.4],['audio/laser-submachine-shot.mp3',1.45]]){
   const literals=a.nodes.filter(n=>n.type==='Literal'&&n.value===sound);if(literals.length!==1)throw Error('Ambiguous weapon sound anchor: '+sound);
   let object=a.parent.get(literals[0]);while(object&&object.type!=='ObjectExpression')object=a.parent.get(object);
   const fields=object?.properties.filter(p=>p.type==='Property'&&a.constant(p.value)===speed);
   if(fields?.length!==1)throw Error('Weapon speed contract changed: '+sound);
   const array=a.parent.get(object),table=a.parent.get(array);
   if(array?.type!=='ArrayExpression'||table?.type!=='Property')throw Error('Weapon table shape changed');
   found.push({speed:prop(a,fields[0]),table:prop(a,table)});
  }
  if(found[0].speed!==found[1].speed||found[0].table!==found[1].table)throw Error('Inconsistent weapon metadata bindings');
  return found[0];
 }
 const oldWeapons=weaponFields(old),newWeapons=weaponFields(cur);
 if(bindings.symbols.ilmWeaponTable!==oldWeapons.table||bindings.symbols.ilmBulletSpeed!==oldWeapons.speed)throw Error('Reference weapon metadata binding does not match reviewed weapon anchors');
 propose(oldWeapons.speed,newWeapons.speed);propose(oldWeapons.table,newWeapons.table);
 const globalMap=()=>Object.fromEntries([...votes].filter(([,v])=>v.size===1).map(([k,v])=>[k,[...v][0]]));
 // Check native network entrypoints themselves, not just references to their names.
 const rootBody=old.tree.body[0]?.expression?.callee?.body?.body;
 const networkDefinition=rootBody?.flatMap(n=>n.declarations||[]).find(d=>d.id.name===bindings.symbols['о̃༩']);
 const networkScope=networkDefinition?.init?.callee;
 const networkReturn=networkScope?.body?.body.filter(n=>n.type==='ReturnStatement').at(-1)?.argument;
 const nativeContracts=[];
 const provisional=globalMap();
 const nextRoot=cur.tree.body[0]?.expression?.callee?.body?.body;
 const nextNetwork=nextRoot?.flatMap(n=>n.declarations||[]).find(d=>d.id.name===provisional[bindings.symbols['о̃༩']])?.init?.callee;
 const nextReturn=nextNetwork?.body?.body.filter(n=>n.type==='ReturnStatement').at(-1)?.argument;
 if(networkReturn?.type!=='ObjectExpression'||nextReturn?.type!=='ObjectExpression')throw Error('Native network interface is not statically inspectable');
 function entryDefinition(a,object,scope,name,namespace){
  const entry=object.properties.find(p=>(p.computed?a.constant(p.key):p.key.name??p.key.value)===name);
  if(!entry){
   const assignments=a.nodes.filter(n=>n.type==='AssignmentExpression'&&n.operator==='='&&n.left.type==='MemberExpression'&&n.left.object.name===namespace&&(n.left.computed?a.constant(n.left.property):n.left.property.name)===name);
   if(assignments.length!==1)return null;
   if(isFunction(assignments[0].right))return assignments[0].right;
   const target=assignments[0].right;
   if(target.type==='Identifier'){const b=a.binding(target);if(b?.node&&isFunction(b.node))return b.node;if(b?.init&&isFunction(b.init))return b.init;}
   return null;
  }
  if(isFunction(entry.value))return entry.value;
  if(entry.value.type!=='Identifier')return null;
  const defs=a.functions.filter(n=>n.id?.name===entry.value.name&&n.start>=scope.start&&n.end<=scope.end);
  for(const n of a.nodes)if(n.type==='VariableDeclarator'&&n.id.name===entry.value.name&&n.start>=scope.start&&n.end<=scope.end&&n.init&&isFunction(n.init))defs.push(n.init);
  return defs.length===1?defs[0]:null;
 }
 for(const key of ['ᴎᚂρ','ѕ᠋༢','ρ٨٨','ᴎ༩༣','ᅠϲ᠍','е̅ܙ','εܖᴏ','ⲅ︊ᄃ']){
  const name=bindings.symbols[key],left=entryDefinition(old,networkReturn,networkScope,name,bindings.symbols['о̃༩']),right=entryDefinition(cur,nextReturn,nextNetwork,provisional[name],provisional[bindings.symbols['о̃༩']]);
  if(!left||!right||oldCanon.get(left)?.hash!==curCanon.get(right)?.hash)throw Error('Native network contract changed or ambiguous: '+key);
  pairs.set(left,right);learn(oldCanon.get(left),curCanon.get(right));nativeContracts.push(key);
 }
 const canonicalRequired=new Set();for(const source of [payload,bootstrap])for(const tok of acorn.tokenizer(source,{ecmaVersion:'latest'}))if(Object.hasOwn(bindings.symbols,tok.value))canonicalRequired.add(tok.value);
 // Existing protected metadata is decoded to a normal constructor assignment.
 const ops=profile.operations.map(op=>op.decoded_before?{...op,before:op.decoded_before,after:op.decoded_after}:op.id==='ilm-native-initial-nickname-id'?{...op,before:'this.ο३︀ = ο३︀',after:'this.ο३︀ = __ilmPlayerNickname(ο३︀,ᴘ५٢)'}:op);
 function anchor(text,id){
  const at=old.source.indexOf(text);if(at<0||old.source.indexOf(text,at+1)>=0)throw Error('Reference anchor is not unique: '+id);
  const n=old.nodes.find(n=>n.start===at&&n.end===at+text.length);if(!n)throw Error('Reference anchor is not an AST node: '+id);
  let fn=n;while(fn&&!isFunction(fn))fn=old.parent.get(fn);
  if(fn&&fn!==old.tree.body[0]?.expression?.callee){
   const matched=pairs.get(fn);if(!matched)throw Error('Native contract changed or ambiguous: '+id);
   const oc=oldCanon.get(fn),nc=curCanon.get(matched),p=[...oc.entries].find(([,v])=>v===n)?.[0];
   const target=nc.entries.get(p);if(!target)throw Error('Unmapped patch node '+id);
   return {old:n,current:target,local:learn(oc,nc)};
  }
  const oc=canonical(old,n),list=cur.nodes.filter(m=>m.type===n.type&&cur.parent.get(m)===cur.tree.body[0]?.expression?.callee?.body).filter(m=>canonical(cur,m).hash===oc.hash);
  if(list.length!==1)throw Error('Bootstrap anchor changed or ambiguous: '+id);
  return {old:n,current:list[0],local:learn(oc,canonical(cur,list[0]))};
 }
 const patchAnchors=ops.map(op=>({op,match:anchor(op.before,op.id)}));
 const boot=anchor(profile.bootstrap_anchor,'bootstrap');
 const map=globalMap();
 const integrity=integrityOperations(old,cur,pairs);
 const outputBindings={schema:'automatic-port-v1',symbols:{},evidence:{}};
 // The home activation method shares its obfuscated spelling with many local
 // functions. Resolve the exported method in the home object namespace.
 const homeName=bindings.symbols['ɑᚆᴏ'];
 const homeScope=rootBody?.flatMap(n=>n.declarations||[]).find(d=>d.id.name===homeName)?.init?.callee;
 const nextHomeScope=nextRoot?.flatMap(n=>n.declarations||[]).find(d=>d.id.name===map[homeName])?.init?.callee;
 const homeReturn=homeScope?.body?.body.filter(n=>n.type==='ReturnStatement').at(-1)?.argument;
 const nextHomeReturn=nextHomeScope?.body?.body.filter(n=>n.type==='ReturnStatement').at(-1)?.argument;
 const homeProperties=new Map();
 if(homeReturn?.type==='ObjectExpression'&&nextHomeReturn?.type==='ObjectExpression'&&canonical(old,homeReturn).hash===canonical(cur,nextHomeReturn).hash) {
  for(let i=0;i<homeReturn.properties.length;i++) {
   const left=homeReturn.properties[i],right=nextHomeReturn.properties[i];
   homeProperties.set(prop(old,left),prop(cur,right));
  }
 }
 for(const key of canonicalRequired){const previous=bindings.symbols[key],next=(key==='nativeIntegrityFlag'?integrity.flag:key==='nativeHomeEnter'?homeProperties.get(previous):map[previous])??(!obfuscated(previous)?previous:undefined);
  if(!next)throw Error('Missing or ambiguous required native binding: '+key+' ('+previous+')');outputBindings.symbols[key]=next;outputBindings.evidence[key]='unique normalized native function correspondence';
 }
 // Every fragment is a reviewed patch. Materialize only immutable literal aliases.
 const literalSets=new Map();for(const n of old.nodes)if(n.type==='Identifier'){const v=old.constant(n);if(v!==undefined){if(!literalSets.has(n.name))literalSets.set(n.name,new Map());literalSets.get(n.name).set(JSON.stringify(v),v);}}const literals=new Map([...literalSets].filter(([,v])=>v.size===1).map(([k,v])=>[k,[...v.values()][0]]));
 function nativeFragment(text,local){const edits=[];for(const tok of acorn.tokenizer(text,{ecmaVersion:'latest'})){
   if(tok.type.label==='name'){
    const value=local.get(tok.value)??map[tok.value];
    if(value!==undefined)edits.push({start:tok.start,end:tok.end,text:value});
    else if(literals.has(tok.value))edits.push({start:tok.start,end:tok.end,text:JSON.stringify(literals.get(tok.value))});
    else if(obfuscated(tok.value))throw Error('Unresolved native patch identifier: '+tok.value);
   }else if(tok.type.label==='string'&&Object.hasOwn(map,tok.value))edits.push({start:tok.start,end:tok.end,text:JSON.stringify(map[tok.value])});
  }for(const e of edits.reverse())text=text.slice(0,e.start)+e.text+text.slice(e.end);return text;
 }
 const operations=patchAnchors.map(({op,match})=>({id:op.id,expected:1,before:cur.source.slice(match.current.start,match.current.end),after:nativeFragment(op.after,match.local)})).concat(integrity.operations);
 const fn=cur.tree.body[0]?.expression?.callee;
 if(!fn||fn.type!=='FunctionExpression'||cur.tree.body.length!==1||!fn.body.body.length)throw Error('Unsupported native bootstrap shape');
 const generated={schema:'automatic-port-v1',source_url:profile.source_url,baseline_sha256:hash(cur.source),operations,
  bootstrap_anchor:cur.source.slice(boot.current.start,boot.current.end),guard_anchor:cur.source.slice(0,fn.body.body[0].end)};
 // This helper is unused after direct constructor patching; retain a correct recipe.
 const meta=operations.find(x=>x.id==='ilm-native-initial-nickname-id');
 const aimTree=acorn.parse(aim,{ecmaVersion:'latest'}),helper=aimTree.body.find(n=>n.id?.name==='__ilmPatchPlayerMetadata');
 let adaptedAim=aim.slice(0,helper.start)+`function __ilmPatchPlayerMetadata(source){const before=${JSON.stringify(meta.before)};if(source.split(before).length!==2)throw Error('Unsupported native player metadata constructor');return source.replace(before,${JSON.stringify(meta.after)});}`+aim.slice(helper.end);
 const directionHelper=acorn.parse(adaptedAim,{ecmaVersion:'latest'}).body.find(n=>n.id?.name==='__ilmPatchNativeDirection');
 const directionRules=operations.filter(x=>x.id.startsWith('ilm-native-angle-bookkeeping-')).map(x=>[x.before,x.after]);
 if(!directionHelper||directionRules.length!==2)throw Error('Both native ILM direction contracts are required');
 adaptedAim=adaptedAim.slice(0,directionHelper.start)+`function __ilmPatchNativeDirection(source,index){const rules=${JSON.stringify(directionRules)},rule=rules[index];if(!rule||source.split(rule[0]).length!==2)throw Error('Unsupported native direction handler');return source.replace(rule[0],rule[1]);}`+adaptedAim.slice(directionHelper.end);
 const fireHelper=acorn.parse(adaptedAim,{ecmaVersion:'latest'}).body.find(n=>n.id?.name==='__jitterPatchNativeFire');
 const fireRule=operations.find(x=>x.id==='jitter-native-fire-priority');
 if(fireHelper&&fireRule) adaptedAim=adaptedAim.slice(0,fireHelper.start)+`function __jitterPatchNativeFire(source){const before=${JSON.stringify(fireRule.before)};if(source.split(before).length!==2)throw Error('Unsupported native fire handler');return source.replace(before,${JSON.stringify(fireRule.after)});}`+adaptedAim.slice(fireHelper.end);
 const output=assemble(Buffer.from(cur.source),generated,outputBindings.symbols,payload,bootstrap,gui,adaptedAim);
 const requiredNative=['ι๔̶','ᴄ９̗','ⲅ︉️','ᴄߌ͏','ⲟ१̖','ᴎܕα','ᴎ༩༣','І̎ܘ','еϲᄄ','ᴎ︅ހ','ѕ٨ᚄ','ᴑ٧ߓ','ᴎ٨ߍ','ࡀ︌٨','І︈༧','ᴉ̷Ꮷ','а̵̠','рܙ๕','ᅟ᠌５','ᴀᄁ︃','рոᴎ','ᅠ̘ܛ'];
 const roles={nativeIntegrityFlag:integrity.flag,nativeIntegritySigners:integrity.signers};for(const key of requiredNative){const next=map[key];if(!next)throw Error('Missing browser validation binding '+key);roles[key]=next;}
 return {source:cur.source,output,profile:generated,bindings:outputBindings,aim:adaptedAim,roles,
  report:{raw_sha256:hash(candidate),reference_sha256:hash(reference),deobfuscated_sha256:hash(cur.source),output_sha256:hash(output),matched_functions:pairs.size,native_network_contracts:nativeContracts,required_bindings:canonicalRequired.size,patches:operations.map(x=>x.id),integrity_compatibility:{status:'applied',predicates:integrity.operations.length},decoder_blocks:decodedNew.evidence,live_server:'not_tested'}};
}
if(require.main===module){
 try{
  const [, ,input,out]=process.argv;if(!input||!out)throw Error('Usage: node tools/auto_port.cjs RAW_JS OUTPUT_DIR');
  const read=f=>fs.readFileSync(path.join(root,f),'utf8');
  const result=port(require('node:zlib').gunzipSync(fs.readFileSync(path.join(root,'baselines/current.js.gz'))).toString(),fs.readFileSync(input,'utf8'),JSON.parse(read('patches/recovered-current.json')),JSON.parse(read('patches/recovered-bindings.json')),read('mod/responsive.js'),read('mod/bootstrap.js'),read('mod/ilm-aim.js'),read('vendor/dat.gui.recovered.js'));
  fs.mkdirSync(out,{recursive:true});for(const [name,data]of Object.entries({'native.js':result.source,'game.modded.js':result.output,'profile.json':JSON.stringify(result.profile,null,2),'bindings.json':JSON.stringify(result.bindings,null,2),'ilm-aim.js':result.aim,'roles.json':JSON.stringify(result.roles,null,2),'port-report.json':JSON.stringify(result.report,null,2)}))fs.writeFileSync(path.join(out,name),data);
  console.log(JSON.stringify({status:'ported',...result.report,decoder_blocks:result.report.decoder_blocks.length}));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={port};
