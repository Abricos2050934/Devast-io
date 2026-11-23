declare const а०̅:CanvasRenderingContext2D;
declare const εᚇ๓:NativeDictionary[];
declare const еܞ︌:NativeWorld;
declare const о̃༩:NativeNetwork;
declare const ρ̃५:NativeDictionary&{angle:number};
declare const ι‌̵:NativeEntities;
declare const ᴇ️̅:NativeDictionary;
declare const ιᄅᴄ:NativeDescriptor[];
declare const ᴘᚉ٦:NativeDictionary;
declare const ᴉ२ߋ:NativeValue[];
declare const ɑᚆᴏ:NativeDictionary;
declare const nativeIntegrityFlag:number;
declare const __devastIntegrityCompatibility:boolean;
declare function __installDevastMod(bridge:NativeBridge):ModRuntime;
var __responsiveView = {x:0,y:0,scale:1,ctx:а०̅};
var __responsiveMod = __installDevastMod({
  synchronizedRender:true, nativePlayerLabels:true,
  types:εᚇ๓, world:еܞ︌, network:о̃༩, input:ρ̃५, entities:ι‌̵,
  aimSend:о̃༩.ᴎᚂρ.__devastAimTransport,
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
