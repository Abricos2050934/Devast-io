const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const dir=__dirname;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function http(url){return new Promise(resolve=>{const p=spawn('curl',['-sS','--max-time','20','-o','/dev/null','-w','%{http_code}',url]);let status='';p.stdout.on('data',c=>status+=c);p.stderr.resume();p.on('error',()=>resolve(0));p.on('close',()=>resolve(Number(status)||0));});}
function probe(){return new Promise(resolve=>{const out=fs.openSync(path.join(dir,'watch-live.log'),'a');const p=spawn(process.execPath,[path.join(dir,'check.cjs')],{cwd:'/workspace/Devast-io',env:process.env,stdio:['ignore',out,out]});p.on('close',code=>{fs.closeSync(out);resolve(code);});});}
(async()=>{for(let attempt=1;attempt<=12;attempt++){
 const home=await http('https://devast.io/');
 let list=null,widget=null;
 if(home===200){list=await http('https://devast.io/list');if(list===200)widget=await http('https://webgames.io/js/widget.min.js?dv1');}
 const state={at:new Date().toISOString(),attempt,home,list,widget};
 fs.appendFileSync(path.join(dir,'network-watch.jsonl'),JSON.stringify(state)+'\n');console.log(JSON.stringify(state));
 if(home===200&&list===200&&widget===200){await probe();console.log(JSON.stringify({event:'live-attempt-finished',report:path.join(dir,'report.json')}));return;}
 if(attempt<12)await delay(30000);
}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
