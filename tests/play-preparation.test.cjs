const test=require('node:test'),assert=require('node:assert/strict');
const {analyze}=require('../tools/updater/static.cjs'),{readonlyConstants}=require('../tools/updater/semantic.cjs'),{playPreparation}=require('../tools/updater/play-preparation.cjs'),{preservedSpans}=require('../tools/updater/project-fragment.cjs');
const previous='function play(){state=1;account.ready(function(){if(mode==="auto")choose();network.login();});}';
const current='function enter(){state=1;account.ready(function(){if(mode==="auto")choose();var saved=load();if(saved){remember(saved);return;}network.login();});}';
const names={oldNamespace:'network',oldLogin:'login',namespace:'network',login:'login'};
const analysis=source=>readonlyConstants(analyze(source));
test('native Play callback additions survive the reviewed wrapper without borrowing the old callback body',()=>{
 const old=analysis(previous),cur=analysis(current),match=playPreparation(old,cur,old.tree.body[0],names);
 const after=previous.replace('state=1;','if(mod&&!mod.beginPlay())return;state=1;').replace('account.ready(function(){','account.ready(guard(function(){').replace('network.login();});','network.login();}));');
 const spans=preservedSpans(old,cur,match,after);assert.ok(spans.some(e=>e.text.includes('var saved=load();if(saved){remember(saved);return;}')));
});
test('native Play changes outside the callback, a changed prefix/login, or ambiguity stop adaptation',()=>{
 const old=analysis(previous);
 for(const source of [current.replace('state=1','state=2'),current.replace('mode==="auto"','mode==="private"'),current.replace('network.login()','network.other()'),current+'\n'+current.replace('enter()','another()')]){
  assert.throws(()=>playPreparation(old,analysis(source),old.tree.body[0],names),/changed or is ambiguous/);
 }
});
