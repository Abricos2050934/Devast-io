function verifyMessage27Menu(mod,reference){
 const root=new window.dat.GUI({autoPlace:false});
 try{
  const make=new Function('menu','MOD',reference.blocks.find(b=>b.name==='aim-menu').source+';return [aimFolder,spearFolder,antiFolder,lineFolder];');
  const expected=make(root,{...mod.settings});
  const describe=folder=>folder.__controllers.map(c=>({property:c.property,label:c.__li.querySelector('.property-name').textContent,min:c.__min??null,max:c.__max??null,step:c.__step??null,options:Array.from(c.domElement.querySelector('select')?.options||[]).map(o=>({label:o.textContent,value:o.value}))}));
  const folders={};for(const folder of expected){const actual=mod.menu.__folders[folder.name];if(!actual)throw Error('Missing uploaded aim folder '+folder.name);const a=describe(actual),b=describe(folder);if(JSON.stringify(a)!==JSON.stringify(b))throw Error('Uploaded aim menu differs: '+folder.name);folders[folder.name]=a;}
  const keyboard=new Function('menu','MOD',reference.blocks.find(b=>b.name==='AimbotMenuSetupKey').source+'\n'+reference.blocks.find(b=>b.name==='aim-keyboard').source+';return keyFolder;')(root,{...mod.settings});
  const keyControls=describe(keyboard),installedKeys=describe(mod.menu.__folders.Keyboard).slice(0,keyControls.length);
  if(JSON.stringify(keyControls)!==JSON.stringify(installedKeys))throw Error('Uploaded aim key order differs');
  if(mod.settings.ModMenuKey!=='KeyM'||mod.settings.HideAngleKey!=='KeyH')throw Error('Selected M/H default bindings were not applied');
  return {status:'passed',upload_sha256:reference.upload_sha256,folders,keyboard:true,key_controls:installedKeys,default_bindings:{menu:mod.settings.ModMenuKey,hide:mod.settings.HideAngleKey},exact_order_labels_ranges_steps_options:true,controls:Object.values(folders).reduce((count,list)=>count+list.length,0)};
 }finally{root.destroy();}
}
module.exports={verifyMessage27Menu};
