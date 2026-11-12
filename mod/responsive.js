function __installDevastMod(B) {
  for (const key of ['ᴎᚂρ','ѕ᠋༢','ρ٨٨']) if(typeof B.network?.[key] !== 'function') throw new Error('Missing native network handler: '+key);
  const ᅟࠅ８ = B.world;
  const рᄇ͡ = B.network;
  function calculateDistance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  class HackCon {
    constructor() {
      this.SAutoLootEnabled = false;
      this.FAutoLootEnabled = false;
      this.LootDataEnabled = false;
      this.AutoTakeEnabled = false;
      this.AutoBuiledEnabled = false;
      this.AntiKickEnabled = false;
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
  const MOD = new HackCon();
  Object.assign(MOD, {zoomFactor:1, showFunctionList:true},__ilmAimDefaults());
  const aimKeys=Object.keys(__ilmAimDefaults());
  const AIM_SAVE='DevastMessage27:aim:v1';
  const aimDefaults=Object.fromEntries(aimKeys.map(key=>[key,MOD[key]]));
  const defaults = JSON.parse(JSON.stringify(MOD));
  const SAVE = 'DevastILM:settings:v3', LEGACY_SAVE = 'BestModMenuConfig';
  const transient = new Set(['Token', 'token', 'tokenId', 'userId']);
  const keySettings = ['AimbotKey','AutoBuiledKey','SAutoLootKey','FAutoLootKey','AutoTakeKey','XrayKey','PlayersListKey','ModMenuKey','AntiAimbotKey','JitterKey','HideAngleKey'];
  const limits = {zoomFactor:[.33,2],Xraytransparency:[.05,1],...__ilmAimConstraints().limits};
  const choices = __ilmAimConstraints().choices;
  function validateSetting(key,value) {
    if (!Object.prototype.hasOwnProperty.call(defaults,key) || typeof value !== typeof defaults[key]) throw new Error('Invalid setting: '+key);
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Invalid numeric setting');
    if (limits[key] && (value < limits[key][0] || value > limits[key][1])) throw new Error('Setting out of range: '+key);
    if (key === 'lockId' && !Number.isInteger(value)) throw new Error('Player ID must be an integer');
    if (choices[key] && !choices[key].includes(value)) throw new Error('Invalid choice: '+key);
    if (keySettings.includes(key) && value!=='NoKey' && !/^(Key[A-Z]|Digit[0-9]|F(?:[1-9]|1[0-2])|Space|Escape|Tab|Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash|Arrow(?:Up|Down|Left|Right)|(?:Shift|Control|Alt|Meta)(?:Left|Right)|Enter|Backspace|Delete|Insert|Home|End|PageUp|PageDown|Numpad\w+)$/.test(value)) throw new Error('Invalid key code');
    return value;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE) || localStorage.getItem(LEGACY_SAVE) || '{}');
    for (const key of Object.keys(defaults)) {
      if (!transient.has(key) && Object.prototype.hasOwnProperty.call(saved,key)) {
        try { MOD[key] = validateSetting(key,saved[key]); } catch (_) {}
      }
    }
  } catch (_) {}
  Object.assign(MOD,aimDefaults);
  try{const saved=JSON.parse(localStorage.getItem(AIM_SAVE)||'{}');for(const key of aimKeys)if(Object.hasOwn(saved,key)){try{MOD[key]=validateSetting(key,saved[key]);}catch(_){}}}catch(_){}
  const usedKeys = new Set();
  for (const key of keySettings) {
    if(MOD[key]==='NoKey')continue;
    if (usedKeys.has(MOD[key])) MOD[key] = defaults[key];
    if (usedKeys.has(MOD[key])) MOD[key] = keySettings.map(k=>defaults[k]).find(code=>!usedKeys.has(code));
    usedKeys.add(MOD[key]);
  }
  if (MOD.SAutoLootEnabled) MOD.FAutoLootEnabled = false;
  const lootItems = [{
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
  const LootData = Object.fromEntries(lootItems.map(item => [item.name, {
    acquire: item.acquire,
    id: item.id
  }]));
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE + ':loot') || localStorage.getItem(LEGACY_SAVE + ':loot') || '{}');
    for (const key of Object.keys(LootData)) if (typeof saved[key] === 'boolean') LootData[key].acquire = saved[key];
  } catch (_) {}
  const allowedLootIds = new Set();
  function refreshLootFilter() {
    allowedLootIds.clear();
    for (const item of Object.values(LootData)) if(item.acquire) allowedLootIds.add(item.id);
  }
  refreshLootFilter();
  let aimCycleDepth=0,aimCycleWritable=false;
  const aimTransport={cycles:0,blockedCycles:0,nativeYields:0,invalidCycles:0,lastInvalidReason:null};
  const aimModule=__createIlmAdapter(MOD,{
    window,document,selfId:()=>B.world.ᅠᏧ‍?.id||0,selfPosition:()=>B.world.ᅠᏧ‍||{x:-1,y:-1},
    playerInfo:id=>({exists:!!playerMeta(id),team:playerMeta(id)?.а༤̘??-1,membership:playerMeta(id)?.ᴌ̗ⲟ}),
    clanInfo:id=>({exists:!!B.world.ﾠࡅ‍[id],membership:B.world.ﾠࡅ‍[id]?.ոᚄރ}),persist,setKey:(key,value)=>setSetting(key,value),
    beginCycle:()=>{if(aimCycleDepth++===0){aimCycleWritable=playing()&&!reconnect.sessionEnded&&automationReady('aim');if(aimCycleWritable)aimTransport.cycles++;else aimTransport.blockedCycles++;}},
    endCycle:()=>{if(--aimCycleDepth===0)aimCycleWritable=false;},
    send:(packet,source)=>{
      if(!aimCycleWritable||!playing()||reconnect.sessionEnded||connectionSocket&&connectionSocket.readyState!==1)return false;
      // The source calculates first. Reject its whole automatic cycle when
      // that calculation used a missing player or a removed/own target.
      if([4,5,6].includes(packet[0])){const reason=source?.kind==='jitter'?invalidAimState(true):invalidAimState();if(reason){aimCycleWritable=false;aimTransport.invalidCycles++;aimTransport.lastInvalidReason=reason;return false;}}
      return __send(packet,true,true);
    }
  });
  const GetAllTargets=aimModule.targets,Aimbot=aimModule.aim;
  const _players_list = [];
  const removers = [];
  const originalSender = B.network.ᴎᚂρ.bind(B.network);
  const originals = {};
  const diagnostics = {
    frames: 0,
    errors: [],
    commands: 0,
    deduplicatedAngles: 0,
    commandsByOpcode:Object.create(null)
  };
  const frameGaps=new Array(120);
  let frameGapIndex=0,frameGapCount=0,previousAnimationFrame=null;
  function animationTiming() {
    const gaps=frameGaps.slice(0,frameGapCount).sort((a,b)=>a-b);
    const mean=gaps.length?gaps.reduce((sum,gap)=>sum+gap,0)/gaps.length:0;
    return {samples:gaps.length,meanGapMs:Math.round(mean*100)/100,p95GapMs:gaps.length?Math.round(gaps[Math.floor((gaps.length-1)*.95)]*100)/100:null,fpsEstimate:mean>0?Math.round(1000/mean):null,hidden:!!document.hidden};
  }
  const recentCombatCommands = [], connectionEvents = [];
  const trafficKeys=['AimBotEnabled','autoFire','FAutoLootEnabled','SAutoLootEnabled','AutoBuiledEnabled','AutoTakeEnabled','SpamChatEnabled','AntiKickEnabled'];
  const trafficSettings=Object.fromEntries(trafficKeys.map(key=>[key,MOD[key]]));
  const trafficChanges=[{at:Math.round(performance.now()),settings:{...trafficSettings}}],trafficSeconds=[];
  let trafficPeak=null,trafficDiscardedChanges=0;
  function trimTraffic(now) {
    while(trafficSeconds.length&&(trafficSeconds.length>1800||now-trafficSeconds[0].at>=1800000))trafficSeconds.shift();
  }
  function recordTraffic(op) {
    const now=performance.now(),at=Math.floor(now/1000)*1000,socket=socketTrace?.id??null;
    let bucket=trafficSeconds[trafficSeconds.length-1];
    if(!bucket||bucket.at!==at||bucket.socket!==socket){bucket={at,socket,commands:0,byOpcode:{}};trafficSeconds.push(bucket);}
    bucket.commands++;bucket.byOpcode[op]=(bucket.byOpcode[op]||0)+1;
    if(!trafficPeak||bucket.commands>trafficPeak.commands)trafficPeak=bucket;
    trimTraffic(now);
  }
  function recordCommand(op) {
    diagnostics.commands++;
    diagnostics.commandsByOpcode[op]=(diagnostics.commandsByOpcode[op]||0)+1;
    recordTraffic(op);
  }
  function trafficInfo() {
    trimTraffic(performance.now());
    const copy=b=>b?{...b,byOpcode:{...b.byOpcode}}:null;
    return {scope:'mod-generated-commands-only',retentionMs:1800000,maxSeconds:1800,
      seconds:trafficSeconds.map(copy),lifetimePeak:copy(trafficPeak),
      settingsChanges:trafficChanges.map(e=>({...e,settings:{...e.settings}})),discardedSettingsChanges:trafficDiscardedChanges};
  }
  const automationDeferrals={aim:0,loot:0,build:0,take:0,chat:0,keepAlive:0};
  const AIM_BUFFER_HIGH_WATER=4096;
  function automationReady(kind) {
    if(!connectionSocket)return true;
    if(connectionSocket.readyState===1){
      const bytes=connectionSocket.bufferedAmount;
      // Native traffic and earlier source directions can remain buffered for
      // a turn of the event loop. They must not freeze fresh aim directions.
      if(!(kind==='aim'?bytes>=AIM_BUFFER_HIGH_WATER:bytes>0))return true;
    }
    automationDeferrals[kind]++;
    return false;
  }
  function combatCommands(now = performance.now()) {
    while (recentCombatCommands.length && now - recentCombatCommands[0].at > 2000) recentCombatCommands.shift();
    const counts = {angle:0,attack:0,release:0};
    for (const {op} of recentCombatCommands) counts[op === 6 ? 'angle' : op === 4 ? 'attack' : 'release']++;
    return counts;
  }
  function connectionEvent(type, details = {}) {
    const now=performance.now();
    const health = B.health?.();
    connectionEvents.push({type,at:Math.round(now),state:B.network.state,
      integrityFlag:typeof B.integrity?.()==='number'?B.integrity():null,
      aim:MOD.AimBotEnabled,autoFire:MOD.autoFire,
      autoBuild:MOD.AutoBuiledEnabled,fastLoot:MOD.FAutoLootEnabled,slowLoot:MOD.SAutoLootEnabled,autoTake:MOD.AutoTakeEnabled,spamChat:MOD.SpamChatEnabled,
      socketState:connectionSocket?.readyState??null,socketBufferedBytes:Number.isFinite(connectionSocket?.bufferedAmount)?connectionSocket.bufferedAmount:null,
      transport:socketTraffic(now),pageHidden:!!document.hidden,
      frameGapMs:previousAnimationFrame===null?null:Math.max(0,Math.round(now-previousAnimationFrame)),
      health:Number.isFinite(health) ? health : null,commandsInLast2s:combatCommands(),...details});
    if (connectionEvents.length > 12) connectionEvents.shift();
  }
  function observeDeath(packet) {
    if (stopped) return;
    const details = {};
    // Only the reviewed three-byte death prefix is safe to include. Never log
    // arbitrary server packets, login payloads or an unbounded response body.
    if (ArrayBuffer.isView(packet) && packet.BYTES_PER_ELEMENT === 1 && packet.length >= 3 && packet[0] === 5) {
      details.deathOpcode = 5;
      details.deathPacketLength = packet.byteLength;
      details.deathPrefixHex = Array.from(packet.subarray(0,3),value=>value.toString(16).padStart(2,'0')).join(' ');
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
  let nativeDraw=false;
  let overlay, overlayHost, ctx, menu, functionList, zoomControl, nextFrame, stopped = false, waitingKey = null;
  let playerListPanel, playerListBody, playerListCount, playerListOrder = '';
  const playerListRows = new Map(), departedPlayers = new Map();
  let lastStep = -Infinity, lastLoot = -Infinity;
  const FAST_LOOT_INTERVAL=25,FAST_LOOT_BURST=8,AUTO_BUILD_INTERVAL=50;
  let lastFastLoot=-Infinity,fastLootCursor=0;
  let lastAutoBuild=-Infinity;
  let lastTake = -Infinity, lastKeepAlive = -Infinity, lastChat = -Infinity, nextChatAt = -Infinity;
  const chatState = {
    status: 'Off',
    sent: 0
  };
  const clipboardState = {status:'Ready'};
  async function copyText(value) {
    try {
      if(typeof navigator.clipboard?.writeText !== 'function') throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);clipboardState.status='Copied';return true;
    } catch (_) {clipboardState.status='Clipboard access denied or unavailable';return false;}
  }
  async function copyNickname(id) {
    if(!Number.isInteger(id) || !playerMeta(id)) {clipboardState.status='Player not found';return false;}
    const name=nickname(id);
    if(!name) {clipboardState.status='Player has no nickname';return false;}
    return copyText(name);
  }
  let previousPlayer = 0, records = [], mouse = null;
  const collectedRecords=records, playerRecords=[], entityRecords=new WeakMap();
  const functionRows = new Map();
  // Column order matches the compact status list in the supplied screenshot.
  const functionLabels = [
    ['SAutoLootEnabled', 'SAutoLoot'],
    ['AimBotEnabled', 'AimBot'],
    ['AutoBuiledEnabled', 'AutoBuild'],
    ['AntiKickEnabled', 'AntiKick'],
    ['FAutoLootEnabled', 'FAutoLoot'],
    ['XrayBuildings', 'Xray'],
    ['AutoTakeEnabled', 'AutoTake']
  ];
  const playerLabelCache = new WeakMap();
  function listen(target, event, callback, options) {
    target.addEventListener(event, callback, options);
    removers.push(() => target.removeEventListener(event, callback, options));
  }
  function playing() {
    return !stopped && B.network.state === 1 && B.world.ᅠᏧ‍ && B.world.ᅠᏧ‍.id > 0;
  }
  function invalidAimState(rotationOnly=false) {
    if(!playing()||reconnect.sessionEnded||Aimbot.dead)return 'session-inactive';
    const id=B.world.ᅠᏧ‍.id,own=GetAllTargets.players[id],target=Aimbot.targetPlayer;
    if(!own?.active||!Number.isFinite(own.x)||!Number.isFinite(own.y))return 'self-position-missing';
    if(rotationOnly)return null;
    if(!target?.active||!Number.isFinite(target.x)||!Number.isFinite(target.y))return 'target-missing';
    if(GetAllTargets.players[target.id]===target&&target.id===id)return 'self-target';
    return null;
  }
  function resetAimForSession() {
    lastSentAngle=null;
    Aimbot.onDeath();
    Aimbot.targetPlayer=null;
    // A new handshake can finish before the source's next 50 ms id=0 tick.
    // Clear both entity histories before accepting positions from that session.
    for(const group of [GetAllTargets.players,GetAllTargets.ghouls])for(const target of group)if(target?.active)target.setInactive();
  }
  let lastSentAngle = null,lastSentPlayer = 0;
  const appliedToggles={AimBotEnabled:MOD.AimBotEnabled};
  function __send(value, forceAngle = false, sourceAngle = false) {
    if (!playing()) return false;
    const packet = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(packet) || packet.length === 0 || packet.some(x => typeof x !== 'number' || !Number.isFinite(x))) return false;
    if (packet[0] === 6) {
      if (packet.length !== 2) return false;
      if(!sourceAngle)packet[1] = (Math.round(packet[1]) % 360 + 360) % 360;
      if (!forceAngle && packet[1] === lastSentAngle && lastSentPlayer === B.world.ᅠᏧ‍.id) {
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
    if (packet[0] === 6) {lastSentAngle = packet[1];lastSentPlayer = B.world.ᅠᏧ‍.id;}
    recordCommand(packet[0]);
    return true;
  }
  // Native fire uses the last source direction; afterFire owns its jitter case.
  function beforeFire() {if(!playing()||reconnect.sessionEnded)return;aimModule.sync();}
  function persist() {
    refreshLootFilter();
    const saved = {};
    for (const key of Object.keys(defaults)) if (!transient.has(key)) saved[key] = MOD[key];
    try {
      localStorage.setItem(AIM_SAVE,JSON.stringify(Object.fromEntries(aimKeys.map(key=>[key,MOD[key]]))));
      // Preserve earlier engine settings for rollback; this engine has its own key.
      const previousAim=JSON.parse(localStorage.getItem(SAVE)||'{}');
      for(const key of aimKeys){if(Object.hasOwn(previousAim,key))saved[key]=previousAim[key];else delete saved[key];}
      localStorage.setItem(SAVE, JSON.stringify(saved));
      localStorage.setItem(SAVE + ':ilm2', '1');
      localStorage.setItem(SAVE + ':loot', JSON.stringify(Object.fromEntries(Object.entries(LootData).map(([k, v]) => [k, v.acquire]))));
    } catch (_) {}
  }
  function setSetting(key, value) {
    if (stopped) throw new Error('Mod has been disposed');
    validateSetting(key,value);
    // dat.GUI writes MOD before onChange, so compare the last applied value.
    if(Object.prototype.hasOwnProperty.call(appliedToggles,key)){
      if(appliedToggles[key]!==value)lastSentAngle=null;
      appliedToggles[key]=value;
    }
    if (keySettings.includes(key)) {
      const conflict = value==='NoKey'?null:keySettings.find(other=>other!==key && MOD[other]===value);
      if (conflict) MOD[conflict] = MOD[key];
    }
    MOD[key] = value;
    if (key === 'NicknameColor') {
      for (let id=1;id<B.world.ᴎ︃ᄉ.length;id++) {
        const meta=playerMeta(id);
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
    if(trafficKeys.some(name=>trafficSettings[name]!==MOD[name])){
      for(const name of trafficKeys)trafficSettings[name]=MOD[name];
      trafficChanges.push({at:Math.round(performance.now()),settings:{...trafficSettings}});
      if(trafficChanges.length>64){trafficChanges.shift();trafficDiscardedChanges++;}
    }
    persist();
    if (menu) menu.updateDisplay();
  }
  function report(error) {
    const message = String(error && error.message || error);
    if (!diagnostics.errors.includes(message)) {
      if (diagnostics.errors.length >= 50) diagnostics.errors.shift();
      diagnostics.errors.push(message);
      console.error('[Devast mod]', message);
    }
  }
  // Decode the native protocol; prediction/history stay in the imported engine.
  function trackPacket(type, playerId, uid, x, y, active, weapon, packed) {
    const kind=type===B.categories.player?'players':type===13?'ghouls':null;
    const id=kind==='players'?playerId:uid;
    if(!kind||!Number.isInteger(id)||id<0||id>65535)return;
    if(id===0)return;
    aimModule.ensure(id);const group=GetAllTargets[kind];
    if(!active){group[id].setInactive();return;}
    if(Number.isFinite(x)&&Number.isFinite(y))aimModule.position(kind,id,x,y,weapon,packed);
  }

  function playerMeta(id) {
    return B.world.ᴎ︃ᄉ[id];
  }
  function nickname(id) {
    const p = playerMeta(id), value = p && p.ο̏︇;
    const text=String(typeof value === 'string' ? value : '');
    const suffix='#'+id;
    return B.nativePlayerLabels && text.endsWith(suffix) ? text.slice(0,-suffix.length) : text;
  }
  function playerLabel(meta, id) {
    const known = playerLabelCache.get(meta);
    if (!Number.isInteger(id)) id = known ? known.id : B.world.ᴎ︃ᄉ.indexOf(meta);
    const name = String(meta?.ο̏︇ || '');
    if(B.nativePlayerLabels) return name;
    return Number.isInteger(id) && id > 0 ? name+'#'+id : name;
  }
  function preparePlayerLabel(meta, id) {
    const cached = playerLabelCache.get(meta);
    if (!cached || cached.id !== id || cached.nickname !== meta.ο̏︇ || cached.color !== MOD.NicknameColor) {
      meta.а༠٥ = null;
      meta.ᴘ๒︅ = null;
      B.world.ᴑܓօ = 1;
      playerLabelCache.set(meta, {
        id,
        nickname:meta.ο̏︇,
        color:MOD.NicknameColor
      });
    }
  }
  function observePlayerSpawn(id) { departedPlayers.delete(id); }
  function observePlayerLeave(id) { aimModule.onOtherDie(id);departedPlayers.set(id,playerMeta(id)); }
  function zoomOffset(nativeOffset) {
    const base = Number.isFinite(nativeOffset) ? nativeOffset : 0;
    return Math.max(-.95, Math.min(3, (1 + base) * MOD.zoomFactor - 1));
  }
  function validClan(id) {
    const p = playerMeta(id), index = p && p.а༤̘;
    if (!Number.isInteger(index) || index < 0) return null;
    const clan = B.world.ﾠࡅ‍[index];
    return clan && Number.isInteger(clan.ոᚄރ) && p.ᴌ̗ⲟ === clan.ոᚄރ ? clan : null;
  }
  function teamId(id) {
    const meta=playerMeta(id),index=meta?.а༤̘;
    if(!Number.isInteger(index)||index<0)return -1;
    const clan=B.world.ﾠࡅ‍[index];
    return clan&&Number.isInteger(clan.ոᚄރ)&&meta.ᴌ̗ⲟ===clan.ոᚄރ?index:-1;
  }
  function sameClan(id) {
    const own = validClan(B.world.ᅠᏧ‍.id);
    return !!own && own === validClan(id);
  }
  function clanColor(id) {
    return id === B.world.ᅠᏧ‍.id || sameClan(id) ? MOD.TeamClanColor : MOD.EnemyClanColor;
  }
  const clanTagColors = new WeakMap();
  function prepareClanTag(clan, id) {
    const color = clanColor(id);
    if (clanTagColors.get(clan) !== color) {
      clan.ᴌ५ᚂ = null;
      clanTagColors.set(clan, color);
    }
  }
  function collect() {
    let count=0,playerCount=0;
    for (let type = 0; type < B.entities.border.length; type++) {
      const border = B.entities.border[type], group = B.entities.ᴎ̂２[type];
      if (!border || !group) continue;
      for (let i = 0; i < border.border; i++) {
        const e = group[border.ⲣᴑᴏ[i]];
        if (e && e.е̝ހ === 0 && Number.isFinite(e.x) && Number.isFinite(e.y)) {
          let record=entityRecords.get(e);
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
  function updateTargets() {
    for (const {e} of playerRecords) {
      const meta=playerMeta(e.ᴘ४１);
      if (meta && typeof meta.ο̏︇==='string') _players_list[e.ᴘ४１]=meta.ο̏︇;
    }
  }
  function view() {
    const v = B.view(), ratio = B.graphics.options && B.graphics.options.еߎ༢;
    return {
      ...v,
      scale: v.scale * (Number.isFinite(ratio) && ratio > 0 ? ratio : 1)
    };
  }
  function cursorWorld(cursor = mouse || GetAllTargets.mousePosition) {
    const v = view(), can = v.ctx?.canvas || document.getElementById('can');
    if (!can || !(v.scale > 0)) return null;
    const r = can.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return __ilmMouseToWorld({x:(cursor.x-r.left)*can.width/r.width,y:(cursor.y-r.top)*can.height/r.height},v);
  }
  function updateMouse() {
    if (!MOD.mouseFovEnable) return;
    // The imported renderer uses client coordinates and the native camera.
    // Doors and building previews retain their canvas/DPI conversion.
    const v = B.view();
    if (v.scale > 0) GetAllTargets.mouseMapCords = __ilmMouseToWorld(GetAllTargets.mousePosition,v);
  }
  function automate(now) {
    const me = B.world.ᅠᏧ‍;
    if (!B.synchronizedRender && MOD.FAutoLootEnabled) scanFastLoot(now);
    if (MOD.SAutoLootEnabled && !MOD.FAutoLootEnabled && now - lastLoot >= 200 && automationReady('loot')) {
      lastLoot = now;
      const loot = records.filter(r => r.type === B.categories.loot && (r.e.x - me.x) ** 2 + (r.e.y - me.y) ** 2 < 50000 && lootAllowed(r.e));
      loot.sort((a, b) => (a.e.x - me.x) ** 2 + (a.e.y - me.y) ** 2 - ((b.e.x - me.x) ** 2 + (b.e.y - me.y) ** 2));
      for (const {e} of loot.slice(0, 1)) __send([12, e.id]);
    }
    if (MOD.AutoTakeEnabled && Aimbot.mouseDown && me.ᴉᄁ͏ === 1 && now - lastTake >= 200 && automationReady('take')) {
      const slots = me.ᴘϲ๓, count = me.ᅠܓ̃;
      if (Array.isArray(slots) && Number.isInteger(count)) {
        const slot = slots.findIndex((item,index)=>index < count && Array.isArray(item) && Number.isFinite(item[0]) && item[0] > 0);
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
  function autoBuildFrame(now=performance.now()) {
    if (!playing() || !MOD.AutoBuiledEnabled) return;
    if(now-lastAutoBuild<AUTO_BUILD_INTERVAL)return;
    const me=B.world.ᅠᏧ‍;
    if (me.ε︁ᚂ!==1 || me.օⲥᚁ!==1) return;
    if(!automationReady('build'))return;
    if(__send([14,me.α०ᚂ,me.ρⲅ️,me.ᴎ︆ࡉ]))lastAutoBuild=now;
  }
  function updateChat(now) {
    if (!MOD.SpamChatEnabled) {
      chatState.status = 'Off';
      return;
    }
    const input = document.getElementById('chatInput'), limit = input && input.maxLength > 0 ? input.maxLength : 100;
    const text = String(MOD.SpamChatText).replace(/[\r\n]+/g, ' ').trim().slice(0, limit);
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
    const wait = B.network.іߐ̸(text);
    if (wait === 0) {
      recordCommand(1);
      lastChat = now;
      nextChatAt = -Infinity;
      chatState.sent++;
      chatState.status = 'Sent (' + chatState.sent + ')';
      const local = playerMeta(B.world.ᅠᏧ‍.id);
      if (local && local.text && typeof local.text.push === 'function') local.text.push(text);
    } else if (Number.isFinite(wait) && wait > 0) {
      nextChatAt = now + Math.max(100, wait + 100);
      chatState.status = 'Chat cooldown: ' + Math.ceil(wait / 1000) + 's';
    } else {
      nextChatAt = now + 5000;
      chatState.status = 'Send not confirmed';
    }
  }
  function scanFastLoot(now=performance.now()) {
    if (!playing() || !MOD.FAutoLootEnabled) return;
    if(now-lastFastLoot<FAST_LOOT_INTERVAL)return;
    if(!automationReady('loot'))return;
    // Match the reference's 25 ms loot timer and bounded burst. Rotate the
    // starting slot so a busy first group cannot starve the remaining drops.
    const me = B.world.ᅠᏧ‍, type = B.categories.loot, border = B.entities.border[type], group = B.entities.ᴎ̂２[type];
    if(!border||!group||!border.border)return;
    let visited=0,sent=0;
    while(visited<border.border&&sent<FAST_LOOT_BURST){
      const i=(fastLootCursor+visited++)%border.border;
      const e = group[border.ⲣᴑᴏ[i]];
      if (!e || e.е̝ހ !== 0 || !Number.isInteger(e.id) || !Number.isFinite(e.x) || !Number.isFinite(e.y)) continue;
      const distance = (e.x - me.x) ** 2 + (e.y - me.y) ** 2;
      if (distance < 41000 && (!MOD.LootDataEnabled || allowedLootIds.has(e.Іࡈ５))&&__send([12,e.id]))sent++;
    }
    fastLootCursor=(fastLootCursor+visited)%border.border;
    if(sent)lastFastLoot=now;
  }
  function building(r) {
    if ([B.categories.player, B.categories.loot, 13].includes(r.type)) return null;
    const descriptor = B.items[r.e.Іࡈ５ >> 7];
    return descriptor && Number.isInteger(descriptor.ࡀ︂̄) && descriptor.ࡀ︂̄ > 0 ? descriptor : null;
  }
  function ownedBuilding(r) {
    if ([B.categories.player,B.categories.loot,B.categories.projectile,13].includes(r.type)) return null;
    const descriptor=B.items[r.e.Іࡈ５>>7];
    if (!descriptor) return null;
    // Interaction opcodes only identify doors/containers. Walls, floors and
    // sleeping bags also have placeable dimensions and item details.
    return descriptor.detail&&typeof descriptor.detail.name==='string'&&Array.isArray(descriptor.width)&&Array.isArray(descriptor.height)
      || Number.isInteger(descriptor.ࡀ︂̄)&&descriptor.ࡀ︂̄>0 ? descriptor:null;
  }
  function highlightMine(entity) {
    if (stopped||!MOD.ShowMines||!playing()) return;
    const v=view(),canvas=v.ctx?.canvas;
    if (!canvas||!Number.isFinite(entity.x)||!Number.isFinite(entity.y)) return;
    const x=(v.x+entity.x)*v.scale,y=(v.y+entity.y)*v.scale;
    const radius=Math.max(6,Math.min(22,25*v.scale));
    if(x < -radius||y < -radius||x > canvas.width+radius||y > canvas.height+radius)return;
    const c=v.ctx;c.save();
    try{
      c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.strokeStyle='#ff453a';c.lineWidth=2;
      c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.stroke();
    }finally{c.restore();}
  }
  function lootAllowed(e) {
    const me = B.world.ᅠᏧ‍;
    return me.І๔︊ === 0 && me.ιᄁ८ === e.id && (!MOD.LootDataEnabled || allowedLootIds.has(e.Іࡈ５));
  }
  const doorInteraction={status:'idle',message:'',id:null,owner:null,expires:0};
  let pendingDoor=null;
  function updateDoorInteraction(now=performance.now()) {
    if(!pendingDoor)return;
    const current=records.find(r=>r.type===pendingDoor.type&&r.e.id===pendingDoor.id&&r.e.ᴘ४１===pendingDoor.owner);
    if(current&&!!(current.e.state&16)!==pendingDoor.wasOpen){
      doorInteraction.status='confirmed';
      doorInteraction.message=current.e.state&16?'Дверь открыта':'Дверь закрыта';
      doorInteraction.expires=now+1500;pendingDoor=null;
    }else if(now-pendingDoor.at>=1500){
      doorInteraction.status='unconfirmed';doorInteraction.message='Нет подтверждения от двери';
      doorInteraction.expires=now+2000;pendingDoor=null;
    }
  }
  function openUnderMouse() {
    if (!playing() || (!MOD.RightClickDoors&&!MOD.OpenEverythingByClick) || B.chatActive?.()) return false;
    const point = cursorWorld();
    if (!point) return false;
    const x = Math.floor(point.x / 100), y = Math.floor(point.y / 100);
    const me = B.world.ᅠᏧ‍;
    let selected;
    for (const r of records) {
      if(r.e.αބ̞!==x || r.e.ᴀܛ٤!==y)continue;
      const d = building(r);
      if(!d)continue;
      if(B.isManualDoor?.(d)){
        if(!MOD.RightClickDoors)continue;
        // E describes the native nearest target. A right click addresses this
        // door directly; the server decides whether the action is permitted.
        if(!__send([d.ࡀ︂̄,r.e.id,r.e.ᴘ४１]))return false;
        const now=performance.now();
        pendingDoor={type:r.type,id:r.e.id,owner:r.e.ᴘ४１,wasOpen:!!(r.e.state&16),at:now};
        Object.assign(doorInteraction,{status:'requested',message:'Запрос двери отправлен',id:r.e.id,owner:r.e.ᴘ४１,expires:now+1500});
        return true;
      }
      if(MOD.OpenEverythingByClick && me.І๔︊===2 && me.ⲟܐ༠===r.e.id && me.с̣ߏ===r.e.ᴘ४１ && me.ࡀ︂̄===d.ࡀ︂̄)selected=[d.ࡀ︂̄,r.e.id,r.e.ᴘ४１];
    }
    return selected ? __send(selected) : false;
  }
  function ensureOverlay() {
    const v=view(),can=v.ctx?.canvas || document.getElementById('can');
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
    const r=can.getBoundingClientRect();
    for (const [key,value]of Object.entries({left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'}))if(overlayHost.style[key]!==value)overlayHost.style[key]=value;
    return !!ctx;
  }
  function syncFunctionList() {
    if (!overlayHost) return;
    if (!functionList) {
      functionList = document.createElement('div');
      functionList.id = 'devast-mod-functions';
      functionList.style.cssText = 'position:absolute;left:8px;top:50%;transform:translateY(-50%);background:rgba(6,25,36,.88);pointer-events:none;display:grid;grid-auto-flow:column;column-gap:12px;padding:2px 5px;font-family:system-ui,sans-serif;font-weight:800;white-space:nowrap;';
      for (const [key, label] of functionLabels) {
        const row = document.createElement('div');
        row.dataset.function = key || 'unavailable';
        row.textContent = '• ' + label;
        if (!key) row.title = 'Unavailable in this script';
        functionRows.set(label, { key, row });
        functionList.appendChild(row);
      }
      overlayHost.shadowRoot.appendChild(functionList);
    }
    const display=MOD.showFunctionList?'grid':'none';
    if (functionList.style.display!==display) functionList.style.display=display;
    if (!MOD.showFunctionList) return;
    const height = parseFloat(overlayHost.style.height) || window.innerHeight, rows = Math.ceil(functionRows.size / 2), font = Math.max(8, Math.min(14, (height - 16) / rows - 3)), line = Math.ceil(font + 3);
    const fontSize=font+'px',lineHeight=line+'px',gridRows='repeat('+rows+', '+line+'px)';
    if (functionList.style.fontSize!==fontSize) functionList.style.fontSize=fontSize;
    if (functionList.style.lineHeight!==lineHeight) functionList.style.lineHeight=lineHeight;
    if (functionList.style.gridTemplateRows!==gridRows) functionList.style.gridTemplateRows=gridRows;
    for (const { key, row } of functionRows.values()) {
      const on = key !== null && MOD[key] === true;
      if (row.dataset.enabled === String(on)) continue;
      row.dataset.enabled = String(on);
      row.style.color = on ? '#ffff00' : '#fff';
      row.style.opacity = '1';
      row.style.textShadow = on ? '0 0 7px rgba(255,255,0,.9)' : 'none';
    }
  }
  function syncPlayerList() {
    if (!playing() || !MOD.PlayersListEnabled) {
      if (playerListPanel) playerListPanel.style.display = 'none';
      return;
    }
    if (!playerListPanel) {
      const style=document.createElement('style');
      style.textContent='.player-list{position:absolute;left:8px;top:8px;width:min(560px,calc(100% - 16px));max-height:calc(100% - 16px);box-sizing:border-box;pointer-events:auto;background:rgba(8,16,25,.96);border:1px solid #607086;border-radius:8px;flex-direction:column;overflow:hidden;color:#fff;font:14px/1.5 system-ui,sans-serif}.player-list-header{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;gap:12px}.player-list button{font:inherit;cursor:pointer;border:0;background:transparent;color:inherit}.player-list-close{font-size:24px!important;line-height:1}.player-list-scroll{overflow:auto;min-height:0;overscroll-behavior:contain}.player-list-row{display:grid;grid-template-columns:58px minmax(0,1fr) minmax(85px,1fr);gap:8px;padding:6px 12px;align-items:center;border-top:1px solid #293646}.player-list-columns{position:sticky;top:0;background:#182434;color:#b6c4d4;font-size:12px}.player-list-name{text-align:left;overflow-wrap:anywhere;padding:0}.player-list-clan{overflow-wrap:anywhere}.player-list-empty{padding:12px;color:#b6c4d4}';
      overlayHost.shadowRoot.appendChild(style);
      playerListPanel=document.createElement('section');playerListPanel.className='player-list';playerListPanel.id='devast-player-list';
      const header=document.createElement('div');header.className='player-list-header';
      playerListCount=document.createElement('strong');header.appendChild(playerListCount);
      const close=document.createElement('button');close.className='player-list-close';close.textContent='×';close.title='Закрыть список игроков';
      listen(close,'click',()=>setSetting('PlayersListEnabled',false));header.appendChild(close);playerListPanel.appendChild(header);
      const scroll=document.createElement('div');scroll.className='player-list-scroll';
      const columns=document.createElement('div');columns.className='player-list-row player-list-columns';
      for (const label of ['#ID','Ник','Клан']) {const cell=document.createElement('span');cell.textContent=label;columns.appendChild(cell);}
      scroll.appendChild(columns);playerListBody=document.createElement('div');scroll.appendChild(playerListBody);playerListPanel.appendChild(scroll);
      for (const name of ['mousedown','click','dblclick','contextmenu','wheel','touchstart']) listen(playerListPanel,name,event=>event.stopPropagation());
      overlayHost.shadowRoot.appendChild(playerListPanel);
    }
    playerListPanel.style.display='flex';
    const ids=[];
    for (let id=1;id<B.world.ᴎ︃ᄉ.length;id++) {
      const meta=playerMeta(id);
      if (!meta || typeof meta.ο̏︇ !== 'string' || departedPlayers.get(id) === meta) continue;
      departedPlayers.delete(id);ids.push(id);
      const name=nickname(id),clan=validClan(id),tag=clan?.name ? '['+clan.name+']' : '—';
      const color=clan ? clanColor(id) : '#9aabbc';
      let entry=playerListRows.get(id);
      if (!entry) {
        const row=document.createElement('div');row.className='player-list-row';row.dataset.playerId=String(id);
        const number=document.createElement('span'),nick=document.createElement('button'),clanLabel=document.createElement('span');
        number.textContent='#'+id;nick.className='player-list-name';nick.title='Копировать ник';clanLabel.className='player-list-clan';
        row.appendChild(number);row.appendChild(nick);row.appendChild(clanLabel);nick.onclick=()=>copyNickname(id);
        entry={row,number,nick,clan:clanLabel};playerListRows.set(id,entry);
      }
      if (entry.name!==name || entry.tag!==tag || entry.nickColor!==MOD.NicknameColor || entry.clanColor!==color) {
        entry.nick.textContent=name || 'Без ника';entry.nick.style.color=MOD.NicknameColor;entry.number.style.color=MOD.NicknameColor;
        entry.clan.textContent=tag;entry.clan.style.color=color;
        entry.name=name;entry.tag=tag;entry.nickColor=MOD.NicknameColor;entry.clanColor=color;
      }
    }
    const order=ids.join(',');
    if (order !== playerListOrder || !playerListBody.children.length) {
      const present=new Set(ids);
      for (const id of playerListRows.keys()) if (!present.has(id)) playerListRows.delete(id);
      const rows=ids.map(id=>playerListRows.get(id).row);
      if (!rows.length) {const empty=document.createElement('div');empty.className='player-list-empty';empty.textContent='Нет данных об игроках';rows.push(empty);}
      playerListBody.replaceChildren(...rows);playerListOrder=order;
    }
    const title='Игроки: '+ids.length;
    if (playerListCount.textContent !== title) playerListCount.textContent=title;
  }
  function draw() {
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
    const v = view(), me = B.world.ᅠᏧ‍;
    function at(e) {
      return {
        x: (v.x + e.x) * v.scale,
        y: (v.y + e.y) * v.scale
      };
    }
    function text(value, x, y, color = '#fff', size = 14) {
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
      let ownerCursor, ownerCursorRead=false,ownerLabelCount=0;
      const drawRecords=MOD.ShowBuildingOwner||MOD.RightClickDoors?records:playerRecords;
      for (const r of drawRecords) {
        if (r.type === B.categories.player) {
          const id = r.e.ᴘ४１, p = at(r.e), self = id === me.id, color = self && !validClan(id) ? '#00ffff' : clanColor(id);
          if (MOD.ShowNamesOnMap && !B.nativePlayerLabels && Number.isInteger(id) && id > 0) {
            text(playerLabel(playerMeta(id),id).trim(), p.x, p.y - 56 * v.scale, MOD.NicknameColor);
            const clan=validClan(id);
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
            const meta = playerMeta(id), sprite = meta && B.karma[meta.ᴑᴄ̉];
            if (sprite && B.graphics.ᴑ̸ᴘ) B.graphics.ᴑ̸ᴘ(sprite, v.x + r.e.x, v.y + r.e.y - 85, 0, 0, 0, 0.6);
          }
        } else if ((MOD.ShowBuildingOwner||MOD.RightClickDoors) && typeof r.e.αބ̞==='number') {
          if (!ownerCursorRead) {ownerCursor=cursorWorld();ownerCursorRead=true;}
          const point = ownerCursor;
          if (!point) continue;
          const x = Math.floor(point.x / 100), y = Math.floor(point.y / 100);
          if (r.e.αބ̞ === x && r.e.ᴀܛ٤ === y) {
            const descriptor=ownedBuilding(r);
            if(!descriptor)continue;
            const p=at(r.e),id=r.e.ᴘ४１,kind=descriptor.detail?.name;
            const owner=Number.isInteger(id)&&id>0?(nickname(id)?nickname(id)+' ':'')+'#'+id:'Owner unknown';
            if(MOD.ShowBuildingOwner)text((kind?kind+': ':'')+owner,p.x,p.y-35-18*ownerLabelCount++,clanColor(id),16);
            if(MOD.RightClickDoors&&B.isManualDoor?.(descriptor)){
              const feedback=doorInteraction.id===r.e.id&&doorInteraction.owner===id&&performance.now()<doorInteraction.expires;
              text(feedback?doorInteraction.message:(r.e.state&16?'ПКМ — закрыть дверь':'ПКМ — открыть дверь'),p.x,p.y-75,feedback&&doorInteraction.status==='unconfirmed'?'#ffb14e':'#fff',14);
            }
          }
        }
      }
      aimModule.render(ctx,B.view());
      ctx.globalAlpha = 1;
    } finally {ctx.restore();}
  }
  const reconnect = {
    status: 'Ready',
    attempts: 0,
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
  let connectionSocket = null, adGate = null, removeSocketObservers = () => {};
  let socketSerial=0,socketTrace=null;
  const callbackTraffic={wrapped:0,accepted:0,rejectedStale:0,rejectedWhileConnected:0,rejectedAfterDispose:0};
  function socketTraffic(now=performance.now()) {
    if(!socketTrace)return null;
    return {id:socketTrace.id,openForMs:socketTrace.openedAt===null?null:Math.max(0,Math.round(now-socketTrace.openedAt)),
      receiveGapMs:socketTrace.lastReceiveAt===null?null:Math.max(0,Math.round(now-socketTrace.lastReceiveAt)),
      receivedMessages:socketTrace.receivedMessages,localCloseSource:socketTrace.localCloseSource};
  }
  function observeCloseRequest(source) {
    if(stopped||!socketTrace||!['native-network-close','native-receive-timeout','native-entry-timeout','mod-entry-timeout'].includes(source))return false;
    if(socketTrace.localCloseSource===null)socketTrace.localCloseSource=source;
    connectionEvent('client-close-request',{source});
    return true;
  }
  const widgetWrappers = new Map();
  function observeSocket(socket) {
    if(socket!==connectionSocket){lastSentAngle=null;}
    removeSocketObservers();
    connectionSocket = socket;
    socketTrace=socket?{id:++socketSerial,openedAt:socket.readyState===1?performance.now():null,lastReceiveAt:null,receivedMessages:0,localCloseSource:null}:null;
    if (typeof socket?.addEventListener !== 'function') return;
    const handlers = {
      open:() => {if(!stopped&&socket===connectionSocket)socketTrace.openedAt=performance.now();},
      message:() => {if(!stopped&&socket===connectionSocket){socketTrace.lastReceiveAt=performance.now();socketTrace.receivedMessages++;}},
      close:event => { if (!stopped && socket === connectionSocket) connectionEvent('socket-close',
        {code:Number.isInteger(event.code) ? event.code : null,clean:event.wasClean === true,localCloseObserved:socketTrace.localCloseSource!==null}); },
      error:() => { if (!stopped && socket === connectionSocket) connectionEvent('socket-error'); }
    };
    for (const [name,handler] of Object.entries(handlers)) socket.addEventListener(name,handler);
    removeSocketObservers = () => {
      for (const [name,handler] of Object.entries(handlers)) socket.removeEventListener?.(name,handler);
    };
  }
  function connectionInfo() {
    const stored = {};
    for (const key of ['token','tokenId','userId','accountToken']) {
      try { stored[key] = !!localStorage.getItem(key); } catch (_) { stored[key] = null; }
    }
    const build=typeof __devastClientBuild==='undefined'?null:{...__devastClientBuild};
    return {schema:3,recoveryVersion:5,auditBuild:'integrity-autoupdate-v1',build,integrityCompatibility:B.integrityPatched?.()===true,
      integrityFlag:typeof B.integrity?.()==='number'?B.integrity():null,state:B.network.state,phase:reconnect.phase,
      sessionEnded:reconnect.sessionEnded,awaitingPlay:reconnect.awaitingPlay,normalJoinRequired:reconnect.freshRequired,
      nativeReady:typeof B.network[B.loginKey] === 'function',
      nativePending:B.pendingKey ? !!B.network[B.pendingKey] : false,
      adWaiting:!!B.adWaiting?.(),socketState:connectionSocket?.readyState ?? null,
      socketBufferedBytes:Number.isFinite(connectionSocket?.bufferedAmount)?connectionSocket.bufferedAmount:null,
      transport:socketTraffic(),
      combatNow:combatCommands(),
      animationTiming:animationTiming(),
      modCommandsByOpcode:{...diagnostics.commandsByOpcode},
      automationSettings:{autoBuild:MOD.AutoBuiledEnabled,fastLoot:MOD.FAutoLootEnabled,slowLoot:MOD.SAutoLootEnabled,autoTake:MOD.AutoTakeEnabled,spamChat:MOD.SpamChatEnabled},
      automationTransport:{deferred:{...automationDeferrals},aimHighWaterBytes:AIM_BUFFER_HIGH_WATER},
      automationLimits:{fastLootIntervalMs:FAST_LOOT_INTERVAL,fastLootBurst:FAST_LOOT_BURST,autoBuildIntervalMs:AUTO_BUILD_INTERVAL},
      modTraffic:trafficInfo(),
      connectionCallbacks:{...callbackTraffic},
      aimTransport:{...aimTransport,nativeSenderAvailable:typeof B.aimSend==='function',sourceTickRateMs:50,deduplicatedDirections:diagnostics.deduplicatedAngles},
      aimSettings:{enabled:MOD.AimBotEnabled,source:'message27-bby',autoFire:MOD.autoFire,target:MOD.target,lockId:MOD.lockId,distanceCoefficient:MOD.distanceCoefficient,offsetCoefficient:MOD.offsetCoefficient},
      lastFailureCode:reconnect.lastFailureCode,gatewayRecoveries:reconnect.gatewayRecoveries,initialHomeRecoveries:reconnect.initialHomeRecoveries,
      stored,modErrorCount:diagnostics.errors.length,events:connectionEvents.map(event=>({...event,transport:event.transport?{...event.transport}:null,commandsInLast2s:{...event.commandsInLast2s}}))};
  }
  function releaseNativePending() {
    if (B.pendingKey) B.network[B.pendingKey] = false;
  }
  function finishStalledEntry(stage) {
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
      try { B.returnToMenu(); } catch (error) { report(error); }
    }
    reconnect.status='Сервис входа не ответил; выберите сервер и повторите Play';
  }
  let initialHomeWaitAt=null,initialHomeSeen=false;
  function watchInitialHome(now) {
    if (initialHomeSeen || typeof B.homeControlsVisible!=='function') return;
    if (B.network.state===1 || B.homeControlsVisible()) {initialHomeSeen=true;return;}
    if (initialHomeWaitAt===null || document.hidden) initialHomeWaitAt=now;
    if (now-initialHomeWaitAt<20000 || document.hidden || reconnect.pending || B.adWaiting?.() || B.network.state!==0 || !B.canShowHome?.()) return;
    initialHomeSeen=true;
    reconnect.initialHomeRecoveries++;
    finishStalledEntry('startup');
  }
  function beginPlay() {
    if (stopped) return true;
    if (B.network.state === 1 || (B.network.state & 2) !== 0) return false;
    const now=performance.now();
    if (B.adWaiting?.()) return false;
    if (reconnect.pending && ['preparing','joining','refreshing'].includes(reconnect.phase) && now < reconnect.deadline) return false;
    // Play can lock its native busy flag before the network login is called.
    // Recover this earlier stage too; persistent account data is never touched.
    reconnect.generation++;
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
  function guardPlayCallback(callback) {
    if (stopped) return callback;
    const generation=reconnect.generation;
    let completed=false;
    return function (...args) {
      if (stopped || completed || generation!==reconnect.generation) return;
      completed=true;
      return callback.apply(this,args);
    };
  }
  function continueAdGate(gate) {
    if (stopped || gate !== adGate || gate.done || !gate.callback || !B.adWaiting?.()) return;
    reconnect.gatewayRecoveries++;
    reconnect.status = 'Рекламный модуль не ответил; продолжаем вход';
    gate.wrapped.call(gate.widget);
  }
  function watchLoginGateway(now) {
    const widget = window.Widget;
    if (typeof B.adWaiting === 'function' && widget) for (const method of ['preroll','createAdPlayer']) {
      const entries = widgetWrappers.get(widget) || {};
      if (typeof widget[method] !== 'function' || widget[method] === entries[method]?.wrapped) continue;
      const original = widget[method];
      const wrapped = function (...args) {
        reconnect.phase='advertising';
        const gate = adGate = {widget, done:false, failed:false, deadline:performance.now()+60000};
        // Native code installs Widget.play immediately after preroll returns.
        Promise.resolve().then(() => {
          if (stopped || gate !== adGate || !B.adWaiting() || typeof widget.play !== 'function') return;
          gate.callback = widget.play;
          gate.wrapped = function (...result) {
            if (stopped || gate !== adGate || gate.done) return;
            gate.done = true;
            adGate = null;
            return gate.callback.apply(this, result);
          };
          widget.play = gate.wrapped;
          if (gate.failed) continueAdGate(gate);
        });
        let result;
        try { result = original.apply(this,args); }
        catch (_) { gate.failed = true; return; }
        if (result && typeof result.then === 'function') Promise.resolve(result).catch(() => {
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
  let automaticJoin = false;
  let nativeLoginDepth = 0;
  function guardHandshakeCallback(url, callback) {
    if (!nativeLoginDepth || typeof callback !== 'function') return callback;
    const generation = reconnect.generation;
    callbackTraffic.wrapped++;
    // Gate the native HTTP response before it can overwrite the current
    // connection's cryptographic state, not only its final start callback.
    return function (...args) {
      if(stopped){callbackTraffic.rejectedAfterDispose++;return;}
      if(generation!==reconnect.generation){
        callbackTraffic.rejectedStale++;
        if(B.network.state===1)callbackTraffic.rejectedWhileConnected++;
        return;
      }
      callbackTraffic.accepted++;
      // Native preflight can issue its next HTTP round from this callback.
      // Carry ownership into that round before the original stack returns.
      nativeLoginDepth++;
      try { return callback.apply(this,args); } finally { nativeLoginDepth--; }
    };
  }
  const connectionWrappers = new Map();
  function markRestoreFailure() {
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
  function prepareNormalJoin() {
    if (!reconnect.freshRequired) return;
    // The native join payload uses state bit 64 for restoration. A rejected
    // session must make one ordinary join instead, retaining all stored identity.
    B.network.state = 0;
    reconnect.freshRequired = false;
    reconnect.freshUsed = true;
  }
  function watchConnectionHandlers() {
    const n = B.network;
    for (const [key,kind] of [[B.loginKey,'login'],[B.restoreFailureKey,'restoreFailure'],[B.preflightKey,'preflight'],[B.errorKey,'error']]) {
      if (!key || typeof n[key] !== 'function' || n[key] === connectionWrappers.get(key)) continue;
      const original = n[key];
      originals[key] = original;
      const wrapper = kind === 'preflight' ? function (...args) {
        if (!nativeLoginDepth || typeof args[1] !== 'function') return original.apply(this,args);
        const generation = reconnect.generation, callback = args[1];
        args[1] = function (...result) {
          if (!stopped && generation !== reconnect.generation) return;
          return callback.apply(this,result);
        };
        return original.apply(this,args);
      } : kind === 'error' ? function (...args) {
        if (!stopped) {
          reconnect.lastFailureCode = Number.isInteger(args[0]) ? args[0] : (Number.isInteger(n.state)?n.state:0);
          reconnect.pending = false;
          reconnect.phase = reconnect.awaitingPlay?'dead':'idle';
          reconnect.generation++;
          releaseNativePending();
          reconnect.status = reconnect.awaitingPlay?'Персонаж погиб; нажмите Play для нового входа с прежним токеном':'Игра не завершила вход; можно повторить без сброса cookies';
        }
        return original.apply(this,args);
      } : kind === 'restoreFailure' ? function (...args) {
        const result = original.apply(this,args);
        if (!stopped) markRestoreFailure();
        return result;
      } : function (...args) {
        if (stopped) return original.apply(this,args);
        const now = performance.now();
        if (n.state === 1 || (n.state & 2) !== 0 || reconnect.pending && reconnect.phase === 'joining' && now < reconnect.deadline) return;
        if (!automaticJoin) {
          reconnect.generation++;
          reconnect.pending = false;
          reconnect.attempts = 0;
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
        catch (error) {
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
  function updateReconnect(now) {
    const n = B.network;
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
      if (reconnect.phase !== 'connecting' && !reconnect.pending) reconnect.deadline = now + 12000;
      reconnect.pending = true;
      reconnect.phase = 'connecting';
      if (now >= reconnect.deadline) {
        reconnect.pending = false;
        reconnect.phase = 'idle';
        reconnect.generation++;
        releaseNativePending();
        observeCloseRequest('mod-entry-timeout');
        connectionEvent('connection-timeout');
        const socket = connectionSocket;
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
    if (reconnect.pending && reconnect.phase === 'joining' && (n.state === 0 || n.state === 64 && !connectionSocket && !reconnect.sessionEnded)) {
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
    const retryable = (n.state & 64) !== 0 || reconnect.freshRequired && (n.state === 0 || n.state === 256);
    if (!retryable || !reconnect.armed || stopped || reconnect.autoBlocked) return;
    if (typeof n.ⲅ︊ᄃ !== 'function' || typeof B.reconnect !== 'function') return;
    if (reconnect.pending) {
      if (now < reconnect.deadline) return;
      reconnect.pending = false;
      reconnect.phase = 'idle';
      reconnect.generation++;
      reconnect.status = 'Refresh timed out';
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
    const selected = n.ԁᴄࡃ;
    if (!Array.isArray(selected)) {
      reconnect.status = 'Select a server';
      return;
    }
    const lobby = selected[0], region = selected[4], mode = selected[6], generation = ++reconnect.generation;
    reconnect.pending = true;
    reconnect.phase = 'refreshing';
    reconnect.attempts++;
    reconnect.next = 0;
    reconnect.deadline = now + 12000;
    reconnect.status = 'Refreshing servers / retry ' + reconnect.attempts;
    try {
      n.ⲅ︊ᄃ('https://devast.io/list?reconnect=' + Date.now(), () => {
        if (stopped || generation !== reconnect.generation || !reconnect.pending) return;
        reconnect.pending = false;
        if ((n.state & 64) === 0 && !(reconnect.freshRequired && (n.state === 0 || n.state === 256))) return;
        const current=n.ԁᴄࡃ;
        if (!Array.isArray(current) || current[0]!==lobby || current[4]!==region || current[6]!==mode) {
          reconnect.armed = false;
          reconnect.status = 'Server selection changed';return;
        }
        const row = n.ոߒ४?.find(r => r[0] === lobby && r[4] === region && r[6] === mode);
        if (!row) {
          reconnect.status = 'Selected server unavailable';
          return;
        }
        n.ԁᴄࡃ = row;
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
        } catch (_) {
          reconnect.status = 'Retry could not start';
        }
      });
    } catch (_) {
      reconnect.pending = false;
      reconnect.status = 'Server refresh failed';
    }
  }
  watchConnectionHandlers();
  function step(now = performance.now()) {
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
    if (previousPlayer !== B.world.ᅠᏧ‍.id) {
      lastSentAngle = null;
      previousPlayer = B.world.ᅠᏧ‍.id;
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
    automate(now);
    if (!B.synchronizedRender) draw();
  }
  function tick(now) {
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
      } catch (e) {
        report(e);
      }
    }
    nextFrame = window.requestAnimationFrame(tick);
  }
  // Native direction functions keep updating their timing/angle bookkeeping;
  // reviewed native patches suppress only their send, exactly as ILM does.
  function keyboard(e) {
    if(aimModule.waitingForKey){e.preventDefault?.();return;}
    if (waitingKey) {
      e.preventDefault();
      e.stopImmediatePropagation();
      try { setSetting(waitingKey,e.code); } catch (error) { report(error); return; }
      waitingKey = null;
      persist();
      menu?.updateDisplay();
      return;
    }
    const t = e.target;
    if (e.repeat || t && (t.isContentEditable || (/^(INPUT|TEXTAREA|SELECT)$/).test(t.tagName)) || B.chatActive && B.chatActive()) return;
    const bindings = {
      AimbotKey:'AimBotEnabled',
      AntiAimbotKey:'AntiAimbot',
      JitterKey:'jitterActive',
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
    for (const [key, setting] of Object.entries(bindings)) if (e.code === MOD[key]) {
      setSetting(setting, !MOD[setting]);
      break;
    }
  }
  listen(window, 'keydown', keyboard, true);
  listen(window, 'mousemove', e => {
    mouse={x:e.clientX,y:e.clientY};
    GetAllTargets.mousePosition.x=e.clientX;GetAllTargets.mousePosition.y=e.clientY;
  }, true);
  listen(window, 'mousedown', e => {
    if (e.target?.closest?.('.dg')) return;
    if (playerListPanel && e.composedPath?.().includes(playerListPanel)) return;
    if(e.button===2){
      const target=e.target;
      if(target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target?.tagName) || target?.closest?.('input,textarea,select,button,a,[contenteditable]'))return;
      const bounds=document.getElementById('can')?.getBoundingClientRect();
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
  listen(window, 'mouseup', e => {
    if (e.button === 0) Aimbot.mouseDown = false;
  }, true);
  listen(window, 'blur', () => {
    Aimbot.mouseDown = false;
  });
  const canvas = document.getElementById('can');
  if (canvas) {
    listen(canvas, 'contextmenu', e => {
      if ((MOD.RightClickDoors||MOD.OpenEverythingByClick) && playing()) e.preventDefault();
    });
    listen(canvas, 'wheel', e => {
      if (!playing()) return;
      if (e.ctrlKey || !Number.isFinite(e.deltaY) || e.deltaY === 0) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? canvas.getBoundingClientRect().height : 1);
      setSetting('zoomFactor',Math.max(.33, Math.min(2, MOD.zoomFactor * Math.exp(-Math.max(-100, Math.min(100, delta)) * .001))));
      zoomControl?.updateDisplay();
    }, {
      capture: true,
      passive: false
    });
  }
  function createMenu() {
    if (stopped || menu) return;
    if (!window.dat || !window.dat.GUI) throw new Error('dat.GUI did not load');
    menu = new window.dat.GUI({
      width: 310
    });
    window.removeEventListener('keydown', window.dat.GUI._keydownHandler, false);
    const style = document.createElement('style');
    style.textContent = '.dg.main{position:fixed!important;top:10px!important;right:10px!important;max-height:92vh;overflow:auto;z-index:2147483647!important;background:#190707!important;border:1px solid #a22;border-radius:6px}.dg .title{color:#ffaaaa}.dg .slider-fg{background:#a22!important}.dg .cr{background:#190d0d}';
    document.head.appendChild(style);
    removers.push(() => style.remove());
    // dat.GUI ends numeric drags with window-level mouseup/touchend handlers.
    // Let move and release events reach those handlers, even inside the menu.
    for (const event of ['mousedown', 'click', 'dblclick', 'wheel', 'touchstart']) listen(menu.domElement, event, e => e.stopPropagation());
    function add(folder, key, label, ...range) {
      const c = folder.add(MOD, key, ...range).name(label || key);
      c.onChange(v => setSetting(key, v));
      return c;
    }
    const visual = menu.addFolder('Visuals');
    for (const key of ['ShowPosition', 'ShowNamesOnMap', 'ShowMines', 'ShowWires', 'ShowPlayerHitbox', 'KarmaAboveHead', 'ShowBuildingOwner', 'XrayBuildings', 'PlayersListEnabled', 'showFunctionList']) add(visual, key);
    add(visual, 'Xraytransparency', 'Building opacity', .05, 1, .05);
    for (const [key,label] of [['TeamClanColor','Цвет своего клана'],['EnemyClanColor','Цвет чужого клана'],['NicknameColor','Цвет ника']]) visual.addColor(MOD, key).name(label).onChange(value=>setSetting(key,value));
    const aimControls=aimModule.installMenu(menu).controllers;
    for (const control of aimControls) control.onChange(value=>{const range=limits[control.property];if(typeof value==='number'&&range)value=Math.max(range[0],Math.min(range[1],value));setSetting(control.property,value);});
    for(const control of aimControls){
      if(typeof defaults[control.property]!=='number')continue;
      const input=control.domElement.querySelector('input');if(!input)continue;
      input.dataset.aimNumericCommit='immediate-v1';
      listen(input,'input',()=>{
        const before=input.value,raw=before.includes(',')&&!before.includes('.')?before.replace(',','.'):before;
        const start=input.selectionStart,end=input.selectionEnd;
        if(raw!==before)input.value=raw;
        if(!raw.trim()||!Number.isFinite(Number(raw)))return;
        control.setValue(Number(raw));
        if(document.activeElement===input){input.value=raw;if(start!==null&&end!==null)input.setSelectionRange(start,end);}
      });
    }
    const zoom = menu.addFolder('Zoom');
    zoomControl = add(zoom, 'zoomFactor', 'View scale', .33, 2, .01);
    zoom.add({
      Reset: () => setSetting('zoomFactor', 1)
    }, 'Reset');
    const automation = menu.addFolder('Automation');
    add(automation,'RightClickDoors','ПКМ: двери');
    for (const key of ['SAutoLootEnabled', 'FAutoLootEnabled', 'LootDataEnabled', 'AutoTakeEnabled', 'AntiKickEnabled', 'OpenEverythingByClick']) add(automation, key);
    add(automation,'AutoBuiledEnabled','AutoBuild').domElement.title = 'Ставит выбранный блок в допустимую клетку предпросмотра под курсором.';
    const filter = automation.addFolder('Loot filter');
    for (const [name, item] of Object.entries(LootData)) filter.add(item, 'acquire').name(name).onChange(persist);
    const keys = menu.__folders.Keyboard || menu.addFolder('Keyboard');
    for (const key of ['AutoBuiledKey', 'SAutoLootKey', 'FAutoLootKey', 'AutoTakeKey', 'XrayKey', 'PlayersListKey']) {
      const c = keys.add(MOD, key), input = c.domElement.querySelector('input');
      input.readOnly = true;
      listen(input, "click", () => {
        waitingKey = key;
        input.blur();
        input.value = 'Press a key';
      });
    }
    const players = menu.addFolder('Players');
    add(players, 'PlayerId', 'Player ID');
    players.add({
      CopyNick: () => copyNickname(Number(MOD.PlayerId))
    }, 'CopyNick').name('Copy nickname');
    players.add({
      CopyAll: () => copyText([...new Set(records.filter(r=>r.type===B.categories.player).map(r=>r.e.ᴘ४１))].map(nickname).filter(Boolean).join('\n'))
    }, 'CopyAll').name('Copy all nicknames');
    players.add(clipboardState,'status').name('Copy status').listen().domElement.querySelector('input').readOnly=true;
    const token = menu.addFolder('Token changer');
    token.add(MOD, 'Token').name('Token');
    token.add({
      Copy: () => copyText(['token', 'tokenId', 'userId'].map(k => JSON.stringify(localStorage.getItem(k) || '')).join(' '))
    }, 'Copy');
    const tokenStatus = {
      status: 'Changes apply on next connection'
    };
    token.add({
      Change: () => {
        let parsed;
        try {
          const raw = String(MOD.Token).trim();
          let i = 0;
          parsed = [];
          while (i < raw.length) {
            if (raw.charCodeAt(i) !== 34) throw Error();
            const start = i++;
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
          if (parsed.length !== 3 || parsed.some(x => typeof x !== 'string' || !x.trim())) throw Error();
        } catch (_) {
          tokenStatus.status = 'Invalid input; nothing changed';
          alert('Expected exactly three nonempty quoted strings: token tokenId userId');
          return;
        }
        const keys = ['token', 'tokenId', 'userId'];
        let previous;
        try {
          previous = keys.map(k => localStorage.getItem(k));
          keys.forEach((k, i) => localStorage.setItem(k, parsed[i]));
        } catch (_) {
          if (previous) keys.forEach((k, i) => {
            try {
              previous[i] === null ? localStorage.removeItem(k) : localStorage.setItem(k, previous[i]);
            } catch (_) {}
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
    const tokenInfo = token.add(tokenStatus, 'status').name('Status').listen();
    tokenInfo.domElement.querySelector('input').readOnly = true;
    const chat = menu.addFolder('Chat');
    add(chat, 'SpamChatText', 'Text');
    add(chat, 'SpamChatEnabled', 'Repeat message');
    const chatStatus = chat.add(chatState, 'status').name('Status').listen();
    chatStatus.domElement.querySelector('input').readOnly = true;
    const connection = menu.addFolder('Connection');
    const connectionStatus = connection.add(reconnect, 'status').name('Status').listen();
    connectionStatus.domElement.querySelector('input').readOnly = true;
    connection.add({CopyReport:()=>copyText(JSON.stringify(connectionInfo(),null,2))},'CopyReport').name('Копировать отчёт входа');
    const config = menu.addFolder('Config');
    config.add({
      Save: persist
    }, 'Save');
    config.add({
      Reset: () => {
        Object.assign(MOD, defaults);
        for (const item of lootItems) LootData[item.name].acquire = item.acquire;
        persist();
        menu.updateDisplay();
      }
    }, 'Reset');
  }
  if (document.readyState === 'loading') listen(window, 'DOMContentLoaded', () => {
    try {
      createMenu();
    } catch (e) {
      report(e);
    }
  }); else createMenu();
  aimModule.start();
  nextFrame = window.requestAnimationFrame(tick);
  return {
    settings: MOD,
    beforeFire,
    afterFire:()=>aimModule.afterFire(),
    afterRelease:()=>aimModule.afterRelease(),
    onMove:move=>aimModule.onMove(move),
    onHandshake:()=>{lastSentAngle=null;aimModule.onHandshake();},
    onSessionStart:resetAimForSession,
    nativePacketAngle:angle=>playing()&&!Aimbot.dead?Aimbot.packetAngle(angle):angle,
    // Compatibility property: the source replaces the primary angle argument
    // through packetAngle and retains native direction clocks and sends.
    get controlsAimDirection() { return false; },
    get jitterAngle() { return null; },
    get aimRenderAngle() { return null; },
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
    get doorInteraction(){updateDoorInteraction();return {...doorInteraction,pending:!!pendingDoor};},
    clanColor,
    prepareClanTag,
    playerLabel,
    preparePlayerLabel,
    observePlayerSpawn,
    observePlayerLeave,
    zoomOffset,
    render(now = performance.now()) {
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
      } catch (e) {
        report(e);
      }
    },
    get records() {
      return records;
    },
    get menu() {
      return menu;
    },
    get playerList() { return playerListPanel; },
    get overlay() {
      return overlay;
    },
    get functionList() {
      return functionList;
    },
    dispose() {
      aimModule.dispose();

      MOD.zoomFactor = 1;
      MOD.AimBotEnabled = false;
      MOD.XrayBuildings = false;
      MOD.ShowMines = false;
      MOD.ShowWires = false;
      stopped = true;
      removeSocketObservers();
      adGate = null;
      for (const [widget,entries] of widgetWrappers) for (const [method,entry] of Object.entries(entries)) if (widget[method] === entry.wrapped) widget[method] = entry.original;
      window.cancelAnimationFrame(nextFrame);
      removers.forEach(f => f());
      if (menu) menu.destroy();
      if (overlayHost) overlayHost.remove();
      Object.assign(B.network, originals);
    }
  };
}
