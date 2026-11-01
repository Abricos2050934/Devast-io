// Browser-only integration checks against the actual current native client.
const fs=require('node:fs'),a=require('./parser.cjs'),{chromium}=require('playwright-core'),{hash}=require('./build_client.cjs');
const s=JSON.parse(fs.readFileSync('patches/recovered-bindings.json')).symbols,p=JSON.parse(fs.readFileSync('patches/recovered-current.json'));
const src=fs.readFileSync('dist/game.modded.js','utf8'),t=a.parse(src,{ecmaVersion:'latest'}),end=t.body[0].expression.callee.body.end-1;
const functionNames={'ι๔̶':'spawn','ᴄ９̗':'headLabel','ⲅ︉️':'leaderLabel','ᴄߌ͏':'update','ⲟ१̖':'packet'};
const edits=[],todo=[t];while(todo.length){const n=todo.pop();if(!n||typeof n!=='object')continue;
 if(n.type==='FunctionDeclaration'&&functionNames[n.id.name])edits.push({at:n.start,text:`window.__ilmFunctions=window.__ilmFunctions||{};window.__ilmFunctions.${functionNames[n.id.name]}=${n.id.name};`});
 for(const v of Object.values(n)){if(Array.isArray(v))todo.push(...v);else if(v&&typeof v==='object')todo.push(v);}
}
if(edits.filter(e=>e.text.includes('__ilmFunctions')).length!==5)throw Error('Expected five native functions');
const probe=`window.__ilmProbe={...window.__ilmFunctions,world:ᴘ̏٤,network:оᴌ︈,entities:ᴘոᚄ,input:ㅤ๘މ,labelFactory:а̵̠,lerp:ᴌߊ༡.ᴎ٨ߍ,layout:{x:ρ̴ކ,y:7},};`;
edits.push({at:end,text:probe});let code=src;for(const e of edits.sort((a,b)=>b.at-a.at))code=code.slice(0,e.at)+e.text+code.slice(e.at);
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,env:{...process.env,HOME:'/tmp/devast-browser-home'},proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={started_at:new Date().toISOString(),output_sha256:hash(src),mode:'native browser fixtures, not a live server session',page_errors:[]};
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.page_errors.push(e.message.slice(0,250)));
  await page.route('https://devast.io/',r=>r.fulfill({status:200,contentType:'text/html',body:fs.readFileSync('build/download/index.html','utf8')}));
  await page.route(p.source_url,r=>r.fulfill({status:200,contentType:'text/javascript',body:code}));
  await page.goto('https://devast.io/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.__ilmProbe&&!!window.__devastMod?.menu);
  report.checks=await page.evaluate(s=>{
   const n=window.__ilmProbe,m=window.__devastMod,w=n.world,players=w[s['ᴎ︃ᄉ']],self=w[s['ᅠᏧ‍']],out={};
   const assert=(value,message)=>{if(!value)throw Error(message);};
   // Run the native metadata initializer normally invoked by the login snapshot.
   w['ࡀ︌٨']=121;
   const initialNames=Array(121).fill(0);initialNames[2]='Initial#tag';
   w['І︈༧'](initialNames);
   assert(players[2][s['ο̏︇']]==='Initial#tag#2','Initial native constructor lost ID');
   assert(players[3][s['ο̏︇']]===0,'Unused native slot sentinel changed');
   out.native_initial_constructor_ids=true;
   // Exercise the real server-spawn metadata handler and BOTH native label generators.
   const texts=[],nativeText=n.labelFactory['ᴉ̷Ꮷ'];
   n.labelFactory['ᴉ̷Ꮷ']=function(...args){texts.push(args[0]);return nativeText.apply(this,args);};
   try{
    for(const [id,raw] of [[2,'Native#tag'],[120,''],[2,'Respawn']]){
     n.spawn([0,id,123,raw,0,0]);const meta=players[id];
     assert(meta[s['ο̏︇']]===raw+'#'+id,'Wrong native metadata nickname');
     texts.length=0;const head=n.headLabel(meta),leader=n.leaderLabel(meta,'#fff');
     assert(texts.filter(x=>x===raw+'#'+id).length>=2,'ID missing from native head/leader label text');
     assert(head&&leader,'Native label canvases missing');
    }
    out.native_head_and_leaderboard_ids=true;out.respawn_has_one_suffix=true;
   }finally{n.labelFactory['ᴉ̷Ꮷ']=nativeText;}
   // Decode current 20-byte packet entries rather than invoking the mod hook directly.
   function packet(type,id,uid,x,y,active=true){
    const b=new ArrayBuffer(22),u8=new Uint8Array(b),u16=new Uint16Array(b);u8[2]=id;u8[3]=uid;u8[5]=type;
    u16[3]=active?1:0;u16[4]=0;u16[1+n.layout.x]=x;u16[1+n.layout.y]=y;
    n.packet(b,u8,0);
   }
   packet(0,1,1,1000,1000);packet(0,2,1,1100,1000);packet(0,2,1,1120,1020);
   assert(m.targets.players[2].x===1120&&m.targets.players[2].prevX[0]===1100,'Player packet history mismatch');
   packet(13,0,17,1200,1200);assert(m.targets.ghouls[17].x===1200,'Ghoul packet hook mismatch');
   packet(13,0,17,0,0,false);assert(!m.targets.ghouls[17].active,'Ghoul removal hook mismatch');
   packet(0,2,1,0,0,false);assert(!m.targets.players[2].active,'Player removal hook mismatch');
   out.current_packet_history_and_removal=true;
   self.id=1;const e=n.entities.get(1,0,1,0);e[s['ᴘ४１']]=1;e.id=0;e['ᴎ٨ߍ']=.25;e['ᴑ٧ߓ']=1;n.input.angle=2;
   const angles=[];
   for(const [mode,enabled] of [['withAim',false],['withAim',true],['always',false]]){
    m.setSetting('ShowRealAngles',mode);m.setSetting('AimBotEnabled',enabled);e.angle=0;n.update(e);
    const expected=mode==='always'||enabled?n.lerp(0,1,.5):2;
    assert(Math.abs(e.angle-expected)<1e-8,'Native self angle mode failed: '+mode+'/'+enabled);angles.push({mode,enabled,angle:e.angle});
   }
   out.native_self_angles=angles;out.mod_errors=[...m.diagnostics.errors];assert(!out.mod_errors.length,'Mod integration errors');
   m.setSetting('AimBotEnabled',false);self.id=0;return out;
  },s);
  report.result='passed';await page.screenshot({path:'build/ilm-upload/native-browser.png'});
 }catch(e){report.result='failed';report.failure=e.message;process.exitCode=1;}
 finally{report.finished_at=new Date().toISOString();fs.writeFileSync('build/ilm-upload/native-browser-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,checks:report.checks},null,2));await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
