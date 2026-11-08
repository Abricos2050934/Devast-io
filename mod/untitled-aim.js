function __untitledAimDefaults(){
function Settings() {
    this.AimbotKey = "KeyZ";
    this.AntiAimbotKey = "NoKey";
    this.JitterKey = "KeyJ";
    this.SpinKey = "KeyU";
    this.ModMenuKey = "KeyH";
    this.StrafeWSKey = "KeyG";
    this.StrafeADKey = "KeyK";

    this.AimBotEnabled = false;
    this.hideAimbotAngle = false;
    this.hidePlayerAngle = false;
    this.ShowRealAngles = "withAim";
    this.resolverType = "linear";

    /* speed — always-on snap, 1ms tick, no skipped packets */
    this.aimTickRate = 1;
    this.instantAim = true;        /* aim at where the enemy is NOW + where he goes, re-aim on every enemy packet */
    this.instantMaxExtrap = 3;     /* max ticks of position extrapolation */
    this.smoothLine = true;        /* line glides toward the predicted point */
    this.smoothLineMs = 45;        /* 0 = instant line (and instant aim if AimAlongLine) */
    this.aimAlongLine = true;      /* send aim at the (possibly smoothed) line tip */
    this.ignoreTeammates = true;
    this.idleTickRate = 100;
    this.turboAim = true;
    this.sendOnlyOnChange = false;

    this.mouseFovEnable = true;
    this.mouseFov = 12345;
    this.distanceCoefficient = 300;
    this.bulletSpeedCoefficient = 4;
    this.offsetCoefficient = 0.1;

    /* per weapon */
    this.perWeaponEnabled = true;
    this.weaponMode = "Auto per weapon";
    this.pauseInGameGui = true;
    this.trigAim = true;
    this.trigIterations = 8;
    this.detectedWeapon = "Other";
    this.spearDistance = 60;
    this.spearBulletSpeed = 1;
    this.spearOffset = 0;
    this.sniperDistance = 80;
    this.sniperBulletSpeed = 1;
    this.sniperOffset = 0;
    this.ak47Distance = 80;
    this.ak47BulletSpeed = 1;
    this.ak47Offset = 0;
    this.otherDistance = 80;
    this.otherBulletSpeed = 1;
    this.otherOffset = 0;
    this.stickyTarget = true;
    this.stickyRadius = 400;

    this.visualizeResolving = true;
    this.visualizeResolvingColor = "#FFF200";

    this.autoFire = false;                 /* new: instant fire only with clear line of sight */
    this.autoFireCheckObstacles = true;
    this.obstacleRadius = 42;              /* size of a block/tree for the sight check */
    this.autoFireLine = true;
    this.lockId = -1;
    this.target = "players";
    this.TargetTeammate = false;

    /* self predict */
    this.selfPredictEnabled = true;
    this.selfPredictCoefficient = 1.5;
    this.selfPredictAffectsAim = true;
    this.selfPredictLine = true;
    this.selfPredictColor = "#00FF88";

    /* anti-anti-aim (resolver against spinning enemies) */
    this.AntiAntiAim = true;
    this.antiAntiAimMode = "smart";
    this.antiAntiAimLine = true;
    this.antiAntiAimColor = "#FF00FF";
    this.antiAntiAimStrength = 1;          /* 0..1: how hard to pull aim to the strafe center */
    this.aaaMinReversals = 3;              /* direction flips needed to count as spam */
    this.aaaSlowInterval = 520;            /* ms: flips slower than this = normal walking */
    this.aaaWindow = 1600;                 /* ms of history analysed */
    this.aaaReleaseMs = 260;               /* ms to keep resolver after spam stops */
    this.aaaDeadzone = 0.6;                /* min move per tick to count as a key press */

    this.jitterActive = false;
    this.jitterOffset = 85;
    this.stopJittersOnStop = false;

    /* spin 360 */
    this.spinActive = false;
    this.spinSpeed = 25;
    this.spinStopOnFire = true;

    this.AntiAimbot = false;
    this.antiAimMode = "At target";
    this.antiAimSpeed = 18;
    this.antiAimStrafe = true;
    this.antiAimCoefficient = 100;
    this.strafeMode = "A/D";
    this.strafeInterval = 20;              /* ms between key switches (lower = faster) */
    this.strafeBlockRealMove = true;       /* ignore your own WASD while strafing */

    this.ShowGauges = true;
    this.ShowMines = true;
    this.ShowSpikes = true;
    this.ShowWires = true;
    this.ShowNamesOnMap = true;
    this.ShowHousesNamesOnMap = true;
    this.ShowKarmaOnPlayers = false;
  }
const defaults=new Settings();for(const key of ["ShowGauges","ShowMines","ShowSpikes","ShowWires","ShowNamesOnMap","ShowHousesNamesOnMap","ShowKarmaOnPlayers"])delete defaults[key];return defaults;
}
// Compatibility marker for existing Resource Override loaders: function __createIlmAim
// Imported from Untitled-1_mod_v4.js; native data, transport and lifecycle are adapted below.
function __createUntitledAim(MOD,environment){
  "use strict";
  const actualWindow=environment.window,actualDocument=environment.document;
  let disposed=false,started=false;const frames=new Set(),timeouts=new Set(),registrations=[],attached=[];
  const globalThis={get __heldItemDef(){return environment.heldItem?.();}};
  const setTimeout=(fn,ms)=>{if(disposed)return 0;const id=actualWindow.setTimeout(()=>{timeouts.delete(id);if(!disposed)fn();},ms);timeouts.add(id);return id;};
  const clearTimeout=id=>{timeouts.delete(id);actualWindow.clearTimeout(id);};
  const requestAnimationFrame=fn=>{if(disposed)return 0;const id=actualWindow.requestAnimationFrame(time=>{frames.delete(id);if(!disposed)fn(time);});frames.add(id);return id;};
  function register(target,name,fn,capture){const callback=event=>{if(disposed)return;fn(event);if(name==='keydown'&&[MOD.AimbotKey,MOD.AntiAimbotKey,MOD.StrafeWSKey,MOD.StrafeADKey,MOD.JitterKey,MOD.SpinKey,MOD.ModMenuKey].includes(event.code))environment.persist?.();};const entry=[target,name,callback,capture];registrations.push(entry);if(started){target.addEventListener(name,callback,capture);attached.push(entry);}}
  const window={Math:actualWindow.Math||Math,JSON:actualWindow.JSON||JSON,requestAnimationFrame,setTimeout,clearTimeout,addEventListener:(...args)=>register(actualWindow,...args)};
  const document={get activeElement(){return actualDocument.activeElement;},addEventListener:(...args)=>register(actualDocument,...args)};
  var AimbotStrafe,GetAllTargets,Aimbot,AimbotJitter,AimbotAntiAim,AimbotSpin,AimbotSelfPredict,AimbotResolver;
  var __aimHub={transport:packet=>environment.send(packet)};
var RAD = 180 / Math.PI;
function getDistance(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
function norm360(a) {
    return ((a % 360) + 360) % 360;
  }
function angleBetween(from, to) {
    return norm360(Math.atan2(to.y - from.y, to.x - from.x) * RAD);
  }
var weaponNameCache = { def: null, name: "Other" };
function readHeldWeaponName() {
    var def = globalThis.__heldItemDef;
    if (!def) return "Other";
    if (weaponNameCache.def === def) return weaponNameCache.name;
    var found = "Other";
    try {
      var detail = def.detail || def;
      for (var k in detail) {
        var v = detail[k];
        if (typeof v === "string") {
          var low = v.toLowerCase();
          if (low === "spear" || low.indexOf("spear") === 0) { found = "Spear"; break; }
          if (low === "sniper" || low.indexOf("sniper") === 0) { found = "Sniper"; break; }
          if (low === "ak47" || low === "ak-47") { found = "AK47"; break; }
        }
      }
    } catch (e) {}
    weaponNameCache.def = def;
    weaponNameCache.name = found;
    return found;
  }
function weaponParams() {
    var w = readHeldWeaponName();
    MOD.detectedWeapon = w;
    if (MOD.weaponMode === "Custom for all" || !MOD.perWeaponEnabled) {
      return { d: MOD.distanceCoefficient, b: MOD.bulletSpeedCoefficient, o: MOD.offsetCoefficient };
    }
    if (w === "Spear") return { d: MOD.spearDistance, b: MOD.spearBulletSpeed, o: MOD.spearOffset };
    if (w === "Sniper") return { d: MOD.sniperDistance, b: MOD.sniperBulletSpeed, o: MOD.sniperOffset };
    if (w === "AK47") return { d: MOD.ak47Distance, b: MOD.ak47BulletSpeed, o: MOD.ak47Offset };
    return { d: MOD.otherDistance, b: MOD.otherBulletSpeed, o: MOD.otherOffset };
  }
function solveIntercept(me, t, wp) {
    var rx = t.x - me.x, ry = t.y - me.y;
    var dist = Math.sqrt(rx * rx + ry * ry);
    var s = Math.max(1, wp.d) * Math.max(1, wp.b);
    var base = dist / s + wp.o;
    if (!MOD.trigAim) return base;
    var vx = t.vx, vy = t.vy;
    var a = vx * vx + vy * vy - s * s;
    var b = 2 * (rx * vx + ry * vy);
    var c = rx * rx + ry * ry;
    var tt = -1;
    if (Math.abs(a) < 1e-6) { if (b !== 0) tt = -c / b; }
    else {
      var disc = b * b - 4 * a * c;
      if (disc >= 0) {
        var sq = Math.sqrt(disc);
        var t1 = (-b - sq) / (2 * a), t2 = (-b + sq) / (2 * a);
        tt = Math.min(t1, t2);
        if (tt < 0) tt = Math.max(t1, t2);
      }
    }
    if (!(tt > 0)) tt = dist / s;
    /* refine: law of cosines iterations */
    for (var i = 0; i < MOD.trigIterations; i++) {
      var fx = rx + vx * tt, fy = ry + vy * tt;
      tt = Math.sqrt(fx * fx + fy * fy) / s;
    }
    return tt + wp.o;
  }
var gameGuiOpen = false;
function inOwnGui(el) {
    return !!(el && el.closest && el.closest(".dg"));
  }
function isGameCanvas(el) {
    return !!(el && el.tagName === "CANVAS");
  }
function aimPaused() { return false; }
function Target(id) {
    this.id = id;
    this.x = -1;
    this.y = -1;
    this.prevX = [-1, -1, -1];
    this.prevY = [-1, -1, -1];
    this.vx = 0;
    this.vy = 0;
    this.lastUpdate = 0;
    this.dt = 50;
    this.active = false;
    this.aaa = { dirX: 0, dirY: 0, segX: 0, segY: 0, flips: [], level: 0, active: false, until: 0, cx: 0, cy: 0 };
  }
Target.prototype.trackStrafe = function (dx, dy, now) {
    /* 8-direction tracking: W,A,S,D and diagonals (AW, AS, DS, DW...).
       A "flip" = new direction differs from previous by >= 90 deg
       (WS, AD, AW<->AS, AW<->DS, W<->A, WD<->SD, etc.) */
    var a = this.aaa, dz = MOD.aaaDeadzone;
    var mag = Math.sqrt(dx * dx + dy * dy);
    if (a.dir === undefined) { a.dir = -1; a.seg = now; a.stopAt = 0; }
    if (mag <= dz) {
      /* standing / blocked: short pauses between key presses are part of spam */
      if (!a.stopAt) a.stopAt = now;
      if (now - a.stopAt > MOD.aaaSlowInterval) { a.dir = -1; a.flips.length = 0; }
      this.evalStrafe(now);
      return;
    }
    a.stopAt = 0;
    var t = 0.383 * mag; /* sin(22.5deg) */
    var sx = dx > t ? 1 : dx < -t ? -1 : 0;
    var sy = dy > t ? 1 : dy < -t ? -1 : 0;
    var d = Math.round(((Math.atan2(sy, sx) * RAD) + 360) % 360 / 45) % 8; /* 0..7 */
    if (d !== a.dir) {
      if (a.dir !== -1) {
        var diff = Math.abs(d - a.dir); if (diff > 4) diff = 8 - diff;
        if (diff >= 2) {
          var held = now - a.seg;
          if (held > MOD.aaaSlowInterval) a.flips.length = 0; /* long hold = normal walking */
          a.flips.push({ t: now, axis: diff, held: held, x: this.x, y: this.y });
          a.seg = now;
        }
      } else a.seg = now;
      a.dir = d;
    }
    a.dirX = sx; a.dirY = sy;
    var w = MOD.aaaWindow;
    while (a.flips.length && now - a.flips[0].t > w) a.flips.shift();
    this.evalStrafe(now);
  };
Target.prototype.evalStrafe = function (now) {
    var a = this.aaa, f = a.flips, n = f.length;
    if (n >= MOD.aaaMinReversals) {
      var ints = [];
      for (var i = 1; i < n; i++) ints.push(f[i].t - f[i - 1].t);
      ints.sort(function (p, q) { return p - q; });
      var med = ints[ints.length >> 1] || 0;
      var short = 0;
      for (i = 0; i < n; i++) if (f[i].held <= MOD.aaaSlowInterval) short++;
      if (med > 0 && med <= MOD.aaaSlowInterval && short >= MOD.aaaMinReversals) {
        a.level = med < 140 ? 3 : med < 280 ? 2 : 1; /* 3 very fast, 2 fast, 1 slow */
        a.active = true;
        a.until = f[n - 1].t + Math.max(MOD.aaaReleaseMs, med * 1.6);
        /* oscillation center = mean of flip points (the strafe extremes) */
        var k = Math.min(n, 6), sx = 0, sy = 0;
        for (i = n - k; i < n; i++) { sx += f[i].x; sy += f[i].y; }
        a.cx = sx / k;
        a.cy = sy / k;
      }
    }
    if (a.active && now > a.until) { a.active = false; a.level = 0; a.flips.length = 0; }
  };
Target.prototype.isStrafing = function () {
    if (this.aaa.active) this.evalStrafe(Date.now());
    return this.aaa.active;
  };
Target.prototype.update = function (x, y) {
    var now = Date.now();
    this.active = true;
    this.prevX[2] = this.prevX[1];
    this.prevX[1] = this.prevX[0];
    this.prevX[0] = this.x;
    this.prevY[2] = this.prevY[1];
    this.prevY[1] = this.prevY[0];
    this.prevY[0] = this.y;
    if (this.x !== -1) {
      /* smoothed velocity, keeps the aim stable at high tick rates */
      var dx = x - this.x, dy = y - this.y;
      var dd = dx * dx + dy * dy;
      if (dd === 0 && now - this.lastUpdate < 6) { this.lastUpdate = now; this.evalStrafe(now); return; } /* duplicate packet */
      if (dd > 250000) { this.vx = 0; this.vy = 0; } /* teleport / respawn */
      else if (dx * this.vx + dy * this.vy <= 0 || dd === 0) { this.vx = dx; this.vy = dy; } /* strafe / stop: react instantly */
      else if (MOD.instantAim) { this.vx = dx; this.vy = dy; } /* no smoothing lag */
      else { this.vx = this.vx * 0.25 + dx * 0.75; this.vy = this.vy * 0.25 + dy * 0.75; }
      var iv = now - this.lastUpdate;
      if (iv > 5 && iv < 400) this.dt = this.dt * 0.7 + iv * 0.3;
      if (dd <= 250000) this.trackStrafe(dx, dy, now);
    }
    this.x = x;
    this.y = y;
    this.lastUpdate = now;
    /* instant re-aim: the moment our target moves, send the new angle (no waiting for the loop) */
    if (MOD.instantAim && MOD.AimBotEnabled && Aimbot && Aimbot.currentTarget === this && !Aimbot._instantQueued) {
      Aimbot._instantQueued = true;
      Promise.resolve().then(function () {
        Aimbot._instantQueued = false;
        try { aimbotTick(); } catch (e) {}
      });
    }
  };
Target.prototype.now = function () {
    var el = (Date.now() - this.lastUpdate) / Math.max(5, this.dt);
    if (!(el > 0)) el = 0;
    if (el > MOD.instantMaxExtrap) el = MOD.instantMaxExtrap;
    return { x: this.x + this.vx * el, y: this.y + this.vy * el, vx: this.vx, vy: this.vy };
  };
Target.prototype.speed = function () {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  };
Target.prototype.setInactive = function () {
    this.x = -1;
    this.y = -1;
    this.vx = 0;
    this.vy = 0;
    for (var i = 0; i < 3; i++) {
      this.prevX[i] = -1;
      this.prevY[i] = -1;
    }
    this.active = false;
    this.aaa = { dirX: 0, dirY: 0, segX: 0, segY: 0, flips: [], level: 0, active: false, until: 0, cx: 0, cy: 0 };
  };
function Line(alpha, width, color) {
    this.x1 = -10;
    this.y1 = -10;
    this.x2 = -10;
    this.y2 = -10;
    this.alpha = alpha;
    this.width = width;
    this.color = color;
  }
Line.prototype.reset = function (x1, y1, x2, y2) {
    this.x1 = x1 === undefined ? -10 : x1;
    this.y1 = y1 === undefined ? -10 : y1;
    this.x2 = x2 === undefined ? -10 : x2;
    this.y2 = y2 === undefined ? -10 : y2;
  };
function smoothLineState(l) {
    if (!l) return null;
    var now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    var dt = Math.min(100, now - (l._st || now));
    l._st = now;
    var ms = Number(MOD.smoothLineMs);
    var kk = (!MOD.smoothLine || !(ms > 0)) ? 1 : 1 - Math.exp(-dt / ms);
    if (!l._s || kk >= 1) {
      l._s = [l.x1, l.y1, l.x2, l.y2];
    } else {
      l._s[0] += (l.x1 - l._s[0]) * kk;
      l._s[1] += (l.y1 - l._s[1]) * kk;
      l._s[2] += (l.x2 - l._s[2]) * kk;
      l._s[3] += (l.y2 - l._s[3]) * kk;
    }
    return l._s;
  }
GetAllTargets = {
    players: [],
    ghouls: [],
    lines: [],
    mousePosition: { x: 0, y: 0 },
    mouseMapCords: { x: 0, y: 0 },
    selfPosition: { x: 0, y: 0 },
    cameraCenter: { x: 0, y: 0 },
    selfFromPacket: 0,
    getPlayerById: function (id) {
      if (!this.players[id]) this.players[id] = new Target(id);
      return this.players[id];
    },
    getGhoulByUid: function (uid) {
      if (!this.ghouls[uid]) this.ghouls[uid] = new Target(uid);
      return this.ghouls[uid];
    },
    resetLines: function () {
      this.lines.forEach(function (l) {
        l.reset();
      });
    },
    resetAll: function () {
      for (var i = 1; i < this.players.length; i++) if (this.players[i]) this.players[i].setInactive();
      for (var j = 1; j < this.ghouls.length; j++) if (this.ghouls[j]) this.ghouls[j].setInactive();
      this.resetLines();
    }
  };
for (var i = 1; i < 121; i++) GetAllTargets.players[i] = new Target(i);
for (var g = 1; g < 999; g++) GetAllTargets.ghouls[g] = new Target(g);
GetAllTargets.lines.push(new Line(0.6, 1, MOD.visualizeResolvingColor));
GetAllTargets.lines.push(new Line(0.8, 2, MOD.selfPredictColor));
GetAllTargets.lines.push(new Line(0.8, 2, MOD.antiAntiAimColor));
GetAllTargets.lines.push(new Line(0.8, 2, "#0000FF"));
var Obstacles = {
    map: {},
    set: function (type, pid, uid, x, y) {
      if (type === 0 || type === 13) return;
      var k = type + "_" + pid + "_" + uid, o = this.map[k];
      if (!o) { this.map[k] = { x: x, y: y, mobile: false }; return; }
      if (Math.abs(o.x - x) > 2 || Math.abs(o.y - y) > 2) o.mobile = true; /* bullets/loot/animals move -> not a wall */
      o.x = x; o.y = y;
    },
    del: function (type, pid, uid) { delete this.map[type + "_" + pid + "_" + uid]; },
    clear: function () { this.map = {}; },
    blocked: function (ax, ay, bx, by) {
      var r = MOD.obstacleRadius, r2 = r * r, dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
      if (L < 1) return false;
      for (var k in this.map) {
        var o = this.map[k];
        if (o.mobile) continue;
        var t = ((o.x - ax) * dx + (o.y - ay) * dy) / L;
        if (t <= 0.02 || t >= 0.98) continue;
        var cx = ax + dx * t - o.x, cy = ay + dy * t - o.y;
        if (cx * cx + cy * cy < r2) return true;
      }
      return false;
    }
  };
__aimHub.obstacles = Obstacles;
AimbotSelfPredict = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    last: { x: 0, y: 0 },
    predicted: { x: 0, y: 0 },
    sample: function (pos) {
      if (!pos) return;
      if (this.last.x || this.last.y) {
        this.vx = this.vx * 0.5 + (pos.x - this.last.x) * 0.5;
        this.vy = this.vy * 0.5 + (pos.y - this.last.y) * 0.5;
      }
      this.last = { x: pos.x, y: pos.y };
      this.x = pos.x;
      this.y = pos.y;
      var c = MOD.selfPredictEnabled ? MOD.selfPredictCoefficient : 0;
      this.predicted = { x: pos.x + this.vx * c, y: pos.y + this.vy * c };
    },
    origin: function (raw) {
      if (MOD.selfPredictEnabled && MOD.selfPredictAffectsAim) return this.predicted;
      return raw;
    },
    draw: function (raw) {
      var l = GetAllTargets.lines[1];
      if (MOD.selfPredictEnabled && MOD.selfPredictLine) {
        l.color = MOD.selfPredictColor;
        l.reset(raw.x, raw.y, this.predicted.x, this.predicted.y);
      } else {
        l.reset();
      }
    }
  };
AimbotResolver = {
    levelNames: ["off", "slow", "fast", "very fast"],
    active: function (t) {
      return !!(MOD.AntiAntiAim && t && t.isStrafing && t.isStrafing());
    },
    /* while the enemy spams keys: no lead, aim at the center of his strafe */
    correct: function (t, px, py) {
      if (!this.active(t)) return { x: px, y: py };
      var a = t.aaa, s = Math.max(0, Math.min(1, MOD.antiAntiAimStrength));
      /* faster spam -> trust the center more */
      var k = s * (a.level === 3 ? 1 : a.level === 2 ? 0.85 : 0.65);
      return { x: t.x + (a.cx - t.x) * k, y: t.y + (a.cy - t.y) * k };
    },
    draw: function (t) {
      var l = GetAllTargets.lines[2];
      if (!MOD.antiAntiAimLine || !this.active(t)) { l.reset(); return; }
      l.color = MOD.antiAntiAimColor;
      l.reset(t.x, t.y, t.aaa.cx, t.aaa.cy);
    }
  };
Aimbot = {
    lastAngle: 0,
    lastSent: -1,
    currentTarget: null,
    dead: false,
    mouseDown: false,
    refreshing: false,
    _refreshTimer: null,
    _cacheTime: 0,
    _cacheAngle: 0,

    send: function (packet) {
      try {
        if (typeof __aimHub.transport === "function") {
          __aimHub.selfSend = true;
          __aimHub.transport(packet);
        }
      } catch (e) {}
      __aimHub.selfSend = false;
    },

    sendAngle: function (angle, force) {
      angle = norm360(Math.round(angle)) % 360;
      if (!force && !MOD.turboAim && MOD.sendOnlyOnChange && angle === this.lastSent) return;
      this.lastSent = angle;
      this.send([6, angle]);
    },

    scheduleRefresh: function () {
      var self = this;
      this.refreshing = true;
      clearTimeout(this._refreshTimer);
      this._refreshTimer = setTimeout(function () {
        self.refreshing = false;
      }, 140);
    },

    onDeath: function () {
      this.dead = true;
      this.currentTarget = null;
      GetAllTargets.resetAll();
    },

    packetAngle: function (angle) {
      if (MOD.AimBotEnabled && MOD.spinActive && !(MOD.spinStopOnFire && this.mouseDown)) return norm360(Math.round(AimbotSpin.angle));
      if (MOD.AimBotEnabled) return norm360(Math.round(this.resolve(true)));
      if (MOD.AntiAimbot) return norm360(Math.round(AimbotAntiAim.aimAngle()));
      if (MOD.hidePlayerAngle) return norm360(Math.round(angle) + 180);
      return angle;
    },

    selfId: -1,

    getSelfRaw: function () {
      if (GetAllTargets.selfFromPacket && Date.now() - GetAllTargets.selfFromPacket < 2000) {
        return GetAllTargets.selfPosition;
      }
      if (this.selfId > 0 && GetAllTargets.players[this.selfId] && GetAllTargets.players[this.selfId].active) {
        return GetAllTargets.players[this.selfId];
      }
      return GetAllTargets.cameraCenter || GetAllTargets.selfPosition;
    },

    getSelf: function () {
      return AimbotSelfPredict.origin(this.getSelfRaw());
    },

    isSelf: function (t) {
      if (this.selfId > 0 && t.id === this.selfId) return true;
      return getDistance(this.getSelfRaw(), t) < 12;
    },

    findTarget: function (from, maxDistance) {
      var best = null;
      var bestDist = maxDistance;
      var mode = MOD.target || "players";
      var cur = this.currentTarget;

      /* sticky: keep the current target while it stays alive and close enough */
      if (MOD.stickyTarget && !(MOD.mouseFovEnable && from === GetAllTargets.mouseMapCords) && cur && cur.active && !this.isSelf(cur) && getDistance(from, cur) < MOD.stickyRadius) {
        return cur;
      }

      if (mode === "players" || mode === "all") {
        var pl = GetAllTargets.players;
        for (var i = 1; i < pl.length; i++) {
          var p = pl[i];
          if (!p || !p.active) continue;
          if (this.isSelf(p)) continue;
          if (MOD.ignoreTeammates && typeof Aimbot.isTeammate === "function" && Aimbot.isTeammate(i)) continue;
          var d = getDistance(from, p);
          if (d < bestDist) {
            best = p;
            bestDist = d;
          }
        }
      }
      if (mode === "ghouls" || mode === "all") {
        var gl = GetAllTargets.ghouls;
        var meRaw = this.getSelfRaw();
        for (var j = 1; j < gl.length; j++) {
          var gh = gl[j];
          if (!gh || !gh.active) continue;
          if (getDistance(meRaw, gh) < 12) continue;
          var d2 = getDistance(from, gh);
          if (d2 < bestDist) {
            best = gh;
            bestDist = d2;
          }
        }
      }
      return best;
    },

    resolve: function (force) {
      /* turbo: never reuse a cached angle — always recompute */
      var now = Date.now();
      if (!MOD.turboAim && !force && now - this._cacheTime < Math.max(1, MOD.aimTickRate / 2)) return this._cacheAngle;

      var raw = this.getSelfRaw();
      AimbotSelfPredict.sample(raw);
      AimbotSelfPredict.draw(raw);
      var me = this.getSelf();

      var target;
      if (MOD.lockId > -1 && MOD.lockId !== this.selfId && GetAllTargets.players[MOD.lockId] && GetAllTargets.players[MOD.lockId].active) {
        target = GetAllTargets.players[MOD.lockId];
      } else if (MOD.mouseFovEnable) {
        target = this.findTarget(GetAllTargets.mouseMapCords, MOD.mouseFov) || (MOD.mouseFov >= 12345 ? this.findTarget(me, 2500) : null);
      } else {
        target = this.findTarget(me, 2500);
      }
      this.currentTarget = target;

      if (target == null) {
        GetAllTargets.lines[0].reset();
        GetAllTargets.lines[0]._s = null;
        GetAllTargets.lines[2].reset();
        this._cacheTime = now;
        this._cacheAngle = this.lastAngle;
        return this.lastAngle;
      }

      var px, py;
      if (MOD.resolverType === "none") {
        px = target.x;
        py = target.y;
      } else if (AimbotResolver.active(target)) {
        /* anti-anti-aim working: prediction disabled until the spam stops */
        px = target.x;
        py = target.y;
      } else {
        var wp = weaponParams();
        var tp = MOD.instantAim ? target.now() : target;
        var lead = solveIntercept(me, tp, wp);
        px = tp.x + lead * tp.vx;
        py = tp.y + lead * tp.vy;
      }
      var corrected = AimbotResolver.correct(target, px, py);
      px = corrected.x;
      py = corrected.y;
      AimbotResolver.draw(target);

      GetAllTargets.lines[0].color = MOD.visualizeResolvingColor;
      GetAllTargets.lines[0].reset(me.x, me.y, px, py);
      var S = smoothLineState(GetAllTargets.lines[0]);
      if (MOD.aimAlongLine && S) {
        px = S[2];
        py = S[3];
      }
      if (!MOD.visualizeResolving && !MOD.aimAlongLine) {
        GetAllTargets.lines[0].reset();
        GetAllTargets.lines[0]._s = null;
      }

      var angle = norm360(Math.atan2(py - me.y, px - me.x) * RAD);
      this.lastAngle = angle;
      this._cacheTime = now;
      this._cacheAngle = angle;

      return angle;
    },

    hasTarget: function () {
      return this.currentTarget != null;
    }
  };
AimbotJitter = {
    flip: false,
    tick: function () {
      if (Aimbot.mouseDown) return Aimbot.resolve();
      this.flip = !this.flip;
      var base = Aimbot.resolve();
      return norm360(this.flip ? base + MOD.jitterOffset : base - MOD.jitterOffset);
    }
  };
AimbotSpin = {
    angle: 0,
    tick: function () {
      this.angle = norm360(this.angle + MOD.spinSpeed);
      return this.angle;
    }
  };
AimbotAntiAim = {
    angle: 0,
    counter: 1,
    step: 0,
    moves: [1, 2, 4, 8, 1, 2, 4, 8, 5, 9, 10, 6],
    aimAngle: function () {
      var mode = MOD.antiAimMode;
      if (mode === "At target") return norm360(Aimbot.resolve() + 180);
      if (mode === "Spin360") {
        this.angle = norm360(this.angle + MOD.antiAimSpeed);
        return this.angle;
      }
      if (mode === "Round") {
        this.counter++;
        this.angle = norm360(this.angle + MOD.antiAimSpeed * (0.5 + Math.abs((this.counter % 600) - 300) / 600));
        return this.angle;
      }
      if (mode === "Round2") {
        this.counter++;
        return norm360((this.counter % 20) * 18);
      }
      if (mode === "Jitter") {
        this.counter++;
        return norm360(Aimbot.resolve() + (this.counter % 2 ? 180 - MOD.antiAimSpeed : 180 + MOD.antiAimSpeed));
      }
      if (mode === "Static") return norm360(MOD.antiAimCoefficient);
      return norm360(Number(mode) || 0);
    },
    strafe: function () {
      this.step += MOD.antiAimCoefficient;
      var idx = Math.floor(this.step / Math.max(1, MOD.antiAimCoefficient));
      return this.moves[idx % this.moves.length];
    }
  };
var KEYS = { w: false, a: false, s: false, d: false };
var KMAP = { KeyW: "w", KeyA: "a", KeyS: "s", KeyD: "d" };
window.addEventListener("keydown", function (e) { var k = KMAP[e.code]; if (k) KEYS[k] = true; }, true);
window.addEventListener("keyup", function (e) { var k = KMAP[e.code]; if (k) KEYS[k] = false; }, true);
AimbotStrafe = {
    bits: { a: 1, d: 2, s: 4, w: 8 },   /* auto-corrected from your real key presses */
    modes: ["W/S", "A/D", "AW/AS", "DW/DS", "AW/DW", "AS/DS", "AW/DS", "DW/AS", "W/A", "W/D", "S/A", "S/D", "Circle 8", "Random 8"],
    ring: ["w", "dw", "d", "ds", "s", "as", "a", "aw"],
    i: 0, last: -1,
    learn: function (mask) {
      if (!(mask > 0)) return;
      var held = [], k; for (k in KEYS) if (KEYS[k]) held.push(k);
      if (held.length === 1) this.bits[held[0]] = mask;
    },
    running: function () { return !!(MOD.AntiAimbot && MOD.antiAimStrafe && MOD.strafeBlockRealMove); },
    mask: function (combo) {
      var m = 0; for (var n = 0; n < combo.length; n++) m |= this.bits[combo.charAt(n).toLowerCase()] || 0;
      return m;
    },
    next: function () {
      var mode = MOD.strafeMode;
      this.i++;
      if (mode === "Circle 8") return this.ring[this.i % 8];
      if (mode === "Random 8") return this.ring[(Math.random() * 8) | 0];
      return mode.split("/")[this.i % 2];
    },
    tick: function () {
      if (!(MOD.AntiAimbot && MOD.antiAimStrafe) || Aimbot.dead) {
        if (this.last !== -1) { Aimbot.send([2, 0]); this.last = -1; }
        return;
      }
      this.last = this.mask(this.next());
      Aimbot.send([2, this.last]);
    }
  };
var AutoFire = {
    tick: function () {
      var t = Aimbot.currentTarget;
      if (!MOD.autoFire || !t || !t.active || Aimbot.mouseDown) { GetAllTargets.lines[3].reset(); return false; }
      var me = Aimbot.getSelfRaw();
      if (!me) return false;
      var clear = !MOD.autoFireCheckObstacles || !Obstacles.blocked(me.x, me.y, t.x, t.y);
      if (MOD.autoFireLine) {
        GetAllTargets.lines[3].color = clear ? "#00FF00" : "#FF0000";
        GetAllTargets.lines[3].reset(me.x, me.y, t.x, t.y);
      } else GetAllTargets.lines[3].reset();
      if (!clear) return false;
      Aimbot.sendAngle(Aimbot.resolve(true), true);
      Aimbot.send([4]);
      Aimbot.send([5]);
      return true;
    }
  };
function aimbotTick() {
    if (Aimbot.dead) return;

    /* keep the self-predict line alive even without a target */
    var rawSelf = Aimbot.getSelfRaw();
    AimbotSelfPredict.sample(rawSelf);
    AimbotSelfPredict.draw(rawSelf);

    if (MOD.AimBotEnabled && aimPaused()) {
      GetAllTargets.lines[0].reset();
      return;
    }
    if (MOD.AimBotEnabled) {
      var angle = Aimbot.resolve(true);

      if (MOD.spinActive) {
        /* spin while the aimbot is running: keep rotating, and on fire
           snap to the target, shoot, then snap back to the spin angle */
        var spinAngle = AimbotSpin.tick();
        var firing = Aimbot.mouseDown && Aimbot.hasTarget();

        if (firing && MOD.spinStopOnFire) {
          Aimbot.sendAngle(angle, true);
          Aimbot.send([4]);
          Aimbot.send([5]);
        } else if (firing) {
          Aimbot.sendAngle(angle, true);
          Aimbot.send([4]);
          Aimbot.send([5]);
          Aimbot.sendAngle(spinAngle, true);
        } else {
          Aimbot.sendAngle(spinAngle, true);
          if (AutoFire.tick()) Aimbot.sendAngle(spinAngle, true);
        }
      } else {
        if (MOD.jitterActive && !Aimbot.refreshing && (!MOD.stopJittersOnStop || Aimbot.mouseDown)) {
          Aimbot.sendAngle(AimbotJitter.tick(), true);
        } else {
          Aimbot.sendAngle(angle, true);
          if (MOD.hideAimbotAngle) {
            Aimbot.send([6, norm360(Math.round(angle))]);
          }
        }
        AutoFire.tick();
      }
    } else {
      GetAllTargets.lines[0].reset();
      GetAllTargets.lines[2].reset();

      if (MOD.AntiAimbot) {
        Aimbot.sendAngle(AimbotAntiAim.aimAngle(), true);
      }
    }

  }
var guiControllers = [];
function refreshGui() {
    guiControllers.forEach(function (c) {
      try {
        c.updateDisplay();
      } catch (e) {}
    });
  }
function toggleStrafeMode(mode) {
    if (MOD.AntiAimbot && MOD.antiAimStrafe && MOD.strafeMode === mode) {
      MOD.AntiAimbot = false;
    } else {
      MOD.AntiAimbot = true;
      MOD.antiAimStrafe = true;
      MOD.strafeMode = mode;
    }
    refreshGui();
  }
function buildMenu(gui) {
    
    gui.domElement.style.zIndex = 999999;
    __aimHub.gui = gui;

    var aim = gui.addFolder("Aimbot");
    guiControllers.push(aim.add(MOD, "AimBotEnabled").name("AimbotEnabled"));
    guiControllers.push(aim.add(MOD, "target", ["players", "ghouls", "all"]).name("Target"));
    guiControllers.push(aim.add(MOD, "resolverType", ["linear", "none"]).name("ResolverType"));
    guiControllers.push(aim.add(MOD, "weaponMode", ["Auto per weapon", "Custom for all"]).name("WeaponSettings"));
    guiControllers.push(aim.add(MOD, "trigAim").name("TrigonometricAim"));
    guiControllers.push(aim.add(MOD, "trigIterations", 0, 10, 1).name("TrigIterations"));
    guiControllers.push(aim.add(MOD, "aimTickRate", 1, 50, 1).name("AimTickRate(ms)"));
    guiControllers.push(aim.add(MOD, "turboAim").name("TurboAim"));
    guiControllers.push(aim.add(MOD, "sendOnlyOnChange").name("SendOnlyOnChange"));
    guiControllers.push(aim.add(MOD, "stickyTarget").name("StickyTarget"));
    guiControllers.push(aim.add(MOD, "stickyRadius", 50, 2000).name("StickyRadius"));
    guiControllers.push(aim.add(MOD, "hideAimbotAngle").name("HideAimbotAngle"));
    guiControllers.push(aim.add(MOD, "hidePlayerAngle").name("HidePlayerAngle"));
    guiControllers.push(aim.add(MOD, "instantAim").name("InstantAim"));
    guiControllers.push(aim.add(MOD, "instantMaxExtrap", 0, 4, 0.1).name("InstantExtrapTicks"));
    guiControllers.push(aim.add(MOD, "ignoreTeammates").name("IgnoreTeammates"));
    guiControllers.push(aim.add(MOD, "smoothLine").name("SmoothLine"));
    guiControllers.push(aim.add(MOD, "smoothLineMs", 0, 200, 1).name("SmoothLineMs"));
    guiControllers.push(aim.add(MOD, "aimAlongLine").name("AimAlongLine"));
    guiControllers.push(aim.add(MOD, "ShowRealAngles", ["never", "always", "withAim"]).name("ShowRealAngles"));
    guiControllers.push(aim.add(MOD, "mouseFovEnable").name("MouseFovEnable"));
    guiControllers.push(aim.add(MOD, "mouseFov", 50, 12345).name("MouseFov"));
    guiControllers.push(aim.add(MOD, "distanceCoefficient", 1, 1000).name("DistanceCoefficient"));
    guiControllers.push(aim.add(MOD, "bulletSpeedCoefficient", 1, 20).name("BulletSpeedCoefficient"));
    guiControllers.push(aim.add(MOD, "offsetCoefficient", 0, 2).name("OffsetCoefficient"));
    guiControllers.push(aim.add(MOD, "autoFire").name("AutoFire (clear sight)"));
    guiControllers.push(aim.add(MOD, "autoFireCheckObstacles").name("AF CheckObstacles"));
    guiControllers.push(aim.add(MOD, "obstacleRadius", 10, 120, 1).name("AF ObstacleSize"));
    guiControllers.push(aim.add(MOD, "autoFireLine").name("AF ShowLine"));
    guiControllers.push(aim.add(MOD, "TargetTeammate").name("TargetTeammate"));
    guiControllers.push(aim.add(MOD, "lockId", -1, 120).step(1).name("LockId"));
    aim.open();

    var wep = gui.addFolder("Weapons");
    guiControllers.push(wep.add(MOD, "perWeaponEnabled").name("PerWeaponSettings"));
    guiControllers.push(wep.add(MOD, "detectedWeapon").name("Detected").listen());
    var wSpear = wep.addFolder("Spear");
    guiControllers.push(wSpear.add(MOD, "spearDistance", 1, 1000).name("Distance"));
    guiControllers.push(wSpear.add(MOD, "spearBulletSpeed", 1, 20).name("BulletSpeed"));
    guiControllers.push(wSpear.add(MOD, "spearOffset", 0, 2).name("Offset"));
    var wSniper = wep.addFolder("Sniper");
    guiControllers.push(wSniper.add(MOD, "sniperDistance", 1, 1000).name("Distance"));
    guiControllers.push(wSniper.add(MOD, "sniperBulletSpeed", 1, 20).name("BulletSpeed"));
    guiControllers.push(wSniper.add(MOD, "sniperOffset", 0, 2).name("Offset"));
    var wAk = wep.addFolder("AK47");
    guiControllers.push(wAk.add(MOD, "ak47Distance", 1, 1000).name("Distance"));
    guiControllers.push(wAk.add(MOD, "ak47BulletSpeed", 1, 20).name("BulletSpeed"));
    guiControllers.push(wAk.add(MOD, "ak47Offset", 0, 2).name("Offset"));
    var wOther = wep.addFolder("Other weapons");
    guiControllers.push(wOther.add(MOD, "otherDistance", 1, 1000).name("Distance"));
    guiControllers.push(wOther.add(MOD, "otherBulletSpeed", 1, 20).name("BulletSpeed"));
    guiControllers.push(wOther.add(MOD, "otherOffset", 0, 2).name("Offset"));
    wep.open();

    var pred = gui.addFolder("Self Predict");
    guiControllers.push(pred.add(MOD, "selfPredictEnabled").name("SelfPredictEnabled"));
    guiControllers.push(pred.add(MOD, "selfPredictCoefficient", 0, 20).name("SelfPredictCoef"));
    guiControllers.push(pred.add(MOD, "selfPredictAffectsAim").name("AffectsAim"));
    guiControllers.push(pred.add(MOD, "selfPredictLine").name("ShowLine"));
    guiControllers.push(
      pred.addColor(MOD, "selfPredictColor").name("LineColor").onChange(function () {
        GetAllTargets.lines[1].color = MOD.selfPredictColor;
      })
    );
    pred.open();

    var anti2 = gui.addFolder("Anti-Anti-Aim");
    guiControllers.push(anti2.add(MOD, "AntiAntiAim").name("Enabled"));
    guiControllers.push(anti2.add(MOD, "antiAntiAimStrength", 0, 1, 0.05).name("Strength"));
    guiControllers.push(anti2.add(MOD, "aaaMinReversals", 2, 8, 1).name("MinFlips"));
    guiControllers.push(anti2.add(MOD, "aaaSlowInterval", 200, 900, 10).name("SlowLimit ms"));
    guiControllers.push(anti2.add(MOD, "aaaReleaseMs", 100, 800, 10).name("Release ms"));
    guiControllers.push(anti2.add(MOD, "aaaDeadzone", 0, 3, 0.1).name("Deadzone"));
    guiControllers.push(anti2.add(MOD, "antiAntiAimLine").name("ShowLine"));
    guiControllers.push(
      anti2.addColor(MOD, "antiAntiAimColor").name("LineColor").onChange(function () {
        GetAllTargets.lines[2].color = MOD.antiAntiAimColor;
      })
    );

    var lines = gui.addFolder("Lines / Visuals");
    guiControllers.push(lines.add(MOD, "visualizeResolving").name("VisualizeResolving"));
    guiControllers.push(
      lines
        .addColor(MOD, "visualizeResolvingColor")
        .name("LineColor")
        .onChange(function () {
          GetAllTargets.lines[0].color = MOD.visualizeResolvingColor;
        })
    );

    var jit = gui.addFolder("Jitter");
    guiControllers.push(jit.add(MOD, "jitterActive").name("JitterActive"));
    guiControllers.push(jit.add(MOD, "jitterOffset", 1, 180).name("JitterOffset"));
    guiControllers.push(jit.add(MOD, "stopJittersOnStop").name("StopJittersOnStop"));

    var spin = gui.addFolder("Spin 360");
    guiControllers.push(spin.add(MOD, "spinActive").name("SpinActive"));
    guiControllers.push(spin.add(MOD, "spinSpeed", 1, 180).name("SpinSpeed(deg/tick)"));
    guiControllers.push(spin.add(MOD, "spinStopOnFire").name("StopOnFire"));
    spin.open();

    var anti = gui.addFolder("Anti-Aim");
    guiControllers.push(anti.add(MOD, "AntiAimbot").name("AntiAimEnable"));
    guiControllers.push(
      anti.add(MOD, "antiAimMode", ["At target", "Spin360", "Round", "Round2", "Jitter", "Static"]).name("AntiAimMode")
    );
    guiControllers.push(anti.add(MOD, "antiAimSpeed", 1, 180).name("AntiAimSpeed"));
    guiControllers.push(anti.add(MOD, "antiAimStrafe").name("StrafeEnable"));
    guiControllers.push(anti.add(MOD, "strafeMode", AimbotStrafe.modes).name("StrafeMode"));
    guiControllers.push(anti.add(MOD, "strafeInterval", 1, 200, 1).name("StrafeSpeed ms"));
    guiControllers.push(anti.add(MOD, "strafeBlockRealMove").name("BlockMyWASD"));

    var keys = gui.addFolder("Keys");
    guiControllers.push(keys.add(MOD, "AimbotKey").name("AimbotKey"));
    guiControllers.push(keys.add(MOD, "AntiAimbotKey").name("AntiAimbotKey"));
    guiControllers.push(keys.add(MOD, "StrafeWSKey").name("Strafe W/S"));
    guiControllers.push(keys.add(MOD, "StrafeADKey").name("Strafe A/D"));
    guiControllers.push(keys.add(MOD, "JitterKey").name("JitterKey"));
    guiControllers.push(keys.add(MOD, "SpinKey").name("SpinKey"));
    guiControllers.push(keys.add(MOD, "ModMenuKey").name("ModMenuKey"));
  }
  const originalTick=aimbotTick;aimbotTick=function(){if(disposed||!environment.running())return;environment.sync(Aimbot,GetAllTargets);environment.beginCycle();try{return originalTick();}finally{environment.endCycle();}};
  Aimbot.refresh=aimbotTick;Aimbot.isTeammate=id=>!MOD.TargetTeammate&&!!environment.isTeammate?.(id);
  return {aim:Aimbot,targets:GetAllTargets,Target,jitter:AimbotJitter,spin:AimbotSpin,antiAim:AimbotAntiAim,strafe:AimbotStrafe,selfPredict:AimbotSelfPredict,resolver:AimbotResolver,obstacles:Obstacles,autoFire:AutoFire,
    smoothLineState,weaponParams,solveIntercept,tick:aimbotTick,
    sync(){environment.sync(Aimbot,GetAllTargets);},
    start(){if(started||disposed)return;started=true;for(const e of registrations){e[0].addEventListener(e[1],e[2],e[3]);attached.push(e);}
(function strafeLoop() {
    try { AimbotStrafe.tick(); } catch (e) {}
    setTimeout(strafeLoop, (MOD.AntiAimbot && MOD.antiAimStrafe) ? Math.max(1, MOD.strafeInterval) : 50);
  })();
(function loop() {
    try {
      aimbotTick();
    } catch (e) {}
    var active = MOD.AimBotEnabled || MOD.AntiAimbot;
    var wait = active ? Math.max(1, MOD.aimTickRate) : Math.max(16, MOD.idleTickRate);
    if (active && MOD.turboAim) {
      setTimeout(loop, wait);
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(function () { try { aimbotTick(); } catch (e) {} });
      }
    } else {
      setTimeout(loop, wait);
    }
  })();
window.addEventListener("mousemove", function (e) {
    GetAllTargets.mousePosition.x = e.clientX;
    GetAllTargets.mousePosition.y = e.clientY;
    if (MOD.AimBotEnabled && Aimbot.mouseDown && !Aimbot.dead) {
      try { Aimbot.sendAngle(Aimbot.resolve(true), true); } catch (x) {}
    }
  });
document.addEventListener("mousedown", function (e) {
    /* handled by hookGameAttack */
  });
document.addEventListener("mouseup", function (e) {
    if (e.button === 0 && (inOwnGui(e.target) || true)) { /* release comes from game [5]; fallback: */ setTimeout(function(){ Aimbot.mouseDown = false; }, 30); }
  });
window.addEventListener("blur", function () {
    Aimbot.mouseDown = false;
  });
window.addEventListener("keydown", function (e) {
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.repeat) return;
    if (e.code === MOD.AimbotKey) {
      MOD.AimBotEnabled = !MOD.AimBotEnabled;
      if (!MOD.AimBotEnabled) GetAllTargets.resetLines();
      refreshGui();
    } else if (e.code === MOD.AntiAimbotKey) {
      MOD.AntiAimbot = !MOD.AntiAimbot;
      refreshGui();
    } else if (e.code === MOD.StrafeWSKey) {
      toggleStrafeMode("W/S");
    } else if (e.code === MOD.StrafeADKey) {
      toggleStrafeMode("A/D");
    } else if (e.code === MOD.JitterKey) {
      MOD.jitterActive = !MOD.jitterActive;
      refreshGui();
    } else if (e.code === MOD.SpinKey) {
      MOD.spinActive = !MOD.spinActive;
      refreshGui();
    } else if (e.code === MOD.ModMenuKey) {
      if (__aimHub.gui) {
        __aimHub.gui.domElement.style.display =
          __aimHub.gui.domElement.style.display === "none" ? "" : "none";
      }
    }
  });
    },
    installMenu(root){buildMenu(root);return {controllers:guiControllers,folders:root.__folders};},
    afterFire(){if(MOD.AimBotEnabled)Aimbot.sendAngle(Aimbot.resolve(true),true);Aimbot.mouseDown=true;Aimbot.scheduleRefresh();},
    afterRelease(){Aimbot.mouseDown=false;Aimbot.scheduleRefresh();},
    onMove(mask){AimbotStrafe.learn(mask);return !AimbotStrafe.running();},
    onHandshake(){Aimbot.dead=false;environment.sync(Aimbot,GetAllTargets);},
    onOtherDie(id){GetAllTargets.getPlayerById(id).setInactive();GetAllTargets.getGhoulByUid(id).setInactive();},
    render(ctx,view){const canvas=ctx.canvas,rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height||!(view.scale>0))return;const cssScale=view.scale/(canvas.width/rect.width);GetAllTargets.cameraCenter={x:rect.width/2/cssScale-view.x,y:rect.height/2/cssScale-view.y};if(MOD.mouseFovEnable)GetAllTargets.mouseMapCords={x:(GetAllTargets.mousePosition.x-rect.left)/cssScale-view.x,y:(GetAllTargets.mousePosition.y-rect.top)/cssScale-view.y};
      for(let n=0;n<GetAllTargets.lines.length;n++){const l=GetAllTargets.lines[n];if(l.x1===-10&&l.y1===-10&&l.x2===-10&&l.y2===-10){l._s=null;l._st=0;continue;}const S=smoothLineState(l);if(n===0&&!MOD.visualizeResolving)continue;ctx.globalAlpha=l.alpha;ctx.lineWidth=l.width*2;ctx.strokeStyle=l.color;ctx.beginPath();ctx.moveTo((S[0]+view.x)*view.scale,(S[1]+view.y)*view.scale);ctx.lineTo((S[2]+view.x)*view.scale,(S[3]+view.y)*view.scale);ctx.stroke();}
    },
    dispose(){if(disposed)return;disposed=true;for(const id of frames)actualWindow.cancelAnimationFrame(id);for(const id of timeouts)actualWindow.clearTimeout(id);for(const e of attached)e[0].removeEventListener(e[1],e[2],e[3]);frames.clear();timeouts.clear();attached.length=0;GetAllTargets.resetAll();}
  };
}

// Keep the native zero sentinel for unused player slots. Decorate raw server names only.
function __ilmPlayerNickname(value,id) {
  return typeof value==='string' ? value+'#'+id : value;
}

// The current game's metadata constructor is in a native decoded block.
// Match one reviewed assignment; preserve the native numeric empty-slot sentinel.
function __ilmPatchPlayerMetadata(source) {
  const before='this.ο३︀ = ο३︀';
  if(source.split(before).length!==2) throw new Error('Unsupported native player metadata constructor');
  return source.replace(before,'this.ο३︀ = __ilmPlayerNickname(ο३︀,ᴘ५٢)');
}

// Patch only the reviewed direction functions inside the native decoded block.
function __ilmPatchNativeDirection(source,index) {
  const rules=[["function օ︃２( ){ if( ( ᴉ̡̂-ѕܓ́)>εࡀߌ) {var ᴑɑࡂ=(( ( ((ㅤ๘މ[ѕ̋̃]-ⲅᚂߌ ) *0xb4)/Math[ո᠋а])%0x168)+0x168 )%0x168; if (ᴑɑࡂ>ᅠ̡๕ ) {ﾠࠂ̶=ᴉ̡̂ ; ѕܓ́ =ᴉ̡̂; ⲅᚂߌ=ㅤ๘މ[ ѕ̋̃ ] ;ᴑɑࡂ =Math[ᴇߌ̄ ](( ( ((ㅤ๘މ[ᴉᄇ︂]*0xb4 ) /Math[ո᠋а ]) %360)  + 360 ) %0550) ;ιܕ︅(еϲᄄ.ᴎ︅ހ([06 , ᴑɑࡂ ] ));}}}","function օ︃２( ){ if( ( ᴉ̡̂-ѕܓ́)>εࡀߌ) {var ᴑɑࡂ=(( ( ((ㅤ๘މ[ѕ̋̃]-ⲅᚂߌ ) *0xb4)/Math[ո᠋а])%0x168)+0x168 )%0x168; if (ᴑɑࡂ>ᅠ̡๕ ) {ﾠࠂ̶=ᴉ̡̂ ; ѕܓ́ =ᴉ̡̂; ⲅᚂߌ=ㅤ๘މ[ ѕ̋̃ ] ;ᴑɑࡂ =Math[ᴇߌ̄ ](( ( ((ㅤ๘މ[ᴉᄇ︂]*0xb4 ) /Math[ո᠋а ]) %360)  + 360 ) %0550) ;((!__responsiveMod||!__responsiveMod.controlsAimDirection)&&ιܕ︅(еϲᄄ.ᴎ︅ހ([06 , ᴑɑࡂ ] )));}}}"],["function ᴄ९ܐ( ){if ( (ᴉ̡̂ - ѕܓ́)>ᴎᄉࡁ){ var ᴑɑࡂ=( (( ( (ㅤ๘މ [ᴉᄇ︂]-ⲅᚂߌ)* 0Xb4) /Math [ⲥᄇօ] ) %360 )+0x168)%360;if(ᴑɑࡂ > 2 ) { ﾠࠂ̶ =ᴉ̡̂; ѕܓ́=ᴉ̡̂ ;ⲅᚂߌ = ㅤ๘މ[ѕ̋̃ ];ᴑɑࡂ =Math [ ᴇߌ̄]((((( ㅤ๘މ[еϲ̇]*0xB4 ) /Math[ɑ︀ܛ] ) %0550 )+0x168)%360) ; ιܕ︅(еϲᄄ.ᴎ︅ހ([6, ᴑɑࡂ]));}}}","function ᴄ९ܐ( ){if ( (ᴉ̡̂ - ѕܓ́)>ᴎᄉࡁ){ var ᴑɑࡂ=( (( ( (ㅤ๘މ [ᴉᄇ︂]-ⲅᚂߌ)* 0Xb4) /Math [ⲥᄇօ] ) %360 )+0x168)%360;if(ᴑɑࡂ > 2 ) { ﾠࠂ̶ =ᴉ̡̂; ѕܓ́=ᴉ̡̂ ;ⲅᚂߌ = ㅤ๘މ[ѕ̋̃ ];ᴑɑࡂ =Math [ ᴇߌ̄]((((( ㅤ๘މ[еϲ̇]*0xB4 ) /Math[ɑ︀ܛ] ) %0550 )+0x168)%360) ; ((!__responsiveMod||!__responsiveMod.controlsAimDirection)&&ιܕ︅(еϲᄄ.ᴎ︅ހ([6, ᴑɑࡂ])));}}}"]];
  const rule=rules[index];
  if(!rule || source.split(rule[0]).length!==2) throw new Error("Unsupported native direction handler");
  return source.replace(rule[0],rule[1]);
}

// Align a shot before the native codec processes its attack command.
function __jitterPatchNativeFire(source) {
  const before='function ᴎ༩༣( ) {ﾠࠂ̶=ᴉ̡̂;';
  if(source.split(before).length!==2) throw new Error('Unsupported native fire handler');
  return source.replace(before,before+'if(typeof __responsiveMod!=="undefined"&&__responsiveMod)__responsiveMod.beforeFire();');
}


// Original ILM screen-to-world helper; the native adapter supplies canvas pixels.
function __ilmMouseToWorld(point,view) {
const _0x555618=view.scale,_0x4212a3=view.x,_0x260b24=view.y;
// BEGIN ORIGINAL ILM MOUSE HELPER
function _0x4b25f3(_0x22b996){return{'x':_0x22b996['x']/_0x555618-_0x4212a3,'y':_0x22b996['y']/_0x555618-_0x260b24};}
// END ORIGINAL ILM MOUSE HELPER
return _0x4b25f3(point);
}

function __untitledAimConstraints(){return {"limits":{"strafeInterval":[1,200],"antiAimSpeed":[1,180],"spinSpeed":[1,180],"jitterOffset":[1,180],"aaaDeadzone":[0,3],"aaaReleaseMs":[100,800],"aaaSlowInterval":[200,900],"aaaMinReversals":[2,8],"antiAntiAimStrength":[0,1],"selfPredictCoefficient":[0,20],"otherOffset":[0,2],"otherBulletSpeed":[1,20],"otherDistance":[1,1000],"ak47Offset":[0,2],"ak47BulletSpeed":[1,20],"ak47Distance":[1,1000],"sniperOffset":[0,2],"sniperBulletSpeed":[1,20],"sniperDistance":[1,1000],"spearOffset":[0,2],"spearBulletSpeed":[1,20],"spearDistance":[1,1000],"lockId":[-1,120],"obstacleRadius":[10,120],"offsetCoefficient":[0,2],"bulletSpeedCoefficient":[1,20],"distanceCoefficient":[1,1000],"mouseFov":[50,12345],"smoothLineMs":[0,200],"instantMaxExtrap":[0,4],"stickyRadius":[50,2000],"aimTickRate":[1,50],"trigIterations":[0,10]},"choices":{"antiAimMode":["At target","Spin360","Round","Round2","Jitter","Static"],"ShowRealAngles":["never","always","withAim"],"weaponMode":["Auto per weapon","Custom for all"],"resolverType":["linear","none"],"target":["players","ghouls","all"]}};}
