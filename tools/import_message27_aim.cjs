// Extract reviewed aim declarations as text. Never run the uploaded client.
const fs=require('node:fs'),z=require('node:zlib'),crypto=require('node:crypto');
const {parse}=require('./parser.cjs');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function extract(source){
 if(sha(source)!=='f3001e45554d86505e89532faaa2aff5be69dec90b713e7966428273d2b1abd0')throw Error('Unexpected uploaded source');
 const tree=parse(source,{ecmaVersion:'latest'}),nodes=[],walk=n=>{if(!n?.type)return;nodes.push(n);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v?.type)walk(v);};walk(tree);
 const text=n=>source.slice(n.start,n.end),top=tree.body;
 const declaration=name=>top.find(n=>n.type==='VariableDeclaration'&&n.declarations.some(d=>d.id.name===name));
 const named=name=>nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name===name);
 const core=declaration('__BBY'),last=top.findIndex(n=>n.start===core.start),tail=top.slice(last+1);
 const begin=tail.findIndex(n=>text(n).startsWith('Aimbot.selfId ='));
 const finish=tail.findIndex(n=>text(n).startsWith('Aimbot.spearResolve ='));
 if(begin<0||finish<=begin)throw Error('Unexpected active integration boundary');
 const glue=tail.slice(begin,finish+1);
 const menu=named('AimbotMenuInit'),body=menu.body.body,first=body.findIndex(n=>n.type==='VariableDeclaration'&&n.declarations[0].id.name==='aimFolder'),end=body.findIndex(n=>n.type==='VariableDeclaration'&&n.declarations[0].id.name==='keyFolder');
 const mod=declaration('MOD').declarations[0].init,settings={};
 const keys=new Set(['AimBotEnabled','AimbotSpearEnabled','spearSpeed','spearMaxRange','spearHandFwd','spearHandSide','spearStabDeg','hideAimbotAngle','hidePlayerAngle','target','TargetTeammate','resolverType','mouseFovEnable','mouseFov','distanceCoefficient','offsetCoefficient','aimStick','aimSmooth','aimMaxRange','aimHoldMs','leadCap','visualizeResolving','visualizeResolvingColor','autoFire','lockId','AntiAimbot','antiAimMode','antiAimCoefficient','jitterActive','jitterOffset','stopJittersOnStop','ShowRealAngles','AimbotKey','AntiAimbotKey','JitterKey','HideAngleKey','ModMenuKey','ModMenuKeyCode']);
 for(const p of mod.properties)if(keys.has(p.key.name)){const n=p.value;settings[p.key.name]=n.type==='Literal'?n.value:n.type==='UnaryExpression'&&n.operator==='-'?-n.argument.value:undefined;if(settings[p.key.name]===undefined)throw Error('Nonliteral aim default');}
 const externalJitter=top.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='routineJitter');
 const loops=top.filter(n=>n.type==='ExpressionStatement'&&n.expression.type==='CallExpression'&&(n.expression.callee.name==='setInterval'&&n.expression.arguments[0]?.name==='routineAntiAimbot'||n.expression.callee.type==='FunctionExpression'&&n.expression.callee.id?.name==='aimbotLoop'));
 const fire=named('ࡀࡄᚁ').body.body.slice(-3);
 const blocks=[{name:'active-core',source:text(core)},{name:'integration',source:glue.map(text).join('\n')},...['__aimShotAllowed','aimbotTick','routineAntiAimbot','AimbotLoadConfig','AimbotMenuSetupKey'].map(name=>({name,source:text(named(name))})),{name:'anti-move-state',source:top.filter(n=>n.type==='VariableDeclaration'&&n.declarations.some(d=>['__antiMoveStep','__antiMovePattern'].includes(d.id.name))).map(text).join('\n')},{name:'source-loops',source:loops.map(text).join('\n')},{name:'external-jitter-state',source:text(declaration('__jitterLastX'))},{name:'external-jitter',source:text(externalJitter)},{name:'render',source:text(named('AimbotDraw'))},{name:'aim-menu',source:body.slice(first,end).map(text).join('\n')},{name:'native-fire-tail',source:fire.map(text).join('\n')}];
 const inputStart=top.findIndex(n=>n.type==='VariableDeclaration'&&n.declarations.some(d=>d.id.name==='__oTouchAim'));
 const inputEnd=top.findIndex((n,i)=>i>inputStart&&n.type==='ExpressionStatement'&&n.expression.type==='CallExpression'&&n.expression.arguments[0]?.value==='keydown');
 if(inputStart<0||inputEnd<=inputStart)throw Error('Source aim input boundary changed');
 blocks.push({name:'aim-input',source:top.slice(inputStart,inputEnd).map(text).join('\n')},{name:'self-player-helper',source:text(named('__isMyAimbotPlayer'))});
 for(const name of ['AimbotSaveConfig','AimbotHookSave'])blocks.push({name,source:text(named(name))});
 const keyboardEnd=body.findIndex(n=>n.type==='VariableDeclaration'&&n.declarations[0].id.name==='visualFolder');
 blocks.push({name:'aim-keyboard',source:body.slice(end,keyboardEnd).map(text).join('\n')});
 for(const b of blocks)b.sha256=sha(b.source);
 return {schema:1,upload_sha256:sha(source),active_override:'__BBY',defaults:settings,blocks};
}
module.exports={extract};
if(require.main===module){const reference=extract(fs.readFileSync(process.argv[2],'utf8'));fs.writeFileSync('recovery/message27-aim-reference.json.gz',z.gzipSync(JSON.stringify(reference),{level:9}));console.log(JSON.stringify({upload_sha256:reference.upload_sha256,blocks:reference.blocks.map(b=>b.name),defaults:Object.keys(reference.defaults).length}));}
