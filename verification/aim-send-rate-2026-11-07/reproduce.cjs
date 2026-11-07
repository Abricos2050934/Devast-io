// Execute only extracted mod modules against local fixtures, never the game client.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),{fixture}=require(path.join(root,'tests/mod-fixture.cjs'));
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'devast-send-rate-')),originalCwd=process.cwd(),rows=[];
try{
 fs.mkdirSync(path.join(temporary,'mod'));
 for(const version of ['before','after']){
  for(const name of ['message15-aim.js','responsive.js']){
   const file='mod/'+name,data=version==='before'?execFileSync('git',['show','caf6d9f:'+file],{cwd:root}):fs.readFileSync(path.join(root,file));fs.writeFileSync(path.join(temporary,file),data);
  }
  process.chdir(temporary);const f=fixture();
  try{
   for(const [k,v]of Object.entries({AimBotEnabled:false,mouseFovEnable:false,lockId:2,autoFire:false,hideAimbotAngle:false,jitterActive:false}))f.mod.setSetting(k,v);
   f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,1,1400,1100,true);f.mod.setSetting('AimBotEnabled',true);f.packets.length=0;
   const backup=[...f.timers].find(([id])=>f.timerPeriods.get(id)===(version==='before'?1:50))[1];let callbacks=0;
   for(let elapsed=0;elapsed<10000;elapsed++){
    f.setClock(2000+elapsed);
    if(elapsed%(version==='before'?4:50)===0){backup();callbacks++;}
    if(elapsed%7===0){f.mod.aim.refresh();callbacks++;}
    if(elapsed%50===0){f.mod.trackPacket(1,2,1,1400,1100,true);callbacks++;}
   }
   const commandsByOpcode={};for(const p of f.packets)commandsByOpcode[p[0]]=(commandsByOpcode[p[0]]||0)+1;
   const result={version,durationMs:10000,stationaryTarget:true,backupCadenceMs:version==='before'?4:50,rafCadenceMs:7,entityUpdateCadenceMs:50,sourceCallbacks:callbacks,commandsByOpcode};rows.push(result);console.log(JSON.stringify(result));
  }finally{f.mod.dispose();}
 }
 if(rows[0].commandsByOpcode[6]!==4129||rows[1].commandsByOpcode[6]!==1)throw Error('Unexpected before/after result');
 fs.writeFileSync(path.join(__dirname,'before-after.json'),JSON.stringify({scope:'Synthetic browser cadence, local extracted mod only, no live server session',baseline_commit:'caf6d9f',rows},null,2)+'\n');
}finally{process.chdir(originalCwd);fs.rmSync(temporary,{recursive:true,force:true});}
