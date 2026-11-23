

var __responsiveView = {x:0,y:0,scale:1,ctx:Ꮷ︌︁};
var __responsiveMod = __installDevastMod({
  synchronizedRender:true, nativePlayerLabels:true,
  types:ᅟі̖, world:і̠̏, network:о̣̃, input:ѕࡈܔ, entities:ո٧ᴎ,
  aimSend:о̣̃.ᴘܙ٣.__devastAimTransport,
  renderer:ᴀᄃ९, items:оࠂᚄ, graphics:ϲ０ᴀ, karma:ᴉ̞๙,
  categories:{player:0,loot:1,projectile:2},
  loginKey:"ㅤܓᴀ",
  restoreFailureKey:"ѕࠀ᠍",
  preflightKey:"ⲟᴀᚃ",
  errorKey:"ﾠܜі",
  pendingKey:"ᴎ̈︀",
  integrity:()=>ⲅ４ܒ,
  integrityPatched:()=>__devastIntegrityCompatibility,
  health:()=>і̠̏.ᴉᚇ︃?.ɑ९ρ?.value,
  isManualDoor:descriptor=>descriptor.е̝̌===ᴀᄃ९.ﾠᚈ༡,
  adWaiting:()=>typeof сރܗ !== 'undefined' && !!(сރܗ && сރܗ.ᴌއ२ === 1),
  returnToMenu:()=>{
    if(typeof сރܗ.run === 'function') сރܗ.run();
  },
  homeControlsVisible:()=>{
    const input=document.getElementById('nicknameInput');
    return !!(input&&input.getClientRects().length);
  },
  canShowHome:()=>typeof сރܗ.run === 'function'&&Array.isArray(о̣̃.ᅠᄀ︅)&&о̣̃.ᅠᄀ︅.length>0,
  reconnect:()=>{
    if(typeof о̣̃.ㅤܓᴀ !== 'function') throw new Error('Game login is not ready');
    о̣̃.ㅤܓᴀ();
  },
  view:()=>({...__responsiveView,ctx:Ꮷ︌︁}),
  chatActive:()=>document.activeElement?.id==='chatInput'
});
window.__devastMod = __responsiveMod;