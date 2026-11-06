// Reuse candidate-native subtrees inside the reviewed patch template. This
// preserves native evaluation order, declarations and current implementation;
// structural fingerprints are used for correspondence, never as a code source.
const parser=require('../parser.cjs');
function preservedSpans(old,current,match,after){
 if(!match.projection)return [];
 const candidates=new Map(),pending=[match.old];
 while(pending.length){const n=pending.pop(),target=match.projection.get(n);
  if(target&&Number.isInteger(target.start)&&Number.isInteger(target.end)){const text=old.source.slice(n.start,n.end);if(!candidates.has(text))candidates.set(text,[]);candidates.get(text).push(target);}
  for(const v of Object.values(n))if(Array.isArray(v))pending.push(...v.filter(x=>x?.type));else if(v?.type)pending.push(v);
 }
 const edits=[],todo=[parser.parse(after,{ecmaVersion:'latest'})];
 while(todo.length){const n=todo.pop(),text=after.slice(n.start,n.end),list=candidates.get(text);
  if(n.type!=='Program'&&list?.length===1){
   const target=list[0],statement=n=>/Statement$|Declaration$/.test(n.type);
   if(statement(n)===statement(target)){
    edits.push({start:n.start,end:n.end,text:current.source.slice(target.start,target.end)});continue;
   }
  }
  for(const [key,v]of Object.entries(n)){
   if(n.type==='Property'&&key==='key'&&!n.computed)continue;
   if(Array.isArray(v))todo.push(...v.filter(x=>x?.type));else if(v?.type)todo.push(v);
  }
 }
 return edits.sort((a,b)=>a.start-b.start);
}
module.exports={preservedSpans};
