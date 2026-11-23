

var __responsiveView: PublishedDynamic = {x:0,y:0,scale:1,ctx:Ꮷ︌︁};
var __responsiveMod: PublishedDynamic = __installDevastMod({
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
  integrity:(): PublishedDynamic=>ⲅ４ܒ,
  integrityPatched:(): PublishedDynamic=>__devastIntegrityCompatibility,
  health:(): PublishedDynamic=>і̠̏.ᴉᚇ︃?.ɑ९ρ?.value,
  isManualDoor:(descriptor: PublishedDynamic): PublishedDynamic=>descriptor.е̝̌===ᴀᄃ९.ﾠᚈ༡,
  adWaiting:(): PublishedDynamic=>typeof сރܗ !== 'undefined' && !!(сރܗ && сރܗ.ᴌއ२ === 1),
  returnToMenu:(): PublishedDynamic=>{
    if(typeof сރܗ.run === 'function') сރܗ.run();
  },
  homeControlsVisible:(): PublishedDynamic=>{
    const input: PublishedDynamic=document.getElementById('nicknameInput');
    return !!(input&&input.getClientRects().length);
  },
  canShowHome:(): PublishedDynamic=>typeof сރܗ.run === 'function'&&Array.isArray(о̣̃.ᅠᄀ︅)&&о̣̃.ᅠᄀ︅.length>0,
  reconnect:(): PublishedDynamic=>{
    if(typeof о̣̃.ㅤܓᴀ !== 'function') throw new Error('Game login is not ready');
    о̣̃.ㅤܓᴀ();
  },
  view:(): PublishedDynamic=>({...__responsiveView,ctx:Ꮷ︌︁}),
  chatActive:(): PublishedDynamic=>document.activeElement?.id==='chatInput'
});
window.__devastMod = __responsiveMod;