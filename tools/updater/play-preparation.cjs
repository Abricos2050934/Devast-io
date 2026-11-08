// The current native account callback may gain server-selection checks. Match
// its unchanged caller and prefix/login anchors, then keep the whole callback.
const {semanticCanonical:canonical}=require('./semantic.cjs');
function callback(fn){const last=fn?.body?.body?.at(-1),call=last?.expression,cb=call?.arguments?.[0];return last?.type==='ExpressionStatement'&&call?.type==='CallExpression'&&call.callee.type==='MemberExpression'&&call.arguments.length===1&&cb?.type==='FunctionExpression'&&cb.params.length===0&&cb.body.body.length>=2?{last,call,cb}:null;}
function masked(fn,c){return {...fn,body:{...fn.body,body:fn.body.body.map(n=>n===c.last?{...n,expression:{...c.call,arguments:[{...c.cb,body:{...c.cb.body,body:[]}}]}}:n)}};}
function login(a,cb,namespace,method){const last=cb.body.body.at(-1)?.expression;return last?.type==='CallExpression'&&last.arguments.length===0&&last.callee.type==='MemberExpression'&&last.callee.object.name===namespace&&(last.callee.computed?a.constant(last.callee.property):last.callee.property.name)===method;}
function playPreparation(old,cur,fn,names){
 const before=callback(fn);if(!before||!login(old,before.cb,names.oldNamespace,names.oldLogin))throw Error('Unsupported native Play callback');
 const oc=canonical(old,masked(fn,before)),prefix=canonical(old,before.cb.body.body[0]),matches=[];
 for(const next of cur.functions){
  if(next.type!=='FunctionDeclaration'||next.params.length!==fn.params.length||next.end-next.start>10000)continue;
  const after=callback(next);if(!after||!login(cur,after.cb,names.namespace,names.login)||canonical(cur,after.cb.body.body[0]).hash!==prefix.hash)continue;
  const nc=canonical(cur,masked(next,after));if(nc.hash===oc.hash)matches.push({next,after,nc});
 }
 if(matches.length!==1)throw Error('Native Play caller changed or is ambiguous');
 const {next,after,nc}=matches[0],projection=new Map();
 const index=nodes=>new Map(nodes.map(n=>[n.type+':'+n.start+':'+n.end,n]));
 const oldNodes=index(old.nodes),nextNodes=index(cur.nodes),original=(map,n)=>n&&map.get(n.type+':'+n.start+':'+n.end);
 for(const [p,n]of oc.entries){const left=original(oldNodes,n),right=original(nextNodes,nc.entries.get(p));if(left&&right)projection.set(left,right);}
 projection.set(before.cb,after.cb);
 return {old:fn,current:next,oc,nc,projection};
}
module.exports={playPreparation};
