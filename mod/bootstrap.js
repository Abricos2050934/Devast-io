var __responsiveDoorEligibility;
var __responsiveView = {x:0,y:0,scale:1,ctx:а०̅};
var __responsiveMod = __installDevastMod({
  synchronizedRender:true, nativePlayerLabels:true,
  types:εᚇ๓, world:еܞ︌, network:о̃༩, input:ρ̃५, entities:ι‌̵,
  renderer:ᴇ️̅, items:ιᄅᴄ, graphics:ᴘᚉ٦, karma:ᴉ२ߋ,
  categories:{player:0,loot:1,projectile:2},
  loginKey:'ᅠϲ᠍',
  restoreFailureKey:'е̅ܙ',
  preflightKey:'εܖᴏ',
  errorKey:'ι︃２',
  pendingKey:'ϲІ̗',
  integrity:()=>nativeIntegrityFlag,
  integrityPatched:()=>__devastIntegrityCompatibility,
  health:()=>еܞ︌.ᴘρࡀ?.ᴇ༤ᚆ?.value,
  isManualDoor:descriptor=>descriptor.ᴎߌ๕===ᴇ️̅.օ̠̄,
  canUseDoor:(descriptor,entity)=>__responsiveDoorEligibility(descriptor,entity),
  adWaiting:()=>typeof ɑᚆᴏ !== 'undefined' && !!(ɑᚆᴏ && ɑᚆᴏ.ϲ१༧ === 1),
  returnToMenu:()=>{
    if(typeof ɑᚆᴏ.nativeHomeEnter === 'function') ɑᚆᴏ.nativeHomeEnter();
  },
  homeControlsVisible:()=>{
    const input=document.getElementById('nicknameInput');
    return !!(input&&input.getClientRects().length);
  },
  canShowHome:()=>typeof ɑᚆᴏ.nativeHomeEnter === 'function'&&Array.isArray(о̃༩.ոߒ४)&&о̃༩.ոߒ४.length>0,
  reconnect:()=>{
    if(typeof о̃༩.ᅠϲ᠍ !== 'function') throw new Error('Game login is not ready');
    о̃༩.ᅠϲ᠍();
  },
  view:()=>({...__responsiveView,ctx:а०̅}),
  chatActive:()=>document.activeElement?.id==='chatInput'
});
window.__devastMod = __responsiveMod;
