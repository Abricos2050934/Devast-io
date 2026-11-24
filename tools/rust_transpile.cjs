// One-time source migration: emit Rust control flow, never a JavaScript AST interpreter.
// The browser bridge provides only generic value/object/browser interoperability.
const parser=require('./parser.cjs');
function transpile(sources){
 const functions=[],ids=new WeakMap(),names=new WeakMap(),manifest=[];
 const q=value=>'"'+Array.from(String(value),c=>c==='\\'?'\\\\':c==='"'?'\\"':c==='\n'?'\\n':c==='\r'?'\\r':c==='\t'?'\\t':c.codePointAt(0)<32?'\\u{'+c.codePointAt(0).toString(16)+'}':c).join('')+'"';
 let serial=0,isAsync=false;
 const tmp=()=>`v${serial++}`,str=x=>`s(${q(x)})`,op=(name,args)=>`op(${q(name)}, &[${args.join(',')}])?`;
 const trees=sources.map(({name,source})=>({name,tree:parser.parse(source,{ecmaVersion:'latest'})}));
 let programIndex=0;
 function scan(n,parent){
  if(!n||typeof n!=='object')return;
  if(/^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(n.type)){
   ids.set(n,functions.length);functions.push(n);
   const inferred=n.id?.name||(parent?.type==='VariableDeclarator'?parent.id.name:parent?.type==='Property'||parent?.type==='MethodDefinition'?parent.key.name??parent.key.value:parent?.type==='AssignmentExpression'?(parent.left.property?.name??parent.left.name):'')||'';
   names.set(n,String(inferred));manifest.push({id:ids.get(n),program:programIndex,name:inferred,async:!!n.async,arrow:n.type==='ArrowFunctionExpression'});
  }
  for(const value of Object.values(n)){if(Array.isArray(value)){for(const child of value)scan(child,n);}else if(value&&typeof value==='object')scan(value,n);}
 }
 for(const [index,{tree}]of trees.entries()){programIndex=index;scan(tree);}
 function patternNames(n){if(!n)return [];switch(n.type){case'Identifier':return[n.name];case'AssignmentPattern':case'RestElement':return patternNames(n.left||n.argument);case'ArrayPattern':return n.elements.flatMap(patternNames);case'ObjectPattern':return n.properties.flatMap(p=>patternNames(p.value||p.argument));default:throw Error('Unsupported binding '+n.type);}}
 function varNames(n,out=new Set()){
  if(!n||typeof n!=='object'||/^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression|ClassDeclaration)$/.test(n.type))return out;
  if(n.type==='VariableDeclaration'&&n.kind==='var')for(const d of n.declarations)for(const key of patternNames(d.id))out.add(key);
  for(const value of Object.values(n))if(Array.isArray(value))value.forEach(x=>varNames(x,out));else if(value&&typeof value==='object')varNames(value,out);
  return out;
 }
 function declare(keys,kind){return keys.map(key=>`let _=${op('decl',['env.clone()',str(key),str(kind)])};`).join('\n');}
 function bind(p,value,mode='init'){
  if(p.type==='Identifier')return `let _=${op(mode,['env.clone()',str(p.name),value])};`;
  if(p.type==='MemberExpression'&&mode==='write')return `let _=${op('putref',[ref(p),value])};`;
  const v=tmp();let code=`let ${v}=${value};\n`;
  if(p.type==='AssignmentPattern')return code+bind(p.left,`if ${v}.is_undefined(){${expr(p.right)}}else{${v}}`,mode);
  if(p.type==='RestElement')return code+bind(p.argument,v,mode);
  if(p.type==='ArrayPattern'){
   const a=tmp();code+=`let ${a}=${op('array_from',[v])};\n`;
   p.elements.forEach((item,i)=>{if(item)code+=bind(item,item.type==='RestElement'?op('slice',[`${a}.clone()`,`n(${i}.0)`]):`prop(${a}.clone(),n(${i}.0))?`,mode)+'\n';});return code;
  }
  if(p.type==='ObjectPattern'){
   const skip=tmp();code+=`let ${skip}=${op('array',[])};\n`;
   for(const prop of p.properties){if(prop.type==='RestElement')code+=bind(prop.argument,op('rest_object',[`${v}.clone()`,`${skip}.clone()`]),mode)+'\n';
    else{const key=tmp();code+=`let ${key}=${propertyKey(prop)};let _=${op('push',[`${skip}.clone()`,`${key}.clone()`])};\n`+bind(prop.value,`prop(${v}.clone(),${key})?`,mode)+'\n';}}
   return code;
  }
  throw Error('Unsupported binding '+p.type);
 }
 function propertyKey(n){return n.computed?expr(n.key):str(n.key.name??n.key.value);}
 function fn(n,overrideName,asClass=false){
  let arity=n.params.findIndex(p=>p.type==='AssignmentPattern'||p.type==='RestElement');if(arity<0)arity=n.params.length;
  return op('fn',[`n(${ids.get(n)}.0)`,'env.clone()',str(overrideName??names.get(n)),`n(${arity}.0)`,`b(${n.type==='ArrowFunctionExpression'})`,`b(${!!n.async})`,`b(${asClass})`]);
 }
 function ref(n){if(n.type==='Identifier')return op('ref_name',['env.clone()',str(n.name)]);if(n.type==='MemberExpression')return op('ref_prop',[expr(n.object),n.computed?expr(n.property):str(n.property.name)]);throw Error('Unsupported assignment target '+n.type);}
 function array(items){const v=tmp();let code=`{let ${v}=${op('array',[])};`;for(const item of items)code+=`let _=${item?op(item.type==='SpreadElement'?'spread':'push',[`${v}.clone()`,expr(item.type==='SpreadElement'?item.argument:item)]):op('hole',[`${v}.clone()`])};`;return code+`${v}}`;}
 function chainMember(n,flag){const object=tmp(),key=tmp();return `{let ${object}=${expr(n.object,flag)};if ${flag}${n.optional?`||nullish(&${object})`:''}{${flag}=true;u()}else{let ${key}=${n.computed?expr(n.property):str(n.property.name)};prop(${object},${key})?}}`;}
 function expr(n,chain=null){
  if(!n)return'u()';
  switch(n.type){
   case'Literal':if(n.regex)return op('regexp',[str(n.regex.pattern),str(n.regex.flags)]);if(n.value===null)return'V::NULL';if(typeof n.value==='string')return str(n.value);if(typeof n.value==='boolean')return`b(${n.value})`;if(typeof n.value==='number')return`n(${Number.isInteger(n.value)?n.value+'.0':n.value})`;throw Error('Unsupported literal');
   case'Identifier':return`get(&env,${q(n.name)})?`;
   case'ThisExpression':return'get(&env,"@this")?';
   case'ArrayExpression':return array(n.elements);
   case'ObjectExpression':{const v=tmp();let code=`{let ${v}=${op('object',[])};`;for(const p of n.properties){if(p.type==='SpreadElement'){code+=`let _=${op('object_spread',[`${v}.clone()`,expr(p.argument)])};`;continue;}const key=tmp();code+=`let ${key}=${propertyKey(p)};let _=${op('define',[`${v}.clone()`,key,str(p.kind==='init'?'value':p.kind),expr(p.value),'b(true)'])};`;}return code+v+'}';}
   case'FunctionExpression':case'ArrowFunctionExpression':return fn(n);
   case'ChainExpression':{const flag=tmp();return`{let mut ${flag}=false;${expr(n.expression,flag)}}`;}
   case'MemberExpression':return chain?chainMember(n,chain):`prop(${expr(n.object)},${n.computed?expr(n.property):str(n.property.name)})?`;
   case'CallExpression':case'NewExpression':{
    const receiver=tmp(),functionValue=tmp();let setup;
    if(n.callee.type==='MemberExpression'){
     setup=`let ${receiver}=${expr(n.callee.object,chain)};`;
     if(chain)setup+=`let ${functionValue}=if ${chain}${n.callee.optional?`||nullish(&${receiver})`:''}{${chain}=true;u()}else{prop(${receiver}.clone(),${n.callee.computed?expr(n.callee.property):str(n.callee.property.name)})?};`;
     else setup+=`let ${functionValue}=prop(${receiver}.clone(),${n.callee.computed?expr(n.callee.property):str(n.callee.property.name)})?;`;
    }else setup=`let ${receiver}=u();let ${functionValue}=${expr(n.callee,chain)};`;
    const invoke=op(n.type==='NewExpression'?'new':'apply',n.type==='NewExpression'?[functionValue,array(n.arguments)]:[functionValue,receiver,array(n.arguments)]);
    return`{${setup}${chain?`if ${chain}${n.optional?`||nullish(&${functionValue})`:''}{${chain}=true;u()}else{${invoke}}`:invoke}}`;
   }
   case'BinaryExpression':return op('binary',[str(n.operator),expr(n.left),expr(n.right)]);
   case'LogicalExpression':{const v=tmp();const condition=n.operator==='&&'?`truth(&${v})`:n.operator==='||'?`!truth(&${v})`:`nullish(&${v})`;return`{let ${v}=${expr(n.left)};if ${condition}{${expr(n.right)}}else{${v}}}`;}
   case'ConditionalExpression':return`if truth(&${expr(n.test)}){${expr(n.consequent)}}else{${expr(n.alternate)}}`;
   case'UnaryExpression':if(n.operator==='delete')return n.argument.type==='MemberExpression'?op('delete',[ref(n.argument)]):`{let _=${expr(n.argument)};b(true)}`;return op('unary',[str(n.operator),n.operator==='typeof'&&n.argument.type==='Identifier'?op('soft_read',['env.clone()',str(n.argument.name)]):expr(n.argument)]);
   case'UpdateExpression':return op('update',[ref(n.argument),str(n.operator),`b(${n.prefix})`]);
   case'AssignmentExpression':{
    if(n.left.type==='ArrayPattern'||n.left.type==='ObjectPattern'){const v=tmp();return`{let ${v}=${expr(n.right)};${bind(n.left,`${v}.clone()`,'write')}${v}}`;}
    const r=tmp(),old=tmp(),value=tmp();let code=`{let ${r}=${ref(n.left)};`;
    if(n.operator==='=')return code+`let ${value}=${expr(n.right)};${op('putref',[r,value])}}`;
    code+=`let ${old}=${op('deref',[`${r}.clone()`])};`;
    if(['&&=','||=','??='].includes(n.operator)){const cond=n.operator==='&&='?`truth(&${old})`:n.operator==='||='?`!truth(&${old})`:`nullish(&${old})`;return code+`if ${cond}{let ${value}=${expr(n.right)};${op('putref',[r,value])}}else{${old}}}`;}
    return code+`let ${value}=${op('binary',[str(n.operator.slice(0,-1)),old,expr(n.right)])};${op('putref',[r,value])}}`;
   }
   case'SequenceExpression':return`{${n.expressions.slice(0,-1).map(x=>`let _=${expr(x)};`).join('')}${expr(n.expressions.at(-1))}}`;
   case'AwaitExpression':return`wasm_bindgen_futures::JsFuture::from(js_sys::Promise::resolve(&${expr(n.argument)})).await.map_err(Flow::Throw)?`;
   default:throw Error('Unsupported expression '+n.type+' at '+n.start);
  }
 }
 function wrap(code){return isAsync?`async {${code}\nOk(u())}.await`:`(|| -> E {${code}\nOk(u())})()`;}
 function lexical(body){let code='';for(const n of body){if(n.type==='VariableDeclaration'&&n.kind!=='var')code+=declare(n.declarations.flatMap(d=>patternNames(d.id)),n.kind);if(n.type==='ClassDeclaration')code+=declare([n.id.name],'let');if(n.type==='FunctionDeclaration')code+=declare([n.id.name],'var')+`let _=${op('init',['env.clone()',str(n.id.name),fn(n)])};`;}return code;}
 function block(body,newScope=true){return`{${newScope?`let env=${op('scope',['env.clone()'])};`:''}${lexical(body)}${body.map(stmt).join('\n')}}`;}
 function loopResult(body,update=''){return`match ${wrap(stmt(body))}{Ok(_)|Err(Flow::Continue)=>{},Err(Flow::Break)=>break,Err(e)=>return Err(e)};${update}`;}
 function stmt(n){
  if(!n)return'';
  switch(n.type){
   case'EmptyStatement':case'FunctionDeclaration':return'';
   case'BlockStatement':return block(n.body);
   case'ExpressionStatement':return`let _=${expr(n.expression)};`;
   case'VariableDeclaration':return n.declarations.map(d=>d.init?bind(d.id,expr(d.init),n.kind==='var'?'write':'init'):n.kind==='var'?'':bind(d.id,'u()')).join('\n');
   case'ReturnStatement':return`return Err(Flow::Return(${expr(n.argument)}));`;
   case'ThrowStatement':return`return Err(Flow::Throw(${expr(n.argument)}));`;
   case'IfStatement':return`if truth(&${expr(n.test)}){${stmt(n.consequent)}}${n.alternate?`else{${stmt(n.alternate)}}`:''}`;
   case'BreakStatement':if(n.label)throw Error('Labelled break unsupported');return'return Err(Flow::Break);';
   case'ContinueStatement':if(n.label)throw Error('Labelled continue unsupported');return'return Err(Flow::Continue);';
   case'WhileStatement':return`while truth(&${expr(n.test)}){${loopResult(n.body)}}`;
   case'ForStatement':{const keys=n.init?.type==='VariableDeclaration'&&n.init.kind!=='var'?n.init.declarations.flatMap(d=>patternNames(d.id)):[];return`{let mut env=${op('scope',['env.clone()'])};${declare(keys,n.init?.kind)}${n.init?.type==='VariableDeclaration'?stmt(n.init):n.init?`let _=${expr(n.init)};`:''}loop{${n.test?`if !truth(&${expr(n.test)}){break;}`:''}${loopResult(n.body,`${keys.length?`env=${op('clone_scope',['env.clone()'])};`:''}${n.update?`let _=${expr(n.update)};`:''}`)}}}`;}
   case'ForOfStatement':case'ForInStatement':{
    const iterator=tmp(),step=tmp(),outcome=tmp();const left=n.left.type==='VariableDeclaration'?n.left.declarations[0].id:n.left;
    const kind=n.left.type==='VariableDeclaration'?n.left.kind:null;const value=n.type==='ForInStatement'?op('keys_in',[expr(n.right)]):expr(n.right);
    const binding=kind?declare(patternNames(left),kind)+bind(left,`prop(${step},s("value"))?`,kind==='var'?'write':'init'):`let _=${op('putref',[ref(left),`prop(${step},s("value"))?`])};`;
    const body=`{let env=${op('scope',['env.clone()'])};${binding}${stmt(n.body)}}`;
    return`{let ${iterator}=${op('iterator',[value])};let ${outcome}=${wrap(`loop{let ${step}=${op('next',[`${iterator}.clone()`])};if truth(&prop(${step}.clone(),s("done"))?){break;}match ${wrap(body)}{Ok(_)|Err(Flow::Continue)=>{},Err(Flow::Break)=>{let _=${op('close_iterator',[`${iterator}.clone()`])};break},Err(e)=>{let _=${op('close_iterator',[`${iterator}.clone()`])};return Err(e)}}}`)};if let Err(e)=${outcome}{return Err(e);}}`;
   }
   case'TryStatement':{const outcome=tmp(),end=tmp();let code=`{let ${outcome}=${wrap(stmt(n.block))};`;if(n.handler){const error=tmp();code+=`let ${outcome}=match ${outcome}{Err(Flow::Throw(${error}))=>${wrap(`let env=${op('scope',['env.clone()'])};${n.handler.param?declare(patternNames(n.handler.param),'let')+bind(n.handler.param,error):''}${stmt(n.handler.body)}`)},other=>other};`;}
    if(n.finalizer)code+=`let ${end}=${wrap(stmt(n.finalizer))};if let Err(e)=${end}{return Err(e);}`;return code+`if let Err(e)=${outcome}{return Err(e);}}`;
   }
   case'ClassDeclaration':{const constructor=n.body.body.find(m=>m.kind==='constructor');if(n.superClass)throw Error('Class inheritance unsupported');if(!constructor)throw Error('Class needs explicit constructor');const v=tmp(),proto=tmp();let code=`{let ${v}=${fn(constructor.value,n.id.name,true)};let _=${op('init',['env.clone()',str(n.id.name),`${v}.clone()`])};let ${proto}=prop(${v}.clone(),s("prototype"))?;`;for(const m of n.body.body)if(m!==constructor)code+=`let _=${op('define',[m.static?`${v}.clone()`:`${proto}.clone()`,propertyKey(m),str(m.kind==='method'?'value':m.kind),fn(m.value,m.key.name??m.key.value),'b(false)'])};`;return code+'}';}
   case'SwitchStatement':{const value=tmp(),index=tmp(),result=tmp();let code=`{let ${value}=${expr(n.discriminant)};let mut ${index}:Option<usize>=None;`;let def=-1;n.cases.forEach((c,i)=>{if(!c.test)def=i;else code+=`if ${index}.is_none()&&truth(&${op('binary',[str('==='),`${value}.clone()`,expr(c.test)])}){${index}=Some(${i});}`;});if(def>=0)code+=`if ${index}.is_none(){${index}=Some(${def});}`;const run=n.cases.map((c,i)=>`if ${index}.map_or(false,|start|start<=${i}){${c.consequent.map(stmt).join('\n')}}`).join('\n');return code+`let ${result}=${wrap(run)};match ${result}{Err(Flow::Break)|Ok(_)=>{},Err(e)=>return Err(e)}}`;}
   default:throw Error('Unsupported statement '+n.type+' at '+n.start);
  }
 }
 const output=['// Migrated owned mod functions. No JavaScript source evaluator is used.','#![allow(unused_variables, unused_mut, unused_assignments, unreachable_code, unused_braces)]','use super::*;'];
 for(const [id,node]of functions.entries()){
  isAsync=!!node.async;let code=`let env=${op('function_scope',['parent','receiver','args.clone()','callee.clone()'])};`;
  if(node.type==='FunctionExpression'&&node.id)code+=declare([node.id.name],'const')+bind(node.id,'callee.clone()');
  for(const name of node.params.flatMap(patternNames))code+=declare([name],'let');
  node.params.forEach((param,i)=>{code+=bind(param,param.type==='RestElement'?op('slice',['args.clone()',`n(${i}.0)`]):`prop(args.clone(),n(${i}.0))?`);});
  code+=declare([...varNames(node.body)],'var');code+=node.body.type==='BlockStatement'?block(node.body.body,false):`return Err(Flow::Return(${expr(node.body)}));`;
  output.push(`// @program ${manifest[id].program}\n// ${names.get(node)||'(anonymous)'}\n${isAsync?'async ':''}fn f_${id}(parent:V,receiver:V,args:V,callee:V)->Result<V,V>{let result:E=${wrap(code)};finish(result)}`);
 }
 isAsync=false;
 for(const [id,{name,tree}]of trees.entries())output.push(`// @program ${id}\n// ${name}\nfn p_${id}(env:V)->Result<V,V>{let result:E=${wrap(declare([...varNames(tree)],'var')+block(tree.body,false))};finish(result)}`);
 output.push('// @program dispatch');
 output.push('pub fn dispatch(id:u32,env:V,receiver:V,args:V,callee:V)->Result<V,V>{match id{'+functions.map((node,id)=>node.async?`${id}=>Ok(wasm_bindgen_futures::future_to_promise(async move{f_${id}(env,receiver,args,callee).await}).into()),`:`${id}=>f_${id}(env,receiver,args,callee),`).join('\n')+'_=>Err(js_sys::Error::new("Unknown Rust function").into())}}');
 output.push('pub fn run_program(id:u32,env:V)->Result<V,V>{match id{'+trees.map((_,id)=>`${id}=>p_${id}(env),`).join('')+'_=>Err(js_sys::Error::new("Unknown Rust module").into())}}');
 return{rust:output.join('\n')+'\n',manifest:{programs:trees.map(({name,tree},id)=>({id,name,entries:tree.body.filter(n=>n.type==='FunctionDeclaration').map(n=>n.id.name)})),functions:manifest}};
}
module.exports={transpile};
