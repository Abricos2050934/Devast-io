function __installDevastMod(this: PublishedDynamic,B: PublishedDynamic): PublishedDynamic {
  for (const key of ["ᴘܙ٣","Ꮷ५༩","Ꮷߓᄆ"]) if(typeof B.network?.[key] !== 'function') throw new Error('Missing native network handler: '+key);
  const ᅟࠅ８: PublishedDynamic = B.world;
  const рᄇ͡: PublishedDynamic = B.network;
  function calculateDistance(this: PublishedDynamic,a: PublishedDynamic, b: PublishedDynamic): PublishedDynamic {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  class HackCon {[key:string]: PublishedDynamic;
    constructor() {
      this.SAutoLootEnabled = false;
      this.FAutoLootEnabled = false;
      this.LootDataEnabled = false;
      this.AutoTakeEnabled = false;
      this.AutoBuiledEnabled = false;
      this.AntiKickEnabled = false;
      this.AdaptiveAimEnabled = true;
      this.predictionAutoSpeed = true;
      this.predictionLatencyMs = 0;
      this.bulletSpeedCoefficient = 1.5;
      this.HidePlayerLabels = true;
      this.OpenEverythingByClick = true;
      this.RightClickDoors = true;
      this.ShowBuildingOwner = true;
      this.AimbotKey = "KeyZ";
      this.AutoBuiledKey = "KeyB";
      this.SAutoLootKey = "KeyX";
      this.FAutoLootKey = "KeyQ";
      this.AutoTakeKey = "KeyT";
      this.ShowMines = true;
      this.ShowWires = true;
      this.ShowPlayerHitbox = false;
      this.XrayBuildings = false;
      this.Xraytransparency = 0.4;
      this.XrayKey = "KeyN";
      this.PlayersListKey = "KeyL";
      this.PlayersListEnabled = false;
      this.SpamChatEnabled = false;
      this.SpamChatText = "";
      this.PlayerId = "";
      this.ModMenuKey = "KeyH";
      this.ModMenuKeyCode = 72;
      this.hit = true;
      this.ShowPosition = true;
      this.ShowNamesOnMap = true;
      this.KarmaAboveHead = true;
      this.TeamClanColor = "#83F6A4";
      this.EnemyClanColor = "#FF0000";
      this.NicknameColor = "#FFFFFF";
      this.AutoOpenSlotsInv = true;
      this.token = "";
      this.userId = 0;
      this.tokenId = 0;
      this.Token = "";
    }
  }
  const MOD: PublishedDynamic = new HackCon();
  Object.assign(MOD, {zoomFactor:1, showFunctionList:true,JitterEnabled:false,JitterSpeed:360},__ilmAimDefaults());
  const aimKeys: PublishedDynamic=Object.keys(__ilmAimDefaults());
  const AIM_SAVE: PublishedDynamic='DevastMessage27:aim:v1';
  const aimDefaults: PublishedDynamic=Object.fromEntries(aimKeys.map((key: PublishedDynamic): PublishedDynamic=>[key,MOD[key]]));
  const defaults: PublishedDynamic = JSON.parse(JSON.stringify(MOD));
  const SAVE: PublishedDynamic = 'DevastILM:settings:v3', LEGACY_SAVE: PublishedDynamic = 'BestModMenuConfig';
  const transient: PublishedDynamic = new Set(['Token', 'token', 'tokenId', 'userId']);
  const keySettings: PublishedDynamic = ['AimbotKey','AutoBuiledKey','SAutoLootKey','FAutoLootKey','AutoTakeKey','XrayKey','PlayersListKey','ModMenuKey','AntiAimbotKey','JitterKey','HideAngleKey'];
  const limits: PublishedDynamic = {JitterSpeed:[1,3600],zoomFactor:[.33,2],Xraytransparency:[.05,1],predictionLatencyMs:[0,500],bulletSpeedCoefficient:[.1,20],...__ilmAimConstraints().limits};
  const choices: PublishedDynamic = __ilmAimConstraints().choices;
  function validateSetting(this: PublishedDynamic,key: PublishedDynamic,value: PublishedDynamic): PublishedDynamic {
    if (!Object.prototype.hasOwnProperty.call(defaults,key) || typeof value !== typeof defaults[key]) throw new Error('Invalid setting: '+key);
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Invalid numeric setting');
    if (limits[key] && (value < limits[key][0] || value > limits[key][1])) throw new Error('Setting out of range: '+key);
    if (key === 'lockId' && !Number.isInteger(value)) throw new Error('Player ID must be an integer');
    if (choices[key] && !choices[key].includes(value)) throw new Error('Invalid choice: '+key);
    if (keySettings.includes(key) && value!=='NoKey' && !/^(Key[A-Z]|Digit[0-9]|F(?:[1-9]|1[0-2])|Space|Escape|Tab|Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash|Arrow(?:Up|Down|Left|Right)|(?:Shift|Control|Alt|Meta)(?:Left|Right)|Enter|Backspace|Delete|Insert|Home|End|PageUp|PageDown|Numpad\w+)$/.test(value)) throw new Error('Invalid key code');
    return value;
  }
  try {
    const saved: PublishedDynamic = JSON.parse(localStorage.getItem(SAVE) || localStorage.getItem(LEGACY_SAVE) || '{}');
    for (const key of Object.keys(defaults)) {
      if (!transient.has(key) && Object.prototype.hasOwnProperty.call(saved,key)) {
        try { MOD[key] = validateSetting(key,saved[key]); } catch (_: any) {}
      }
    }
  } catch (_: any) {}
  Object.assign(MOD,aimDefaults);
  try{const saved: PublishedDynamic=JSON.parse(localStorage.getItem(AIM_SAVE)||'{}');for(const key of aimKeys)if(Object.hasOwn(saved,key)){try{MOD[key]=validateSetting(key,saved[key]);}catch(_: any){}}}catch(_: any){}
  const usedKeys: PublishedDynamic = new Set();
  for (const key of keySettings) {
    if(MOD[key]==='NoKey')continue;
    if (usedKeys.has(MOD[key])) MOD[key] = defaults[key];
    if (usedKeys.has(MOD[key])) MOD[key] = keySettings.map((k: PublishedDynamic): PublishedDynamic=>defaults[k]).find((code: PublishedDynamic): PublishedDynamic=>!usedKeys.has(code));
    usedKeys.add(MOD[key]);
  }
  if (MOD.SAutoLootEnabled) MOD.FAutoLootEnabled = false;
  const lootItems: PublishedDynamic = [{
    "name": "smallwood",
    "acquire": false,
    "id": 0
  }, {
    "name": "mediumwood",
    "acquire": false,
    "id": 1
  }, {
    "name": "bigwood",
    "acquire": false,
    "id": 2
  }, {
    "name": "smallstone",
    "acquire": false,
    "id": 3
  }, {
    "name": "mediumstone",
    "acquire": false,
    "id": 4
  }, {
    "name": "bigstone",
    "acquire": false,
    "id": 5
  }, {
    "name": "steel",
    "acquire": true,
    "id": 6
  }, {
    "name": "animalfat",
    "acquire": false,
    "id": 7
  }, {
    "name": "animaltendon",
    "acquire": false,
    "id": 8
  }, {
    "name": "string",
    "acquire": false,
    "id": 9
  }, {
    "name": "leatherboar",
    "acquire": false,
    "id": 10
  }, {
    "name": "shapedmetal",
    "acquire": true,
    "id": 11
  }, {
    "name": "rawsteak",
    "acquire": false,
    "id": 12
  }, {
    "name": "cookedsteak",
    "acquire": true,
    "id": 13
  }, {
    "name": "rottensteak",
    "acquire": false,
    "id": 14
  }, {
    "name": "orange",
    "acquire": false,
    "id": 15
  }, {
    "name": "rottenorange",
    "acquire": false,
    "id": 16
  }, {
    "name": "seedorange",
    "acquire": false,
    "id": 17
  }, {
    "name": "hachet",
    "acquire": false,
    "id": 18
  }, {
    "name": "stonepickaxe",
    "acquire": false,
    "id": 19
  }, {
    "name": "steelpickaxe",
    "acquire": false,
    "id": 20
  }, {
    "name": "stoneaxe",
    "acquire": false,
    "id": 21
  }, {
    "name": "workbench",
    "acquire": false,
    "id": 22
  }, {
    "name": "woodspear",
    "acquire": false,
    "id": 23
  }, {
    "name": "woodbow",
    "acquire": false,
    "id": 24
  }, {
    "name": "9mm",
    "acquire": true,
    "id": 25
  }, {
    "name": "deserteagle",
    "acquire": true,
    "id": 26
  }, {
    "name": "shotgun",
    "acquire": true,
    "id": 27
  }, {
    "name": "ak51",
    "acquire": true,
    "id": 28
  }, {
    "name": "sniper",
    "acquire": true,
    "id": 29
  }, {
    "name": "woodwall",
    "acquire": false,
    "id": 30
  }, {
    "name": "stonewall",
    "acquire": true,
    "id": 31
  }, {
    "name": "steelwall",
    "acquire": true,
    "id": 32
  }, {
    "name": "wooddoor",
    "acquire": false,
    "id": 33
  }, {
    "name": "stonedoor",
    "acquire": true,
    "id": 34
  }, {
    "name": "steeldoor",
    "acquire": true,
    "id": 35
  }, {
    "name": "campfire",
    "acquire": false,
    "id": 36
  }, {
    "name": "bullet9mm",
    "acquire": true,
    "id": 37
  }, {
    "name": "bulletshotgun",
    "acquire": true,
    "id": 38
  }, {
    "name": "bulletsniper",
    "acquire": true,
    "id": 39
  }, {
    "name": "medikit",
    "acquire": false,
    "id": 40
  }, {
    "name": "bandage",
    "acquire": false,
    "id": 41
  }, {
    "name": "soda",
    "acquire": false,
    "id": 42
  }, {
    "name": "mp5",
    "acquire": true,
    "id": 43
  }, {
    "name": "headscarf",
    "acquire": false,
    "id": 44
  }, {
    "name": "chapka",
    "acquire": true,
    "id": 45
  }, {
    "name": "wintercoat",
    "acquire": true,
    "id": 46
  }, {
    "name": "gazmask",
    "acquire": false,
    "id": 47
  }, {
    "name": "gazprotection",
    "acquire": true,
    "id": 48
  }, {
    "name": "radiationsuit",
    "acquire": true,
    "id": 49
  }, {
    "name": "woodarrow",
    "acquire": false,
    "id": 50
  }, {
    "name": "campfirebbq",
    "acquire": true,
    "id": 51
  }, {
    "name": "smelter",
    "acquire": true,
    "id": 52
  }, {
    "name": "woodbigdoor",
    "acquire": false,
    "id": 53
  }, {
    "name": "stonebigdoor",
    "acquire": false,
    "id": 54
  }, {
    "name": "steelbigdoor",
    "acquire": false,
    "id": 55
  }, {
    "name": "sulfur",
    "acquire": true,
    "id": 56
  }, {
    "name": "shapeduranium",
    "acquire": true,
    "id": 57
  }, {
    "name": "workbench2",
    "acquire": true,
    "id": 58
  }, {
    "name": "uranium",
    "acquire": true,
    "id": 59
  }, {
    "name": "weaving",
    "acquire": false,
    "id": 60
  }, {
    "name": "gasoline",
    "acquire": true,
    "id": 61
  }, {
    "name": "sulfurpickaxe",
    "acquire": true,
    "id": 62
  }, {
    "name": "chest",
    "acquire": false,
    "id": 63
  }, {
    "name": "fridge",
    "acquire": false,
    "id": 64
  }, {
    "name": "woodfloor",
    "acquire": false,
    "id": 65
  }, {
    "name": "hammer",
    "acquire": true,
    "id": 66
  }, {
    "name": "sleepingbag",
    "acquire": false,
    "id": 67
  }, {
    "name": "repairhammer",
    "acquire": false,
    "id": 68
  }, {
    "name": "nails",
    "acquire": false,
    "id": 69
  }, {
    "name": "woodlightfloor",
    "acquire": false,
    "id": 70
  }, {
    "name": "woodsmallwall",
    "acquire": false,
    "id": 71
  }, {
    "name": "stonesmallwall",
    "acquire": false,
    "id": 72
  }, {
    "name": "steelsmallwall",
    "acquire": false,
    "id": 73
  }, {
    "name": "tomatosoup",
    "acquire": true,
    "id": 74
  }, {
    "name": "syringe",
    "acquire": false,
    "id": 75
  }, {
    "name": "chemicalcomponent",
    "acquire": false,
    "id": 76
  }, {
    "name": "radaway",
    "acquire": false,
    "id": 77
  }, {
    "name": "seedtomato",
    "acquire": false,
    "id": 78
  }, {
    "name": "tomato",
    "acquire": false,
    "id": 79
  }, {
    "name": "rottentomato",
    "acquire": false,
    "id": 80
  }, {
    "name": "can",
    "acquire": false,
    "id": 81
  }, {
    "name": "woodcrossbow",
    "acquire": false,
    "id": 82
  }, {
    "name": "woodcrossarrow",
    "acquire": false,
    "id": 83
  }, {
    "name": "nailgun",
    "acquire": false,
    "id": 84
  }, {
    "name": "sawedoffshotgun",
    "acquire": true,
    "id": 85
  }, {
    "name": "stonefloor",
    "acquire": false,
    "id": 86
  }, {
    "name": "tilingfloor",
    "acquire": false,
    "id": 87
  }, {
    "name": "crisps",
    "acquire": false,
    "id": 88
  }, {
    "name": "rottencrisps",
    "acquire": false,
    "id": 89
  }, {
    "name": "electronics",
    "acquire": true,
    "id": 90
  }, {
    "name": "junk",
    "acquire": true,
    "id": 91
  }, {
    "name": "bigwire",
    "acquire": true,
    "id": 92
  }, {
    "name": "energycells",
    "acquire": true,
    "id": 93
  }, {
    "name": "laserpistol",
    "acquire": true,
    "id": 94
  }, {
    "name": "tesla",
    "acquire": true,
    "id": 95
  }, {
    "name": "alloys",
    "acquire": true,
    "id": 96
  }, {
    "name": "sulfuraxe",
    "acquire": true,
    "id": 97
  }, {
    "name": "landmine",
    "acquire": true,
    "id": 98
  }, {
    "name": "dynamite",
    "acquire": true,
    "id": 99
  }, {
    "name": "c4",
    "acquire": true,
    "id": 100
  }, {
    "name": "c4trigger",
    "acquire": false,
    "id": 101
  }, {
    "name": "compost",
    "acquire": false,
    "id": 102
  }, {
    "name": "armorphysic1",
    "acquire": false,
    "id": 103
  }, {
    "name": "armorphysic2",
    "acquire": true,
    "id": 104
  }, {
    "name": "armorphysic3",
    "acquire": true,
    "id": 105
  }, {
    "name": "armorfire1",
    "acquire": false,
    "id": 106
  }, {
    "name": "armorfire2",
    "acquire": true,
    "id": 107
  }, {
    "name": "armorfire3",
    "acquire": true,
    "id": 108
  }, {
    "name": "armordeminer",
    "acquire": false,
    "id": 109
  }, {
    "name": "armortesla1",
    "acquire": true,
    "id": 110
  }, {
    "name": "armortesla2",
    "acquire": true,
    "id": 111
  }, {
    "name": "woodspike",
    "acquire": false,
    "id": 112
  }, {
    "name": "lasersubmachine",
    "acquire": true,
    "id": 113
  }, {
    "name": "grenade",
    "acquire": true,
    "id": 114
  }, {
    "name": "superhammer",
    "acquire": true,
    "id": 115
  }, {
    "name": "ghoulblood",
    "acquire": false,
    "id": 116
  }, {
    "name": "camouflagegear",
    "acquire": false,
    "id": 117
  }, {
    "name": "agitator",
    "acquire": false,
    "id": 118
  }, {
    "name": "ghouldrug",
    "acquire": false,
    "id": 119
  }, {
    "name": "mushroom1",
    "acquire": false,
    "id": 120
  }, {
    "name": "mushroom2",
    "acquire": false,
    "id": 121
  }, {
    "name": "mushroom3",
    "acquire": false,
    "id": 122
  }, {
    "name": "rottenmushroom1",
    "acquire": false,
    "id": 123
  }, {
    "name": "rottenmushroom2",
    "acquire": false,
    "id": 124
  }, {
    "name": "rottenmushroom3",
    "acquire": false,
    "id": 125
  }, {
    "name": "lapadone",
    "acquire": false,
    "id": 126
  }, {
    "name": "lapabotrepair",
    "acquire": true,
    "id": 127
  }, {
    "name": "smallwire",
    "acquire": true,
    "id": 128
  }, {
    "name": "pumpkin",
    "acquire": true,
    "id": 129
  }, {
    "name": "rottenpumpkin",
    "acquire": false,
    "id": 130
  }, {
    "name": "seedghoul",
    "acquire": true,
    "id": 131
  }, {
    "name": "äáäctor",
    "acquire": false,
    "id": 132
  }, {
    "name": "antidote",
    "acquire": false,
    "id": 133
  }, {
    "name": "antidoteflower",
    "acquire": false,
    "id": 134
  }, {
    "name": "seedtree",
    "acquire": false,
    "id": 135
  }, {
    "name": "acorn",
    "acquire": false,
    "id": 136
  }, {
    "name": "rottenacorn",
    "acquire": false,
    "id": 137
  }, {
    "name": "lasersniper",
    "acquire": true,
    "id": 138
  }, {
    "name": "halbot",
    "acquire": true,
    "id": 139
  }, {
    "name": "teslabot",
    "acquire": true,
    "id": 140
  }, {
    "name": "cable0",
    "acquire": false,
    "id": 141
  }, {
    "name": "cable1",
    "acquire": false,
    "id": 142
  }, {
    "name": "cable2",
    "acquire": false,
    "id": 143
  }, {
    "name": "cable3",
    "acquire": false,
    "id": 144
  }, {
    "name": "switch",
    "acquire": false,
    "id": 145
  }, {
    "name": "gateor",
    "acquire": false,
    "id": 146
  }, {
    "name": "gateand",
    "acquire": false,
    "id": 147
  }, {
    "name": "gatenot",
    "acquire": false,
    "id": 148
  }, {
    "name": "lamp",
    "acquire": false,
    "id": 149
  }, {
    "name": "cablewall",
    "acquire": false,
    "id": 150
  }, {
    "name": "automaticdoor",
    "acquire": false,
    "id": 151
  }, {
    "name": "platform",
    "acquire": false,
    "id": 152
  }, {
    "name": "stonecave",
    "acquire": true,
    "id": 153
  }, {
    "name": "bunkerwall",
    "acquire": true,
    "id": 154
  }, {
    "name": "goldfloor",
    "acquire": false,
    "id": 155
  }, {
    "name": "redfloor",
    "acquire": false,
    "id": 156
  }, {
    "name": "weldingmachine",
    "acquire": false,
    "id": 157
  }, {
    "name": "cable4",
    "acquire": false,
    "id": 158
  }, {
    "name": "gatetimer",
    "acquire": false,
    "id": 159
  }, {
    "name": "gatexorcounter",
    "acquire": false,
    "id": 160
  }, {
    "name": "feeder",
    "acquire": true,
    "id": 161
  }];
  const LootData: PublishedDynamic = Object.fromEntries(lootItems.map((item: PublishedDynamic): PublishedDynamic => [item.name, {
    acquire: item.acquire,
    id: item.id
  }]));
  try {
    const saved: PublishedDynamic = JSON.parse(localStorage.getItem(SAVE + ':loot') || localStorage.getItem(LEGACY_SAVE + ':loot') || '{}');
    for (const key of Object.keys(LootData)) if (typeof saved[key] === 'boolean') LootData[key].acquire = saved[key];
  } catch (_: any) {}
  // Complete the old settings migration before a native Play can connect.
  // Archive exact old values first; account storage is outside this migration.
  const legacySettingsMigration: PublishedDynamic = ((): PublishedDynamic=>{
    let moved: PublishedDynamic=0;
    try {
      const rows: PublishedDynamic=['',':loot',':ilm2'].map((suffix: PublishedDynamic): PublishedDynamic=>({key:LEGACY_SAVE+suffix,target:SAVE+suffix,value:localStorage.getItem(LEGACY_SAVE+suffix)})).filter((row: PublishedDynamic): PublishedDynamic=>row.value!==null);
      if(!rows.length)return {status:'not-needed',moved};
      for(const row of rows)if(row.key!==LEGACY_SAVE+':ilm2'){
        const value: PublishedDynamic=JSON.parse(row.value);
        if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid legacy settings');
      }
      const archiveKey: PublishedDynamic=SAVE+':legacy-backup:v1';
      const archive: PublishedDynamic=JSON.parse(localStorage.getItem(archiveKey)||'[]');
      if(!Array.isArray(archive))throw Error('Invalid settings archive');
      for(const {key,value}of rows)if(!archive.some((row: PublishedDynamic): PublishedDynamic=>row?.key===key&&row.value===value))archive.push({key,value});
      const archiveText: PublishedDynamic=JSON.stringify(archive);
      localStorage.setItem(archiveKey,archiveText);
      if(localStorage.getItem(archiveKey)!==archiveText)throw Error('Settings archive was not saved');
      // Existing current settings take precedence over historical values.
      for(const row of rows)if(localStorage.getItem(row.target)===null){
        localStorage.setItem(row.target,row.value);
        if(localStorage.getItem(row.target)!==row.value)throw Error('Settings migration was not saved');
      }
      for(const row of rows){
        if(localStorage.getItem(row.key)!==row.value)throw Error('Legacy settings changed during migration');
        localStorage.removeItem(row.key);
        if(localStorage.getItem(row.key)!==null)throw Error('Legacy settings were not retired');
        moved++;
      }
      return {status:'migrated',moved};
    }catch(_: any){return {status:'failed',moved};}
  })();
  const allowedLootIds: PublishedDynamic = new Set();
  function refreshLootFilter(this: PublishedDynamic): PublishedDynamic {
    allowedLootIds.clear();
    for (const item of Object.values<PublishedDynamic>(LootData)) if(item.acquire) allowedLootIds.add(item.id);
  }
  refreshLootFilter();
  const ballistic: PublishedDynamic=__createBallisticAim(MOD,(): PublishedDynamic=>performance.now());
  let ballisticPrediction: PublishedDynamic={valid:false,status:'no-target'},lastAdaptiveDirection: PublishedDynamic=-Infinity,lastAdaptiveTarget: PublishedDynamic=null;
  let aimCycleDepth: PublishedDynamic=0,aimCycleWritable: PublishedDynamic=false;
  const aimTransport: PublishedDynamic={cycles:0,blockedCycles:0,nativeYields:0,invalidCycles:0,lastInvalidReason:null};
  const aimModule: PublishedDynamic=__createIlmAdapter(MOD,{
    window,document,selfId:(): PublishedDynamic=>B.world.ѕ‌０?.id||0,selfPosition:(): PublishedDynamic=>B.world.ѕ‌０||{x:-1,y:-1},rotationTick:(): PublishedDynamic=>{if(adaptiveGunActive()&&playing()&&!Aimbot.dead)aimModule.refreshTargets();updateJitter(performance.now(),true);},
    playerInfo:(id: PublishedDynamic): PublishedDynamic=>({exists:!!playerMeta(id),team:playerMeta(id)?.ո२２??-1,membership:playerMeta(id)?.ᴏܒܔ}),
    clanInfo:(id: PublishedDynamic): PublishedDynamic=>({exists:!!B.world.ⲥ༢ނ[id],membership:B.world.ⲥ༢ނ[id]?.ᅟ̟͏}),persist,setKey:(key: PublishedDynamic,value: PublishedDynamic): PublishedDynamic=>setSetting(key,value),
    beginCycle:(): PublishedDynamic=>{if(aimCycleDepth++===0){aimCycleWritable=playing()&&!reconnect.sessionEnded&&automationReady('aim');if(aimCycleWritable)aimTransport.cycles++;else aimTransport.blockedCycles++;}},
    endCycle:(): PublishedDynamic=>{if(--aimCycleDepth===0)aimCycleWritable=false;},
    send:(packet: PublishedDynamic,source: PublishedDynamic): PublishedDynamic=>{
      if(!aimCycleWritable||!playing()||reconnect.sessionEnded||connectionSocket&&connectionSocket.readyState!==1)return false;
      // The source calculates first. Reject its whole automatic cycle when
      // that calculation used a missing player or a removed/own target.
      if(adaptiveGunActive()&&packet[0]===4)Aimbot.resolve();
      if([4,5,6].includes(packet[0])){const reason: PublishedDynamic=invalidAimState();if(reason){aimCycleWritable=false;aimTransport.invalidCycles++;aimTransport.lastInvalidReason=reason;return false;}}
      if(packet[0]===6&&MOD.JitterEnabled&&!jitterAiming())return false;
      if(packet[0]===6&&MOD.AdaptiveAimEnabled){
        const now: PublishedDynamic=performance.now();
        if(lastAdaptiveTarget===Aimbot.targetPlayer&&now-lastAdaptiveDirection<50)return false;
        if(!__send(packet,false,true))return false;
        lastAdaptiveDirection=now;lastAdaptiveTarget=Aimbot.targetPlayer;stopJitter();return true;
      }
      if(packet[0]===6)stopJitter();
      if(packet[0]===4){stopJitter();jitter.fireUntil=performance.now()+150;if(!__send([6,Aimbot.lastAngle],true,true))return false;}
      return __send(packet,!MOD.AdaptiveAimEnabled,true);
    }
  });
  const GetAllTargets: PublishedDynamic=aimModule.targets,Aimbot: PublishedDynamic=aimModule.aim;
  const originalGunResolve: PublishedDynamic=Aimbot.resolve.bind(Aimbot),originalAimDeath: PublishedDynamic=Aimbot.onDeath.bind(Aimbot),originalAimRefresh: PublishedDynamic=Aimbot.refresh.bind(Aimbot);
  function normalizeAimAngle(this: PublishedDynamic,angle: PublishedDynamic): PublishedDynamic{return angle>=0&&angle<360?angle:((angle%360)+360)%360;}
  const originalAimSmooth: PublishedDynamic=Aimbot.aimSmooth.bind(Aimbot);
  Aimbot.aimSmooth=function(this: PublishedDynamic,angle: PublishedDynamic): PublishedDynamic{
    // The imported smoother retains a continuous angle. Rebase its memory
    // before the next step so JavaScript's negative remainder cannot turn
    // a second 360-degree crossing into a long rotation in the wrong direction.
    if(Number.isFinite(this._smoothAngle))this._smoothAngle=normalizeAimAngle(this._smoothAngle);
    const resolved: PublishedDynamic=originalAimSmooth(angle);
    if(!Number.isFinite(resolved))return resolved;
    this._smoothAngle=normalizeAimAngle(resolved);
    return this._smoothAngle;
  };
  function adaptiveGunActive(this: PublishedDynamic): PublishedDynamic{return MOD.AdaptiveAimEnabled&&MOD.AimBotEnabled&&!(MOD.AimbotSpearEnabled&&GetAllTargets.selfWeapon===5);}
  Aimbot.refresh=function(this: PublishedDynamic): PublishedDynamic{if(adaptiveGunActive()&&!this.dead)aimModule.refreshTargets();return originalAimRefresh();};
  function ballisticWeaponProfile(this: PublishedDynamic,weapon: PublishedDynamic): PublishedDynamic{
    const native: PublishedDynamic=B.types?.[B.categories.player]?.εࡇ︃?.[weapon];
    return {speed:Number.isFinite(native?.ⲣ̜९)?native.ⲣ̜९*1000:0,range:Number.isFinite(native?.path)?native.path:0};
  }
  Aimbot.onDeath=function(this: PublishedDynamic): PublishedDynamic{ballistic.reset();ballisticPrediction={valid:false,status:'session-ended'};lastAdaptiveDirection=-Infinity;lastAdaptiveTarget=null;return originalAimDeath();};
  Aimbot.resolve=function(this: PublishedDynamic): PublishedDynamic{
    if(!MOD.AdaptiveAimEnabled)return originalGunResolve();
    const id: PublishedDynamic=B.world.ѕ‌０?.id,self: PublishedDynamic=GetAllTargets.players[id];
    let target: PublishedDynamic=null;
    if(self?.active){
      if(MOD.lockId>-1){const locked: PublishedDynamic=GetAllTargets.players[MOD.lockId];if(this.isPlayerCandidate(locked))target=locked;}
      else target=this.findNearestPlayerTo(MOD.mouseFovEnable?GetAllTargets.mouseMapCords:self,MOD.mouseFovEnable?MOD.mouseFov:MOD.aimMaxRange);
    }
    this.targetPlayer=target;
    const selfMotion: PublishedDynamic=ballistic.motion('p:'+id);
    ballisticPrediction=target?ballistic.resolve('p:'+id,(GetAllTargets.ghouls[target.id]===target?'g:':'p:')+target.id,ballisticWeaponProfile(selfMotion?.weapon)):{valid:false,status:'no-target'};
    if(!ballisticPrediction.valid){this.targetPlayer=null;GetAllTargets.lines[0].reset();return this.lastAngle;}
    this.lastAngle=((ballisticPrediction.angle%360)+360)%360;this._smoothAngle=this.lastAngle;
    if(MOD.visualizeResolving){const p: PublishedDynamic=ballisticPrediction;GetAllTargets.lines[0].color=MOD.visualizeResolvingColor;GetAllTargets.lines[0].reset(p.ox,p.oy,p.x,p.y);}
    return this.lastAngle;
  };
  Object.defineProperty(Aimbot,'prediction',{get:(): PublishedDynamic=>({...ballisticPrediction})});
  const _players_list: PublishedDynamic = [];
  const removers: PublishedDynamic = [];
  const originalSender: PublishedDynamic = B.network.ᴘܙ٣.bind(B.network);
  const originals: PublishedDynamic = {};
  const diagnostics: PublishedDynamic = {
    frames: 0,
    errors: [],
    commands: 0,
    deduplicatedAngles: 0,
    commandsByOpcode:Object.create(null)
  };
  const frameGaps: PublishedDynamic=new Array(120);
  let frameGapIndex: PublishedDynamic=0,frameGapCount: PublishedDynamic=0,previousAnimationFrame: PublishedDynamic=null;
  function animationTiming(this: PublishedDynamic): PublishedDynamic {
    const gaps: PublishedDynamic=frameGaps.slice(0,frameGapCount).sort((a: PublishedDynamic,b: PublishedDynamic): PublishedDynamic=>a-b);
    const mean: PublishedDynamic=gaps.length?gaps.reduce((sum: PublishedDynamic,gap: PublishedDynamic): PublishedDynamic=>sum+gap,0)/gaps.length:0;
    return {samples:gaps.length,meanGapMs:Math.round(mean*100)/100,p95GapMs:gaps.length?Math.round(gaps[Math.floor((gaps.length-1)*.95)]*100)/100:null,fpsEstimate:mean>0?Math.round(1000/mean):null,hidden:!!document.hidden};
  }
  const recentCombatCommands: PublishedDynamic = [], connectionEvents: PublishedDynamic = [];
  const wireSeconds: PublishedDynamic=[],wireTotals: PublishedDynamic={packets:0,bytes:0};
  let wirePeak: PublishedDynamic=null,firstServerDeath: PublishedDynamic=null,firstConnectionEnd: PublishedDynamic=null;
  function trimWire(this: PublishedDynamic,now: PublishedDynamic): PublishedDynamic{while(wireSeconds.length&&(wireSeconds.length>240||now-wireSeconds[0].at>=120000))wireSeconds.shift();}
  function observeWireSend(this: PublishedDynamic,bytes: PublishedDynamic): PublishedDynamic{
    if(stopped||!Number.isSafeInteger(bytes)||bytes<0||bytes>2147483647)return;
    const now: PublishedDynamic=performance.now(),at: PublishedDynamic=Math.floor(now/1000)*1000,socket: PublishedDynamic=socketTrace?.id??null;
    let bucket: PublishedDynamic=wireSeconds.at(-1);
    if(!bucket||bucket.at!==at||bucket.socket!==socket){bucket={at,socket,packets:0,bytes:0};wireSeconds.push(bucket);}
    bucket.packets++;bucket.bytes+=bytes;wireTotals.packets++;wireTotals.bytes+=bytes;
    if(!wirePeak||bucket.packets>wirePeak.packets||bucket.packets===wirePeak.packets&&bucket.bytes>wirePeak.bytes)wirePeak={...bucket};
    if(socketTrace){socketTrace.sentMessages++;socketTrace.sentBytes+=bytes;socketTrace.lastSendAt=now;}
    trimWire(now);
  }
  function wireTrafficInfo(this: PublishedDynamic,now: PublishedDynamic=performance.now()): PublishedDynamic{
    trimWire(now);return {scope:'native send calls returned without throwing; delivery is not confirmed and payloads are not recorded',totals:{...wireTotals},recentSeconds:wireSeconds.map((bucket: PublishedDynamic): PublishedDynamic=>({...bucket})),peakSecond:wirePeak?{...wirePeak}:null};
  }
  const pickupRequests: PublishedDynamic=[],pickupPrevious: PublishedDynamic=new WeakMap();
  function trimPickupRequests(this: PublishedDynamic,now: PublishedDynamic): PublishedDynamic{while(pickupRequests.length&&(pickupRequests.length>128||now-pickupRequests[0].at>=120000))pickupRequests.shift();}
  function recordPickupRequest(this: PublishedDynamic,entity: PublishedDynamic): PublishedDynamic{
    // Numeric gameplay metadata only. Do not copy chat, login or arbitrary packets.
    try{
    const now: PublishedDynamic=performance.now(),socket: PublishedDynamic=socketTrace?.id??null,me: PublishedDynamic=B.world.ѕ‌０;
    const previous: PublishedDynamic=pickupPrevious.get(entity),distance: PublishedDynamic=Math.hypot(entity.x-me.x,entity.y-me.y);
    const numeric: PublishedDynamic=(value: PublishedDynamic): PublishedDynamic=>Number.isFinite(value)?value:null;
    const entry: PublishedDynamic={at:Math.round(now),socket,id:numeric(entity.id),itemType:numeric(entity.ᴎࡈ̷),
      distance:Number.isFinite(distance)?Math.round(distance*100)/100:null,
      nativeInteraction:numeric(me.ࡀ༠५),nativeSelectedId:numeric(me.ᴄрܜ),
      repeatGapMs:previous&&previous.id===entity.id&&previous.socket===socket?Math.max(0,Math.round(now-previous.at)):null};
    pickupPrevious.set(entity,{at:now,id:entity.id,socket});pickupRequests.push(entry);trimPickupRequests(now);
    }catch(_: any){} // Recording must never interrupt native gameplay.
  }
  function pickupRequestInfo(this: PublishedDynamic): PublishedDynamic{
    trimPickupRequests(performance.now());
    return {scope:'mod pickup calls accepted by the native sender; delivery and server acceptance are not confirmed',retentionMs:120000,maxEntries:128,requests:pickupRequests.map((entry: PublishedDynamic): PublishedDynamic=>({...entry}))};
  }
  const trafficKeys: PublishedDynamic=['AimBotEnabled','AimbotSpearEnabled','AdaptiveAimEnabled','JitterEnabled','AntiAimbot','autoFire','hidePlayerAngle','hideAimbotAngle','FAutoLootEnabled','SAutoLootEnabled','AutoBuiledEnabled','AutoTakeEnabled','SpamChatEnabled','AntiKickEnabled'];
  const trafficSettings: PublishedDynamic=Object.fromEntries(trafficKeys.map((key: PublishedDynamic): PublishedDynamic=>[key,MOD[key]]));
  const trafficChanges: PublishedDynamic=[{at:Math.round(performance.now()),settings:{...trafficSettings}}],trafficSeconds: PublishedDynamic=[];
  let trafficPeak: PublishedDynamic=null,trafficDiscardedChanges: PublishedDynamic=0;
  function trimTraffic(this: PublishedDynamic,now: PublishedDynamic): PublishedDynamic {
    while(trafficSeconds.length&&(trafficSeconds.length>1800||now-trafficSeconds[0].at>=1800000))trafficSeconds.shift();
  }
  function recordTraffic(this: PublishedDynamic,op: PublishedDynamic): PublishedDynamic {
    const now: PublishedDynamic=performance.now(),at: PublishedDynamic=Math.floor(now/1000)*1000,socket: PublishedDynamic=socketTrace?.id??null;
    let bucket: PublishedDynamic=trafficSeconds[trafficSeconds.length-1];
    if(!bucket||bucket.at!==at||bucket.socket!==socket){bucket={at,socket,commands:0,byOpcode:{}};trafficSeconds.push(bucket);}
    bucket.commands++;bucket.byOpcode[op]=(bucket.byOpcode[op]||0)+1;
    if(!trafficPeak||bucket.commands>trafficPeak.commands)trafficPeak=bucket;
    trimTraffic(now);
  }
  function recordCommand(this: PublishedDynamic,op: PublishedDynamic): PublishedDynamic {
    diagnostics.commands++;
    diagnostics.commandsByOpcode[op]=(diagnostics.commandsByOpcode[op]||0)+1;
    recordTraffic(op);
  }
  function trafficInfo(this: PublishedDynamic): PublishedDynamic {
    trimTraffic(performance.now());
    const copy: PublishedDynamic=(b: PublishedDynamic): PublishedDynamic=>b?{...b,byOpcode:{...b.byOpcode}}:null;
    return {scope:'mod-generated-commands-only',retentionMs:1800000,maxSeconds:1800,
      seconds:trafficSeconds.map(copy),lifetimePeak:copy(trafficPeak),
      settingsChanges:trafficChanges.map((e: PublishedDynamic): PublishedDynamic=>({...e,settings:{...e.settings}})),discardedSettingsChanges:trafficDiscardedChanges};
  }
  const automationDeferrals: PublishedDynamic={aim:0,loot:0,build:0,take:0,chat:0,keepAlive:0};
  const AIM_BUFFER_HIGH_WATER: PublishedDynamic=4096;
  function automationReady(this: PublishedDynamic,kind: PublishedDynamic): PublishedDynamic {
    if(!connectionSocket)return true;
    if(connectionSocket.readyState===1){
      const bytes: PublishedDynamic=connectionSocket.bufferedAmount;
      // Native traffic and earlier source directions can remain buffered for
      // a turn of the event loop. They must not freeze fresh aim directions.
      if(!(kind==='aim'?bytes>=AIM_BUFFER_HIGH_WATER:bytes>0))return true;
    }
    automationDeferrals[kind]++;
    return false;
  }
  function combatCommands(this: PublishedDynamic,now: PublishedDynamic = performance.now()): PublishedDynamic {
    while (recentCombatCommands.length && now - recentCombatCommands[0].at > 2000) recentCombatCommands.shift();
    const counts: PublishedDynamic = {angle:0,attack:0,release:0};
    for (const {op} of recentCombatCommands) counts[op === 6 ? "angle" : op === 4 ? 'attack' : 'release']++;
    return counts;
  }
  function connectionEvent(this: PublishedDynamic,type: PublishedDynamic, details: PublishedDynamic = {}): PublishedDynamic {
    const now: PublishedDynamic=performance.now();
    const health: PublishedDynamic = B.health?.();
    const event: PublishedDynamic={type,at:Math.round(now),state:B.network.state,
      integrityFlag:typeof B.integrity?.()==='number'?B.integrity():null,
      aim:MOD.AimBotEnabled,adaptiveAim:MOD.AdaptiveAimEnabled,jitter:MOD.JitterEnabled,strafe:MOD.AntiAimbot,autoFire:MOD.autoFire,
      spear:MOD.AimbotSpearEnabled,hidePlayerAngle:MOD.hidePlayerAngle,hideAimbotAngle:MOD.hideAimbotAngle,
      autoBuild:MOD.AutoBuiledEnabled,fastLoot:MOD.FAutoLootEnabled,slowLoot:MOD.SAutoLootEnabled,autoTake:MOD.AutoTakeEnabled,spamChat:MOD.SpamChatEnabled,
      socketState:connectionSocket?.readyState??null,socketBufferedBytes:Number.isFinite(connectionSocket?.bufferedAmount)?connectionSocket.bufferedAmount:null,
      transport:socketTraffic(now),pageHidden:!!document.hidden,
      frameGapMs:previousAnimationFrame===null?null:Math.max(0,Math.round(now-previousAnimationFrame)),
      health:Number.isFinite(health) ? health : null,commandsInLast2s:combatCommands(),...details};
    if(['server-death','socket-close','native-network-error'].includes(type)){
      const recent: PublishedDynamic=pickupRequests.filter((entry: PublishedDynamic): PublishedDynamic=>entry.socket===event.transport?.id&&event.at-entry.at>=0&&event.at-entry.at<10000).slice(-32);
      if(recent.length)event.pickupRequestsBeforeEnd=recent.map((entry: PublishedDynamic): PublishedDynamic=>({...entry}));
    }
    connectionEvents.push(event);
    if(type==='server-death'&&firstServerDeath===null)firstServerDeath=event;
    if(firstConnectionEnd===null&&event.transport?.receivedMessages>0&&(type==='server-death'||type==='socket-close'||type==='native-network-error'&&event.failureCode>0))firstConnectionEnd=event;
    if (connectionEvents.length > 12) connectionEvents.shift();
  }
  function observeDeath(this: PublishedDynamic,packet: PublishedDynamic, opcode: PublishedDynamic=5): PublishedDynamic {
    if (stopped) return;
    const details: PublishedDynamic = {};
    // Only the reviewed three-byte death prefix is safe to include. Never log
    // arbitrary server packets, login payloads or an unbounded response body.
    if (Number.isInteger(opcode) && opcode>=0 && opcode<=255 && (ArrayBuffer.isView as (value: PublishedDynamic)=>boolean)(packet) && packet.BYTES_PER_ELEMENT === 1 && packet.length >= 3 && packet[0] === opcode) {
      details.deathOpcode = opcode;
      details.deathPacketLength = packet.byteLength;
      details.deathPrefixHex = Array.from(packet.subarray(0,3),(value: PublishedDynamic): PublishedDynamic=>value.toString(16).padStart(2,'0')).join(' ');
    }
    connectionEvent('server-death',details);
    Aimbot.onDeath();
    // A confirmed death terminates the playable session. Socket close flags
    // must not turn it into a request to restore the dead character.
    reconnect.sessionEnded=true;
    reconnect.awaitingPlay=true;
    reconnect.generation++;
    reconnect.pending=false;
    reconnect.phase='dead';
    reconnect.next=0;
    reconnect.armed=false;
    reconnect.autoBlocked=true;
    reconnect.freshRequired=true;
    reconnect.freshUsed=false;
    releaseNativePending();
  }
  let nativeDraw: PublishedDynamic=false;
  let overlay: PublishedDynamic, overlayHost: PublishedDynamic, ctx: PublishedDynamic, menu: PublishedDynamic, functionList: PublishedDynamic, zoomControl: PublishedDynamic, nextFrame: PublishedDynamic, stopped: PublishedDynamic = false, waitingKey: PublishedDynamic = null;
  let playerListPanel: PublishedDynamic, playerListBody: PublishedDynamic, playerListCount: PublishedDynamic, playerListOrder: PublishedDynamic = '';
  const playerListRows: PublishedDynamic = new Map(), departedPlayers: PublishedDynamic = new Map();
  let lastStep: PublishedDynamic = -Infinity, lastLoot: PublishedDynamic = -Infinity;
  const FAST_LOOT_INTERVAL: PublishedDynamic=25,FAST_LOOT_BURST: PublishedDynamic=8,FAST_LOOT_SCAN_LIMIT: PublishedDynamic=256,AUTO_BUILD_INTERVAL: PublishedDynamic=50;
  let lastFastLoot: PublishedDynamic=-Infinity,fastLootCursor: PublishedDynamic=0;
  let lastAutoBuild: PublishedDynamic=-Infinity;
  let lastTake: PublishedDynamic = -Infinity, lastKeepAlive: PublishedDynamic = -Infinity, lastChat: PublishedDynamic = -Infinity, nextChatAt: PublishedDynamic = -Infinity;
  const chatState: PublishedDynamic = {
    status: 'Off',
    sent: 0
  };
  const clipboardState: PublishedDynamic = {status:'Ready'};
  async function copyText(this: PublishedDynamic,value: PublishedDynamic): Promise<PublishedDynamic> {
    try {
      if(typeof navigator.clipboard?.writeText !== 'function') throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);clipboardState.status='Copied';return true;
    } catch (_: any) {clipboardState.status='Clipboard access denied or unavailable';return false;}
  }
  async function copyNickname(this: PublishedDynamic,id: PublishedDynamic): Promise<PublishedDynamic> {
    if(!Number.isInteger(id) || !playerMeta(id)) {clipboardState.status='Player not found';return false;}
    const name: PublishedDynamic=nickname(id);
    if(!name) {clipboardState.status='Player has no nickname';return false;}
    return copyText(name);
  }
  let previousPlayer: PublishedDynamic = 0, records: PublishedDynamic = [], mouse: PublishedDynamic = null;
  const collectedRecords: PublishedDynamic=records, playerRecords: PublishedDynamic=[], entityRecords: PublishedDynamic=new WeakMap();
  const functionRows: PublishedDynamic = new Map();
  // Column order matches the compact status list in the supplied screenshot.
  const functionLabels: PublishedDynamic = [
    ['SAutoLootEnabled', 'SAutoLoot'],
    ['AimBotEnabled', 'AimBot'],
    ['AutoBuiledEnabled', 'AutoBuild'],
    ['AntiKickEnabled', 'AntiKick'],
    ['FAutoLootEnabled', 'FAutoLoot'],
    ['XrayBuildings', 'Xray'],
    ['AutoTakeEnabled', 'AutoTake']
  ];
  const playerLabelCache: PublishedDynamic = new WeakMap();
  function listen(this: PublishedDynamic,target: PublishedDynamic, event: PublishedDynamic, callback: PublishedDynamic, options?: PublishedDynamic): PublishedDynamic {
    target.addEventListener(event, callback, options);
    removers.push((): PublishedDynamic => target.removeEventListener(event, callback, options));
  }
  function playing(this: PublishedDynamic): PublishedDynamic {
    return !stopped && B.network.state === 1 && B.world.ѕ‌０ && B.world.ѕ‌０.id > 0;
  }
  function invalidAimState(this: PublishedDynamic,rotationOnly: PublishedDynamic=false): PublishedDynamic {
    if(!playing()||reconnect.sessionEnded||Aimbot.dead)return 'session-inactive';
    const id: PublishedDynamic=B.world.ѕ‌０.id,own: PublishedDynamic=GetAllTargets.players[id],target: PublishedDynamic=Aimbot.targetPlayer;
    if(!own?.active||!Number.isFinite(own.x)||!Number.isFinite(own.y))return 'self-position-missing';
    if(rotationOnly)return null;
    if(!target?.active||!Number.isFinite(target.x)||!Number.isFinite(target.y))return 'target-missing';
    if(GetAllTargets.players[target.id]===target&&target.id===id)return 'self-target';
    if(MOD.AdaptiveAimEnabled&&(!ballistic.motion('p:'+id)||!ballistic.motion((GetAllTargets.ghouls[target.id]===target?'g:':'p:')+target.id)))return 'stale-position';
    return null;
  }
  function resetAimForSession(this: PublishedDynamic): PublishedDynamic {
    lastSentAngle=null;automaticDirection=false;
    stopJitter();jitter.fireUntil=-Infinity;
    Aimbot.onDeath();
    Aimbot.targetPlayer=null;
    // A new handshake can finish before the source's next 50 ms id=0 tick.
    // Clear both entity histories before accepting positions from that session.
    for(const group of [GetAllTargets.players,GetAllTargets.ghouls])for(const target of group)if(target?.active)target.setInactive();
  }
  let lastSentAngle: PublishedDynamic = null,lastSentPlayer: PublishedDynamic = 0,automaticDirection: PublishedDynamic=false;
  const appliedToggles: PublishedDynamic={AimBotEnabled:MOD.AimBotEnabled,JitterEnabled:MOD.JitterEnabled};
  function __send(this: PublishedDynamic,value: PublishedDynamic, forceAngle: PublishedDynamic = false, sourceAngle: PublishedDynamic = false): PublishedDynamic {
    if (!playing()) return false;
    const packet: PublishedDynamic = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(packet) || packet.length === 0 || packet.some((x: PublishedDynamic): PublishedDynamic => typeof x !== 'number' || !Number.isFinite(x))) return false;
    if (packet[0] === 6) {
      if (packet.length !== 2) return false;
      packet[1] = normalizeAimAngle(sourceAngle?packet[1]:Math.round(packet[1]));
      if (!forceAngle && packet[1] === lastSentAngle && lastSentPlayer === B.world.ѕ‌０.id) {
        diagnostics.deduplicatedAngles++;
        return true;
      }
    }
    if([2,4,5,6].includes(packet[0])&&typeof B.aimSend==='function')B.aimSend(packet.slice());
    else originalSender(JSON.stringify(packet));
    if ([4,5,6].includes(packet[0])) {
      recentCombatCommands.push({at:performance.now(),op:packet[0]});
      if (recentCombatCommands.length > 180) recentCombatCommands.shift();
    }
    if (packet[0] === 6) {lastSentAngle = packet[1];lastSentPlayer = B.world.ѕ‌０.id;automaticDirection=sourceAngle||jitter.spinning;}
    recordCommand(packet[0]);
    return true;
  }
  // Restored from our earlier rotating Jitter (f978ade), independent of mouse
  // and movement input. Only its 50 ms timer is allowed to send idle angles.
  const jitter: PublishedDynamic={angle:0,updatedAt:null,lastSentAt:-Infinity,fireUntil:-Infinity,spinning:false,deferredDirections:0};
  function gunAimActive(this: PublishedDynamic): PublishedDynamic{return MOD.AimBotEnabled||MOD.AimbotSpearEnabled&&GetAllTargets.selfWeapon===5;}
  function jitterAiming(this: PublishedDynamic): PublishedDynamic{return !!(Aimbot.mouseDown||performance.now()<jitter.fireUntil||MOD.autoFire&&gunAimActive()&&!invalidAimState());}
  function stopJitter(this: PublishedDynamic): PublishedDynamic{jitter.spinning=false;jitter.updatedAt=null;jitter.lastSentAt=-Infinity;}
  function updateJitter(this: PublishedDynamic,now: PublishedDynamic,sendDirection: PublishedDynamic=false): PublishedDynamic{
    if(!MOD.JitterEnabled||invalidAimState(true)||jitterAiming()||B.chatActive?.()){stopJitter();return;}
    if(jitter.updatedAt===null){jitter.angle=((B.input?.angle||0)*180/Math.PI%360+360)%360;jitter.updatedAt=now;}
    const visualNow: PublishedDynamic=Math.max(now,jitter.updatedAt);
    jitter.angle=(jitter.angle+(visualNow-jitter.updatedAt)*MOD.JitterSpeed/1000)%360;jitter.updatedAt=visualNow;jitter.spinning=true;
    if(sendDirection&&now-jitter.lastSentAt>=50){if(!automationReady('aim')){jitter.deferredDirections++;return;}if(__send([6,jitter.angle]))jitter.lastSentAt=now;}
  }
  function beforeFire(this: PublishedDynamic): PublishedDynamic{
    if(!playing()||reconnect.sessionEnded||Aimbot.dead)return false;
    if(!MOD.JitterEnabled&&!gunAimActive()&&!automaticDirection)return true;
    jitter.fireUntil=performance.now()+150;stopJitter();
    if(!automationReady('aim'))return false;
    if(gunAimActive()){
      const angle: PublishedDynamic=MOD.AimbotSpearEnabled&&GetAllTargets.selfWeapon===5?Aimbot.spearResolve():Aimbot.resolve();
      if(!invalidAimState())return __send([6,angle],true,true);
    }
    // Target loss must not shoot along the last idle rotation or hidden angle.
    return Number.isFinite(B.input?.angle)?__send([6,B.input.angle*180/Math.PI],true):true;
  }
  function persist(this: PublishedDynamic): PublishedDynamic {
    refreshLootFilter();
    lastFastLoot=-Infinity;
    const saved: PublishedDynamic = {};
    for (const key of Object.keys(defaults)) if (!transient.has(key)) saved[key] = MOD[key];
    try {
      localStorage.setItem(AIM_SAVE,JSON.stringify(Object.fromEntries(aimKeys.map((key: PublishedDynamic): PublishedDynamic=>[key,MOD[key]]))));
      // Preserve earlier engine settings for rollback; this engine has its own key.
      const previousAim: PublishedDynamic=JSON.parse(localStorage.getItem(SAVE)||'{}');
      for(const key of aimKeys){if(Object.hasOwn(previousAim,key))saved[key]=previousAim[key];else delete saved[key];}
      localStorage.setItem(SAVE, JSON.stringify(saved));
      localStorage.setItem(SAVE + ':ilm2', '1');
      localStorage.setItem(SAVE + ':loot', JSON.stringify(Object.fromEntries(Object.entries(LootData).map(([k, v]: PublishedDynamic): PublishedDynamic => [k, v.acquire]))));
    } catch (_: any) {}
  }
  function setSetting(this: PublishedDynamic,key: PublishedDynamic, value: PublishedDynamic): PublishedDynamic {
    if (stopped) throw new Error('Mod has been disposed');
    validateSetting(key,value);
    // dat.GUI writes MOD before onChange, so compare the last applied value.
    if(Object.prototype.hasOwnProperty.call(appliedToggles,key)){
      if(appliedToggles[key]!==value)lastSentAngle=null;
      appliedToggles[key]=value;
    }
    if (keySettings.includes(key)) {
      const conflict: PublishedDynamic = value==='NoKey'?null:keySettings.find((other: PublishedDynamic): PublishedDynamic=>other!==key && MOD[other]===value);
      if (conflict) MOD[conflict] = MOD[key];
    }
    MOD[key] = value;
    if(key==='AdaptiveAimEnabled'){lastAdaptiveDirection=-Infinity;lastAdaptiveTarget=null;}
    if(key==='JitterEnabled'&&!value)stopJitter();
    if (key === 'NicknameColor') {
      for (let id: PublishedDynamic=1;id<B.world.Іⲥ︇.length;id++) {
        const meta: PublishedDynamic=playerMeta(id);
        if (meta && typeof meta === 'object') preparePlayerLabel(meta,id);
      }
    }
    if (key === 'PlayersListEnabled' && !value && playerListPanel) playerListPanel.style.display = 'none';
    if (key === 'SpamChatEnabled') {
      chatState.status = value ? 'Waiting for game' : 'Off';
      if (value) {
        lastChat = -Infinity;
        nextChatAt = -Infinity;
      }
    }
    if (key === 'SAutoLootEnabled' && value) MOD.FAutoLootEnabled = false;
    if (key === 'FAutoLootEnabled' && value) MOD.SAutoLootEnabled = false;
    if(trafficKeys.some((name: PublishedDynamic): PublishedDynamic=>trafficSettings[name]!==MOD[name])){
      for(const name of trafficKeys)trafficSettings[name]=MOD[name];
      trafficChanges.push({at:Math.round(performance.now()),settings:{...trafficSettings}});
      if(trafficChanges.length>64){trafficChanges.shift();trafficDiscardedChanges++;}
    }
    persist();
    if (menu) menu.updateDisplay();
  }
  function report(this: PublishedDynamic,error: PublishedDynamic): PublishedDynamic {
    const message: PublishedDynamic = String(error && error.message || error);
    if (!diagnostics.errors.includes(message)) {
      if (diagnostics.errors.length >= 50) diagnostics.errors.shift();
      diagnostics.errors.push(message);
      console.error('[Devast mod]', message);
    }
  }
  // Decode the native protocol; prediction/history stay in the imported engine.
  function trackPacket(this: PublishedDynamic,type: PublishedDynamic, playerId: PublishedDynamic, uid: PublishedDynamic, x: PublishedDynamic, y: PublishedDynamic, active: PublishedDynamic, weapon: PublishedDynamic, packed: PublishedDynamic, packet: PublishedDynamic={}): PublishedDynamic {
    if(type===B.categories.projectile){
      if(active&&playerId===B.world.ѕ‌０?.id&&Number.isInteger(packet.state)){
        const self: PublishedDynamic=ballistic.motion('p:'+playerId);
        if(self)ballistic.projectile(playerId+':'+uid+':'+packet.entityId,self.weapon,(packet.state>>>8)*10,ballisticWeaponProfile(self.weapon).speed);
      }
      return;
    }
    const kind: PublishedDynamic=type===B.categories.player?'players':type===13?'ghouls':null;
    const id: PublishedDynamic=kind==='players'?playerId:uid;
    if(!kind||!Number.isInteger(id)||id<0||id>65535)return;
    if(id===0)return;
    ballistic.track((kind==='players'?'p:':'g:')+id,Number.isFinite(packet.x)?packet.x:x,Number.isFinite(packet.y)?packet.y:y,active,{generation:uid,weapon:kind==='players'&&Number.isFinite(packed)?(packed>>>8)&255:undefined});
    aimModule.ensure(id);const group: PublishedDynamic=GetAllTargets[kind];
    if(!active){group[id].setInactive();return;}
    if(Number.isFinite(x)&&Number.isFinite(y))aimModule.position(kind,id,x,y,weapon,packed);
  }

  function playerMeta(this: PublishedDynamic,id: PublishedDynamic): PublishedDynamic {
    return B.world.Іⲥ︇[id];
  }
  function nickname(this: PublishedDynamic,id: PublishedDynamic): PublishedDynamic {
    const p: PublishedDynamic = playerMeta(id), value: PublishedDynamic = p && p.ᴑ︎ܔ;
    const text: PublishedDynamic=String(typeof value === 'string' ? value : '');
    const suffix: PublishedDynamic='#'+id;
    return B.nativePlayerLabels && text.endsWith(suffix) ? text.slice(0,-suffix.length) : text;
  }
  function playerLabel(this: PublishedDynamic,meta: PublishedDynamic, id: PublishedDynamic): PublishedDynamic {
    const known: PublishedDynamic = playerLabelCache.get(meta);
    if (!Number.isInteger(id)) id = known ? known.id : B.world.Іⲥ︇.indexOf(meta);
    const name: PublishedDynamic = String(meta?.ᴑ︎ܔ || '');
    if(B.nativePlayerLabels) return name;
    return Number.isInteger(id) && id > 0 ? name+'#'+id : name;
  }
  function preparePlayerLabel(this: PublishedDynamic,meta: PublishedDynamic, id: PublishedDynamic): PublishedDynamic {
    const cached: PublishedDynamic = playerLabelCache.get(meta);
    if (!cached || cached.id !== id || cached.nickname !== meta.ᴑ︎ܔ || cached.color !== MOD.NicknameColor) {
      meta.ܐᚉߏ = null;
      meta.օ༨ᚈ = null;
      B.world.ᴇߐᄇ = 1;
      playerLabelCache.set(meta, {
        id,
        nickname:meta.ᴑ︎ܔ,
        color:MOD.NicknameColor
      });
    }
  }
  function observePlayerSpawn(this: PublishedDynamic,id: PublishedDynamic): PublishedDynamic { departedPlayers.delete(id); }
  function observePlayerLeave(this: PublishedDynamic,id: PublishedDynamic): PublishedDynamic { aimModule.onOtherDie(id);departedPlayers.set(id,playerMeta(id)); }
  function zoomOffset(this: PublishedDynamic,nativeOffset: PublishedDynamic): PublishedDynamic {
    const base: PublishedDynamic = Number.isFinite(nativeOffset) ? nativeOffset : 0;
    return Math.max(-.95, Math.min(3, (1 + base) * MOD.zoomFactor - 1));
  }
  function validClan(this: PublishedDynamic,id: PublishedDynamic): PublishedDynamic {
    const p: PublishedDynamic = playerMeta(id), index: PublishedDynamic = p && p.ո२２;
    if (!Number.isInteger(index) || index < 0) return null;
    const clan: PublishedDynamic = B.world.ⲥ༢ނ[index];
    return clan && Number.isInteger(clan.ᅟ̟͏) && p.ᴏܒܔ === clan.ᅟ̟͏ ? clan : null;
  }
  function teamId(this: PublishedDynamic,id: PublishedDynamic): PublishedDynamic {
    const meta: PublishedDynamic=playerMeta(id),index: PublishedDynamic=meta?.ո२２;
    if(!Number.isInteger(index)||index<0)return -1;
    const clan: PublishedDynamic=B.world.ⲥ༢ނ[index];
    return clan&&Number.isInteger(clan.ᅟ̟͏)&&meta.ᴏܒܔ===clan.ᅟ̟͏?index:-1;
  }
  function sameClan(this: PublishedDynamic,id: PublishedDynamic): PublishedDynamic {
    const own: PublishedDynamic = validClan(B.world.ѕ‌０.id);
    return !!own && own === validClan(id);
  }
  function clanColor(this: PublishedDynamic,id: PublishedDynamic): PublishedDynamic {
    return id === B.world.ѕ‌０.id || sameClan(id) ? MOD.TeamClanColor : MOD.EnemyClanColor;
  }
  const clanTagColors: PublishedDynamic = new WeakMap();
  function prepareClanTag(this: PublishedDynamic,clan: PublishedDynamic, id: PublishedDynamic): PublishedDynamic {
    const color: PublishedDynamic = clanColor(id);
    if (clanTagColors.get(clan) !== color) {
      clan.ⲅɑܛ = null;
      clanTagColors.set(clan, color);
    }
  }
  function collect(this: PublishedDynamic): PublishedDynamic {
    let count: PublishedDynamic=0,playerCount: PublishedDynamic=0;
    for (let type: PublishedDynamic = 0; type < B.entities.border.length; type++) {
      const border: PublishedDynamic = B.entities.border[type], group: PublishedDynamic = B.entities.ε९̙[type];
      if (!border || !group) continue;
      for (let i: PublishedDynamic = 0; i < border.border; i++) {
        const e: PublishedDynamic = group[border.ⲣܐܕ[i]];
        if (e && e.рօߍ === 0 && Number.isFinite(e.x) && Number.isFinite(e.y)) {
          let record: PublishedDynamic=entityRecords.get(e);
          if (!record) {record={type,e};entityRecords.set(e,record);}
          else record.type=type;
          collectedRecords[count++]=record;
          if (type===B.categories.player) playerRecords[playerCount++]=record;
        }
      }
    }
    collectedRecords.length=count;
    playerRecords.length=playerCount;
    return collectedRecords;
  }
  function updateTargets(this: PublishedDynamic): PublishedDynamic {
    for (const {e} of playerRecords) {
      const meta: PublishedDynamic=playerMeta(e.ᴉ̊︉);
      if (meta && typeof meta.ᴑ︎ܔ==='string') _players_list[e.ᴉ̊︉]=meta.ᴑ︎ܔ;
    }
  }
  function view(this: PublishedDynamic): PublishedDynamic {
    const v: PublishedDynamic = B.view(), ratio: PublishedDynamic = B.graphics.options && B.graphics.options.ⲥᴇ̵;
    return {
      ...v,
      scale: v.scale * (Number.isFinite(ratio) && ratio > 0 ? ratio : 1)
    };
  }
  function cursorWorld(this: PublishedDynamic,cursor: PublishedDynamic = mouse || GetAllTargets.mousePosition): PublishedDynamic {
    const v: PublishedDynamic = view(), can: PublishedDynamic = v.ctx?.canvas || document.getElementById('can');
    if (!can || !(v.scale > 0)) return null;
    const r: PublishedDynamic = can.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return __ilmMouseToWorld({x:(cursor.x-r.left)*can.width/r.width,y:(cursor.y-r.top)*can.height/r.height},v);
  }
  function updateMouse(this: PublishedDynamic): PublishedDynamic {
    if (!MOD.mouseFovEnable) return;
    // The imported renderer uses client coordinates and the native camera.
    // Doors and building previews retain their canvas/DPI conversion.
    const v: PublishedDynamic = B.view();
    if (v.scale > 0) GetAllTargets.mouseMapCords = __ilmMouseToWorld(GetAllTargets.mousePosition,v);
  }
  function automate(this: PublishedDynamic,now: PublishedDynamic): PublishedDynamic {
    const me: PublishedDynamic = B.world.ѕ‌０;
    if (!B.synchronizedRender && MOD.FAutoLootEnabled) scanFastLoot(now);
    if (MOD.SAutoLootEnabled && !MOD.FAutoLootEnabled && now - lastLoot >= 200 && automationReady('loot')) {
      lastLoot = now;
      const loot: PublishedDynamic = records.filter((r: PublishedDynamic): PublishedDynamic => r.type === B.categories.loot && (r.e.x - me.x) ** 2 + (r.e.y - me.y) ** 2 < 50000 && lootAllowed(r.e));
      loot.sort((a: PublishedDynamic, b: PublishedDynamic): PublishedDynamic => (a.e.x - me.x) ** 2 + (a.e.y - me.y) ** 2 - ((b.e.x - me.x) ** 2 + (b.e.y - me.y) ** 2));
      for (const {e} of loot.slice(0, 1)) if(__send([12,e.id]))recordPickupRequest(e);
    }
    if (MOD.AutoTakeEnabled && Aimbot.mouseDown && me.ⲅոᴇ === 1 && now - lastTake >= 200 && automationReady('take')) {
      const slots: PublishedDynamic = me.ﾠܞ༠, count: PublishedDynamic = me.α͏３;
      if (Array.isArray(slots) && Number.isInteger(count)) {
        const slot: PublishedDynamic = slots.findIndex((item: PublishedDynamic,index: PublishedDynamic): PublishedDynamic=>index < count && Array.isArray(item) && Number.isFinite(item[0]) && item[0] > 0);
        if (slot >= 0) __send([27, slot]);
      }
      lastTake = now;
    }
    if (MOD.AntiKickEnabled && now - lastKeepAlive >= 7000 && automationReady('keepAlive')) {
      __send([0]);
      lastKeepAlive = now;
    }
    updateChat(now);
  }
  // Use the same selected building, rotation and cursor preview as native placement.
  function autoBuildFrame(this: PublishedDynamic,now: PublishedDynamic=performance.now()): PublishedDynamic {
    if (!playing() || !MOD.AutoBuiledEnabled) return;
    if(now-lastAutoBuild<AUTO_BUILD_INTERVAL)return;
    const me: PublishedDynamic=B.world.ѕ‌０;
    if (me.ⲣ͢５!==1 || me.ᴘމ᠌!==1) return;
    if(!automationReady('build'))return;
    if(__send([14,me.Іᄇ‌,me.ㅤ︇ބ,me.ѕ３９]))lastAutoBuild=now;
  }
  function updateChat(this: PublishedDynamic,now: PublishedDynamic): PublishedDynamic {
    if (!MOD.SpamChatEnabled) {
      chatState.status = 'Off';
      return;
    }
    const input: PublishedDynamic = document.getElementById('chatInput'), limit: PublishedDynamic = input && input.maxLength > 0 ? input.maxLength : 100;
    const text: PublishedDynamic = String(MOD.SpamChatText).replace(/[\r\n]+/g, ' ').trim().slice(0, limit);
    if (!text) {
      chatState.status = 'Enter a message';
      return;
    }
    if (B.chatActive && B.chatActive()) {
      chatState.status = 'Paused while typing';
      return;
    }
    if (now < nextChatAt) {
      chatState.status = 'Chat cooldown: ' + Math.ceil((nextChatAt - now) / 1000) + 's';
      return;
    }
    if (now - lastChat < 5000) {
      chatState.status = 'Next message: ' + Math.ceil((5000 - now + lastChat) / 1000) + 's';
      return;
    }
    if(!automationReady('chat')){chatState.status='Waiting for network';return;}
    const wait: PublishedDynamic = B.network.ɑࠁᄉ(text);
    if (wait === 0) {
      recordCommand(1);
      lastChat = now;
      nextChatAt = -Infinity;
      chatState.sent++;
      chatState.status = 'Sent (' + chatState.sent + ')';
      const local: PublishedDynamic = playerMeta(B.world.ѕ‌０.id);
      if (local && local.text && typeof local.text.push === 'function') local.text.push(text);
    } else if (Number.isFinite(wait) && wait > 0) {
      nextChatAt = now + Math.max(100, wait + 100);
      chatState.status = 'Chat cooldown: ' + Math.ceil(wait / 1000) + 's';
    } else {
      nextChatAt = now + 5000;
      chatState.status = 'Send not confirmed';
    }
  }
  function scanFastLoot(this: PublishedDynamic,now: PublishedDynamic=performance.now()): PublishedDynamic {
    if (!playing() || !MOD.FAutoLootEnabled) return;
    if(now-lastFastLoot<FAST_LOOT_INTERVAL)return;
    if(!automationReady('loot'))return;
    // Bound unsuccessful scans as well as sends. Rotate the starting slot
    // so large groups still get visited across successive 25 ms cycles.
    const me: PublishedDynamic = B.world.ѕ‌０, type: PublishedDynamic = B.categories.loot, border: PublishedDynamic = B.entities.border[type], group: PublishedDynamic = B.entities.ε९̙[type];
    lastFastLoot=now;
    if(!border||!group||!border.border)return;
    let visited: PublishedDynamic=0,sent: PublishedDynamic=0;
    while(visited<Math.min(border.border,FAST_LOOT_SCAN_LIMIT)&&sent<FAST_LOOT_BURST){
      const i: PublishedDynamic=(fastLootCursor+visited++)%border.border;
      const e: PublishedDynamic = group[border.ⲣܐܕ[i]];
      if (!e || e.рօߍ !== 0 || !Number.isInteger(e.id) || !Number.isFinite(e.x) || !Number.isFinite(e.y)) continue;
      const distance: PublishedDynamic = (e.x - me.x) ** 2 + (e.y - me.y) ** 2;
      if (distance < 41000 && (!MOD.LootDataEnabled || allowedLootIds.has(e.ᴎࡈ̷))) {
        // The preceding request can fill the queue during this same burst.
        // Resume at this unsent drop after the transport drains.
        if(!automationReady('loot')){visited--;break;}
        if(__send([12,e.id])){recordPickupRequest(e);sent++;}
      }
    }
    fastLootCursor=(fastLootCursor+visited)%border.border;
    
  }
  function building(this: PublishedDynamic,r: PublishedDynamic): PublishedDynamic {
    if ([B.categories.player, B.categories.loot, 13].includes(r.type)) return null;
    const descriptor: PublishedDynamic = B.items[r.e.ᴎࡈ̷ >> 7];
    return descriptor && Number.isInteger(descriptor.ᴌᚉܒ) && descriptor.ᴌᚉܒ > 0 ? descriptor : null;
  }
  function ownedBuilding(this: PublishedDynamic,r: PublishedDynamic): PublishedDynamic {
    if ([B.categories.player,B.categories.loot,B.categories.projectile,13].includes(r.type)) return null;
    const descriptor: PublishedDynamic=B.items[r.e.ᴎࡈ̷>>7];
    if (!descriptor) return null;
    // Interaction opcodes only identify doors/containers. Walls, floors and
    // sleeping bags also have placeable dimensions and item details.
    return descriptor.detail&&typeof descriptor.detail.name==='string'&&Array.isArray(descriptor.width)&&Array.isArray(descriptor.height)
      || Number.isInteger(descriptor.ᴌᚉܒ)&&descriptor.ᴌᚉܒ>0 ? descriptor:null;
  }
  function highlightMine(this: PublishedDynamic,entity: PublishedDynamic): PublishedDynamic {
    if (stopped||!MOD.ShowMines||!playing()) return;
    const v: PublishedDynamic=view(),canvas: PublishedDynamic=v.ctx?.canvas;
    if (!canvas||!Number.isFinite(entity.x)||!Number.isFinite(entity.y)) return;
    const x: PublishedDynamic=(v.x+entity.x)*v.scale,y: PublishedDynamic=(v.y+entity.y)*v.scale;
    const radius: PublishedDynamic=Math.max(6,Math.min(22,25*v.scale));
    if(x < -radius||y < -radius||x > canvas.width+radius||y > canvas.height+radius)return;
    const c: PublishedDynamic=v.ctx;c.save();
    try{
      c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.strokeStyle='#ff453a';c.lineWidth=2;
      c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.stroke();
    }finally{c.restore();}
  }
  function lootAllowed(this: PublishedDynamic,e: PublishedDynamic): PublishedDynamic {
    const me: PublishedDynamic = B.world.ѕ‌０;
    return me.ࡀ༠५ === 0 && me.ᴄрܜ === e.id && (!MOD.LootDataEnabled || allowedLootIds.has(e.ᴎࡈ̷));
  }
  const doorInteraction: PublishedDynamic={status:'idle',message:'',id:null,owner:null,expires:0};
  let pendingDoor: PublishedDynamic=null;
  function updateDoorInteraction(this: PublishedDynamic,now: PublishedDynamic=performance.now()): PublishedDynamic {
    if(!pendingDoor)return;
    const current: PublishedDynamic=records.find((r: PublishedDynamic): PublishedDynamic=>r.type===pendingDoor.type&&r.e.id===pendingDoor.id&&r.e.ᴉ̊︉===pendingDoor.owner);
    if(current&&!!(current.e.state&16)!==pendingDoor.wasOpen){
      doorInteraction.status='confirmed';
      doorInteraction.message=current.e.state&16?'Дверь открыта':'Дверь закрыта';
      doorInteraction.expires=now+1500;pendingDoor=null;
    }else if(now-pendingDoor.at>=1500){
      doorInteraction.status='unconfirmed';doorInteraction.message='Нет подтверждения от двери';
      doorInteraction.expires=now+2000;pendingDoor=null;
    }
  }
  function openUnderMouse(this: PublishedDynamic): PublishedDynamic {
    if (!playing() || (!MOD.RightClickDoors&&!MOD.OpenEverythingByClick) || B.chatActive?.()) return false;
    const point: PublishedDynamic = cursorWorld();
    if (!point) return false;
    const x: PublishedDynamic = Math.floor(point.x / 100), y: PublishedDynamic = Math.floor(point.y / 100);
    const me: PublishedDynamic = B.world.ѕ‌０;
    let selected: PublishedDynamic;
    for (const r of records) {
      if(r.e.ࡀ٤༨!==x || r.e.ⲅι८!==y)continue;
      const d: PublishedDynamic = building(r);
      if(!d)continue;
      if(B.isManualDoor?.(d)){
        if(!MOD.RightClickDoors)continue;
        // E describes the native nearest target. A right click addresses this
        // door directly; the server decides whether the action is permitted.
        if(!__send([d.ᴌᚉܒ,r.e.id,r.e.ᴉ̊︉]))return false;
        const now: PublishedDynamic=performance.now();
        pendingDoor={type:r.type,id:r.e.id,owner:r.e.ᴉ̊︉,wasOpen:!!(r.e.state&16),at:now};
        Object.assign(doorInteraction,{status:'requested',message:'Запрос двери отправлен',id:r.e.id,owner:r.e.ᴉ̊︉,expires:now+1500});
        return true;
      }
      if(MOD.OpenEverythingByClick && me.ࡀ༠५===2 && me.αߍⲥ===r.e.id && me.еࠅ८===r.e.ᴉ̊︉ && me.ᴌᚉܒ===d.ᴌᚉܒ)selected=[d.ᴌᚉܒ,r.e.id,r.e.ᴉ̊︉];
    }
    return selected ? __send(selected) : false;
  }
  function ensureOverlay(this: PublishedDynamic): PublishedDynamic {
    const v: PublishedDynamic=view(),can: PublishedDynamic=v.ctx?.canvas || document.getElementById('can');
    if (!can) return false;
    if (!overlayHost) {
      overlayHost=document.createElement('div');overlayHost.id='devast-mod-layer';
      overlayHost.style.cssText='position:fixed;pointer-events:none;z-index:100000;background:transparent;';
      overlayHost.attachShadow({mode:'open'});document.body.appendChild(overlayHost);
    }
    // The native hook runs after the world is drawn. Reuse that frame instead
    // of clearing and compositing another full-size pixel surface every frame.
    nativeDraw=!!(B.synchronizedRender && v.ctx?.canvas===document.getElementById('can'));
    if (nativeDraw) {
      ctx=v.ctx;
      if (overlay) overlay.style.display='none';
    } else {
      if (!overlay) {
        overlay=document.createElement('canvas');overlay.id='devast-mod-overlay';
        overlay.style.cssText='display:block;width:100%;height:100%;background:transparent;';
        overlayHost.shadowRoot.appendChild(overlay);
      }
      overlay.style.display='block';ctx=overlay.getContext('2d');
      if(overlay.width!==can.width)overlay.width=can.width;
      if(overlay.height!==can.height)overlay.height=can.height;
    }
    const r: PublishedDynamic=can.getBoundingClientRect();
    for (const [key,value]of Object.entries({left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'}))if(overlayHost.style[key]!==value)overlayHost.style[key]=value;
    return !!ctx;
  }
  function syncFunctionList(this: PublishedDynamic): PublishedDynamic {
    if (!overlayHost) return;
    if (!functionList) {
      functionList = document.createElement('div');
      functionList.id = 'devast-mod-functions';
      functionList.style.cssText = 'position:absolute;left:8px;top:50%;transform:translateY(-50%);background:rgba(6,25,36,.88);pointer-events:none;display:grid;grid-auto-flow:column;column-gap:12px;padding:2px 5px;font-family:system-ui,sans-serif;font-weight:800;white-space:nowrap;';
      for (const [key, label] of functionLabels) {
        const row: PublishedDynamic = document.createElement('div');
        row.dataset.function = key || 'unavailable';
        row.textContent = '• ' + label;
        if (!key) row.title = 'Unavailable in this script';
        functionRows.set(label, { key, row });
        functionList.appendChild(row);
      }
      overlayHost.shadowRoot.appendChild(functionList);
    }
    const display: PublishedDynamic=MOD.showFunctionList?'grid':'none';
    if (functionList.style.display!==display) functionList.style.display=display;
    if (!MOD.showFunctionList) return;
    const height: PublishedDynamic = parseFloat(overlayHost.style.height) || window.innerHeight, rows: PublishedDynamic = Math.ceil(functionRows.size / 2), font: PublishedDynamic = Math.max(8, Math.min(14, (height - 16) / rows - 3)), line: PublishedDynamic = Math.ceil(font + 3);
    const fontSize: PublishedDynamic=font+'px',lineHeight: PublishedDynamic=line+'px',gridRows: PublishedDynamic='repeat('+rows+', '+line+'px)';
    if (functionList.style.fontSize!==fontSize) functionList.style.fontSize=fontSize;
    if (functionList.style.lineHeight!==lineHeight) functionList.style.lineHeight=lineHeight;
    if (functionList.style.gridTemplateRows!==gridRows) functionList.style.gridTemplateRows=gridRows;
    for (const { key, row } of functionRows.values()) {
      const on: PublishedDynamic = key !== null && MOD[key] === true;
      if (row.dataset.enabled === String(on)) continue;
      row.dataset.enabled = String(on);
      row.style.color = on ? '#ffff00' : '#fff';
      row.style.opacity = '1';
      row.style.textShadow = on ? '0 0 7px rgba(255,255,0,.9)' : 'none';
    }
  }
  function syncPlayerList(this: PublishedDynamic): PublishedDynamic {
    if (!playing() || !MOD.PlayersListEnabled) {
      if (playerListPanel) playerListPanel.style.display = 'none';
      return;
    }
    if (!playerListPanel) {
      const style: PublishedDynamic=document.createElement('style');
      style.textContent='.player-list{position:absolute;left:8px;top:8px;width:min(560px,calc(100% - 16px));max-height:calc(100% - 16px);box-sizing:border-box;pointer-events:auto;background:rgba(8,16,25,.96);border:1px solid #607086;border-radius:8px;flex-direction:column;overflow:hidden;color:#fff;font:14px/1.5 system-ui,sans-serif}.player-list-header{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;gap:12px}.player-list button{font:inherit;cursor:pointer;border:0;background:transparent;color:inherit}.player-list-close{font-size:24px!important;line-height:1}.player-list-scroll{overflow:auto;min-height:0;overscroll-behavior:contain}.player-list-row{display:grid;grid-template-columns:58px minmax(0,1fr) minmax(85px,1fr);gap:8px;padding:6px 12px;align-items:center;border-top:1px solid #293646}.player-list-columns{position:sticky;top:0;background:#182434;color:#b6c4d4;font-size:12px}.player-list-name{text-align:left;overflow-wrap:anywhere;padding:0}.player-list-clan{overflow-wrap:anywhere}.player-list-empty{padding:12px;color:#b6c4d4}';
      overlayHost.shadowRoot.appendChild(style);
      playerListPanel=document.createElement('section');playerListPanel.className='player-list';playerListPanel.id='devast-player-list';
      const header: PublishedDynamic=document.createElement('div');header.className='player-list-header';
      playerListCount=document.createElement('strong');header.appendChild(playerListCount);
      const close: PublishedDynamic=document.createElement('button');close.className='player-list-close';close.textContent='×';close.title='Закрыть список игроков';
      listen(close,"click",(): PublishedDynamic=>setSetting('PlayersListEnabled',false));header.appendChild(close);playerListPanel.appendChild(header);
      const scroll: PublishedDynamic=document.createElement('div');scroll.className='player-list-scroll';
      const columns: PublishedDynamic=document.createElement('div');columns.className='player-list-row player-list-columns';
      for (const label of ['#ID','Ник','Клан']) {const cell: PublishedDynamic=document.createElement('span');cell.textContent=label;columns.appendChild(cell);}
      scroll.appendChild(columns);playerListBody=document.createElement('div');scroll.appendChild(playerListBody);playerListPanel.appendChild(scroll);
      for (const name of ['mousedown',"click",'dblclick','contextmenu','wheel','touchstart']) listen(playerListPanel,name,(event: PublishedDynamic): PublishedDynamic=>event.stopPropagation());
      overlayHost.shadowRoot.appendChild(playerListPanel);
    }
    playerListPanel.style.display='flex';
    const ids: PublishedDynamic=[];
    for (let id: PublishedDynamic=1;id<B.world.Іⲥ︇.length;id++) {
      const meta: PublishedDynamic=playerMeta(id);
      if (!meta || typeof meta.ᴑ︎ܔ !== 'string' || departedPlayers.get(id) === meta) continue;
      departedPlayers.delete(id);ids.push(id);
      const name: PublishedDynamic=nickname(id),clan: PublishedDynamic=validClan(id),tag: PublishedDynamic=clan?.name ? '['+clan.name+']' : '—';
      const color: PublishedDynamic=clan ? clanColor(id) : '#9aabbc';
      let entry: PublishedDynamic=playerListRows.get(id);
      if (!entry) {
        const row: PublishedDynamic=document.createElement('div');row.className='player-list-row';row.dataset.playerId=String(id);
        const number: PublishedDynamic=document.createElement('span'),nick: PublishedDynamic=document.createElement('button'),clanLabel: PublishedDynamic=document.createElement('span');
        number.textContent='#'+id;nick.className='player-list-name';nick.title='Копировать ник';clanLabel.className='player-list-clan';
        row.appendChild(number);row.appendChild(nick);row.appendChild(clanLabel);nick.onclick=(): PublishedDynamic=>copyNickname(id);
        entry={row,number,nick,clan:clanLabel};playerListRows.set(id,entry);
      }
      if (entry.name!==name || entry.tag!==tag || entry.nickColor!==MOD.NicknameColor || entry.clanColor!==color) {
        entry.nick.textContent=name || 'Без ника';entry.nick.style.color=MOD.NicknameColor;entry.number.style.color=MOD.NicknameColor;
        entry.clan.textContent=tag;entry.clan.style.color=color;
        entry.name=name;entry.tag=tag;entry.nickColor=MOD.NicknameColor;entry.clanColor=color;
      }
    }
    const order: PublishedDynamic=ids.join(',');
    if (order !== playerListOrder || !playerListBody.children.length) {
      const present: PublishedDynamic=new Set(ids);
      for (const id of playerListRows.keys()) if (!present.has(id)) playerListRows.delete(id);
      const rows: PublishedDynamic=ids.map((id: PublishedDynamic): PublishedDynamic=>playerListRows.get(id).row);
      if (!rows.length) {const empty: PublishedDynamic=document.createElement('div');empty.className='player-list-empty';empty.textContent='Нет данных об игроках';rows.push(empty);}
      playerListBody.replaceChildren(...rows);playerListOrder=order;
    }
    const title: PublishedDynamic='Игроки: '+ids.length;
    if (playerListCount.textContent !== title) playerListCount.textContent=title;
  }
  function draw(this: PublishedDynamic): PublishedDynamic {
    updateDoorInteraction();
    if (!playing()) {
      if (!nativeDraw && ctx && overlay) ctx.clearRect(0, 0, overlay.width, overlay.height);
      if (functionList) functionList.style.display = 'none';
      if (playerListPanel) playerListPanel.style.display = 'none';
      return;
    }
    if (!ensureOverlay()) return;
    syncFunctionList();
    syncPlayerList();
    if (!nativeDraw) ctx.clearRect(0, 0, overlay.width, overlay.height);
    const v: PublishedDynamic = view(), me: PublishedDynamic = B.world.ѕ‌０;
    function at(this: PublishedDynamic,e: PublishedDynamic): PublishedDynamic {
      return {
        x: (v.x + e.x) * v.scale,
        y: (v.y + e.y) * v.scale
      };
    }
    function text(this: PublishedDynamic,value: PublishedDynamic, x: PublishedDynamic, y: PublishedDynamic, color: PublishedDynamic = '#fff', size: PublishedDynamic = 14): PublishedDynamic {
      ctx.font = size + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000';
      ctx.fillStyle = color;
      ctx.strokeText(String(value), x, y);
      ctx.fillText(String(value), x, y);
    }
    ctx.save();
    try {
      if (nativeDraw) {
        ctx.setTransform(1,0,0,1,0,0);
        ctx.globalAlpha=1;
        ctx.globalCompositeOperation='source-over';
        ctx.shadowColor='rgba(0,0,0,0)';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
        ctx.filter='none';ctx.lineCap='butt';ctx.lineJoin='miter';ctx.miterLimit=10;
        ctx.setLineDash([]);ctx.lineDashOffset=0;ctx.textBaseline='alphabetic';
      }
      if (MOD.ShowPosition) text('[' + Math.floor(me.x / 100) + ':' + Math.floor(me.y / 100) + ']', 100, 32, '#fff', 18);
      let ownerCursor: PublishedDynamic, ownerCursorRead: PublishedDynamic=false,ownerLabelCount: PublishedDynamic=0;
      const drawRecords: PublishedDynamic=MOD.ShowBuildingOwner||MOD.RightClickDoors?records:playerRecords;
      for (const r of drawRecords) {
        if (r.type === B.categories.player) {
          const id: PublishedDynamic = r.e.ᴉ̊︉, p: PublishedDynamic = at(r.e), self: PublishedDynamic = id === me.id, color: PublishedDynamic = self && !validClan(id) ? '#00ffff' : clanColor(id);
          if (MOD.ShowNamesOnMap && !B.nativePlayerLabels && Number.isInteger(id) && id > 0) {
            text(playerLabel(playerMeta(id),id).trim(), p.x, p.y - 56 * v.scale, MOD.NicknameColor);
            const clan: PublishedDynamic=validClan(id);
            if(clan && typeof clan.name==='string' && clan.name) text('['+clan.name+']',p.x,p.y-72*v.scale,clanColor(id));
          }
          if (MOD.ShowPlayerHitbox) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 38 * v.scale, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeRect(p.x - 30 * v.scale, p.y - 30 * v.scale, 60 * v.scale, 60 * v.scale);

          }
          if (MOD.KarmaAboveHead) {
            const meta: PublishedDynamic = playerMeta(id), sprite: PublishedDynamic = meta && B.karma[meta.ᅠ️๙];
            if (sprite && B.graphics.οⲅ३) B.graphics.οⲅ३(sprite, v.x + r.e.x, v.y + r.e.y - 85, 0, 0, 0, 0.6);
          }
        } else if ((MOD.ShowBuildingOwner||MOD.RightClickDoors) && typeof r.e.ࡀ٤༨==='number') {
          if (!ownerCursorRead) {ownerCursor=cursorWorld();ownerCursorRead=true;}
          const point: PublishedDynamic = ownerCursor;
          if (!point) continue;
          const x: PublishedDynamic = Math.floor(point.x / 100), y: PublishedDynamic = Math.floor(point.y / 100);
          if (r.e.ࡀ٤༨ === x && r.e.ⲅι८ === y) {
            const descriptor: PublishedDynamic=ownedBuilding(r);
            if(!descriptor)continue;
            const p: PublishedDynamic=at(r.e),id: PublishedDynamic=r.e.ᴉ̊︉,kind: PublishedDynamic=descriptor.detail?.name;
            const owner: PublishedDynamic=Number.isInteger(id)&&id>0?(nickname(id)?nickname(id)+' ':'')+'#'+id:'Owner unknown';
            if(MOD.ShowBuildingOwner)text((kind?kind+': ':'')+owner,p.x,p.y-35-18*ownerLabelCount++,clanColor(id),16);
            if(MOD.RightClickDoors&&B.isManualDoor?.(descriptor)){
              const feedback: PublishedDynamic=doorInteraction.id===r.e.id&&doorInteraction.owner===id&&performance.now()<doorInteraction.expires;
              text(feedback?doorInteraction.message:(r.e.state&16?'ПКМ — закрыть дверь':'ПКМ — открыть дверь'),p.x,p.y-75,feedback&&doorInteraction.status==='unconfirmed'?'#ffb14e':'#fff',14);
            }
          }
        }
      }
      const aimView: PublishedDynamic=B.view();
      aimModule.render(ctx,aimView,v.scale/aimView.scale);
      ctx.globalAlpha = 1;
    } finally {ctx.restore();}
  }
  const reconnect: PublishedDynamic = {
    status: 'Ready',
    attempts: 0,
    refreshFailures:0,
    armed: false,
    next: 0,
    pending: false,
    generation: 0,
    phase: 'idle',
    freshRequired: false,
    freshUsed: false,
    autoBlocked: false,
    lastFailureCode: 0,
    gatewayRecoveries: 0,
    sessionEnded:false,
    awaitingPlay:false,
    initialHomeRecoveries:0
  };
  let connectionSocket: PublishedDynamic = null, adGate: PublishedDynamic = null, removeSocketObservers: PublishedDynamic = (): PublishedDynamic => {};
  let socketSerial: PublishedDynamic=0,socketTrace: PublishedDynamic=null;
  const callbackTraffic: PublishedDynamic={wrapped:0,accepted:0,rejectedStale:0,rejectedWhileConnected:0,rejectedAfterDispose:0};
  function socketTraffic(this: PublishedDynamic,now: PublishedDynamic=performance.now()): PublishedDynamic {
    if(!socketTrace)return null;
    return {id:socketTrace.id,openForMs:socketTrace.openedAt===null?null:Math.max(0,Math.round(now-socketTrace.openedAt)),
      receiveGapMs:socketTrace.lastReceiveAt===null?null:Math.max(0,Math.round(now-socketTrace.lastReceiveAt)),
      sentMessages:socketTrace.sentMessages,sentBytes:socketTrace.sentBytes,sendGapMs:socketTrace.lastSendAt===null?null:Math.max(0,Math.round(now-socketTrace.lastSendAt)),
      receivedMessages:socketTrace.receivedMessages,localCloseSource:socketTrace.localCloseSource};
  }
  function observeCloseRequest(this: PublishedDynamic,source: PublishedDynamic): PublishedDynamic {
    if(stopped||!socketTrace||!['native-network-close','native-receive-timeout','native-entry-timeout','mod-entry-timeout'].includes(source))return false;
    if(socketTrace.localCloseSource===null)socketTrace.localCloseSource=source;
    connectionEvent('client-close-request',{source});
    return true;
  }
  const widgetWrappers: PublishedDynamic = new Map();
  function observeSocket(this: PublishedDynamic,socket: PublishedDynamic): PublishedDynamic {
    if (socket !== connectionSocket) {
      lastSentAngle = null;
      if (socket && reconnect.phase === 'connecting') reconnect.deadline = performance.now() + 12000;
    }
    removeSocketObservers();
    connectionSocket = socket;
    socketTrace=socket?{id:++socketSerial,openedAt:socket.readyState===1?performance.now():null,lastReceiveAt:null,receivedMessages:0,lastSendAt:null,sentMessages:0,sentBytes:0,localCloseSource:null}:null;
    const observedTrace: PublishedDynamic=socketTrace;
    if (typeof socket?.addEventListener !== 'function') return;
    const handlers: PublishedDynamic = {
      open:(): PublishedDynamic => {if(!stopped&&socket===connectionSocket)socketTrace.openedAt=performance.now();},
      message:(): PublishedDynamic => {if(!stopped&&socket===connectionSocket){socketTrace.lastReceiveAt=performance.now();socketTrace.receivedMessages++;}},
      close:(event: PublishedDynamic): PublishedDynamic => { if (!stopped && observedTrace === socketTrace) connectionEvent('socket-close',
        {code:Number.isInteger(event.code) ? event.code : null,clean:event.wasClean === true,localCloseObserved:socketTrace.localCloseSource!==null}); },
      error:(): PublishedDynamic => { if (!stopped && socket === connectionSocket) connectionEvent('socket-error'); }
    };
    for (const [name,handler] of Object.entries(handlers)) socket.addEventListener(name,handler);
    removeSocketObservers = (): PublishedDynamic => {
      for (const [name,handler] of Object.entries(handlers)) socket.removeEventListener?.(name,handler);
    };
  }
  function connectionInfo(this: PublishedDynamic): PublishedDynamic {
    const copyEvent: PublishedDynamic=(event: PublishedDynamic): PublishedDynamic=>({...event,transport:event.transport?{...event.transport}:null,commandsInLast2s:{...event.commandsInLast2s},...(event.pickupRequestsBeforeEnd?{pickupRequestsBeforeEnd:event.pickupRequestsBeforeEnd.map((entry: PublishedDynamic): PublishedDynamic=>({...entry}))}:{})});
    const stored: PublishedDynamic = {};
    for (const key of ['token','tokenId','userId','accountToken']) {
      try { stored[key] = !!localStorage.getItem(key); } catch (_: any) { stored[key] = null; }
    }
    const build: PublishedDynamic=typeof __devastClientBuild==='undefined'?null:{...__devastClientBuild};
    return {schema:3,recoveryVersion:5,auditBuild:'integrity-autoupdate-v1',build,integrityCompatibility:B.integrityPatched?.()===true,
      legacySettingsMigration:{...legacySettingsMigration},
      integrityFlag:typeof B.integrity?.()==='number'?B.integrity():null,state:B.network.state,phase:reconnect.phase,
      sessionEnded:reconnect.sessionEnded,awaitingPlay:reconnect.awaitingPlay,normalJoinRequired:reconnect.freshRequired,automaticRecoveryBlocked:reconnect.autoBlocked,
      nativeReady:typeof B.network[B.loginKey] === 'function',
      nativePending:B.pendingKey ? !!B.network[B.pendingKey] : false,
      adWaiting:!!B.adWaiting?.(),socketState:connectionSocket?.readyState ?? null,
      socketBufferedBytes:Number.isFinite(connectionSocket?.bufferedAmount)?connectionSocket.bufferedAmount:null,
      transport:socketTraffic(),
      nativeWireTraffic:wireTrafficInfo(),pickupRequests:pickupRequestInfo(),
      combatNow:combatCommands(),
      animationTiming:animationTiming(),
      modCommandsByOpcode:{...diagnostics.commandsByOpcode},
      automationSettings:{autoBuild:MOD.AutoBuiledEnabled,fastLoot:MOD.FAutoLootEnabled,slowLoot:MOD.SAutoLootEnabled,autoTake:MOD.AutoTakeEnabled,spamChat:MOD.SpamChatEnabled},
      automationTransport:{deferred:{...automationDeferrals},aimHighWaterBytes:AIM_BUFFER_HIGH_WATER},
      automationLimits:{fastLootIntervalMs:FAST_LOOT_INTERVAL,fastLootBurst:FAST_LOOT_BURST,autoBuildIntervalMs:AUTO_BUILD_INTERVAL},
      modTraffic:trafficInfo(),
      connectionCallbacks:{...callbackTraffic},
      aimTransport:{...aimTransport,nativeSenderAvailable:typeof B.aimSend==='function',sourceTickRateMs:50,deduplicatedDirections:diagnostics.deduplicatedAngles},
      aimSettings:{enabled:MOD.AimBotEnabled,spear:MOD.AimbotSpearEnabled,hidePlayerAngle:MOD.hidePlayerAngle,hideAimbotAngle:MOD.hideAimbotAngle,source:'message27-bby',adaptive:MOD.AdaptiveAimEnabled,jitter:MOD.JitterEnabled,jitterSpeed:MOD.JitterSpeed,strafe:MOD.AntiAimbot,autoFire:MOD.autoFire,target:MOD.target,lockId:MOD.lockId,distanceCoefficient:MOD.distanceCoefficient,offsetCoefficient:MOD.offsetCoefficient},
      lastFailureCode:reconnect.lastFailureCode,serverListRefreshFailures:reconnect.refreshFailures,gatewayRecoveries:reconnect.gatewayRecoveries,initialHomeRecoveries:reconnect.initialHomeRecoveries,
      stored,modErrorCount:diagnostics.errors.length,firstServerDeath:firstServerDeath?copyEvent(firstServerDeath):null,firstConnectionEnd:firstConnectionEnd?copyEvent(firstConnectionEnd):null,events:connectionEvents.map(copyEvent)};
  }
  function releaseNativePending(this: PublishedDynamic): PublishedDynamic {
    if (B.pendingKey) B.network[B.pendingKey] = false;
  }
  function failedServerRefresh(this: PublishedDynamic,status: PublishedDynamic): PublishedDynamic{
    reconnect.pending=false;reconnect.phase='idle';reconnect.next=0;
    reconnect.refreshFailures++;reconnect.status=status;
    if(reconnect.refreshFailures>=3)finishStalledEntry('server-list');
  }
  function finishStalledEntry(this: PublishedDynamic,stage: PublishedDynamic): PublishedDynamic {
    // Releasing the busy flag alone leaves the native connecting screen active.
    // Invalidate outstanding callbacks before returning through the game's UI.
    reconnect.generation++;
    reconnect.pending=false;
    reconnect.phase='idle';
    reconnect.next=0;
    reconnect.armed=false;
    reconnect.autoBlocked=true;
    releaseNativePending();
    B.network.state=0;
    connectionEvent('entry-timeout',{stage});
    if (typeof B.returnToMenu === 'function') {
      try { B.returnToMenu(); } catch (error: any) { report(error); }
    }
    reconnect.status='Сервис входа не ответил; выберите сервер и повторите Play';
  }
  let initialHomeWaitAt: PublishedDynamic=null,initialHomeSeen: PublishedDynamic=false;
  function watchInitialHome(this: PublishedDynamic,now: PublishedDynamic): PublishedDynamic {
    if (initialHomeSeen || typeof B.homeControlsVisible!=='function') return;
    if (B.network.state===1 || B.homeControlsVisible()) {initialHomeSeen=true;return;}
    if (initialHomeWaitAt===null || document.hidden) initialHomeWaitAt=now;
    if (now-initialHomeWaitAt<20000 || document.hidden || reconnect.pending || B.adWaiting?.() || B.network.state!==0 || !B.canShowHome?.()) return;
    initialHomeSeen=true;
    reconnect.initialHomeRecoveries++;
    finishStalledEntry('startup');
  }
  function beginPlay(this: PublishedDynamic): PublishedDynamic {
    if (stopped) return true;
    if (B.network.state === 1 || (B.network.state & 2) !== 0) return false;
    const now: PublishedDynamic=performance.now();
    if (B.adWaiting?.()) return false;
    if (reconnect.pending && ['preparing','joining','refreshing'].includes(reconnect.phase) && now < reconnect.deadline) return false;
    // Play can lock its native busy flag before the network login is called.
    // Recover this earlier stage too; persistent account data is never touched.
    reconnect.generation++;
    reconnect.refreshFailures=0;
    releaseNativePending();
    reconnect.pending=true;
    reconnect.phase='preparing';
    reconnect.deadline=now+12000;
    reconnect.armed=true;
    reconnect.autoBlocked=false;
    reconnect.awaitingPlay=false;
    if (reconnect.sessionEnded) reconnect.freshRequired=true;
    reconnect.status='Preparing game; saved login kept';
    return true;
  }
  function guardPlayCallback(this: PublishedDynamic,callback: PublishedDynamic): PublishedDynamic {
    if (stopped) return callback;
    const generation: PublishedDynamic=reconnect.generation;
    let completed: PublishedDynamic=false;
    return function (this: PublishedDynamic,...args: PublishedDynamic[]): PublishedDynamic {
      if (stopped || completed || generation!==reconnect.generation) return;
      completed=true;
      return callback.apply(this,args);
    };
  }
  function continueAdGate(this: PublishedDynamic,gate: PublishedDynamic): PublishedDynamic {
    if (stopped || gate !== adGate || gate.done || !gate.callback || !B.adWaiting?.()) return;
    reconnect.gatewayRecoveries++;
    reconnect.status = 'Рекламный модуль не ответил; продолжаем вход';
    gate.wrapped.call(gate.widget);
  }
  function watchLoginGateway(this: PublishedDynamic,now: PublishedDynamic): PublishedDynamic {
    const widget: PublishedDynamic = window.Widget;
    if (typeof B.adWaiting === 'function' && widget) for (const method of ['preroll','createAdPlayer']) {
      const entries: PublishedDynamic = widgetWrappers.get(widget) || {};
      if (typeof widget[method] !== 'function' || widget[method] === entries[method]?.wrapped) continue;
      const original: PublishedDynamic = widget[method];
      const wrapped: PublishedDynamic = function (this: PublishedDynamic,...args: PublishedDynamic[]): PublishedDynamic {
        reconnect.phase='advertising';
        const gate: PublishedDynamic = adGate = {widget, done:false, failed:false, deadline:performance.now()+60000};
        // Native code installs Widget.play immediately after preroll returns.
        Promise.resolve().then((): PublishedDynamic => {
          if (stopped || gate !== adGate || !B.adWaiting() || typeof widget.play !== 'function') return;
          gate.callback = widget.play;
          gate.wrapped = function (this: PublishedDynamic,...result: PublishedDynamic[]): PublishedDynamic {
            if (stopped || gate !== adGate || gate.done) return;
            gate.done = true;
            adGate = null;
            return gate.callback.apply(this, result);
          };
          widget.play = gate.wrapped;
          if (gate.failed) continueAdGate(gate);
        });
        let result: PublishedDynamic;
        try { result = original.apply(this,args); }
        catch (_: any) { gate.failed = true; return; }
        if (result && typeof result.then === 'function') Promise.resolve(result).catch((): PublishedDynamic => {
          gate.failed = true;
          continueAdGate(gate);
        });
        return result;
      };
      entries[method] = {original,wrapped};
      widgetWrappers.set(widget,entries);
      widget[method] = wrapped;
    }
    if (adGate && !adGate.done) {
      if (!B.adWaiting?.()) adGate = null;
      else if (document.hidden) adGate.deadline = now + 60000;
      else if (now >= adGate.deadline) continueAdGate(adGate);
      else reconnect.status = 'Ожидание завершения рекламного модуля';
    }
  }
  let automaticJoin: PublishedDynamic = false;
  let nativeLoginDepth: PublishedDynamic = 0;
  function guardHandshakeCallback(this: PublishedDynamic,url: PublishedDynamic, callback: PublishedDynamic): PublishedDynamic {
    if (!nativeLoginDepth || typeof callback !== 'function') return callback;
    const generation: PublishedDynamic = reconnect.generation;
    callbackTraffic.wrapped++;
    // Gate the native HTTP response before it can overwrite the current
    // connection's cryptographic state, not only its final start callback.
    return function (this: PublishedDynamic,...args: PublishedDynamic[]): PublishedDynamic {
      if(stopped){callbackTraffic.rejectedAfterDispose++;return;}
      // Native entry can finish before the next frame retires this generation.
      const connected: PublishedDynamic = (B.network.state & 1) !== 0;
      if(generation!==reconnect.generation || connected){
        callbackTraffic.rejectedStale++;
        if(connected)callbackTraffic.rejectedWhileConnected++;
        return;
      }
      callbackTraffic.accepted++;
      // Native preflight can issue its next HTTP round from this callback.
      // Carry ownership into that round before the original stack returns.
      nativeLoginDepth++;
      try { return callback.apply(this,args); } finally { nativeLoginDepth--; }
    };
  }
  const connectionWrappers: PublishedDynamic = new Map();
  function markRestoreFailure(this: PublishedDynamic): PublishedDynamic {
    reconnect.generation++;
    reconnect.pending = false;
    reconnect.phase = 'idle';
    reconnect.next = 0;
    if (reconnect.freshUsed) {
      reconnect.autoBlocked = true;
      reconnect.status = 'Normal login rejected; retry manually';
      return;
    }
    reconnect.armed = true;
    reconnect.freshRequired = true;
    reconnect.status = 'Saved session ended; normal login will keep account data';
  }
  function prepareNormalJoin(this: PublishedDynamic): PublishedDynamic {
    if (!reconnect.freshRequired) return;
    // The native join payload uses state bit 64 for restoration. A rejected
    // session must make one ordinary join instead, retaining all stored identity.
    B.network.state = 0;
    reconnect.freshRequired = false;
    reconnect.freshUsed = true;
  }
  function watchConnectionHandlers(this: PublishedDynamic): PublishedDynamic {
    const n: PublishedDynamic = B.network;
    for (const [key,kind] of [[B.loginKey,'login'],[B.restoreFailureKey,'restoreFailure'],[B.preflightKey,'preflight'],[B.errorKey,'error']]) {
      if (!key || typeof n[key] !== 'function' || n[key] === connectionWrappers.get(key)) continue;
      const original: PublishedDynamic = n[key];
      originals[key] = original;
      const wrapper: PublishedDynamic = kind === 'preflight' ? function (this: PublishedDynamic,...args: PublishedDynamic[]): PublishedDynamic {
        if (!nativeLoginDepth) return original.apply(this,args);
        for(const index of [1,2])if(typeof args[index]==='function')args[index]=guardHandshakeCallback(args[0],args[index]);
        return original.apply(this,args);
      } : kind === 'error' ? function (this: PublishedDynamic,...args: PublishedDynamic[]): PublishedDynamic {
        if (!stopped) {
          reconnect.lastFailureCode = Number.isInteger(args[0]) ? args[0] : (Number.isInteger(n.state)?n.state:0);
          connectionEvent('native-network-error',{failureCode:reconnect.lastFailureCode});
          reconnect.pending = false;
          reconnect.phase = reconnect.awaitingPlay?'dead':'idle';
          reconnect.generation++;
          releaseNativePending();
          reconnect.status = reconnect.awaitingPlay?'Персонаж погиб; нажмите Play для нового входа с прежним токеном':'Игра не завершила вход; можно повторить без сброса cookies';
          // The native close handler can replace this rejection with restore
          // state 64. Keep the rejection latched until an explicit Play.
          if((reconnect.lastFailureCode&(8|16|512|1024))!==0){
            reconnect.armed=false;
            reconnect.autoBlocked=true;
            reconnect.next=0;
            reconnect.status='Соединение завершено игрой; нажмите Play для входа';
          }
        }
        return original.apply(this,args);
      } : kind === 'restoreFailure' ? function (this: PublishedDynamic,...args: PublishedDynamic[]): PublishedDynamic {
        const result: PublishedDynamic = original.apply(this,args);
        if (!stopped) markRestoreFailure();
        return result;
      } : function (this: PublishedDynamic,...args: PublishedDynamic[]): PublishedDynamic {
        if (stopped) return original.apply(this,args);
        const now: PublishedDynamic = performance.now();
        if (n.state === 1 || (n.state & 2) !== 0 || reconnect.pending && reconnect.phase === 'joining' && now < reconnect.deadline) return;
        if (!automaticJoin) {
          reconnect.generation++;
          reconnect.pending = false;
          reconnect.attempts = 0;
          reconnect.refreshFailures=0;
          reconnect.next = 0;
          reconnect.autoBlocked = false;
          reconnect.freshUsed = false;
          reconnect.armed = true;
        }
        reconnect.awaitingPlay=false;
        if (n.state === 256 || reconnect.sessionEnded) reconnect.freshRequired = true;
        prepareNormalJoin();
        reconnect.pending = true;
        reconnect.phase = 'joining';
        reconnect.deadline = now + 12000;
        reconnect.status = 'Connecting; saved login kept';
        nativeLoginDepth++;
        try { return original.apply(this,args); }
        catch (error: any) {
          reconnect.pending = false;
          reconnect.phase = 'idle';
          reconnect.generation++;
          releaseNativePending();
          reconnect.status = 'Не удалось начать вход; повторите Play без сброса cookies';
          throw error;
        }
        finally { nativeLoginDepth--; }
      };
      connectionWrappers.set(key,wrapper);
      n[key] = wrapper;
    }
  }
  function updateReconnect(this: PublishedDynamic,now: PublishedDynamic): PublishedDynamic {
    const n: PublishedDynamic = B.network;
    watchConnectionHandlers();
    watchLoginGateway(now);
    watchInitialHome(now);
    if (reconnect.awaitingPlay) {
      reconnect.pending=false;
      reconnect.phase='dead';
      reconnect.next=0;
      releaseNativePending();
      if (n.state===64) n.state=0;
      reconnect.status='Персонаж погиб; нажмите Play для нового входа с прежним токеном';
      return;
    }
    if (n.state === 1) {
      reconnect.sessionEnded=false;
      reconnect.awaitingPlay=false;
      reconnect.status = 'Connected';
      reconnect.attempts = 0;
      reconnect.refreshFailures=0;
      reconnect.armed = true;
      reconnect.pending = false;
      reconnect.next = 0;
      reconnect.phase = 'idle';
      reconnect.freshRequired = false;
      reconnect.freshUsed = false;
      reconnect.autoBlocked = false;
      reconnect.generation++;
      return;
    }
    if ((n.state & 2) !== 0) {
      reconnect.armed = true;
      if (reconnect.phase !== 'connecting') reconnect.deadline = now + 12000;
      reconnect.pending = true;
      reconnect.phase = 'connecting';
      if (now >= reconnect.deadline) {
        reconnect.pending = false;
        reconnect.phase = 'idle';
        reconnect.generation++;
        releaseNativePending();
        observeCloseRequest('mod-entry-timeout');
        connectionEvent('connection-timeout');
        const socket: PublishedDynamic = connectionSocket;
        connectionSocket = null;
        if (socket && typeof socket.close === 'function') socket.close();
        // Retain the native restore bit and let the existing bounded retry path
        // obtain a fresh connection. No persistent identity is changed.
        n.state = 64;
        reconnect.status = 'Соединение не завершилось; повторяем с прежним токеном';
      }
      return;
    }
    if (reconnect.pending && reconnect.phase === 'preparing' && n.state === 0) {
      if (document.hidden) reconnect.deadline=now+12000;
      else if (now>=reconnect.deadline) {
        finishStalledEntry('preparing');
      }
    }
    const restoringWithoutSocket: PublishedDynamic = n.state === 64 && !reconnect.sessionEnded &&
      (!connectionSocket || connectionSocket.readyState >= 2);
    if (reconnect.pending && reconnect.phase === 'joining' && (n.state === 0 || restoringWithoutSocket)) {
      if (document.hidden) reconnect.deadline=now+12000;
      else if (now >= reconnect.deadline) finishStalledEntry('joining');
    }
    if (n.state === 256 && !reconnect.freshRequired && !reconnect.autoBlocked) markRestoreFailure();
    if ((n.state & (8|16|512|1024)) !== 0) {
      reconnect.pending = false;
      reconnect.status = 'Login rejected; see the game message';
      return;
    }
    if (reconnect.sessionEnded && (n.state & 64)!==0) reconnect.freshRequired=true;
    const retryable: PublishedDynamic = (n.state & 64) !== 0 || reconnect.freshRequired && (n.state === 0 || n.state === 256);
    if (!retryable || !reconnect.armed || stopped || reconnect.autoBlocked) return;
    if (typeof n.ⲣօᄇ !== 'function' || typeof B.reconnect !== 'function') return;
    if (reconnect.pending) {
      if (now < reconnect.deadline) return;
      reconnect.pending = false;
      reconnect.phase = 'idle';
      reconnect.generation++;
      failedServerRefresh('Refresh timed out');
      return;
    }
    if (reconnect.attempts >= 3 && (reconnect.sessionEnded || !reconnect.freshRequired)) {
      finishStalledEntry('retries');
      return;
    }
    if (!reconnect.next) {
      reconnect.next = now + (reconnect.freshRequired ? 1000 : [1000, 3000, 7000][reconnect.attempts]);
      reconnect.status = 'Retry scheduled; saved login kept';
      return;
    }
    if (now < reconnect.next) return;
    const selected: PublishedDynamic = n.ᴌޅᚉ;
    if (!Array.isArray(selected)) {
      reconnect.status = 'Select a server';
      return;
    }
    const lobby: PublishedDynamic = selected[0], region: PublishedDynamic = selected[4], mode: PublishedDynamic = selected[6], generation: PublishedDynamic = ++reconnect.generation;
    reconnect.pending = true;
    reconnect.phase = 'refreshing';
    reconnect.attempts++;
    reconnect.next = 0;
    reconnect.deadline = now + 12000;
    reconnect.status = 'Refreshing servers / retry ' + reconnect.attempts;
    try {
      n.ⲣօᄇ('https://devast.io/list?reconnect=' + Date.now(), (): PublishedDynamic => {
        if (stopped || generation !== reconnect.generation || !reconnect.pending) return;
        reconnect.pending = false;
        if ((n.state & 64) === 0 && !(reconnect.freshRequired && (n.state === 0 || n.state === 256))) return;
        const current: PublishedDynamic=n.ᴌޅᚉ;
        if (!Array.isArray(current) || current[0]!==lobby || current[4]!==region || current[6]!==mode) {
          reconnect.armed = false;
          reconnect.status = 'Server selection changed';return;
        }
        const row: PublishedDynamic = n.ᅠᄀ︅?.find((r: PublishedDynamic): PublishedDynamic => r[0] === lobby && r[4] === region && r[6] === mode);
        if (!row) {
          failedServerRefresh('Selected server unavailable');
          return;
        }
        reconnect.refreshFailures=0;
        n.ᴌޅᚉ = row;
        reconnect.status = 'Connecting / retry ' + reconnect.attempts;
        try {
          prepareNormalJoin();
          automaticJoin = true;
          try { B.reconnect(); } finally { automaticJoin = false; }
          if (!reconnect.autoBlocked && !reconnect.freshRequired) {
            reconnect.pending = true;
            reconnect.phase = 'joining';
            reconnect.deadline = performance.now() + 12000;
          }
        } catch (_: any) {
          reconnect.status = 'Retry could not start';
        }
      });
    } catch (_: any) {
      failedServerRefresh('Server refresh failed');
    }
  }
  watchConnectionHandlers();
  function step(this: PublishedDynamic,now: PublishedDynamic = performance.now()): PublishedDynamic {
    if (stopped) return;
    diagnostics.frames++;
    updateReconnect(now);
    if (!playing()) {
      lastSentAngle = null;
      Aimbot.mouseDown = false;
      if (previousPlayer) {
        previousPlayer = 0;
        records.length = 0;
        playerRecords.length = 0;
        _players_list.length = 0;
      }
      chatState.status = MOD.SpamChatEnabled ? 'Waiting for game' : 'Off';
      draw();
      return;
    }
    if (previousPlayer !== B.world.ѕ‌０.id) {
      lastSentAngle = null;
      previousPlayer = B.world.ѕ‌０.id;
      lastLoot = lastTake = now;
      lastChat = nextChatAt = -Infinity;
      lastKeepAlive = now;
    }
    if (!B.synchronizedRender) {
      autoBuildFrame(now);
      records = collect();
      updateTargets();
      updateMouse();
    }
    updateJitter(now);
    automate(now);
    if (!B.synchronizedRender) draw();
  }
  function tick(this: PublishedDynamic,now: PublishedDynamic): PublishedDynamic {
    if (stopped) return;
    if (document.hidden) previousAnimationFrame=null;
    else if (Number.isFinite(now)) {
      if (previousAnimationFrame!==null && now>previousAnimationFrame) {
        frameGaps[frameGapIndex]=now-previousAnimationFrame;
        frameGapIndex=(frameGapIndex+1)%frameGaps.length;
        frameGapCount=Math.min(frameGapCount+1,frameGaps.length);
      }
      previousAnimationFrame=now;
    }
    if (now - lastStep >= 16) {
      lastStep = now;
      try {
        step(now);
      } catch (e: any) {
        report(e);
      }
    }
    nextFrame = window.requestAnimationFrame(tick);
  }
  // Native direction functions keep updating their timing/angle bookkeeping;
  // reviewed native patches suppress only their send, exactly as ILM does.
  function keyboard(this: PublishedDynamic,e: PublishedDynamic): PublishedDynamic {
    if(aimModule.waitingForKey){e.preventDefault?.();return;}
    if (waitingKey) {
      e.preventDefault();
      e.stopImmediatePropagation();
      try { setSetting(waitingKey,e.code); } catch (error: any) { report(error); return; }
      waitingKey = null;
      persist();
      menu?.updateDisplay();
      return;
    }
    const t: PublishedDynamic = e.target;
    if (e.repeat || t && (t.isContentEditable || (/^(INPUT|TEXTAREA|SELECT)$/).test(t.tagName)) || B.chatActive && B.chatActive()) return;
    const bindings: PublishedDynamic = {
      AimbotKey:'AimBotEnabled',
      AntiAimbotKey:'AntiAimbot',
      JitterKey:'JitterEnabled',
      HideAngleKey:'hideAimbotAngle',
      AutoBuiledKey: 'AutoBuiledEnabled',
      SAutoLootKey: 'SAutoLootEnabled',
      FAutoLootKey: 'FAutoLootEnabled',
      AutoTakeKey: 'AutoTakeEnabled',
      XrayKey: 'XrayBuildings',
      PlayersListKey: 'PlayersListEnabled',
    };
    if (e.code === MOD.ModMenuKey) {
      if (menu) menu.domElement.style.display = menu.domElement.style.display === 'none' ? '' : 'none';
      return;
    }
    for (const [key, setting] of Object.entries<string>(bindings)) if (e.code === MOD[key]) {
      setSetting(setting, !MOD[setting]);
      break;
    }
  }
  listen(window, 'keydown', keyboard, true);
  listen(window, 'mousemove', (e: PublishedDynamic): PublishedDynamic => {
    mouse={x:e.clientX,y:e.clientY};
    GetAllTargets.mousePosition.x=e.clientX;GetAllTargets.mousePosition.y=e.clientY;
  }, true);
  listen(window, 'mousedown', (e: PublishedDynamic): PublishedDynamic => {
    if (e.target?.closest?.('.dg')) return;
    if (playerListPanel && e.composedPath?.().includes(playerListPanel)) return;
    if(e.button===2){
      const target: PublishedDynamic=e.target;
      if(target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target?.tagName) || target?.closest?.('input,textarea,select,button,a,[contenteditable]'))return;
      const bounds: PublishedDynamic=document.getElementById('can')?.getBoundingClientRect();
      if(!bounds || e.clientX<bounds.left || e.clientY<bounds.top || e.clientX>=bounds.left+bounds.width || e.clientY>=bounds.top+bounds.height)return;
    }
    mouse = {
      x: e.clientX,
      y: e.clientY
    };

    if (e.button === 2 && openUnderMouse()) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
  listen(window, 'mouseup', (e: PublishedDynamic): PublishedDynamic => {
    if (e.button === 0) Aimbot.mouseDown = false;
  }, true);
  listen(window, 'blur', (): PublishedDynamic => {
    Aimbot.mouseDown = false;
  });
  const canvas: PublishedDynamic = document.getElementById('can');
  if (canvas) {
    listen(canvas, 'contextmenu', (e: PublishedDynamic): PublishedDynamic => {
      if ((MOD.RightClickDoors||MOD.OpenEverythingByClick) && playing()) e.preventDefault();
    });
    listen(canvas, 'wheel', (e: PublishedDynamic): PublishedDynamic => {
      if (!playing()) return;
      if (e.ctrlKey || !Number.isFinite(e.deltaY) || e.deltaY === 0) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const delta: PublishedDynamic = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? canvas.getBoundingClientRect().height : 1);
      setSetting('zoomFactor',Math.max(.33, Math.min(2, MOD.zoomFactor * Math.exp(-Math.max(-100, Math.min(100, delta)) * .001))));
      zoomControl?.updateDisplay();
    }, {
      capture: true,
      passive: false
    });
  }
  function createMenu(this: PublishedDynamic): PublishedDynamic {
    if (stopped || menu) return;
    if (!window.dat || !window.dat.GUI) throw new Error('dat.GUI did not load');
    menu = new window.dat.GUI({
      width: 310
    });
    window.removeEventListener('keydown', window.dat.GUI._keydownHandler, false);
    const style: PublishedDynamic = document.createElement('style');
    style.textContent = '.dg.main{position:fixed!important;top:10px!important;right:10px!important;max-height:92vh;overflow:auto;z-index:2147483647!important;background:#190707!important;border:1px solid #a22;border-radius:6px}.dg .title{color:#ffaaaa}.dg .slider-fg{background:#a22!important}.dg .cr{background:#190d0d}';
    document.head.appendChild(style);
    removers.push((): PublishedDynamic => style.remove());
    // dat.GUI ends numeric drags with window-level mouseup/touchend handlers.
    // Let move and release events reach those handlers, even inside the menu.
    for (const event of ['mousedown', "click", 'dblclick', 'wheel', 'touchstart']) listen(menu.domElement, event, (e: PublishedDynamic): PublishedDynamic => e.stopPropagation());
    function add(this: PublishedDynamic,folder: PublishedDynamic, key: PublishedDynamic, label?: PublishedDynamic, ...range: PublishedDynamic[]): PublishedDynamic {
      const c: PublishedDynamic = folder.add(MOD, key, ...range).name(label || key);
      c.onChange((v: PublishedDynamic): PublishedDynamic => setSetting(key, v));
      return c;
    }
    const visual: PublishedDynamic = menu.addFolder('Visuals');
    for (const key of ['ShowPosition', 'ShowNamesOnMap', 'ShowMines', 'ShowWires', 'ShowPlayerHitbox', 'KarmaAboveHead', 'ShowBuildingOwner', 'XrayBuildings', 'PlayersListEnabled', 'showFunctionList']) add(visual, key);
    add(visual, 'Xraytransparency', 'Building opacity', .05, 1, .05);
    for (const [key,label] of [['TeamClanColor','Цвет своего клана'],['EnemyClanColor','Цвет чужого клана'],['NicknameColor','Цвет ника']]) visual.addColor(MOD, key).name(label).onChange((value: PublishedDynamic): PublishedDynamic=>setSetting(key,value));
    const aimControls: PublishedDynamic=aimModule.installMenu(menu).controllers;
    const adaptiveMenu: PublishedDynamic=menu.addFolder('Adaptive Aim');
    add(adaptiveMenu,'AdaptiveAimEnabled','Расчёт перехвата');
    add(adaptiveMenu,'predictionAutoSpeed','Скорость из игры и пуль');
    add(adaptiveMenu,'bulletSpeedCoefficient','Резервная скорость, ед/мс',.1,20,.05);
    add(adaptiveMenu,'predictionLatencyMs','Компенсация задержки, мс',0,500,5);
    const jitterMenu: PublishedDynamic=menu.addFolder('Jitter');
    add(jitterMenu,'JitterEnabled','Enabled');
    add(jitterMenu,'JitterSpeed','Speed (degrees/sec)',1,3600,1);
    for (const control of aimControls) control.onChange((value: PublishedDynamic): PublishedDynamic=>{const range: PublishedDynamic=limits[control.property];if(typeof value==='number'&&range)value=Math.max(range[0],Math.min(range[1],value));setSetting(control.property,value);});
    for(const control of aimControls){
      if(typeof defaults[control.property]!=='number')continue;
      const input: PublishedDynamic=control.domElement.querySelector('input');if(!input)continue;
      input.dataset.aimNumericCommit='immediate-v1';
      listen(input,'input',(): PublishedDynamic=>{
        const before: PublishedDynamic=input.value,raw: PublishedDynamic=before.includes(',')&&!before.includes('.')?before.replace(',','.'):before;
        const start: PublishedDynamic=input.selectionStart,end: PublishedDynamic=input.selectionEnd;
        if(raw!==before)input.value=raw;
        if(!raw.trim()||!Number.isFinite(Number(raw)))return;
        control.setValue(Number(raw));
        if(document.activeElement===input){input.value=raw;if(start!==null&&end!==null)input.setSelectionRange(start,end);}
      });
    }
    const zoom: PublishedDynamic = menu.addFolder('Zoom');
    zoomControl = add(zoom, 'zoomFactor', 'View scale', .33, 2, .01);
    zoom.add({
      Reset: (): PublishedDynamic => setSetting('zoomFactor', 1)
    }, 'Reset');
    const automation: PublishedDynamic = menu.addFolder('Automation');
    add(automation,'RightClickDoors','ПКМ: двери');
    for (const key of ['SAutoLootEnabled', 'FAutoLootEnabled', 'LootDataEnabled', 'AutoTakeEnabled', 'AntiKickEnabled', 'OpenEverythingByClick']) add(automation, key);
    add(automation,'AutoBuiledEnabled','AutoBuild').domElement.title = 'Ставит выбранный блок в допустимую клетку предпросмотра под курсором.';
    const filter: PublishedDynamic = automation.addFolder('Loot filter');
    for (const [name, item] of Object.entries(LootData)) filter.add(item, 'acquire').name(name).onChange(persist);
    const keys: PublishedDynamic = menu.__folders.Keyboard || menu.addFolder('Keyboard');
    for (const key of ['AutoBuiledKey', 'SAutoLootKey', 'FAutoLootKey', 'AutoTakeKey', 'XrayKey', 'PlayersListKey']) {
      const c: PublishedDynamic = keys.add(MOD, key), input: PublishedDynamic = c.domElement.querySelector('input');
      input.readOnly = true;
      listen(input, "click", (): PublishedDynamic => {
        waitingKey = key;
        input.blur();
        input.value = 'Press a key';
      });
    }
    const players: PublishedDynamic = menu.addFolder('Players');
    add(players, 'PlayerId', 'Player ID');
    players.add({
      CopyNick: (): PublishedDynamic => copyNickname(Number(MOD.PlayerId))
    }, 'CopyNick').name('Copy nickname');
    players.add({
      CopyAll: (): PublishedDynamic => copyText([...new Set(records.filter((r: PublishedDynamic): PublishedDynamic=>r.type===B.categories.player).map((r: PublishedDynamic): PublishedDynamic=>r.e.ᴉ̊︉))].map(nickname).filter(Boolean).join('\n'))
    }, 'CopyAll').name('Copy all nicknames');
    players.add(clipboardState,'status').name('Copy status').listen().domElement.querySelector('input').readOnly=true;
    const token: PublishedDynamic = menu.addFolder('Token changer');
    token.add(MOD, 'Token').name('Token');
    token.add({
      Copy: (): PublishedDynamic => copyText(['token', 'tokenId', 'userId'].map((k: PublishedDynamic): PublishedDynamic => JSON.stringify(localStorage.getItem(k) || '')).join(' '))
    }, 'Copy');
    const tokenStatus: PublishedDynamic = {
      status: 'Changes apply on next connection'
    };
    token.add({
      Change: (): PublishedDynamic => {
        let parsed: PublishedDynamic;
        try {
          const raw: PublishedDynamic = String(MOD.Token).trim();
          let i: PublishedDynamic = 0;
          parsed = [];
          while (i < raw.length) {
            if (raw.charCodeAt(i) !== 34) throw Error();
            const start: PublishedDynamic = i++;
            for (; i < raw.length; i++) {
              if (raw.charCodeAt(i) === 92) {
                i++;
                continue;
              }
              if (raw.charCodeAt(i) === 34) {
                i++;
                break;
              }
            }
            parsed.push(JSON.parse(raw.slice(start, i)));
            if (i < raw.length && raw[i].trim() !== '') throw Error();
            while (i < raw.length && raw[i].trim() === '') i++;
          }
          if (parsed.length !== 3 || parsed.some((x: PublishedDynamic): PublishedDynamic => typeof x !== 'string' || !x.trim())) throw Error();
        } catch (_: any) {
          tokenStatus.status = 'Invalid input; nothing changed';
          alert('Expected exactly three nonempty quoted strings: token tokenId userId');
          return;
        }
        const keys: PublishedDynamic = ['token', 'tokenId', 'userId'];
        let previous: PublishedDynamic;
        try {
          previous = keys.map((k: PublishedDynamic): PublishedDynamic => localStorage.getItem(k));
          keys.forEach((k: PublishedDynamic, i: PublishedDynamic): PublishedDynamic => localStorage.setItem(k, parsed[i]));
        } catch (_: any) {
          if (previous) keys.forEach((k: PublishedDynamic, i: PublishedDynamic): PublishedDynamic => {
            try {
              previous[i] === null ? localStorage.removeItem(k) : localStorage.setItem(k, previous[i]);
            } catch (_: any) {}
          });
          tokenStatus.status = 'Storage error; update not confirmed';
          alert('Could not save token fields');
          return;
        }
        MOD.Token = '';
        tokenStatus.status = 'Saved all 3 fields; reconnect to apply';
        menu.updateDisplay();
      }
    }, 'Change');
    const tokenInfo: PublishedDynamic = token.add(tokenStatus, 'status').name('Status').listen();
    tokenInfo.domElement.querySelector('input').readOnly = true;
    const chat: PublishedDynamic = menu.addFolder('Chat');
    add(chat, 'SpamChatText', 'Text');
    add(chat, 'SpamChatEnabled', 'Repeat message');
    const chatStatus: PublishedDynamic = chat.add(chatState, 'status').name('Status').listen();
    chatStatus.domElement.querySelector('input').readOnly = true;
    const connection: PublishedDynamic = menu.addFolder('Connection');
    const connectionStatus: PublishedDynamic = connection.add(reconnect, 'status').name('Status').listen();
    connectionStatus.domElement.querySelector('input').readOnly = true;
    connection.add({CopyReport:(): PublishedDynamic=>copyText(JSON.stringify(connectionInfo(),null,2))},'CopyReport').name('Копировать отчёт входа');
    const config: PublishedDynamic = menu.addFolder('Config');
    config.add({
      Save: persist
    }, 'Save');
    config.add({
      Reset: (): PublishedDynamic => {
        Object.assign(MOD, defaults);
        for (const item of lootItems) LootData[item.name].acquire = item.acquire;
        persist();
        menu.updateDisplay();
      }
    }, 'Reset');
  }
  if (document.readyState === 'loading') listen(window, 'DOMContentLoaded', (): PublishedDynamic => {
    try {
      createMenu();
    } catch (e: any) {
      report(e);
    }
  }); else createMenu();
  aimModule.start();
  nextFrame = window.requestAnimationFrame(tick);
  return {
    settings: MOD,
    observeWireSend,
    beforeFire,
    afterFire:(): PublishedDynamic=>aimModule.afterFire(),
    afterRelease:(): PublishedDynamic=>{aimModule.afterRelease();jitter.fireUntil=performance.now()+150;},
    onMove:(move: PublishedDynamic): PublishedDynamic=>aimModule.onMove(move),
    onHandshake:(): PublishedDynamic=>{lastSentAngle=null;stopJitter();jitter.fireUntil=-Infinity;aimModule.onHandshake();},
    onSessionStart:resetAimForSession,
    nativePacketAngle:(angle: PublishedDynamic): PublishedDynamic=>playing()&&!Aimbot.dead&&!(jitterAiming()&&invalidAimState())?Aimbot.packetAngle(angle):angle,
    // Compatibility property: the source replaces the primary angle argument
    // through packetAngle and retains native direction clocks and sends.
    get controlsAimDirection(): PublishedDynamic {return playing()&&!Aimbot.dead&&!reconnect.sessionEnded&&(MOD.JitterEnabled&&!jitterAiming()||gunAimActive()&&!invalidAimState());},
    get jitterAngle(): PublishedDynamic { return playing()&&!Aimbot.dead&&jitter.spinning&&MOD.ShowRealAngles!=='never'?jitter.angle*Math.PI/180:null; },
    jitterTick:(): PublishedDynamic=>updateJitter(performance.now(),true),
    get aimRenderAngle(): PublishedDynamic { return null; },
    targets: GetAllTargets,
    trackPacket,
    aim: Aimbot,
    aimModule,
    loot: LootData,
    diagnostics,
    chat: chatState,
    clipboard: clipboardState,
    copyNickname,
    reconnect,
    observeSocket,
    observeCloseRequest,
    observeDeath,
    highlightMine,
    beginPlay,
    guardPlayCallback,
    guardHandshakeCallback,
    connectionInfo,
    step,
    setSetting,
    openUnderMouse,
    get doorInteraction(): PublishedDynamic{updateDoorInteraction();return {...doorInteraction,pending:!!pendingDoor};},
    clanColor,
    prepareClanTag,
    playerLabel,
    preparePlayerLabel,
    observePlayerSpawn,
    observePlayerLeave,
    zoomOffset,
    render(this: PublishedDynamic,now: PublishedDynamic = performance.now()): PublishedDynamic {
      if (stopped) return;
      try {
        if (B.synchronizedRender && playing()) {
          autoBuildFrame(now);
          records = collect();
          updateTargets();
          updateMouse();
        }
        scanFastLoot(now);
        draw();
      } catch (e: any) {
        report(e);
      }
    },
    get records(): PublishedDynamic {
      return records;
    },
    get menu(): PublishedDynamic {
      return menu;
    },
    get playerList(): PublishedDynamic { return playerListPanel; },
    get overlay(): PublishedDynamic {
      return overlay;
    },
    get functionList(): PublishedDynamic {
      return functionList;
    },
    dispose(this: PublishedDynamic): PublishedDynamic {
      aimModule.dispose();

      MOD.zoomFactor = 1;
      MOD.AimBotEnabled = false;
      MOD.XrayBuildings = false;
      MOD.ShowMines = false;
      MOD.ShowWires = false;
      stopped = true;
      removeSocketObservers();
      adGate = null;
      for (const [widget,entries] of widgetWrappers) for (const [method,entry] of Object.entries<PublishedDynamic>(entries)) if (widget[method] === entry.wrapped) widget[method] = entry.original;
      window.cancelAnimationFrame(nextFrame);
      removers.forEach((f: PublishedDynamic): PublishedDynamic => f());
      if (menu) menu.destroy();
      if (overlayHost) overlayHost.remove();
      Object.assign(B.network, originals);
    }
  };
}