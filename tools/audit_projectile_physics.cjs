const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.argv[2]||path.join(root,'build/projectile-physics'));fs.mkdirSync(out,{recursive:true});const tools=path.join(root,'tools'),{analyze}=require(tools+'/updater/static.cjs'),{readonlyConstants}=require(tools+'/updater/semantic.cjs');
const meta=JSON.parse(fs.readFileSync(root+'/dist/auto-update/current.json')),original=process.env.DEVAST_TEST_CANDIDATE?path.resolve(process.env.DEVAST_TEST_CANDIDATE):path.join(root,'dist/auto-update/versions',meta.release),lab=path.join(out,'native-lab');fs.mkdirSync(lab,{recursive:true});
for(const name of ['game.modded.js','profile.json','bindings.json','roles.json','source.json','index.html','ilm-aim.js','native.js'])fs.copyFileSync(path.join(original,name),path.join(lab,name));
const roles=JSON.parse(fs.readFileSync(lab+'/roles.json')),a=readonlyConstants(analyze(fs.readFileSync(lab+'/game.modded.js','utf8'))),speed=roles.ballisticProjectileSpeed,prop=n=>n.computed?a.constant(n.property):n.property.name;
const matches=a.nodes.filter(n=>n.type==='VariableDeclarator'&&n.init?.type==='BinaryExpression'&&n.init.operator==='*'&&n.init.left.type==='MemberExpression'&&prop(n.init.left)===speed&&n.init.right.type==='Identifier');
if(matches.length!==1)throw Error('Unique native projectile integration required: '+matches.length);
const step=matches[0];let owner=step;while(owner.type!=='FunctionDeclaration')owner=a.parent.get(owner);
const delta=step.init.right.name,coords=owner.body.body.filter(n=>n.type==='VariableDeclaration').flatMap(n=>n.declarations).filter(n=>n.init?.type==='BinaryExpression'&&n.init.operator==='-'&&n.init.left.type==='MemberExpression'&&n.init.right.type==='MemberExpression').slice(0,2);
if(coords.length!==2)throw Error('Projectile endpoint contract changed');
let source=fs.readFileSync(tools+'/validate_update.cjs','utf8');
const hook=`edits.push({at:${owner.start},text:${JSON.stringify('window.__physicsMotion={step:'+owner.id.name+',delta:()=>'+delta+',setDelta:value=>{'+delta+'=value;},destX:'+JSON.stringify(prop(coords[0].init.left))+',destY:'+JSON.stringify(prop(coords[1].init.left))+',sourceX:'+JSON.stringify(prop(coords[0].init.right))+',sourceY:'+JSON.stringify(prop(coords[1].init.right))+'};')}});\n`;
source=source.replace('let code=output;',hook+"edits.push({at:end,text:"+JSON.stringify('window.__physicsEncode=packet=>{const data='+roles['еϲᄄ']+'['+JSON.stringify(roles['ᴎ︅ހ'])+'](packet);return Array.from(new Uint8Array(data));};')+"});\nlet code=output;");
const stop=source.indexOf('  report.reload_identity=[];');if(stop<0)throw Error('Audit insertion missing');
source=source.slice(0,stop)+`
 report.physics=await page.evaluate(({s,r})=>{
  const n=window.__updateProbe,m=window.__devastMod,physics=window.__physicsMotion,fields=n.types[0][s.curveWeapons];
  const catalog=Object.entries(fields).filter(([,v])=>v?.path>0&&v[s.curveBulletSpeed]>0).map(([id,v])=>({id:+id,speed:v[s.curveBulletSpeed]*1000,range:v.path,reload:v.reload,sound:Object.values(v).find(x=>Array.isArray(x)&&x.some(y=>typeof y==='string'&&y.startsWith('audio/')))?.[0]||null,numeric:Object.fromEntries(Object.entries(v).filter(([,x])=>typeof x==='number'))}));
  m.settings.AimBotEnabled=false;m.settings.autoFire=false;n.network.state=1;n.world[s['ᅠᏧ‍']].id=1;
  const oldDelta=physics.delta(),motion=[];
  try{for(const [i,speed]of [140,145,180].entries())for(const [j,angle]of [0,Math.PI/4,Math.PI].entries()){
   const b=new ArrayBuffer(22),u8=new Uint8Array(b),u16=new Uint16Array(b);u8[2]=1;u8[3]=1;u8[5]=2;u16[3]=(speed<<8)|1;u16[4]=70+i*3+j;u16[5]=1000;u16[6]=1000;u16[7]=Math.round(1000+600*Math.cos(angle));u16[8]=Math.round(1000+600*Math.sin(angle));u16[9]=4;n.packet(b,u8,0);
   const bullet=n.entities.get(1,70+i*3+j,1,2),start={x:bullet[physics.sourceX],y:bullet[physics.sourceY]};physics.setDelta(100);physics.step(bullet);motion.push({packedSpeed:speed,angle,start,after:{x:bullet[physics.sourceX],y:bullet[physics.sourceY]},display:{x:bullet.x,y:bullet.y},distance:Math.hypot(bullet[physics.sourceX]-start.x,bullet[physics.sourceY]-start.y),runtimeSpeed:bullet[r.ballisticProjectileSpeed]});
  }}finally{physics.setDelta(oldDelta);}
  const encoding=[0,.1,.9,1,1.9,90.5,359.9].map(angle=>({angle,bytes:window.__physicsEncode([6,angle])}));return {catalog,motion,encoding,units:'world units; native elapsed time in milliseconds',nativeSpeedKey:r.ballisticProjectileSpeed};
 },{s:symbols,r:roles});report.status='passed';
 }catch(error){report.error=error.message;process.exitCode=1;}
 finally{fs.writeFileSync(${JSON.stringify(path.join(out,'native-physics.json'))},JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,error:report.error,physics:report.physics}));if(browser)await browser.close();}
})();`;
process.argv[2]=lab;const filename=path.join(tools,'validate_update.cjs'),mod=new Module(filename,module);mod.filename=filename;mod.paths=Module._nodeModulePaths(tools);mod._compile(source,filename);
