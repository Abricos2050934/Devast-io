// Compare the installed real dat.GUI with the isolated uploaded menu block.
function verifyIlmMenu(mod,reference){
 const check=(v,t)=>{if(!v)throw Error(t);};
 const source=reference.blocks.find(b=>b.name==='menu').source;
 const root=new window.dat.GUI({autoPlace:false});
 const settings={...mod.settings};
 try{
  new Function('_0x2a1bff','_0x2ea565',source)(root,settings);
  function describe(folder){return folder.__controllers.map(c=>({
   property:c.property,label:c.__li.querySelector('.property-name').textContent,
   min:c.__min??null,max:c.__max??null,step:c.__step??null,
   options:Array.from(c.domElement.querySelector('select')?.options||[]).map(o=>({label:o.textContent,value:o.value}))
  }));}
  const expected=describe(root.__folders['Aim Bot']),actual=describe(mod.menu.__folders['Aim Bot']);
  check(JSON.stringify(actual)===JSON.stringify(expected),'ILM labels/order/ranges/steps/options differ from uploaded menu');
  check(Object.keys(mod.menu.__folders['Aim Bot'].__folders).length===0,'Extra ILM subfolder remains');
  const aimKeys=new Set(['AimBotEnabled','autoFire','mouseFovEnable','mouseFov','lockId','visualizeResolving','visualizeResolvingColor',...expected.map(c=>c.property)]),extra=[];
  function walk(folder,path){for(const c of folder.__controllers)if(aimKeys.has(c.property)&&path!=='Aim Bot')extra.push(path+'/'+c.property);for(const[name,child]of Object.entries(folder.__folders))walk(child,path?path+'/'+name:name);}
  walk(mod.menu,'');check(extra.length===0,'Non-source ILM controls remain: '+extra.join(','));
  const saved=mod.settings.visualizeResolvingColor,color=mod.targets.lines[0].color;
  try{mod.setSetting('visualizeResolvingColor','#123456');check(mod.targets.lines[0].color===color,'Unused original color setting overrides source line');}finally{mod.setSetting('visualizeResolvingColor',saved);}
  return {status:'passed',controls:actual,exact_order_labels_ranges_steps_options:true,no_extra_aim_controls:true,source_line_color:true};
 }finally{root.destroy();}
}
module.exports={verifyIlmMenu};
