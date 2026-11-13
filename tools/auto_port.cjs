// Port only structurally unchanged native contracts; ambiguous changes are errors.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),acorn=require('./parser.cjs');
const {analyze,isFunction,obfuscated,hash}=require('./updater/static.cjs');
const {readonlyConstants,semanticCanonical:canonical}=require('./updater/semantic.cjs');
const {deobfuscate}=require('./updater/decoder.cjs');
const {integrityOperations}=require('./updater/integrity.cjs');
const {directionDelay,exportNames,serverListSchema,namespaceByExports}=require('./updater/network-contracts.cjs');
const {translate}=require('./translate_payload.cjs'),{assemble}=require('./build_client.cjs');
const root=path.resolve(__dirname,'..');
function port(reference,candidate,profile,bindings,payload,bootstrap,aim,gui){
 if(hash(reference)!==profile.baseline_sha256)throw Error('Reference baseline checksum mismatch');
 const decodeOptions={cacheDir:path.join(root,'.updater','native-decode-cache-v1')};
 const decodedOld=deobfuscate(reference,decodeOptions),decodedNew=reference===candidate?decodedOld:deobfuscate(candidate,decodeOptions);
 const old=readonlyConstants(analyze(decodedOld.source)),cur=readonlyConstants(analyze(decodedNew.source)),oldCanon=new Map(),curCanon=new Map();
 const group=(a,cache)=>{const map=new Map();for(const n of a.functions){if(n.end-n.start>80000)continue;const c=canonical(a,n);cache.set(n,c);if(!map.has(c.hash))map.set(c.hash,[]);map.get(c.hash).push(n);}return map;};
 const og=group(old,oldCanon),ng=group(cur,curCanon),pairs=new Map(),votes=new Map(),propertyVotes=new Map();
 const propose=(a,b)=>{if(!a||!b||!obfuscated(a)&&a!==b)return;if(!votes.has(a))votes.set(a,new Set());votes.get(a).add(b);};
 function prop(a,n){if(n.type==='MemberExpression')return n.computed?a.constant(n.property):n.property.name;if(n.type==='Property')return n.computed?a.constant(n.key):n.key.name??n.key.value;}
 function learn(oc,nc){const local=new Map();function add(a,b){if(a===undefined||b===undefined)return;if(local.has(a)&&local.get(a)!==b)throw Error('Inconsistent structural binding '+a);local.set(a,b);propose(a,b);}
  for(const [p,n]of oc.entries){const m=nc.entries.get(p);if(!m)continue;
   if(n.type==='Identifier'&&m.type==='Identifier'&&
      (old.constant(n)===undefined&&!old.isUndefined(n)||old.binding(n)?.node===n)&&
      (cur.constant(m)===undefined&&!cur.isUndefined(m)||cur.binding(m)?.node===m))add(n.name,m.name);
   if(n.type===m.type&&['MemberExpression','Property'].includes(n.type)){const a=prop(old,n),b=prop(cur,m);if(typeof a==='string'&&typeof b==='string'&&obfuscated(a)){add(a,b);if(n.type==='MemberExpression'){if(!propertyVotes.has(a))propertyVotes.set(a,new Set());propertyVotes.get(a).add(b);}}}
  }return local;
 }
 for(const [key,list]of og){const next=ng.get(key);if(list.length===1&&next?.length===1){pairs.set(list[0],next[0]);learn(oldCanon.get(list[0]),curCanon.get(next[0]));}}
 // An exact reviewed source also proves identities that are ambiguous across
 // renamed clients (for example, repeated local function names).
 if(old.source===cur.source){
  const byStart=new Map(cur.functions.map(fn=>[fn.start,fn]));
  for(const fn of old.functions){const next=byStart.get(fn.start);if(next)pairs.set(fn,next);}
  for(const node of old.nodes)if(node.type==='Identifier')votes.set(node.name,new Set([node.name]));
 }
 // Projectile metadata is a required contract for circular interception.
 function curveWeaponFields(a){
  const found=[];
  for(const [sound,speed]of [['audio/ak47-shot.mp3',1.4],['audio/laser-submachine-shot.mp3',1.45]]){
   const hits=a.nodes.filter(n=>n.type==='Literal'&&n.value===sound);if(hits.length!==1)throw Error('Ambiguous curve weapon anchor');
   let object=a.parent.get(hits[0]);while(object&&object.type!=='ObjectExpression')object=a.parent.get(object);
   const fields=object?.properties.filter(p=>p.type==='Property'&&a.constant(p.value)===speed);
   const path=object?.properties.find(p=>p.type==='Property'&&prop(a,p)==='path');
   const array=a.parent.get(object),table=a.parent.get(array);
   if(fields?.length!==1||a.constant(path?.value)!==900||array?.type!=='ArrayExpression'||table?.type!=='Property')throw Error('Native curve weapon speed/range contract changed');
   found.push({speed:prop(a,fields[0]),table:prop(a,table)});
  }
  if(found[0].speed!==found[1].speed||found[0].table!==found[1].table)throw Error('Inconsistent curve weapon metadata');
  return found[0];
 }
 const curveOld=curveWeaponFields(old),curveNew=curveWeaponFields(cur);
 if(bindings.symbols.curveWeapons!==curveOld.table||bindings.symbols.curveBulletSpeed!==curveOld.speed)throw Error('Reviewed curve weapon bindings changed');
 propose(curveOld.table,curveNew.table);propose(curveOld.speed,curveNew.speed);
 const verifiedGlobals=new Map();
 const globalMap=()=>Object.fromEntries([...votes].filter(([,v])=>v.size===1).map(([k,v])=>[k,[...v][0]]).concat([...verifiedGlobals]));
 // Check native network entrypoints themselves, not just references to their names.
 const rootBody=old.tree.body[0]?.expression?.callee?.body?.body;
 const networkDefinition=rootBody?.flatMap(n=>n.declarations||[]).find(d=>d.id.name===bindings.symbols['о̃༩']);
 const networkScope=networkDefinition?.init?.callee;
 const networkReturn=networkScope?.body?.body.filter(n=>n.type==='ReturnStatement').at(-1)?.argument;
 const nativeContracts=[];
 const provisional=globalMap();
 const nextRoot=cur.tree.body[0]?.expression?.callee?.body?.body;
 let nextNetwork=nextRoot?.flatMap(n=>n.declarations||[]).find(d=>d.id.name===provisional[bindings.symbols['о̃༩']])?.init?.callee;
 let nextReturn=nextNetwork?.body?.body.filter(n=>n.type==='ReturnStatement').at(-1)?.argument;
 if(networkReturn?.type!=='ObjectExpression')throw Error('Native network interface is not statically inspectable');
 if(nextReturn?.type!=='ObjectExpression'){
  // Independent export-function identities disambiguate a namespace when
  // unrelated alpha-equivalent fragments vote for different global objects.
  const anchors=networkReturn.properties.map(p=>entryDefinition(old,networkReturn,networkScope,prop(old,p),bindings.symbols['о̃༩'])).map(fn=>pairs.get(fn)).filter(Boolean);
  const found=namespaceByExports(cur,nextRoot,anchors);
  provisional[bindings.symbols['о̃༩']]=found.name;nextNetwork=found.scope;nextReturn=found.object;
 }

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
 const nextExports=exportNames(cur,nextReturn,provisional[bindings.symbols['о̃༩']]);
 function jsonReader(a,fn){return fn&&fn.params.length===2&&serverListSchema(a,fn)&&a.nodes.filter(n=>n.start>=fn.start&&n.end<=fn.end&&n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.object.name==='JSON'&&prop(a,n.callee)==='parse').length===1;}
 for(const key of ['ᴎᚂρ','ѕ᠋༢','ρ٨٨','ᴎ༩༣','ᅠϲ᠍','е̅ܙ','εܖᴏ','ⲅ︊ᄃ']){
  const name=bindings.symbols[key],left=entryDefinition(old,networkReturn,networkScope,name,bindings.symbols['о̃༩']);
  const direction=key==='ѕ᠋༢'||key==='ρ٨٨';
  if(!provisional[name]){
   const delay=directionDelay(old,left),matches=[];
   if(direction&&delay===null)throw Error('Unsupported reference direction timer: '+key);
   for(const nextName of nextExports){
    const fn=entryDefinition(cur,nextReturn,nextNetwork,nextName,provisional[bindings.symbols['о̃༩']]);
    if(fn&&(key==='ⲅ︊ᄃ'?jsonReader(old,left)&&jsonReader(cur,fn):oldCanon.get(left)?.hash===curCanon.get(fn)?.hash&&(!direction||directionDelay(cur,fn)===delay)))matches.push(nextName);
   }
   if(matches.length!==1)throw Error('Ambiguous native network export: '+key);
   provisional[name]=matches[0];propose(name,matches[0]);
  }
  const right=entryDefinition(cur,nextReturn,nextNetwork,provisional[name],provisional[bindings.symbols['о̃༩']]);
  if(!left||!right)throw Error('Native network contract changed or ambiguous: '+key);
  if(oldCanon.get(left)?.hash!==curCanon.get(right)?.hash){
   if(key==='ⲅ︊ᄃ'&&jsonReader(old,left)&&jsonReader(cur,right)){nativeContracts.push(key);continue;}
   // The protected preflight implementation stays entirely native. Bind its
   // export through the independently matched login caller, not cipher text.
   const loginOld=entryDefinition(old,networkReturn,networkScope,bindings.symbols['ᅠϲ᠍'],bindings.symbols['о̃༩']);
   const loginNew=entryDefinition(cur,nextReturn,nextNetwork,provisional[bindings.symbols['ᅠϲ᠍']],provisional[bindings.symbols['о̃༩']]);
   function calls(a,fn,target,namespace,name){return a.nodes.filter(n=>n.start>=fn.start&&n.end<=fn.end&&n.type==='CallExpression'&&(n.callee.type==='Identifier'&&n.callee.name===target.id?.name||n.callee.type==='MemberExpression'&&n.callee.object.name===namespace&&prop(a,n.callee)===name));}
   if(key!=='εܖᴏ'||left.params.length!==right.params.length||!loginOld||!loginNew||oldCanon.get(loginOld)?.hash!==curCanon.get(loginNew)?.hash||calls(old,loginOld,left,bindings.symbols['о̃༩'],name).length!==1||calls(cur,loginNew,right,provisional[bindings.symbols['о̃༩']],provisional[name]).length!==1)throw Error('Native network contract changed or ambiguous: '+key);
   nativeContracts.push(key);continue;
  }
  if(direction&&(directionDelay(old,left)===null||directionDelay(old,left)!==directionDelay(cur,right)))throw Error('Native direction timing changed: '+key);
  pairs.set(left,right);learn(oldCanon.get(left),curCanon.get(right));nativeContracts.push(key);
 }
 // All eight native method contracts below/above must pass before this
 // independently identified namespace can override conflicting name votes.
 verifiedGlobals.set(bindings.symbols['о̃༩'],provisional[bindings.symbols['о̃༩']]);
 // Required adapter fields use member-access evidence. Unrelated alpha-equivalent
 // object literals can reuse the same old property spelling for another field.
 const canonicalRequired=new Set(),propertyKeys=new Set(),variableKeys=new Set();
 for(const source of [payload,bootstrap]){
  for(const tok of acorn.tokenizer(source,{ecmaVersion:'latest'}))if(Object.hasOwn(bindings.symbols,tok.value))canonicalRequired.add(tok.value);
  const todo=[[acorn.parse(source,{ecmaVersion:'latest'}),null]];while(todo.length){const[n,parent]=todo.pop();
   if(n.type==='Literal'&&Object.hasOwn(bindings.symbols,n.value))propertyKeys.add(n.value);
   if(n.type==='Identifier'&&Object.hasOwn(bindings.symbols,n.name)){
    const field=parent?.type==='MemberExpression'&&!parent.computed&&parent.property===n||parent?.type==='Property'&&!parent.computed&&parent.key===n;
    (field?propertyKeys:variableKeys).add(n.name);
   }
   for(const v of Object.values(n))if(Array.isArray(v))todo.push(...v.filter(x=>x?.type).map(x=>[x,n]));else if(v?.type)todo.push([v,n]);
  }
 }
 // Existing protected metadata is decoded to a normal constructor assignment.
 const ops=profile.operations.map(op=>op.decoded_before?{...op,before:op.decoded_before,after:op.decoded_after}:op.id==='ilm-native-initial-nickname-id'?{...op,before:'this.ο३︀ = ο३︀',after:'this.ο३︀ = __ilmPlayerNickname(ο३︀,ᴘ५٢)'}:op);
 function anchor(text,id){
  const at=old.source.indexOf(text);if(at<0||old.source.indexOf(text,at+1)>=0)throw Error('Reference anchor is not unique: '+id);
  const n=old.nodes.find(n=>n.start===at&&n.end===at+text.length);if(!n)throw Error('Reference anchor is not an AST node: '+id);
  let fn=n;while(fn&&!isFunction(fn))fn=old.parent.get(fn);
  if(id==='native-guard-stale-preflight-response'){
   const oldList=entryDefinition(old,networkReturn,networkScope,bindings.symbols['ⲅ︊ᄃ'],bindings.symbols['о̃༩']);
   const nextList=entryDefinition(cur,nextReturn,nextNetwork,provisional[bindings.symbols['ⲅ︊ᄃ']],provisional[bindings.symbols['о̃༩']]);
   function helper(a,list,scope){
    const calls=a.nodes.filter(n=>n.start>=list.start&&n.end<=list.end&&n.type==='CallExpression'&&n.callee.type==='Identifier'&&n.arguments.length===3&&n.arguments[0].name===list.params[0].name&&isFunction(n.arguments[1])&&isFunction(n.arguments[2]));
    if(calls.length!==1)return;
    function xhr(n){if(n.type!=='NewExpression')return false;if(n.callee.name==='XMLHttpRequest')return true;if(n.callee.type!=='MemberExpression'||prop(a,n.callee)!=='XMLHttpRequest')return false;let obj=n.callee.object,seen=new Set();while(obj?.type==='Identifier'&&!seen.has(obj)){seen.add(obj);if(obj.name==='window'&&!a.binding(obj))return true;const b=a.binding(obj);if(b?.kind!=='const')break;obj=b.init;}return false;}
    const defs=a.functions.filter(f=>f.id?.name===calls[0].callee.name&&f.start>=scope.start&&f.end<=scope.end&&f.params.length===3&&a.nodes.some(n=>n.start>=f.start&&n.end<=f.end&&(xhr(n)||n.type==='Identifier'&&n.name==='XMLHttpRequest'||a.constant(n)==='XMLHttpRequest')));
    return defs.length===1?defs[0]:undefined;
   }
   const previous=helper(old,oldList,networkScope),current=helper(cur,nextList,nextNetwork);
   if(previous!==fn||!current||n!==fn)throw Error('Native HTTP callback interface changed');
   propose(fn.id.name,current.id.name);const local=new Map(fn.params.map((p,i)=>[p.name,current.params[i].name]));
   return {old:n,current,local,callbackGuard:true};
  }
  if(fn&&fn!==old.tree.body[0]?.expression?.callee){
   if(!pairs.has(fn)&&id==='ilm-native-player-nickname-id'){
    const match=require('./updater/player-rejoin.cjs').playerRejoin(old,cur,fn);
    pairs.set(fn,match.current);curCanon.set(match.current,match.nc);
   }
   if(!pairs.has(fn)&&id==='ilm-native-initial-nickname-id'){
    const match=require('./updater/player-rejoin.cjs').playerConstructor(old,cur,fn);
    pairs.set(fn,match.current);curCanon.set(match.current,match.nc);
   }
   const matched=pairs.get(fn);
   if(!matched&&id==='native-play-preparation-recovery'&&n===fn){
    const match=require('./updater/play-preparation.cjs').playPreparation(old,cur,fn,{oldNamespace:bindings.symbols['о̃༩'],oldLogin:bindings.symbols['ᅠϲ᠍'],namespace:provisional[bindings.symbols['о̃༩']],login:provisional[bindings.symbols['ᅠϲ᠍']]});
    return {...match,local:learn(match.oc,match.nc)};
   }
   if(!matched)throw Error('Native contract changed or ambiguous: '+id);
   const oc=oldCanon.get(fn),nc=curCanon.get(matched),p=[...oc.entries].find(([,v])=>v===n)?.[0];
   const target=nc.entries.get(p);if(!target)throw Error('Unmapped patch node '+id);
   return {old:n,current:target,local:learn(oc,nc),projection:new Map([...oc.entries].filter(([p])=>nc.entries.has(p)).map(([p,n])=>[n,nc.entries.get(p)]))};
  }
  const oc=canonical(old,n),list=cur.nodes.filter(m=>m.type===n.type&&cur.parent.get(m)===cur.tree.body[0]?.expression?.callee?.body).filter(m=>canonical(cur,m).hash===oc.hash);
  if(list.length!==1&&id==='bootstrap')return require('./updater/bootstrap.cjs').initializerBootstrap(old,cur,n,bindings.symbols['ι‌̵'],globalMap()[bindings.symbols['ι‌̵']],pairs);
  if(list.length!==1)throw Error('Bootstrap anchor changed or ambiguous: '+id);
  return {old:n,current:list[0],local:learn(oc,canonical(cur,list[0]))};
 }
 const patchAnchors=ops.map(op=>({op,match:anchor(op.before,op.id)}));
 const boot=anchor(profile.bootstrap_anchor,'bootstrap');
 const map=globalMap();
 const integrity=integrityOperations(old,cur,pairs,bindings.integrity);
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
 if(!homeProperties.has(bindings.symbols.nativeHomeEnter))homeProperties.set(bindings.symbols.nativeHomeEnter,require('./updater/home-activation.cjs').homeActivation(old,cur,homeScope,nextHomeScope,homeReturn,nextHomeReturn,bindings.symbols.nativeHomeEnter,pairs));
 for(const key of canonicalRequired){const previous=bindings.symbols[key],fields=propertyKeys.has(key)&&!variableKeys.has(key)&&propertyVotes.get(previous),field=fields&&fields.size===1?[...fields][0]:undefined,next=(key==='nativeIntegrityFlag'?integrity.flag:key==='nativeHomeEnter'?homeProperties.get(previous):fields?field:map[previous])??(!obfuscated(previous)?previous:undefined);
  if(!next)throw Error('Missing or ambiguous required native binding: '+key+' ('+previous+')');outputBindings.symbols[key]=next;outputBindings.evidence[key]='unique normalized native function correspondence';
 }
 // Every fragment is a reviewed patch. Materialize only immutable literal aliases.
 const literalSets=new Map();for(const n of old.nodes)if(n.type==='Identifier'){const v=old.constant(n);if(v!==undefined||old.isUndefined(n)){if(!literalSets.has(n.name))literalSets.set(n.name,new Map());literalSets.get(n.name).set(v===undefined?'undefined':JSON.stringify(v),v);}}const literals=new Map([...literalSets].filter(([,v])=>v.size===1).map(([k,v])=>[k,[...v.values()][0]]));
 function nativeFragment(text,local,preserved=[]){const edits=[...preserved],properties=new Set(),pending=[acorn.parse(text,{ecmaVersion:'latest'})];
  while(pending.length){const n=pending.pop();if(n.type==='MemberExpression'&&!n.computed&&n.property.type==='Identifier'&&!obfuscated(n.property.name))properties.add(n.property.start);if(n.type==='Property'&&!n.computed&&n.key.type==='Identifier'&&!obfuscated(n.key.name))properties.add(n.key.start);for(const v of Object.values(n))if(Array.isArray(v))pending.push(...v.filter(x=>x?.type));else if(v?.type)pending.push(v);}
  for(const tok of acorn.tokenizer(text,{ecmaVersion:'latest'})){
   if(preserved.some(e=>tok.start>=e.start&&tok.end<=e.end))continue;
   if(tok.type.label==='name'){
    if(properties.has(tok.start))continue;
    const value=local.get(tok.value)??map[tok.value];
    if(value!==undefined)edits.push({start:tok.start,end:tok.end,text:value});
    else if(literals.has(tok.value))edits.push({start:tok.start,end:tok.end,text:literals.get(tok.value)===undefined?'undefined':JSON.stringify(literals.get(tok.value))});
    else if(obfuscated(tok.value))throw Error('Unresolved native patch identifier: '+tok.value);
   }else if(tok.type.label==='string'&&Object.hasOwn(map,tok.value))edits.push({start:tok.start,end:tok.end,text:JSON.stringify(map[tok.value])});
  }for(const e of edits.sort((a,b)=>b.start-a.start))text=text.slice(0,e.start)+e.text+text.slice(e.end);return text;
 }
 const operations=patchAnchors.map(({op,match})=>{
  const before=cur.source.slice(match.current.start,match.current.end);
  let after=match.callbackGuard?before:nativeFragment(op.after,match.local,require('./updater/project-fragment.cjs').preservedSpans(old,cur,match,op.after));
  if(match.callbackGuard){const [url,ok]=match.current.params.map(p=>p.name),at=match.current.body.start+1-match.current.start;after=before.slice(0,at)+`if(__responsiveMod)${ok}=__responsiveMod.guardHandshakeCallback(${url},${ok});`+before.slice(at);}
  return {id:op.id,expected:1,before,after};
 }).concat(integrity.operations);
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
 const requiredNative=['ι๔̶','ᴄ９̗','ⲅ︉️','ᴄߌ͏','ⲟ१̖','ᴎܕα','ᴎ༩༣','ԁ̶ϲ','І̎ܘ','еϲᄄ','ᴎ︅ހ','ѕ٨ᚄ','ᴑ٧ߓ','ᴎ٨ߍ','ࡀ︌٨','І︈༧','ᴉ̷Ꮷ','а̵̠','рܙ๕','ᅟ᠌５','ᴀᄁ︃','рոᴎ','ᅠ̘ܛ'];
 const roles={nativeIntegrityFlag:integrity.flag,nativeIntegritySigners:integrity.signers};for(const key of requiredNative){const next=map[bindings.roles?.[key]||key];if(!next)throw Error('Missing browser validation binding '+key);roles[key]=next;}
 if(aim.includes('function __createIlmAim(')||aim.includes('function __createMessage27Core(')){
  outputBindings.symbols['ⲟࠀᄀ']=map[bindings.symbols['ⲟࠀᄀ']];
  roles.messageKeyboard=map[bindings.roles?.messageKeyboard||'ⲣ๒༩'];
  roles.messageKeyboardDown=map[bindings.roles?.messageKeyboardDown||'ᴌЇ'];
  roles.messageKeyboardUp=map[bindings.roles?.messageKeyboardUp||'р͢ο'];
  roles.messageMove=map[bindings.roles?.messageMovePoll];
  if(!outputBindings.symbols['ⲟࠀᄀ']||!roles.messageKeyboard)throw Error('Missing Message15 lifecycle bindings');
  generated.operations=require('./updater/message15-contracts.cjs').message15Operations(cur,operations,outputBindings.symbols,roles,bindings.native_protocol,new Set(pairs.values()));
  if(aim.includes('function __createMessage27Core(')){
   generated.operations=require('./updater/untitled-contracts.cjs').untitledDirectionOperations(generated.operations,cur,{primaryOnly:true,jitterOwnership:true});
   const position=generated.operations.find(op=>op.id==='packet-position-history');
   const native=acorn.parse(position.before,{ecmaVersion:'latest'}).body[0].expression;
   if(native.type!=='CallExpression'||native.arguments.length!==13)throw Error('Uploaded aim native position metadata changed');
   const fragment=i=>position.before.slice(native.arguments[i].start,native.arguments[i].end);
   const extras=[fragment(7),fragment(9),`{x:${fragment(5)},y:${fragment(6)},state:${fragment(11)},entityId:${fragment(3)}}`];
   const tree=acorn.parse(position.after,{ecmaVersion:'latest'}),pending=[tree],hits=[];
   while(pending.length){const n=pending.pop();if(n.type==='CallExpression'&&n.callee.property?.name==='trackPacket')hits.push(n);for(const v of Object.values(n))if(Array.isArray(v))pending.push(...v.filter(x=>x?.type));else if(v?.type)pending.push(v);}
   if(hits.length!==1||hits[0].arguments.length!==6)throw Error('Uploaded aim position hook changed');
   const at=hits[0].end-1;position.after=position.after.slice(0,at)+','+extras.join(',')+position.after.slice(at);
  }
  generated.operations.push(require('./updater/aim-transport.cjs').aimTransportOperation(cur,outputBindings.symbols,roles,new Set(pairs.values())));
  // The adaptive model must use the same packed speed as the native projectile
  // constructor. A changed shift, divisor or entity binding blocks publication.
  const projectileSpeeds=cur.nodes.filter(n=>{
   if(n.type!=='AssignmentExpression'||n.operator!=='='||n.left.type!=='MemberExpression'||n.left.object.type!=='Identifier')return false;
   const value=n.right;
   return value.type==='BinaryExpression'&&value.operator==='/'&&cur.constant(value.right)===100&&value.left.type==='BinaryExpression'&&value.left.operator==='>>'&&cur.constant(value.left.right)===8&&value.left.left.type==='MemberExpression'&&value.left.left.object.name===n.left.object.name&&prop(cur,value.left.left)==='state';
  });
  const speedFields=new Set(projectileSpeeds.map(n=>prop(cur,n.left)));
  if(!projectileSpeeds.length||speedFields.size!==1)throw Error('Native packed projectile speed contract changed or ambiguous');
  roles.ballisticProjectileSpeed=[...speedFields][0];
  const helper=acorn.parse(adaptedAim,{ecmaVersion:'latest'}).body.find(n=>n.id?.name==='__jitterPatchNativeFire');
  const rule=generated.operations.find(op=>op.id==='jitter-native-fire-priority');
  adaptedAim=adaptedAim.slice(0,helper.start)+`function __jitterPatchNativeFire(source){const before=${JSON.stringify(rule.before)};if(source.split(before).length!==2)throw Error('Unsupported native fire handler');return source.replace(before,${JSON.stringify(rule.after)});}`+adaptedAim.slice(helper.end);
 }
 generated.operations=require('./updater/death-diagnostics.cjs').deathDiagnosticOperations(cur,generated.operations,roles);
 for(const op of generated.operations){try{acorn.parse(op.after,{ecmaVersion:'latest'});}catch(error){throw Error('Invalid emitted patch '+op.id+': '+error.message+' near '+op.after.slice(Math.max(0,error.pos-70),error.pos+70));}}
 const output=assemble(Buffer.from(cur.source),generated,outputBindings.symbols,payload,bootstrap,gui,adaptedAim);
 return {source:cur.source,output,profile:generated,bindings:outputBindings,aim:adaptedAim,roles,
  report:{raw_sha256:hash(candidate),reference_sha256:hash(reference),deobfuscated_sha256:hash(cur.source),output_sha256:hash(output),matched_functions:pairs.size,native_network_contracts:nativeContracts,required_bindings:canonicalRequired.size,patches:generated.operations.map(x=>x.id),integrity_compatibility:{status:'applied',predicates:integrity.operations.length},decoder_blocks:decodedNew.evidence,live_server:'not_tested'}};
}
if(require.main===module){
 try{
  const [, ,input,out]=process.argv;if(!input||!out)throw Error('Usage: node tools/auto_port.cjs RAW_JS OUTPUT_DIR');
  const read=f=>fs.readFileSync(path.join(root,f),'utf8');
  const candidate=fs.readFileSync(input,'utf8'),reference=require('./updater/references.cjs').loadReference(root,candidate);
  const result=port(reference.source,candidate,reference.profile,reference.bindings,read('mod/responsive.js'),read('mod/bootstrap.js'),read('mod/ilm-aim.js'),read('vendor/dat.gui.recovered.js'));
  fs.mkdirSync(out,{recursive:true});for(const [name,data]of Object.entries({'native.js':result.source,'game.modded.js':result.output,'profile.json':JSON.stringify(result.profile,null,2),'bindings.json':JSON.stringify(result.bindings,null,2),'ilm-aim.js':result.aim,'roles.json':JSON.stringify(result.roles,null,2),'port-report.json':JSON.stringify(result.report,null,2)}))fs.writeFileSync(path.join(out,name),data);
  console.log(JSON.stringify({status:'ported',...result.report,decoder_blocks:result.report.decoder_blocks.length}));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={port};
