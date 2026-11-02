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
      this.resolverType = "linear";
      this.ShowRealAngles = "withAim";
      this.target = "players";
      this.AimBotEnabled = false;
      this.mouseFovEnable = true;
      this.distanceCoefficient = 300;
      this.bulletSpeedCoefficient = 4;
      this.offsetCoefficient = 0.1;
      this.visualizeResolving = true;
      this.visualizeResolvingColor = "#EEEEEE";
      this.autoFire = false;
      this.lockId = -1;
      this.mouseFov = 12345;
      this.OpenEverythingByClick = true;
      this.ShowBuildingOwner = true;
      this.AimbotKey = "Space";
      this.AutoBuiledKey = "KeyB";
      this.SAutoLootKey = "KeyX";
      this.FAutoLootKey = "KeyQ";
      this.AutoTakeKey = "KeyT";
      this.ShowMines = true;
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
  Object.assign(MOD, {zoomFactor:1, showFunctionList:true});
  const defaults = JSON.parse(JSON.stringify(MOD));
  const SAVE = 'DevastILM:settings:v3', LEGACY_SAVE = 'BestModMenuConfig';
  const transient = new Set(['Token', 'token', 'tokenId', 'userId']);
  const keySettings = ['AimbotKey','AutoBuiledKey','SAutoLootKey','FAutoLootKey','AutoTakeKey','XrayKey','PlayersListKey','ModMenuKey'];
  const limits = {mouseFov:[1,20000],lockId:[-1,65535],distanceCoefficient:[10,1000],offsetCoefficient:[0,3],bulletSpeedCoefficient:[1,15],zoomFactor:[.33,2],Xraytransparency:[.05,1]};
  const choices = {target:['players','ghouls','all'],ShowRealAngles:['always','withAim']};
  function validateSetting(key,value) {
    if (!Object.prototype.hasOwnProperty.call(defaults,key) || typeof value !== typeof defaults[key]) throw new Error('Invalid setting: '+key);
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Invalid numeric setting');
    if (limits[key] && (value < limits[key][0] || value > limits[key][1])) throw new Error('Setting out of range: '+key);
    if (key === 'lockId' && !Number.isInteger(value)) throw new Error('Player ID must be an integer');
    if (choices[key] && !choices[key].includes(value)) throw new Error('Invalid choice: '+key);
    if (keySettings.includes(key) && !/^(Key[A-Z]|Digit[0-9]|F(?:[1-9]|1[0-2])|Space|Escape|Tab|Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash|Arrow(?:Up|Down|Left|Right)|(?:Shift|Control|Alt|Meta)(?:Left|Right)|Enter|Backspace|Delete|Insert|Home|End|PageUp|PageDown|Numpad\w+)$/.test(value)) throw new Error('Invalid key code');
    return value;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE) || localStorage.getItem(LEGACY_SAVE) || '{}');
    for (const key of Object.keys(defaults)) {
      if (!transient.has(key) && Object.prototype.hasOwnProperty.call(saved,key)) {
        try { MOD[key] = validateSetting(key,saved[key]); } catch (_) {}
      }
    }
    if (localStorage.getItem(SAVE + ':ilm2') !== '1' && localStorage.getItem(LEGACY_SAVE + ':ilm2') !== '1') {
      for (const key of ['AimBotEnabled', 'AimbotKey', 'autoFire', 'target', 'mouseFovEnable', 'mouseFov', 'lockId', 'distanceCoefficient', 'bulletSpeedCoefficient', 'resolverType', 'offsetCoefficient', 'visualizeResolving', 'visualizeResolvingColor', 'ShowRealAngles']) MOD[key] = defaults[key];
      const migrated = {};
      for (const key of Object.keys(defaults)) if (!transient.has(key)) migrated[key] = MOD[key];
      localStorage.setItem(SAVE, JSON.stringify(migrated));
      localStorage.setItem(SAVE + ':ilm2', '1');
    }
  } catch (_) {}
  const usedKeys = new Set();
  for (const key of keySettings) {
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
  // One consistent native view per aim operation; reuse metadata objects between ticks.
  const aimSelf={id:0,team:-1}, aimTeams=new Map();
  let aimDepth=0, aimEpoch=0;
  function aimSnapshot(callback) {
    if(aimDepth===0) {
      aimSelf.id=B.world.ᅠᏧ‍?.id || 0;
      aimSelf.team=teamId(aimSelf.id);
      aimEpoch++;
    }
    aimDepth++;
    try { return callback(); } finally { aimDepth--; }
  }
  const ilmWorld = {
    get PLAYER() {
      if(!aimDepth) {aimSelf.id=B.world.ᅠᏧ‍?.id || 0;aimSelf.team=teamId(aimSelf.id);}
      return aimSelf;
    },
    players:new Proxy({}, {get:(_, key)=>{
      if(typeof key==='symbol')return undefined;
      const id=Number(key);
      let entry=aimTeams.get(id);
      if(!entry) {entry={team:-1,epoch:-1};aimTeams.set(id,entry);}
      if(!aimDepth||entry.epoch!==aimEpoch) {entry.team=teamId(id);entry.epoch=aimEpoch;}
      return entry;
    }})
  };
  const ilm = __createIlmAim(MOD, ilmWorld, packet=>__send(packet,true));
  const GetAllTargets = ilm.targets, Aimbot = ilm.aim;
  // Delegate to the unchanged ILM methods; cache only the native metadata adapter.
  for(const key of ['resolve','findNearestPlayerTo']) {
    const method=Aimbot[key];
    Object.defineProperty(Aimbot,key,{value:function(...args){return aimSnapshot(()=>method.apply(this,args));}});
  }
  Aimbot.mouseDown = false;
  // ILM owns lastId and its death reset on the 50 ms tick. A temporary socket
  // failure or a newly received player ID must not erase packet history.
  Aimbot.refresh = () => { if (!stopped) aimSnapshot(()=>ilm.tick()); };
  const _players_list = [];
  const removers = [];
  const originalSender = B.network.ᴎᚂρ.bind(B.network);
  const originals = {};
  const diagnostics = {
    frames: 0,
    errors: [],
    commands: 0,
    deduplicatedAngles: 0
  };
  let overlay, overlayHost, ctx, menu, functionList, zoomControl, nextFrame, stopped = false, waitingKey = null;
  let lastStep = -Infinity, lastLoot = -Infinity, lastBuild = -Infinity;
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
  let lastSentAngle = null;
  function __send(value, forceAngle = false) {
    if (!playing()) return false;
    const packet = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(packet) || packet.length === 0 || packet.some(x => typeof x !== 'number' || !Number.isFinite(x))) return false;
    if (packet[0] === 6) {
      if (packet.length !== 2) return false;
      packet[1] = (Math.round(packet[1]) % 360 + 360) % 360;
      if (!forceAngle && packet[1] === lastSentAngle) {
        diagnostics.deduplicatedAngles++;
        return true;
      }
    }
    originalSender(JSON.stringify(packet));
    if (packet[0] === 6) lastSentAngle = packet[1];
    diagnostics.commands++;
    return true;
  }
  function persist() {
    refreshLootFilter();
    const saved = {};
    for (const key of Object.keys(defaults)) if (!transient.has(key)) saved[key] = MOD[key];
    try {
      localStorage.setItem(SAVE, JSON.stringify(saved));
      localStorage.setItem(SAVE + ':ilm2', '1');
      localStorage.setItem(SAVE + ':loot', JSON.stringify(Object.fromEntries(Object.entries(LootData).map(([k, v]) => [k, v.acquire]))));
    } catch (_) {}
  }
  function setSetting(key, value) {
    if (stopped) throw new Error('Mod has been disposed');
    validateSetting(key,value);
    if (keySettings.includes(key)) {
      const conflict = keySettings.find(other=>other!==key && MOD[other]===value);
      if (conflict) MOD[conflict] = MOD[key];
    }
    MOD[key] = value;
    if (key === 'SpamChatEnabled') {
      chatState.status = value ? 'Waiting for game' : 'Off';
      if (value) {
        lastChat = -Infinity;
        nextChatAt = -Infinity;
      }
    }
    if (key === 'SAutoLootEnabled' && value) MOD.FAutoLootEnabled = false;
    if (key === 'FAutoLootEnabled' && value) MOD.SAutoLootEnabled = false;
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
  // Decode only the current protocol here; prediction/history methods remain ILM's.
  function trackPacket(type, playerId, uid, x, y, active) {
    const group=type===B.categories.player?GetAllTargets.players:type===13?GetAllTargets.ghouls:null;
    const id=type===B.categories.player?playerId:uid;
    if(!group || !Number.isInteger(id) || id<(active?1:0) || id>65535) return;
    // Fill any extended slots: original ILM iterates densely over both arrays.
    while(group.length<=id) group.push(new ilm.Target(group.length));
    if(!active) { group[id].setInactive(); return; }
    if(Number.isFinite(x)&&Number.isFinite(y)) group[id].update(x,y);
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
    const signature = String(MOD.ShowNamesOnMap) + '|' + id + '|' + String(meta.ο̏︇ || '');
    if (playerLabelCache.get(meta)?.signature !== signature) {
      meta.а༠٥ = null;
      playerLabelCache.set(meta, {
        id,
        signature
      });
    }
  }
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
    const result = [];
    for (let type = 0; type < B.entities.border.length; type++) {
      const border = B.entities.border[type], group = B.entities.ᴎ̂２[type];
      if (!border || !group) continue;
      for (let i = 0; i < border.border; i++) {
        const e = group[border.ⲣᴑᴏ[i]];
        if (e && e.е̝ހ === 0 && Number.isFinite(e.x) && Number.isFinite(e.y)) result.push({
          type,
          e
        });
      }
    }
    return result;
  }
  function updateTargets() {
    for (const {type, e} of records) if (type === B.categories.player && playerMeta(e.ᴘ४１) && typeof playerMeta(e.ᴘ४１).ο̏︇ === 'string') _players_list[e.ᴘ४１] = playerMeta(e.ᴘ४１).ο̏︇;
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
    return {
      x: (cursor.x - r.left) * can.width / r.width / v.scale - v.x,
      y: (cursor.y - r.top) * can.height / r.height / v.scale - v.y
    };
  }
  function updateMouse() {
    if (!MOD.mouseFovEnable) return;
    const point = cursorWorld(GetAllTargets.mousePosition);
    if (point) GetAllTargets.mouseMapCords = point;
  }
  function automate(now) {
    const me = B.world.ᅠᏧ‍;
    if (!B.synchronizedRender && MOD.FAutoLootEnabled) scanFastLoot();
    if (MOD.SAutoLootEnabled && !MOD.FAutoLootEnabled && now - lastLoot >= 200) {
      lastLoot = now;
      const loot = records.filter(r => r.type === B.categories.loot && (r.e.x - me.x) ** 2 + (r.e.y - me.y) ** 2 < 50000 && lootAllowed(r.e));
      loot.sort((a, b) => (a.e.x - me.x) ** 2 + (a.e.y - me.y) ** 2 - ((b.e.x - me.x) ** 2 + (b.e.y - me.y) ** 2));
      for (const {e} of loot.slice(0, 1)) __send([12, e.id]);
    }
    if (MOD.AutoBuiledEnabled && me.ε︁ᚂ === 1 && me.օⲥᚁ === 1 && now - lastBuild >= 120) {
      const packet = [14, me.α०ᚂ, me.ρⲅ️, me.ᴎ︆ࡉ];
      if (packet.every(Number.isFinite)) {
        __send(packet);
        lastBuild = now;
      }
    }
    if (MOD.AutoTakeEnabled && Aimbot.mouseDown && me.ᴉᄁ͏ === 1 && now - lastTake >= 200) {
      const slots = me.ᴘϲ๓, count = me.ᅠܓ̃;
      if (Array.isArray(slots) && Number.isInteger(count)) {
        const slot = slots.findIndex((item,index)=>index < count && Array.isArray(item) && Number.isFinite(item[0]) && item[0] > 0);
        if (slot >= 0) __send([27, slot]);
      }
      lastTake = now;
    }
    if (MOD.AntiKickEnabled && now - lastKeepAlive >= 7000) {
      __send([0]);
      lastKeepAlive = now;
    }
    updateChat(now);
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
    const wait = B.network.іߐ̸(text);
    if (wait === 0) {
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
  function scanFastLoot() {
    if (!playing() || !MOD.FAutoLootEnabled) return;
    // ILM visits every nearby drop on each frame, independently of the game's
    // single cursor-selected interaction. fastDist in ILM is squared distance.
    const me = B.world.ᅠᏧ‍, type = B.categories.loot, border = B.entities.border[type], group = B.entities.ᴎ̂２[type];
    if (border && group) for (let i = 0; i < border.border; i++) {
      const e = group[border.ⲣᴑᴏ[i]];
      if (!e || e.е̝ހ !== 0 || !Number.isInteger(e.id) || !Number.isFinite(e.x) || !Number.isFinite(e.y)) continue;
      const distance = (e.x - me.x) ** 2 + (e.y - me.y) ** 2;
      if (distance < 41000 && (!MOD.LootDataEnabled || allowedLootIds.has(e.Іࡈ５))) __send([12, e.id]);
    }
  }
  function building(r) {
    if ([B.categories.player, B.categories.loot, 13].includes(r.type)) return null;
    const descriptor = B.items[r.e.Іࡈ５ >> 7];
    return descriptor && Number.isInteger(descriptor.ࡀ︂̄) && descriptor.ࡀ︂̄ > 0 ? descriptor : null;
  }
  function lootAllowed(e) {
    const me = B.world.ᅠᏧ‍;
    return me.І๔︊ === 0 && me.ιᄁ८ === e.id && (!MOD.LootDataEnabled || allowedLootIds.has(e.Іࡈ５));
  }
  function openUnderMouse() {
    if (!playing() || !MOD.OpenEverythingByClick) return false;
    const point = cursorWorld();
    if (!point) return false;
    const x = Math.floor(point.x / 100), y = Math.floor(point.y / 100);
    for (const r of records) {
      const d = building(r);
      const me = B.world.ᅠᏧ‍;
      if (d && r.e.αބ̞ === x && r.e.ᴀܛ٤ === y && me.І๔︊ === 2 && me.ⲟܐ༠ === r.e.id && me.с̣ߏ === r.e.ᴘ४１ && me.ࡀ︂̄ === d.ࡀ︂̄) return __send([d.ࡀ︂̄, r.e.id, r.e.ᴘ४１]);
    }
    return false;
  }
  function ensureOverlay() {
    const can = view().ctx?.canvas || document.getElementById('can');
    if (!can) return false;
    if (!overlay) {
      overlay = document.createElement('canvas');
      overlay.id = 'devast-mod-overlay';
      overlayHost = document.createElement('div');
      overlayHost.id = 'devast-mod-layer';
      overlayHost.style.cssText = 'position:fixed;pointer-events:none;z-index:100000;background:transparent;';
      overlay.style.cssText = 'display:block;width:100%;height:100%;background:transparent;';
      overlayHost.attachShadow({
        mode: 'open'
      }).appendChild(overlay);
      document.body.appendChild(overlayHost);
      ctx = overlay.getContext('2d');
    }
    const r = can.getBoundingClientRect();
    if (overlay.width !== can.width) overlay.width = can.width;
    if (overlay.height !== can.height) overlay.height = can.height;
    for (const [key, value] of Object.entries({
      left: r.left + 'px',
      top: r.top + 'px',
      width: r.width + 'px',
      height: r.height + 'px'
    })) if (overlayHost.style[key] !== value) overlayHost.style[key] = value;
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
    functionList.style.display = MOD.showFunctionList ? 'grid' : 'none';
    if (!MOD.showFunctionList) return;
    const height = parseFloat(overlayHost.style.height) || window.innerHeight, rows = Math.ceil(functionRows.size / 2), font = Math.max(8, Math.min(14, (height - 16) / rows - 3)), line = Math.ceil(font + 3);
    functionList.style.fontSize = font + 'px';
    functionList.style.lineHeight = line + 'px';
    functionList.style.gridTemplateRows = 'repeat(' + rows + ', ' + line + 'px)';
    for (const { key, row } of functionRows.values()) {
      const on = key !== null && MOD[key] === true;
      if (row.dataset.enabled === String(on)) continue;
      row.dataset.enabled = String(on);
      row.style.color = on ? '#ffff00' : '#fff';
      row.style.opacity = '1';
      row.style.textShadow = on ? '0 0 7px rgba(255,255,0,.9)' : 'none';
    }
  }
  function draw() {
    if (!playing()) {
      if (ctx && overlay) ctx.clearRect(0, 0, overlay.width, overlay.height);
      if (functionList) functionList.style.display = 'none';
      return;
    }
    if (!ensureOverlay()) return;
    syncFunctionList();
    ctx.clearRect(0, 0, overlay.width, overlay.height);
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
    if (MOD.ShowPosition) text('[' + Math.floor(me.x / 100) + ':' + Math.floor(me.y / 100) + ']', 100, 32, '#fff', 18);
    for (const r of records) {
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
      } else if (MOD.ShowBuildingOwner && building(r)) {
        const point = cursorWorld();
        if (!point) continue;
        const x = Math.floor(point.x / 100), y = Math.floor(point.y / 100);
        if (r.e.αބ̞ === x && r.e.ᴀܛ٤ === y) {
          const p = at(r.e), id = r.e.ᴘ४１;
          text(Number.isInteger(id) && id > 0 ? (nickname(id) ? nickname(id)+' ' : '')+'#'+id : 'Owner unknown', p.x, p.y - 35, clanColor(id), 16);
        }
      }
    }
    const selfRecord = records.find(r => r.type === B.categories.player && r.e.ᴘ४１ === me.id);
    if (MOD.AimBotEnabled && selfRecord) {
      for (const [i, line] of GetAllTargets.lines.entries()) {
        if (i === 0 && !MOD.visualizeResolving) continue;
        if (![line.x1, line.y1, line.x2, line.y2].every(Number.isFinite) || line.x1 === -1 && line.y1 === -1 && line.x2 === -1 && line.y2 === -1) continue;
        if (line.x1 === line.x2 && line.y1 === line.y2) continue;
        const start = at({x:line.x1, y:line.y1});
        const end = at({x:line.x2, y:line.y2});
        ctx.globalAlpha = line.alpha;
        ctx.strokeStyle = i === 0 ? MOD.visualizeResolvingColor : line.color;
        ctx.lineWidth = line.width;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (MOD.PlayersListEnabled) {
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      const left = Math.min(180,overlay.width/3), width = overlay.width-left-12;
      ctx.fillRect(left, 16, width, overlay.height-50);
      let i = 0;
      const ids = new Set(records.filter(r=>r.type === B.categories.player).map(r=>r.e.ᴘ४１));
      for (const id of ids) {
        if (!Number.isInteger(id) || id < 1) continue;
        const clan = validClan(id), col = Math.floor(i / 30), row = i % 30;
        const x=left+width/8+col*width/4,y=35+row*((overlay.height-70)/30);
        ctx.save();ctx.beginPath();ctx.rect(left+col*width/4,16,width/4,overlay.height-50);ctx.clip();
        text(playerLabel(playerMeta(id),id).trim(),x,y,MOD.NicknameColor,13);
        if(clan && clan.name) text('['+clan.name+']',x,y+11,clanColor(id),10);
        ctx.restore();
        i++;
      }
      text('Players: ' + i, overlay.width - 100, overlay.height - 22);
    }
    ctx.restore();
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
    autoBlocked: false
  };
  let automaticJoin = false;
  let nativeLoginDepth = 0;
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
    for (const [key,kind] of [[B.loginKey,'login'],[B.restoreFailureKey,'restoreFailure'],[B.preflightKey,'preflight']]) {
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
        if (n.state === 256) reconnect.freshRequired = true;
        prepareNormalJoin();
        reconnect.pending = true;
        reconnect.phase = 'joining';
        reconnect.deadline = now + 12000;
        reconnect.status = 'Connecting; saved login kept';
        nativeLoginDepth++;
        try { return original.apply(this,args); }
        catch (error) { reconnect.pending = false; reconnect.phase = 'idle'; throw error; }
        finally { nativeLoginDepth--; }
      };
      connectionWrappers.set(key,wrapper);
      n[key] = wrapper;
    }
  }
  function updateReconnect(now) {
    const n = B.network;
    watchConnectionHandlers();
    if (n.state === 1) {
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
      reconnect.pending = false;
      reconnect.phase = 'connecting';
      return;
    }
    if (reconnect.pending && reconnect.phase === 'joining' && now >= reconnect.deadline && n.state === 0) {
      reconnect.pending = false;
      reconnect.phase = 'idle';
      reconnect.generation++;
      reconnect.status = 'Login timed out; retry manually';
    }
    if (n.state === 256 && !reconnect.freshRequired && !reconnect.autoBlocked) markRestoreFailure();
    if ((n.state & (8|16|512|1024)) !== 0) {
      reconnect.pending = false;
      reconnect.status = 'Login rejected; see the game message';
      return;
    }
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
    if (reconnect.attempts >= 3 && !reconnect.freshRequired) {
      reconnect.status = 'Connection failed after ' + reconnect.attempts + ' retries';
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
      if (previousPlayer) {
        previousPlayer = 0;
        records = [];
        _players_list.length = 0;
      }
      chatState.status = MOD.SpamChatEnabled ? 'Waiting for game' : 'Off';
      draw();
      return;
    }
    if (previousPlayer !== B.world.ᅠᏧ‍.id) {
      lastSentAngle = null;
      previousPlayer = B.world.ᅠᏧ‍.id;
      lastLoot = lastBuild = lastTake = now;
      lastChat = nextChatAt = -Infinity;
      lastKeepAlive = now;
    }
    if (!B.synchronizedRender) {
      records = collect();
      updateTargets();
      updateMouse();
    }
    if (!MOD.AimBotEnabled) lastSentAngle = null;
    automate(now);
    if (!B.synchronizedRender) draw();
  }
  function tick(now) {
    if (stopped) return;
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
  // ILM executes its aim loop every 50 ms, independently of rendering.
  const aimTimer = window.setInterval(() => {
    if (stopped) return;
    try { Aimbot.refresh(); } catch (error) { report(error); }
  }, 50);
  // Native direction functions keep updating their timing/angle bookkeeping;
  // reviewed native patches suppress only their send, exactly as ILM does.
  function keyboard(e) {
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
      AimbotKey: 'AimBotEnabled',
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
    if (e.target.closest && e.target.closest('.dg')) return;
    mouse = {
      x: e.clientX,
      y: e.clientY
    };
    if (e.button === 0) {
      Aimbot.mouseDown = true;

    }
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
      if (MOD.OpenEverythingByClick && playing()) e.preventDefault();
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
    for (const key of ['ShowPosition', 'ShowNamesOnMap', 'ShowMines', 'ShowPlayerHitbox', 'KarmaAboveHead', 'ShowBuildingOwner', 'XrayBuildings', 'PlayersListEnabled', 'showFunctionList']) add(visual, key);
    add(visual, 'Xraytransparency', 'Building opacity', .05, 1, .05);
    for (const key of ['TeamClanColor', 'EnemyClanColor','NicknameColor']) visual.addColor(MOD, key).onChange(persist);
    const aim = menu.addFolder('Aim bot');
    for (const key of ['AimBotEnabled', 'autoFire', 'visualizeResolving']) add(aim, key);
    add(aim, 'bulletSpeedCoefficient', 'bulletSpeedCoefficient', 1, 15, .25);
    add(aim, 'ShowRealAngles', 'Show real angles', ['always', 'withAim']);
    add(aim, 'target', 'Target', ['players', 'ghouls', 'all']);
    add(aim, 'mouseFovEnable', 'Target near cursor');
    add(aim, 'mouseFov', 'Cursor range', 1, 20000, 1);
    add(aim, 'lockId', 'Lock player ID', -1, 65535, 1);
    add(aim, 'distanceCoefficient', 'Distance coefficient', 10, 1000, 10);
    add(aim, 'offsetCoefficient', 'Prediction offset', 0, 3, .1);
    aim.addColor(MOD, 'visualizeResolvingColor').onChange(persist);
    const zoom = menu.addFolder('Zoom');
    zoomControl = add(zoom, 'zoomFactor', 'View scale', .33, 2, .01);
    zoom.add({
      Reset: () => setSetting('zoomFactor', 1)
    }, 'Reset');
    const automation = menu.addFolder('Automation');
    for (const key of ['SAutoLootEnabled', 'FAutoLootEnabled', 'LootDataEnabled', 'AutoBuiledEnabled', 'AutoTakeEnabled', 'AntiKickEnabled', 'OpenEverythingByClick']) add(automation, key);
    const filter = automation.addFolder('Loot filter');
    for (const [name, item] of Object.entries(LootData)) filter.add(item, 'acquire').name(name).onChange(persist);
    const keys = menu.addFolder('Keyboard');
    for (const key of ['AimbotKey', 'AutoBuiledKey', 'SAutoLootKey', 'FAutoLootKey', 'AutoTakeKey', 'XrayKey', 'PlayersListKey', 'ModMenuKey']) {
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
  nextFrame = window.requestAnimationFrame(tick);
  return {
    settings: MOD,
    targets: GetAllTargets,
    trackPacket,
    aim: Aimbot,
    loot: LootData,
    diagnostics,
    chat: chatState,
    clipboard: clipboardState,
    copyNickname,
    reconnect,
    step,
    setSetting,
    openUnderMouse,
    clanColor,
    prepareClanTag,
    playerLabel,
    preparePlayerLabel,
    zoomOffset,
    render(now = performance.now()) {
      if (stopped) return;
      try {
        if (B.synchronizedRender && playing()) {
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
    get overlay() {
      return overlay;
    },
    get functionList() {
      return functionList;
    },
    dispose() {
      MOD.zoomFactor = 1;
      MOD.AimBotEnabled = false;
      MOD.XrayBuildings = false;
      MOD.ShowMines = false;
      stopped = true;
      window.clearInterval(aimTimer);
      window.cancelAnimationFrame(nextFrame);
      removers.forEach(f => f());
      if (menu) menu.destroy();
      if (overlayHost) overlayHost.remove();
      Object.assign(B.network, originals);
    }
  };
}
