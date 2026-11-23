// Active __BBY aim from message (27).txt, SHA256 f3001e45554d86505e89532faaa2aff5be69dec90b713e7966428273d2b1abd0.
// Source blocks are byte-for-byte audited against the compressed reference.
function __createMessage27Core(MOD,environment) {
 let stopped=false,started=false,depth=0,phase='aim';
 const timers=new Map(),removers=[];
 function cycle(fn,kind=phase){if(stopped)return;const previous=phase;phase=kind;if(depth++===0)environment.beginCycle(kind);try{return fn();}finally{if(--depth===0)environment.endCycle();phase=previous;}}
 function emit(packet){if(stopped)return false;return depth?environment.send(packet,{kind:phase}):cycle(()=>environment.send(packet,{kind:phase}));}
 function timer(method,fn,delay){if(stopped)return null;let id;const interval=method==='setInterval';const wrapped=()=>{if(!interval)timers.delete(id);if(!stopped)cycle(fn,fn.name==='routineAntiAimbot'?'anti':'aim');};id=environment.window[method](wrapped,delay);timers.set(id,interval);return id;}
 function clear(id){const interval=timers.get(id);if(interval===undefined)return;environment.window[interval?'clearInterval':'clearTimeout'](id);timers.delete(id);}
 const setInterval=(fn,delay)=>timer('setInterval',fn,delay),setTimeout=(fn,delay)=>timer('setTimeout',fn,delay),clearTimeout=clear,clearInterval=clear;
 const window={Math,JSON,setInterval,setTimeout,clearInterval,clearTimeout,addEventListener(type,fn,options){environment.window.addEventListener(type,fn,options);removers.push(()=>environment.window.removeEventListener(type,fn,options));}};
 const document=new Proxy(environment.document,{get(target,key){if(key==='addEventListener')return (type,fn,options)=>{target.addEventListener(type,fn,options);removers.push(()=>target.removeEventListener(type,fn,options));};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
 const օܓߋ=window;
 const globalThis={__autoPortAimbotPacketTransport:emit};
 const __gk=value=>value; // Imported integration passes plain booleans/numbers.
 const World=environment.world,օ̖̏='id',x='x',y='y';
 const network={ε٣︀:value=>emit(JSON.parse(value)),ᴉࡃϲ:value=>emit(JSON.parse(value))},ո︀̜=network,аρ３=network;
 const AIM_RAD=180/Math.PI,SPEAR_IDX=5;
 // Settings are loaded and validated by the host before creating the core.
 // The host has already loaded and validated its versioned aim namespace.
 // Running the old BestModMenuConfig migration here would replace deliberate
 // values such as 100/.1/.62/220 and re-enable a saved disabled mouse FOV.
 var __BBY = (function () {
  var BabaConfig = MOD;
    function calculateDistance(point1, point2) {
        return Math.floor(Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)));
    }
    class GetAllTargetsCon {
        constructor() {
            this.players = [];
            this.ghouls = [];
            for (let player = 1; player < 121; player++) {
                this.players[player] = new GetTarget(player);
            }
            for (let ghoul = 1; ghoul < 999; ghoul++) {
                this.ghouls[ghoul] = new GetTarget(ghoul);
            }
            this.obstacles = [];
            this.lines = [];
            this.lines.push(new LinesCon(0.6, 1, "#FFF200"));
            this.lines.push(new LinesCon(0.8, 3, "#FF0000"));
            this.lines.push(new LinesCon(0.8, 3, "#00FF00"));
            this.lines.push(new LinesCon(0.8, 2, "#0000FF"));
            this.mousePosition = { x: 0, y: 0 };
            this.mouseMapCords = { x: 0, y: 0 };
            this.shifting = false;
            this.menuActive = false;
            this.menuX = 0;
            this.menuY = 0;
            this.menuWidth = 0;
            this.menuHeight = 0;
            this.lastId = 0;
            this.myLastMoveDirection = 0;
        }
        getPlayerById(pID) {
            return this.players[pID];
        }
        getGhoulByUid(uID) {
            return this.ghouls[uID];
        }
    }
    class GetTarget {
        constructor(ids) {
            this.id = ids;
            this.x = -1;
            this.y = -1;
            this.prevX = [];
            this.prevY = [];
            this.active = false;
            this.weapon = -1;
            this.gear = -1;
            for (let lastpos = 0; lastpos < 3; lastpos++) {
                this.prevX.push(-1);
                this.prevY.push(-1);
            }
        }
        update(ux, uy, xy) {
            if (this.x !== ux || this.y !== uy) {
                this.active = true;
                this.prevMovedAt2 = this.prevMovedAt || 0;
                this.prevMovedAt = this.movedAt || 0;
                this.movedAt = Date.now();
                this.prevX[2] = this.prevX[1];
                this.prevX[1] = this.prevX[0];
                this.prevX[0] = this.x;
                this.x = ux;
                this.prevY[2] = this.prevY[1];
                this.prevY[1] = this.prevY[0];
                this.prevY[0] = this.y;
                this.y = uy;
                this.weapon = xy;
                if (!MOD.AdaptiveAimEnabled) AimbotRefresh();
            }
        }
        setInactive() {
            this.x = -1;
            this.y = -1;
            for (let lastposs = 0; lastposs < 3; lastposs++) {
                this.prevX[lastposs] = -1;
                this.prevY[lastposs] = -1;
            }
            this.active = false;
            this.weapon = -1;
            this.movedAt = 0;
            this.prevMovedAt = 0;
            this.prevMovedAt2 = 0;
            if (!MOD.AdaptiveAimEnabled) AimbotRefresh();
        }
    }
    class AimbotCon {
        constructor() {
            this.lastAngle = 0;
            this.targetPlayer = null;
        }
        resolve() {
            switch (MOD.resolverType) {
                case 1:
                    var myPlayerResolverType1 = GetAllTargets.getPlayerById(World.PLAYER[օ̖̏]);
                    var targetResolverType1 = this.findNearestPlayerTo(myPlayerResolverType1, MOD.aimMaxRange || 2400);
                    this.targetPlayer = targetResolverType1;
                    if (targetResolverType1 == null) {
                        return this.lastAngle;
                    }
                    var targetXResolverType1;
                    var targetYResolverType1;
                    var _pt1 = this.aimPoint(myPlayerResolverType1, targetResolverType1, MOD.distanceCoefficient);
                    var targetXResolverType1 = _pt1.x;
                    var targetYResolverType1 = _pt1.y;
                    var _dx1 = targetXResolverType1 - myPlayerResolverType1.x;
                    var _dy1 = targetYResolverType1 - myPlayerResolverType1.y;
                    var angleResolverType1 = (_dx1 === 0 && _dy1 === 0) ? this.lastAngle : window.Math.atan2(_dy1, _dx1) * 180 / window.Math.PI;
                    if (isFinite(angleResolverType1)) angleResolverType1 = ((angleResolverType1 % 360) + 360) % 360;
                    angleResolverType1 = this.aimSmooth(angleResolverType1);
                    if (MOD.hideAimbotAngle) {
                        ո︀̜.ε٣︀(window.JSON.stringify([6, angleResolverType1]));
                    }
                    this.lastAngle = angleResolverType1;
                    return angleResolverType1;
                case "linear":
                default:
                    var myPlayerResolverLinear = GetAllTargets.getPlayerById(World.PLAYER[օ̖̏]);
                    var targetLinear;
                    if (MOD.lockId > -1) {
                        targetLinear = GetAllTargets.getPlayerById(MOD.lockId);
                        if (!this.isPlayerCandidate(targetLinear)) targetLinear = null;
                    } else if (MOD.mouseFovEnable) {
                        var _mf = +MOD.mouseFov;
                        if (!(_mf > 0) || _mf > 1600) _mf = 900;
                        targetLinear = this.findNearestPlayerTo(GetAllTargets.mouseMapCords, _mf);
                    } else {
                        targetLinear = this.findNearestPlayerTo(myPlayerResolverLinear, MOD.aimMaxRange || 2400);
                    }
                    this.targetPlayer = targetLinear;
                    if (targetLinear === null) {
                        return this.lastAngle;
                    }
                    var _ptL = this.aimPoint(myPlayerResolverLinear, targetLinear, MOD.distanceCoefficient);
                    var targetXResolverLinear = _ptL.x;
                    var targetYResolverLinear = _ptL.y;
                    var _dxL = targetXResolverLinear - myPlayerResolverLinear.x;
                    var _dyL = targetYResolverLinear - myPlayerResolverLinear.y;
                    var angleResolverLinear = (_dxL === 0 && _dyL === 0) ? this.lastAngle : window.Math.atan2(_dyL, _dxL) * 180 / window.Math.PI;
                    if (isFinite(angleResolverLinear)) angleResolverLinear = ((angleResolverLinear % 360) + 360) % 360;
                    angleResolverLinear = this.aimSmooth(angleResolverLinear);
                    if (MOD.hideAimbotAngle) {
                        ո︀̜.ε٣︀(window.JSON.stringify([6, angleResolverLinear]));
                    }
                    this.lastAngle = angleResolverLinear;
                    if (MOD.visualizeResolving) {
                        GetAllTargets.lines[0].color = MOD.visualizeResolvingColor || "#FFF200";
                        GetAllTargets.lines[0].reset(myPlayerResolverLinear.x, myPlayerResolverLinear.y, targetXResolverLinear, targetYResolverLinear);
                    }
                    return angleResolverLinear;
            }
        }
        isPlayerCandidate(player) {
            try {
                if (!player || !player.active || player.id === World.PLAYER[օ̖̏]) return false;
                if (!isFinite(+player.x) || !isFinite(+player.y) || +player.x < 0 || +player.y < 0) return false;
                if (!World.players || !World.players[player.id]) return false;
                var ps = World.players[player.id];
                if (!MOD.TargetTeammate && World.PLAYER.εᴎ༩ !== -1 && ps.εᴎ༩ === World.PLAYER.εᴎ༩) {
                    var clan = World.ⲣ８ߌ && World.ⲣ８ߌ[World.PLAYER.εᴎ༩];
                    if (!clan || ps.і٥ࠂ === undefined || clan.ᴎ०︁ === undefined || ps.і٥ࠂ === clan.ᴎ०︁) return false;
                }
                return true;
            } catch (e) { return false; }
        }
        findNearestPlayerTo(cords, Fov) {
            let selected = null;
            let bestScore = +Fov;
            if (!cords || !isFinite(+cords.x) || !isFinite(+cords.y) || !(bestScore > 0)) return null;
            var me = null;
            try { me = GetAllTargets.getPlayerById(World.PLAYER[օ̖̏]); } catch (e) {}
            var maxFromMe = +MOD.aimMaxRange || 2400;
            var stick = +MOD.aimStick;
            if (!(stick >= 0)) stick = 240;
            var consider = (ent, ok) => {
                if (!ok || !ent) return;
                if (me && isFinite(+me.x) && +me.x >= 0) {
                    var md = calculateDistance(me, ent);
                    if (!isFinite(md) || md > maxFromMe) return;
                }
                var distance = calculateDistance(cords, ent);
                if (!isFinite(distance)) return;
                var score = distance;
                if (this.targetPlayer === ent && distance < +Fov + stick) score -= stick;
                if (score < bestScore) {
                    selected = ent;
                    bestScore = score;
                }
            };
            if (MOD.target === "players" || MOD.target === "all") {
                for (let id = 1; id < GetAllTargets.players.length; id++) {
                    const player = GetAllTargets.getPlayerById(id);
                    consider(player, this.isPlayerCandidate(player));
                }
            }
            if (MOD.target === "ghouls" || MOD.target === "all") {
                for (let uid = 1; uid < GetAllTargets.ghouls.length; uid++) {
                    const ghoul = GetAllTargets.getGhoulByUid(uid);
                    consider(ghoul, !!(ghoul && ghoul.active && isFinite(+ghoul.x) && +ghoul.x >= 0 && +ghoul.y >= 0));
                }
            }
            var nowHold = Date.now();
            var held = this._heldTarget;
            var holdMs = +MOD.aimHoldMs;
            if (!(holdMs >= 0)) holdMs = 200;
            if (held && held !== selected && nowHold < (this._heldUntil || 0)) {
                var heldOk = false;
                try {
                    if (GetAllTargets.players && GetAllTargets.players[held.id] === held) heldOk = this.isPlayerCandidate(held);
                    else heldOk = !!(held.active && isFinite(+held.x) && +held.x >= 0 && isFinite(+held.y) && +held.y >= 0);
                } catch (eHold) { heldOk = false; }
                if (heldOk && me && isFinite(+me.x) && +me.x >= 0) {
                    var hd = calculateDistance(me, held);
                    if (isFinite(hd) && hd <= maxFromMe) selected = held;
                }
            }
            if (selected !== this._heldTarget) {
                this._heldTarget = selected || null;
                this._heldUntil = selected ? nowHold + holdMs : 0;
            }
            return selected;
        }
        targetVelocity(target) {
            if (!target || !(target.prevX && target.prevX[0] >= 0) || !(target.prevY && target.prevY[0] >= 0)) return { x: 0, y: 0 };
            var dt = (+target.movedAt || 0) - (+target.prevMovedAt || 0);
            if (!(dt >= 12) || dt > 320) return { x: 0, y: 0 };
            if (Date.now() - (+target.movedAt || 0) > 220) return { x: 0, y: 0 };
            var vx = (target.x - target.prevX[0]) / dt;
            var vy = (target.y - target.prevY[0]) / dt;
            if (target.prevX[1] >= 0 && target.prevY[1] >= 0) {
                var dt2 = (+target.prevMovedAt || 0) - (+target.prevMovedAt2 || 0);
                if (dt2 >= 12 && dt2 <= 320) {
                    vx = vx * 0.7 + ((target.prevX[0] - target.prevX[1]) / dt2) * 0.3;
                    vy = vy * 0.7 + ((target.prevY[0] - target.prevY[1]) / dt2) * 0.3;
                }
            }
            var sp = Math.sqrt(vx * vx + vy * vy);
            var capV = 1.2;
            if (sp > capV) {
                vx = vx * capV / sp;
                vy = vy * capV / sp;
            }
            return { x: vx, y: vy };
        }
        aimPoint(me, target, distanceCoefficient) {
            if (!target) return { x: 0, y: 0 };
            if (!me || !isFinite(+me.x) || !isFinite(+me.y)) return { x: target.x, y: target.y };
            var dx = +target.x - +me.x;
            var dy = +target.y - +me.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (!(dist > 0)) return { x: +target.x, y: +target.y };
            var vel = this.targetVelocity(target);
            var off = +MOD.offsetCoefficient;
            if (!(off >= 0)) off = 0.8;
            var vx = vel.x * off;
            var vy = vel.y * off;
            var perTick = +distanceCoefficient;
            if (!(perTick > 1)) perTick = +MOD.distanceCoefficient;
            if (!(perTick > 1)) perTick = 80;
            var bullet = perTick / 50;
            var cap = +MOD.leadCap;
            if (!(cap > 0)) cap = 280;
            var t = dist / bullet;
            var a = vx * vx + vy * vy - bullet * bullet;
            var b = 2 * (dx * vx + dy * vy);
            var c = dist * dist;
            if (bullet > 0 && Math.abs(a) > 1e-9) {
                var disc = b * b - 4 * a * c;
                if (disc >= 0) {
                    var root = Math.sqrt(disc);
                    var t1 = (-b - root) / (2 * a);
                    var t2 = (-b + root) / (2 * a);
                    var best = -1;
                    if (t1 > 16 && t1 < 1800) best = t1;
                    if (t2 > 16 && t2 < 1800 && (best < 0 || t2 < best)) best = t2;
                    if (best > 0) t = best;
                }
            }
            if (!(t > 0) || t > 1800) t = Math.min(1800, dist / Math.max(bullet, 0.05));
            var lx = vx * t;
            var ly = vy * t;
            var mag = Math.sqrt(lx * lx + ly * ly);
            if (mag > cap && mag > 0) {
                lx *= cap / mag;
                ly *= cap / mag;
            }
            return { x: +target.x + lx, y: +target.y + ly };
        }
        aimSmooth(angle) {
            if (!isFinite(+angle)) return isFinite(+this._smoothAngle) ? +this._smoothAngle : (+this.lastAngle || 0);
            var k = +MOD.aimSmooth;
            if (!(k > 0) || k > 1) k = 0.74;
            var prev = +this._smoothAngle;
            if (!isFinite(prev)) {
                this._smoothAngle = +angle;
                return +angle;
            }
            var delta = +angle - prev;
            delta = ((delta + 540) % 360) - 180;
            var next = prev + delta * k;
            this._smoothAngle = next;
            return next;
        }
    }
    class LinesCon {
        constructor(alpha, width, color) {
            this.x1 = -10;
            this.x2 = -10;
            this.y1 = -10;
            this.y2 = -10;
            this.alpha = alpha;
            this.width = width;
            this.color = color;
            this.outOfRange = false;
        }
        reset(x1 = -1, y1 = -1, x2 = -1, y2 = -1) {
            this.outOfRange = false;
            this.x1 = x1;
            this.x2 = x2;
            this.y1 = y1;
            this.y2 = y2;
        }
        set(x1, y1, x2, y2, outOfRange = false) {
            this.reset(x1, y1, x2, y2);
            this.outOfRange = Boolean(outOfRange);
        }
    }
    function AimbotRefresh() {
        GetAllTargets.lines.forEach(line => line.reset(-1, -1, -1, -1));
        if (World.PLAYER[օ̖̏] === 0 || World.PLAYER[x] === -1 || World.PLAYER[y] === -1) {
            if (GetAllTargets.lastId !== 0) {
                GetAllTargets.lastId = 0;
                for (let allplayers = 1; allplayers < 121; allplayers++) {
                    GetAllTargets.getPlayerById(allplayers).setInactive();
                }
                for (let allghouls = 1; allghouls < 999; allghouls++) {
                    GetAllTargets.getGhoulByUid(allghouls).setInactive();
                }
            }
            return;
        }
        GetAllTargets.lastId = World.PLAYER[օ̖̏];
        if (MOD.AimBotEnabled) {
            // While jitter is enabled, the dedicated jitter loop owns angle packets.
            // This prevents normal target refreshes from instantly overwriting the side-to-side angle.
            
            var __babaAimAngle = Aimbot.resolve();
            // Do not force the previous angle after the real target disappeared.
            if (Aimbot.targetPlayer !== null && isFinite(+__babaAimAngle)) {
                ո︀̜.ε٣︀(window.JSON.stringify([6, __babaAimAngle]));
            }
        }
    }
    
    var GetAllTargets = new GetAllTargetsCon();
    var Aimbot = new AimbotCon();
    

    // Jitter must actively send angle packets; merely toggling jitterActive changes no rotation.
    // Use the same CODE36 angle packet as the aimbot and alternate around the anti-aim base angle.
    
    
    
    window.Aimbot = Aimbot;
    window.GetAllTargets = GetAllTargets;
    window.AimbotRefresh = AimbotRefresh;
    window.addEventListener("mousemove", function(event) {
        GetAllTargets.mousePosition.x = event.clientX;
        GetAllTargets.mousePosition.y = event.clientY;
    });  return {G: GetAllTargets,A: Aimbot,R: AimbotRefresh};
})();
 var GetAllTargets=__BBY.G,Aimbot=__BBY.A,AimbotRefresh=__BBY.R;
 Aimbot.selfId = -1;
Aimbot.dead = false;
Aimbot.mouseDown = false;
Aimbot.refreshing = false;
Aimbot._refreshTimer = null;
Aimbot.myId = function() {
    try {
        var __id = World.PLAYER[օ̖̏];
        if (__id !== undefined && __id !== null && __id !== 0) this.selfId = __id;
    } catch (e) {}
    return this.selfId;
};
Aimbot.send = function(packet) {
    try {
        var __t = globalThis.__autoPortAimbotPacketTransport;
        if (typeof __t === "function") __t(packet);
    } catch (e) {}
};
Aimbot.isDead = function() {
    if (this.dead || !World.PLAYER) return true;
    const id = World.PLAYER[օ̖̏];
    const player = Number.isInteger(id) && id > 0 ? GetAllTargets.getPlayerById(id) : null;
    return !player || player.active !== true;
};
Aimbot.onDeath = function() {
    this.dead = true;
    this.targetPlayer = null;
    this.currentTarget = null;
    this._heldTarget = null;
    this._heldUntil = 0;
    this._smoothAngle = NaN;
    this.lastAngle = 0;
    this.mouseDown = false;
    GetAllTargets.resetAll();
};
Aimbot.scheduleRefresh = function() {
    if (this.isDead())
        return;
    var self = this;
    this.refreshing = true;
    clearTimeout(this._refreshTimer);
    this._refreshTimer = setTimeout(function() { self.refreshing = false; }, 140);
};
Aimbot.refresh = function() { aimbotTick(); };
Aimbot.packetAngle = function(fallback) {
    if (__gk(MOD.AimBotEnabled) && this.targetPlayer)
        return ((Math.floor(this.lastAngle) % 360) + 360) % 360;
    if (MOD.hidePlayerAngle)
        return (((Math.floor(fallback) + 180) % 360) + 360) % 360;
    return fallback;
};
Aimbot.hasTarget = function() { return this.targetPlayer !== null; };
Aimbot.getSelf = function() {
    if (GetAllTargets.selfFromPacket && Date.now() - GetAllTargets.selfFromPacket < 2000)
        return GetAllTargets.selfPosition;
    var sid = this.myId();
    if (sid > 0 && GetAllTargets.players[sid] && GetAllTargets.players[sid].active)
        return GetAllTargets.players[sid];
    if (GetAllTargets.cameraCenter && (GetAllTargets.cameraCenter.x !== 0 || GetAllTargets.cameraCenter.y !== 0))
        return GetAllTargets.cameraCenter;
    return GetAllTargets.selfPosition;
};
Aimbot.findTarget = function(from, maxDistance) {
    return this.findNearestPlayerTo(from, maxDistance);
};
GetAllTargets.selfPosition = { x: 0, y: 0 };
GetAllTargets.selfFromPacket = 0;
GetAllTargets.selfWeapon = -1;
GetAllTargets.cameraCenter = { x: 0, y: 0 };
GetAllTargets.resetLines = function() {
    this.lines.forEach(function(line) { line.reset(-1, -1, -1, -1); });
};
GetAllTargets.resetAll = function() {
    for (var i = 1; i < this.players.length; i++) {
        var p = this.players[i];
        if (p && p.active) p.setInactive();
    }
    for (var j = 1; j < this.ghouls.length; j++) {
        var g = this.ghouls[j];
        if (g && g.active) g.setInactive();
    }
    this.resetLines();
    this.lastId = 0;
};
Aimbot.spearResolve = function() {
    var me = this.getSelf();
    if (!me) return this.lastAngle;
    var target = this.targetPlayer || this.currentTarget;
    var blocked = false;
    try {
        if (target && GetAllTargets.players && GetAllTargets.players[target.id] === target)
            blocked = !this.isPlayerCandidate(target);
    } catch (e) { blocked = true; }
    if (!target || !target.active || blocked)
        target = this.findTarget(me, Math.min(2500, MOD.spearMaxRange || 560));
    try {
        if (target && GetAllTargets.players && GetAllTargets.players[target.id] === target && !this.isPlayerCandidate(target))
            target = null;
    } catch (e2) { target = null; }
    this.currentTarget = target || null;
    this.targetPlayer = target || null;
    if (!target) return this.lastAngle;
    var pt = this.aimPoint(me, target, +MOD.spearSpeed || 46.5);
    var fwd = MOD.spearHandFwd || 22;
    var side = MOD.spearHandSide || -39;
    var dx = pt.x - me.x, dy = pt.y - me.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / dist, uy = dy / dist;
    var hx = me.x + ux * fwd + (-uy) * side;
    var hy = me.y + uy * fwd + (ux) * side;
    var stabDeg = MOD.spearStabDeg || 2.5;
    var stab = stabDeg * Math.PI / 180;
    var ax = pt.x - hx, ay = pt.y - hy;
    var angStab = Math.atan2(ay * Math.cos(stab) - ax * Math.sin(stab), ax * Math.cos(stab) + ay * Math.sin(stab)) * AIM_RAD;
    var angle = Math.floor(angStab);
    this.lastAngle = ((angle % 360) + 360) % 360;
    if (GetAllTargets.lines[1])
        GetAllTargets.lines[1].set(me.x, me.y, pt.x, pt.y, dist > (MOD.spearMaxRange || 560) ? 1 : 0);
    return this.lastAngle;
};
 let aimTouchId = null;
function touchAim(event) {
    const changed = Array.from(event.changedTouches || event.touches || []);
    const touch = changed.find(point => {
        if (aimTouchId !== null) return point.identifier === aimTouchId;
        const target = point.target || event.target;
        return !target || target.tagName === 'CANVAS';
    });
    if (!touch) return;
    aimTouchId = touch.identifier ?? null;
    GetAllTargets.mousePosition.x = touch.clientX;
    GetAllTargets.mousePosition.y = touch.clientY;
}
function releaseAimTouch(event) {
    if (Array.from(event.changedTouches || []).some(point => point.identifier === aimTouchId)) aimTouchId = null;
}
օܓߋ.addEventListener('touchstart', touchAim, {passive:true});
օܓߋ.addEventListener('touchmove', touchAim, {passive:true});
օܓߋ.addEventListener('touchend', releaseAimTouch, {passive:true});
օܓߋ.addEventListener('touchcancel', releaseAimTouch, {passive:true});
օܓߋ.addEventListener('blur', () => { aimTouchId = null; });
document.addEventListener("mousedown", function(event) {
    if (event.button === 0)
        Aimbot.mouseDown = true;
});
document.addEventListener("mouseup", function(event) {
    if (event.button === 0)
        Aimbot.mouseDown = false;
});
օܓߋ.addEventListener("blur", function() {
    Aimbot.mouseDown = false;
});
 function __isMyAimbotPlayer(object, id) {
    if (!object || !World.PLAYER) return false;
    const self = World.PLAYER[օ̖̏];
    if (!Number.isInteger(self) || self <= 0) return false;
    return (id === undefined ? object[օ̖̏] : id) === self;
}
 function __aimShotAllowed() {
    var t = Aimbot && Aimbot.targetPlayer;
    if (!t || !t.active) return false;
    try {
        if (GetAllTargets.players && GetAllTargets.players[t.id] === t)
            return !!Aimbot.isPlayerCandidate(t);
    } catch (e) { return false; }
    return true;
}
 function aimbotTick() {
    if (Aimbot.dead)
        return;
    var _spearOn = __gk(MOD.AimbotSpearEnabled) && GetAllTargets.selfWeapon === SPEAR_IDX && SPEAR_IDX >= 0;
    if (_spearOn) {
        var sAngle = Aimbot.spearResolve();
        if (sAngle !== null && isFinite(+sAngle))
            Aimbot.send([6, __gk(sAngle)]);
        if (MOD.spearAutoThrow && __aimShotAllowed()) {
            Aimbot.send([4]);
            Aimbot.send([5]);
        }
    } else if (__gk(MOD.AimBotEnabled) && MOD.autoFire && __aimShotAllowed()) {
        Aimbot.send([4]);
        Aimbot.send([5]);
    }
}
 var __antiMoveStep = 0;
var __antiMovePattern = [1, 2, 4, 8, 1, 2, 4, 8, 5, 9, 10, 6];
 function routineAntiAimbot() {
    try {
        if (!__gk(MOD.AntiAimbot)) return;
        var coeff = Math.max(1, +MOD.antiAimCoefficient || 100);
        __antiMoveStep++;
        var idx = Math.floor(__antiMoveStep * 100 / coeff) % __antiMovePattern.length;
        ո︀̜.ε٣︀(window.JSON.stringify([2, __antiMovePattern[idx]]));
    } catch (e) {}
}
 function afterFire(){Aimbot.mouseDown=true;Aimbot.scheduleRefresh();}
 function start(){if(started||stopped)return;started=true;setInterval(()=>environment.rotationTick(),50);setInterval(routineAntiAimbot, 50);
(function aimbotLoop() {
    try {
        aimbotTick();
    } catch (e) {}
    setTimeout(aimbotLoop, MOD.AimBotEnabled || MOD.AntiAimbot || MOD.AimbotSpearEnabled ? 50 : 200);
})();}
 function render(ctx,view,pixelScale=1){
  // The host resets the native canvas transform before overlays. Convert only
  // draw coordinates to backing pixels; source mouse/camera maths stay logical.
  if(!(pixelScale>0)||!Number.isFinite(pixelScale))pixelScale=1;
  const surface=pixelScale===1?ctx:new Proxy(ctx,{get(target,key){if(key==='moveTo'||key==='lineTo')return (px,py)=>target[key](px*pixelScale,py*pixelScale);if(key==='lineWidth')return target.lineWidth/pixelScale;const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;},set(target,key,value){return Reflect.set(target,key,key==='lineWidth'?value*pixelScale:value,target);}});
  const ᴏܘ๐=surface,ㅤο９=view.x,ᴉᚉ̷=view.y,о༨ε=view.scale;function AimbotDraw() {
      let aimAlpha = ᴏܘ๐.globalAlpha
        , aimWidth = ᴏܘ๐.lineWidth;
      for (var aimLine = 0; aimLine < GetAllTargets.lines.length; aimLine++) {
        let pos = GetAllTargets.lines[aimLine];
        ᴏܘ๐.lineWidth = pos.width;
        ᴏܘ๐.globalAlpha = pos.outOfRange ? pos.alpha * .3 : pos.alpha;
        ᴏܘ๐.strokeStyle = pos.color;
        ᴏܘ๐.beginPath();
        ᴏܘ๐.moveTo((ㅤο９ + pos.x1) * о༨ε, (ᴉᚉ̷ + pos.y1) * о༨ε);
        ᴏܘ๐.lineTo((ㅤο９ + pos.x2) * о༨ε, (ᴉᚉ̷ + pos.y2) * о༨ε);
        ᴏܘ๐.stroke();
      }
      ᴏܘ๐.globalAlpha = aimAlpha;
      ᴏܘ๐.lineWidth = aimWidth;
      GetAllTargets.cameraCenter = {
        x: ᴏܘ๐.canvas.width / 2 / о༨ε - ㅤο９,
        y: ᴏܘ๐.canvas.height / 2 / о༨ε - ᴉᚉ̷
      };
      try {
        if (GetAllTargets && GetAllTargets.mousePosition) {
          GetAllTargets.mouseMapCords = {
            x: GetAllTargets.mousePosition.x / о༨ε - ㅤο９,
            y: GetAllTargets.mousePosition.y / о༨ε - ᴉᚉ̷
          };
        }
      } catch (e) {}
    }AimbotDraw();}
 function AimbotSaveConfig() { environment.persist(); }
 function AimbotHookSave(gui) {
    gui.__controllers.forEach(function(controller) {
        var previous = controller.__onFinishChange;
        controller.onFinishChange(function(value) {
            if (previous)
                previous.call(controller, value);
            AimbotSaveConfig();
        });
    });
    for (var name in gui.__folders) {
        AimbotHookSave(gui.__folders[name]);
    }
}
 const keyCapture = {current: null};
function finishKeyCapture() {
    const current = keyCapture.current;
    if (!current) return;
    keyCapture.current = null;
    MOD[current.key] = current.previous;
    current.control.updateDisplay();
}
function handleCapturedKey(event) {
    const current = keyCapture.current;
    if (!current || event.repeat) return;
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    if (event.code === 'Escape') { finishKeyCapture(); return; }
    try {
        MOD[current.key] = event.code;
    } catch (error) {
        current.element.title = error.message;
        return;
    }
    keyCapture.current = null;
    current.control.updateDisplay();
    AimbotSaveConfig();
}
document.addEventListener('keydown', handleCapturedKey);
function AimbotMenuSetupKey(folder, keyName, displayName) {
    const control = folder.add(MOD, keyName).name(displayName);
    const element = control.domElement.querySelector('input');
    element.readOnly = true;
    element.style.textAlign = 'center';
    element.style.cursor = 'pointer';
    element.addEventListener('click', () => {
        finishKeyCapture();
        element.blur();
        keyCapture.current = {key: keyName, previous: MOD[keyName], control, element};
        MOD[keyName] = '...';
        control.updateDisplay();
    });
}
 function installMenu(menu){const aimFolder = menu.addFolder("👑 Aim Bot 👑");
aimFolder.add(MOD, "AimBotEnabled").name("AimBotEnabled");
aimFolder.add(MOD, "target", ["players", "ghouls", "all"]).name("Target");
aimFolder.add(MOD, "resolverType", ["linear"]).name("ResolverType");
aimFolder.add(MOD, "TargetTeammate").name("TargetTeammate");
aimFolder.add(MOD, "hideAimbotAngle").name("HideAimbotAngle");
aimFolder.add(MOD, "hidePlayerAngle").name("HidePlayerAngle");
aimFolder.add(MOD, "ShowRealAngles", ["never", "always", "withAim"]).name("ShowRealAngles");
aimFolder.add(MOD, "mouseFovEnable").name("MouseFovEnable");
aimFolder.add(MOD, "mouseFov", 0, 12345, 100).name("MouseFov");
aimFolder.add(MOD, "distanceCoefficient", 10, 1000, 10).name("DistanceCoefficient");
aimFolder.add(MOD, "offsetCoefficient", 0, 3, 0.1).name("OffsetCoefficient");
aimFolder.add(MOD, "aimStick", 0, 800, 10).name("AimStick");
aimFolder.add(MOD, "aimHoldMs", 0, 600, 10).name("AimHoldMs");
aimFolder.add(MOD, "leadCap", 40, 500, 10).name("LeadCap");
aimFolder.add(MOD, "aimSmooth", 0.05, 1, 0.01).name("AimSmooth");
aimFolder.add(MOD, "autoFire").name("AutoFire");
aimFolder.add(MOD, "lockId", -1, 120, 1).name("LockId");
const spearFolder = menu.addFolder("\ud83d\udde1 Aimbot Spear \ud83d\udde1");
spearFolder.add(MOD, "AimbotSpearEnabled").name("AimbotSpearEnabled");
spearFolder.add(MOD, "spearSpeed", 20, 60, 0.5).name("SpearSpeed");
spearFolder.add(MOD, "spearMaxRange", 200, 600, 10).name("MaxRange");
spearFolder.add(MOD, "spearHandFwd", -60, 60, 1).name("HandFwd");
spearFolder.add(MOD, "spearHandSide", -60, 60, 1).name("HandSide");
spearFolder.add(MOD, "spearStabDeg", 0.5, 10, 0.5).name("Stability");
spearFolder.add(MOD, "spearAutoThrow").name("AutoThrow");
const antiFolder = menu.addFolder("Anti-Aim / Strafe");
antiFolder.add(MOD, "AntiAimbot").name("StrafeEnable");
antiFolder.add(MOD, "antiAimCoefficient", 10, 500, 10).name("AntiAimCoefficient");
const lineFolder = menu.addFolder("Aim Line");
lineFolder.add(MOD, "visualizeResolving").name("ShowAimLine");
lineFolder.addColor(MOD, "visualizeResolvingColor").name("AimLineColor");
 const keyFolder = menu.addFolder("Keyboard");
AimbotMenuSetupKey(keyFolder, "AimbotKey", "AimbotKey");
AimbotMenuSetupKey(keyFolder, "AntiAimbotKey", "AntiAimbotKey");
AimbotMenuSetupKey(keyFolder, "JitterKey", "JitterKey");
AimbotMenuSetupKey(keyFolder, "HideAngleKey", "HideAngleKey");
AimbotMenuSetupKey(keyFolder, "ModMenuKey", "ModMenuKey");
 aimFolder.open();
 const folders=[aimFolder,spearFolder,antiFolder,lineFolder];for(const folder of [...folders,keyFolder])AimbotHookSave(folder);return {folders,controllers:folders.flatMap(folder=>folder.__controllers)};
 }
 return {targets:GetAllTargets,aim:Aimbot,Target:GetAllTargets.players[1].constructor,
   start,installMenu,render,tick:()=>cycle(aimbotTick),refreshTargets:()=>cycle(AimbotRefresh),
   position(kind,id,px,py,weapon,packed){return cycle(()=>{const target=GetAllTargets[kind][id];if(kind==='players'&&Number.isFinite(packed)){target.weaponIdx=(packed>>8)&255;if(id===World.PLAYER.id)GetAllTargets.selfWeapon=target.weaponIdx;}target.update(px,py,weapon);if(kind==='players'&&id===World.PLAYER.id){Aimbot.selfId=id;GetAllTargets.selfPosition={x:px,y:py};GetAllTargets.selfFromPacket=Date.now();Aimbot.dead=false;}});},
   afterFire:()=>cycle(afterFire),afterRelease(){Aimbot.mouseDown=false;},onMove(mask){GetAllTargets.myLastMoveDirection=mask;return true;},
   antiTick:()=>cycle(routineAntiAimbot,'anti'),
   onHandshake(){Aimbot.dead=false;},onOtherDie(id){GetAllTargets.players[id]?.setInactive();},sync(){},
   ensure(id){if(id>0){for(const group of [GetAllTargets.players,GetAllTargets.ghouls])if(!group[id])group[id]=new this.Target(id);}},
   dispose(){if(stopped)return;finishKeyCapture();stopped=true;for(const id of [...timers.keys()])clear(id);for(const remove of removers)remove();Aimbot.mouseDown=false;}
 };
}
// Existing Resource Override installations recognize this entrypoint name.
// It forwards to the uploaded engine and contains no previous aim mechanics.
function __createIlmAim(settings,environment){return __createMessage27Core(settings,environment);}
function __createIlmAdapter(settings,environment){
 const pendingKeys=new Set();
 const sourceSettings=new Proxy(settings,{get(target,key){return pendingKeys.has(key)?'...':target[key];},set(target,key,value){if(['AimbotKey','AntiAimbotKey','JitterKey','HideAngleKey','ModMenuKey'].includes(key)){if(value==='...'){pendingKeys.add(key);return true;}if(pendingKeys.has(key)){environment.setKey(key,value);pendingKeys.delete(key);return true;}}target[key]=value;return true;}});
 const metadata=new Proxy([],{get(target,key){if(typeof key==='string'&&/^\d+$/.test(key)){const id=+key;if(!environment.playerInfo(id).exists)return undefined;if(!target[id])target[id]={get εᴎ༩(){return environment.playerInfo(id).team;},get і٥ࠂ(){return environment.playerInfo(id).membership;}};}return target[key];}});
 const clans=new Proxy([],{get(target,key){if(typeof key==='string'&&/^\d+$/.test(key)){const id=+key;if(!environment.clanInfo(id).exists)return undefined;if(!target[id])target[id]={get ᴎ०︁(){return environment.clanInfo(id).membership;}};}return target[key];}});
 const self={get id(){return environment.selfId();},get x(){return environment.selfPosition().x;},get y(){return environment.selfPosition().y;},get εᴎ༩(){return environment.playerInfo(environment.selfId()).team;}};
 const core=__createIlmAim(sourceSettings,{...environment,world:{PLAYER:self,players:metadata,ⲣ８ߌ:clans}}),originalEnsure=core.ensure.bind(core);
 Object.defineProperty(core,'waitingForKey',{get:()=>pendingKeys.size>0});
 core.ensure=originalEnsure;
 return core;
}
function __ilmAimDefaults(){return {"AimBotEnabled":false,"AimbotSpearEnabled":false,"spearSpeed":46.5,"spearMaxRange":560,"spearHandFwd":22,"spearHandSide":-39,"spearStabDeg":2.5,"hideAimbotAngle":false,"hidePlayerAngle":false,"target":"players","TargetTeammate":false,"resolverType":"linear","mouseFovEnable":true,"mouseFov":900,"distanceCoefficient":80,"offsetCoefficient":0.8,"aimStick":240,"aimSmooth":0.74,"aimMaxRange":2400,"aimHoldMs":200,"leadCap":280,"visualizeResolving":true,"visualizeResolvingColor":"#FFF200","autoFire":false,"lockId":-1,"AntiAimbot":false,"antiAimCoefficient":100,"ShowRealAngles":"withAim","AimbotKey":"KeyZ","AntiAimbotKey":"NoKey","JitterKey":"KeyJ","HideAngleKey":"KeyH","ModMenuKey":"KeyM","spearAutoThrow":false};}
function __ilmAimConstraints(){return {limits:{mouseFov:[0,12345],distanceCoefficient:[10,1000],offsetCoefficient:[0,3],aimStick:[0,800],aimHoldMs:[0,600],leadCap:[40,500],aimSmooth:[.05,1],lockId:[-1,120],aimMaxRange:[1,20000],spearSpeed:[20,60],spearMaxRange:[200,600],spearHandFwd:[-60,60],spearHandSide:[-60,60],spearStabDeg:[.5,10],antiAimCoefficient:[10,500]},choices:{target:['players','ghouls','all'],resolverType:['linear'],ShowRealAngles:['never','always','withAim']}};}
function __ilmMouseToWorld(point,view){return {x:point.x/view.scale-view.x,y:point.y/view.scale-view.y};}
// Physical prediction in world units and seconds. No native game code is executed here.
function __createBallisticAim(settings, clock) {
  const tracks=new Map(), speeds=new Map(), projectiles=new Map();
  const maxAge=350, maxGap=500, maxSpeed=1800;
  const maxHistory=1250, maxObservations=32, circleHistory=600;
  // Experimental interpretation of the screenshot, not its recovered formula.
  // RTT samples must be real round trips supplied by a verified integration.
  // Until then the configured fallback is reported as configured, not measured.
  const rttSamples=[];
  function bounded(value, fallback, minimum, maximum) {
    return Number.isFinite(value)?Math.max(minimum,Math.min(maximum,value)):fallback;
  }
  function sampleRtt(milliseconds) {
    const at=clock();
    if(!Number.isFinite(milliseconds)||milliseconds<0||milliseconds>2000||!Number.isFinite(at))return false;
    if(rttSamples.length&&at<rttSamples.at(-1).at)rttSamples.length=0;
    rttSamples.push({value:milliseconds,at});
    while(rttSamples.length>250)rttSamples.shift();
    return true;
  }
  function timingInfo() {
    const at=clock(),window=Math.round(bounded(settings.videoPingSteps,125,1,250));
    while(rttSamples.length&&(rttSamples.length>window||at-rttSamples[0].at>10000||at<rttSamples[0].at))rttSamples.shift();
    const currentPing=rttSamples.at(-1)?.value??null;
    const avgPing=rttSamples.length?rttSamples.reduce((sum,item)=>sum+item.value,0)/rttSamples.length:bounded(settings.videoPingMs,90,0,500);
    const leadMs=bounded(avgPing,90,0,500);
    const totalDelayMs=Math.min(750,leadMs+bounded(settings.videoDelayMs,1,0,100)+bounded(settings.videoDelaySendMs,20,0,100)+bounded(settings.predictionLatencyMs,0,0,500));
    return {enabled:!!settings.VideoAimEnabled,avgPing,currentPing,deltaPing:currentPing===null?null:currentPing-avgPing,samples:rttSamples.length,
      source:rttSamples.length?'measured':'configured',leadMs,totalDelayMs,aimSteps:Math.round(bounded(settings.videoAimSteps,2,1,8))};
  }
  // Use an evenly spaced observation clock only when packet arrivals support
  // one. Whole-slot gaps preserve the timing of a missing observation.
  function sampleTimes(samples) {
    if (samples.length < 7) return samples;
    const intervals = [];
    for (let i = 1; i < samples.length; i++) intervals.push(samples[i].at - samples[i - 1].at);
    const typical = intervals.slice().sort((a, b) => a - b)[Math.floor((intervals.length - 1) / 2)];
    if (typical < 25 || typical > 150) return samples;

    const last = samples.at(-1).at;
    const slots = new Array(samples.length);
    slots[intervals.length] = 0;
    for (let i = intervals.length - 1; i >= 0; i--) {
      const steps = Math.round(intervals[i] / typical);
      if (steps < 1 || steps > 4) return samples;
      slots[i] = slots[i + 1] - steps;
    }

    let sumSlot = 0, sumTime = 0, sumSlot2 = 0, sumSlotTime = 0;
    for (let i = 0; i < samples.length; i++) {
      const slot = slots[i], time = samples[i].at - last;
      sumSlot += slot;
      sumTime += time;
      sumSlot2 += slot * slot;
      sumSlotTime += slot * time;
    }
    const count = samples.length;
    const period = (count * sumSlotTime - sumSlot * sumTime) / (count * sumSlot2 - sumSlot ** 2);
    const offset = (sumTime - period * sumSlot) / count;
    const residuals = samples.map((point, i) => point.at - last - offset - slots[i] * period);
    const rms = Math.sqrt(residuals.reduce((sum, value) => sum + value ** 2, 0) / count);
    if (rms < .001 || period < typical * .85 || period > typical * 1.15 ||
        rms > Math.min(10, .17 * period) || residuals.some(r => Math.abs(r) > .32 * period)) {
      return samples;
    }

    // Keep the receipt time of the newest position as the age reference.
    return samples.map(({ x, y }, i) => ({ x, y, at: last + slots[i] * period }));
  }
  function circle(samples){
    if (samples.length < 5) return null;
    const first = samples[0], last = samples.at(-1), previous = samples.at(-2);
    if (last.at - first.at < 250 - 1e-6) return null;
    const dx = previous.x - last.x, dy = previous.y - last.y;
    if (dx === 0 && dy === 0) return null;
    const collinear = samples.every(point =>
      (point.x - last.x) * dy === (point.y - last.y) * dx);
    if (collinear) return null;
    for (let count = samples.length; count >= 5; count--) {
      const fit = fitCircle(samples.slice(-count));
      if (fit) return fit;
    }
    return null;
  }
  function fitCircle(samples){
    if(samples.length<5||samples.at(-1).at-samples[0].at<250-1e-6)return null;
    const last=samples.at(-1),points=samples.map(p=>({x:p.x-last.x,y:p.y-last.y,t:(p.at-last.at)/1000})),n=points.length;
    let mx=0,my=0,mz=0;for(const p of points){mx+=p.x/n;my+=p.y/n;mz+=(p.x*p.x+p.y*p.y)/n;}
    let xx=0,xy=0,yy=0,xz=0,yz=0;
    for(const p of points){const x=p.x-mx,y=p.y-my,z=p.x*p.x+p.y*p.y-mz;xx+=x*x;xy+=x*y;yy+=y*y;xz+=x*z;yz+=y*z;}
    const det=xx*yy-xy*xy,orthogonalRms=Math.sqrt(Math.max(0,(xx+yy-Math.hypot(xx-yy,2*xy))/(2*n)));
    if(det<1e-7*(xx+yy)**2||orthogonalRms<.55)return null;
    const cx=(xz*yy-yz*xy)/(2*det),cy=(yz*xx-xz*xy)/(2*det),radius=Math.sqrt(cx*cx+cy*cy+mz-2*cx*mx-2*cy*my);
    const residualTolerance=Math.min(3,Math.max(1.5,radius*.01));
    if(!Number.isFinite(radius)||radius+residualTolerance<50||radius>5000)return null;
    let previous=null,angle=0,first=0,st=0,sa=0,stt=0,sta=0;const rates=[],angles=[];
    for(let i=0;i<n;i++){
      const p=points[i];if(Math.abs(Math.hypot(p.x-cx,p.y-cy)-radius)>residualTolerance)return null;
      const a=Math.atan2(p.y-cy,p.x-cx);
      if(previous===null)first=angle=a;
      else {const delta=Math.atan2(Math.sin(a-previous),Math.cos(a-previous)),dt=p.t-points[i-1].t;if(dt<=0)return null;angle+=delta;rates.push(delta/dt);}
      previous=a;angles.push(angle);st+=p.t;sa+=angle;stt+=p.t*p.t;sta+=p.t*angle;
    }
    const omega=(n*sta-st*sa)/(n*stt-st*st),speed=Math.abs(omega)*radius,sweep=Math.abs(angle-first);
    // Curvature must be larger than quantization noise. Nearly straight noisy
    // samples otherwise fit a large circle and produce false curved leads.
    const sagitta=radius*(1-Math.cos(sweep/2)),intercept=(sa-omega*st)/n;
    const timingError=Math.sqrt(points.reduce((sum,p,i)=>sum+(radius*(angles[i]-intercept-omega*p.t))**2,0)/n);
    if(speed<30||speed>1200||sweep<.08||sweep>Math.PI||sagitta<1.5||timingError>2.5||rates.some(r=>r*omega<=0))return null;
    return {cx:last.x+cx,cy:last.y+cy,radius,omega,angle,at:last.at};
  }
  function segmentError(rows, start, end) {
    const count = end - start;
    let sumT = 0, sumZ = 0, sumTT = 0, sumTZ = 0, sumZZ = 0;
    for (let i = start; i < end; i++) {
      const { t, z } = rows[i];
      sumT += t;
      sumZ += z;
      sumTT += t * t;
      sumTZ += t * z;
      sumZZ += z * z;
    }
    const variance = sumTT - sumT * sumT / count;
    const covariance = sumTZ - sumT * sumZ / count;
    return Math.max(0, sumZZ - sumZ * sumZ / count - (variance > 0 ? covariance ** 2 / variance : 0));
  }
  // A periodic strafe has a nearly fixed travel axis, but its velocity
  // changes sign. Anchor its displacement to the newest packet and fit
  // frequency and phase from the history, rather than extrapolating speed.
  function fitStrafe(samples) {
    const first = samples[0], last = samples.at(-1), count = samples.length;
    if (count < 6 || last.at - first.at < 420) return null;
    const previous = samples.at(-2);
    if (last.x === previous.x && last.y === previous.y) return null;

    let axisX = 0, axisY = 0, extent = 0;
    for (const point of samples) {
      const x = point.x - last.x, y = point.y - last.y, distance = Math.hypot(x, y);
      if (distance > extent) {
        axisX = x;
        axisY = y;
        extent = distance;
      }
    }
    if (extent < 13) return null;
    axisX /= extent;
    axisY /= extent;
    const rows = samples.slice(0, -1).map(point => {
      const x = point.x - last.x, y = point.y - last.y;
      return { t: (point.at - last.at) / 1000, z: x * axisX + y * axisY, orthogonal: y * axisX - x * axisY };
    });
    if (rows.some(row => Math.abs(row.orthogonal) > 2.5)) return null;

    // Compare with a linear lead through the same latest sample.
    let tt = 0, tz = 0;
    for (const { t, z } of rows) {
      tt += t * t;
      tz += t * z;
    }
    const slope = tz / tt;
    const lineError = rows.reduce((error, { t, z }) => error + (z - slope * t) ** 2, 0);
    if (lineError / count < 2.1) return null;

    let best = null;
    for (let omega = .75; omega <= 6; omega += .25) {
      const terms = rows.map(({ t, z }) => [Math.cos(omega * t) - 1, Math.sin(omega * t), z]);
      let cc = 0, cs = 0, ss = 0, cz = 0, sz = 0;
      for (const [cos, sin, z] of terms) {
        cc += cos * cos;
        cs += cos * sin;
        ss += sin * sin;
        cz += cos * z;
        sz += sin * z;
      }
      const determinant = cc * ss - cs * cs;
      if (determinant < 1e-9) continue;
      const a = (cz * ss - sz * cs) / determinant;
      const b = (sz * cc - cz * cs) / determinant;
      const amplitude = Math.hypot(a, b);
      if (amplitude < 10 || amplitude > 240 || amplitude * omega > 700) continue;

      let error = 0, peakError = 0;
      for (const [cos, sin, z] of terms) {
        const residual = Math.abs(z - a * cos - b * sin);
        error += residual * residual;
        peakError = Math.max(peakError, residual);
      }
      if (peakError > 3.25 || error / count > 1.9 ** 2 || error > lineError * .24) continue;
      // When several fits explain the observations, penalize wide swings.
      const score = error / count + .1 * (amplitude / 110) ** 2;
      if (!best || score < best.score) best = { a, b, omega, amplitude, error, score };
    }
    if (!best) return null;

    // Two straight legs with an observed change can mimic a partial wave.
    // Prefer the latest leg when this explains the history much better.
    const observed = rows.concat({ t: 0, z: 0 });
    for (let split = 3; split + 3 <= observed.length; split++) {
      const legsError = segmentError(observed, 0, split) + segmentError(observed, split, observed.length);
      if (legsError < best.error * .6) return null;
    }
    const { a, b, omega, amplitude } = best;
    return {
      name: 'strafe', speed: amplitude * omega,
      vx: axisX * b * omega, vy: axisY * b * omega,
      offset(t) {
        const distance = a * (Math.cos(omega * t) - 1) + b * Math.sin(omega * t);
        return { x: axisX * distance, y: axisY * distance };
      },
    };
  }
  // Fit forward drift plus one oscillating axis. Subtract the projection
  // onto time before solving for the sine and cosine coefficients.
  function fitDriftingStrafe(samples) {
    if (samples.length < 10) return null;
    const last = samples.at(-1);
    const previous = samples.at(-2);
    const span = (last.at - samples[0].at) / 1000;
    if (span < .65 || (last.x === previous.x && last.y === previous.y)) return null;
    const rows = samples.slice(0, -1).map(point => ({
      t: (point.at - last.at) / 1000, x: point.x - last.x, y: point.y - last.y,
    }));
    const tt = rows.reduce((sum, row) => sum + row.t ** 2, 0);
    const slopeX = rows.reduce((sum, row) => sum + row.t * row.x, 0) / tt;
    const slopeY = rows.reduce((sum, row) => sum + row.t * row.y, 0) / tt;
    const straightError = rows.reduce((sum, { t, x, y }) => sum + (x - slopeX * t) ** 2 + (y - slopeY * t) ** 2, 0);
    if (straightError < rows.length * 9) return null;

    let best = null;
    for (let omega = 2; omega <= 9; omega += .25) {
      if (omega * span < 4) continue;
      const basis = rows.map(({ t }) => ({ c: Math.cos(omega * t) - 1, s: Math.sin(omega * t) }));
      const slopeC = basis.reduce((sum, { c }, i) => sum + c * rows[i].t, 0) / tt;
      const slopeS = basis.reduce((sum, { s }, i) => sum + s * rows[i].t, 0) / tt;
      let cc = 0, cs = 0, ss = 0, cx = 0, sx = 0, cy = 0, sy = 0;
      for (let i = 0; i < rows.length; i++) {
        const { t, x, y } = rows[i];
        const c = basis[i].c - slopeC * t, s = basis[i].s - slopeS * t;
        cc += c * c; cs += c * s; ss += s * s;
        cx += c * x; sx += s * x; cy += c * y; sy += s * y;
      }
      const determinant = cc * ss - cs * cs;
      if (determinant <= 1e-6) continue;
      const ax = (cx * ss - sx * cs) / determinant, ay = (cy * ss - sy * cs) / determinant;
      const bx = (sx * cc - cx * cs) / determinant, by = (sy * cc - cy * cs) / determinant;

      const radiusA = Math.hypot(ax, ay), radiusB = Math.hypot(bx, by);
      const amplitude = Math.hypot(radiusA, radiusB);
      // A transverse strafe has a single oscillation axis. For instance,
      // an orbit has two distinct axes and should stay in the circle model.
      if (amplitude < 12 || amplitude * omega > 700 ||
          Math.abs(ax * by - ay * bx) > amplitude * 1.8) continue;
      const driftX = slopeX - slopeC * ax - slopeS * bx;
      const driftY = slopeY - slopeC * ay - slopeS * by;
      const [axisX, axisY] = radiusA > radiusB ? [ax / radiusA, ay / radiusA] : [bx / radiusB, by / radiusB];
      const transverseDrift = Math.abs(driftX * axisY - driftY * axisX);
      if (transverseDrift < 20 || Math.hypot(driftX, driftY) > 600) continue;

      let error = 0, peakError = 0;
      for (let i = 0; i < rows.length; i++) {
        const { t, x, y } = rows[i], { c, s } = basis[i];
        const residual = Math.hypot(x - driftX * t - ax * c - bx * s, y - driftY * t - ay * c - by * s);
        error += residual ** 2;
        peakError = Math.max(peakError, residual);
      }
      if (peakError > 4 || error > Math.min(4 * rows.length, .15 * straightError)) continue;
      if (!best || error < best.error) best = { ax, ay, bx, by, omega, driftX, driftY, amplitude, error };
    }
    if (!best) return null;
    const { ax, ay, bx, by, omega, driftX, driftY, amplitude } = best;
    return {
      name: 'drifting-strafe',
      speed: Math.hypot(driftX, driftY) + amplitude * omega,
      vx: driftX + bx * omega, vy: driftY + by * omega,
      offset(t) {
        const c = Math.cos(omega * t) - 1, s = Math.sin(omega * t);
        return { x: driftX * t + ax * c + bx * s, y: driftY * t + ay * c + by * s };
      },
    };
  }
  function strafe(key, motion) {
    if (motion.curve) return null;
    const track = tracks.get(key);
    if (track.strafe === undefined) {
      const samples = track.timedSamples ??= sampleTimes(track.samples);
      track.strafe = fitStrafe(samples) ?? fitDriftingStrafe(samples);
    }
    return track.strafe;
  }
  function track(key,x,y,active,meta={}) {
    if(!active){tracks.delete(key);return;}
    if(!Number.isFinite(x)||!Number.isFinite(y))return;
    const at=clock();let t=tracks.get(key),last=t?.samples.at(-1);
    if(!t || at<last.at || at-last.at>maxGap || meta.generation!==undefined&&t.generation!==undefined&&meta.generation!==t.generation){
      t={samples:[],weapon:-1,generation:meta.generation};tracks.set(key,t);last=null;
    }
    if(last && (Math.hypot(x-last.x,y-last.y)>200 || at-last.at>=8&&Math.hypot(x-last.x,y-last.y)/(at-last.at)*1000>maxSpeed)){t.samples=[];last=null;t.curve=null;}
    if(meta.weapon!==undefined)t.weapon=meta.weapon;
    if(meta.generation!==undefined)t.generation=meta.generation;
    const newObservation=!last||at-t.observationAt>=8;
    if(!newObservation)t.samples[t.samples.length-1]={x,y,at};
    else {t.samples.push({x,y,at});t.observationAt=at;}
    while(t.samples.length>maxObservations||t.samples.length>2&&at-t.samples[0].at>maxHistory+1e-6)t.samples.shift();
    t.timedSamples=undefined;
    const window=t.samples.slice(-8).filter(p=>at-p.at<=circleHistory+1e-6);
    const curve=circle(window),before=t.curve;
    t.strafe=undefined;
    // Coalesced packets refine one observation; they cannot confirm a new window.
    if(curve){curve.streak=before&&before.omega*curve.omega>0&&Math.abs(before.radius-curve.radius)<.15*curve.radius&&Math.hypot(before.cx-curve.cx,before.cy-curve.cy)<Math.max(8,.15*curve.radius)?before.streak+(newObservation?1:0):1;}
    t.curve=curve;
  }
  function motion(key,at=clock()) {
    const t=tracks.get(key),last=t?.samples.at(-1);
    if(!last || at<last.at || at-last.at>maxAge)return null;
    const s=t.timedSamples ??= sampleTimes(t.samples);let vx=0,vy=0;
    if(s.length>1){
      const p=s.at(-2),dt=(last.at-p.at)/1000;
      if(dt>0){
        const dx=last.x-p.x,dy=last.y-p.y;
        // A stop or turn should not drag an older velocity into the next shot.
        let first=Math.max(0,s.length-4);
        // Retain the latest uninterrupted leg. Checking only the newest pair
        // let pre-turn samples back into the fit one packet after a turn.
        for(let i=s.length-2;i>first;i--){
          const a=s[i-1],b=s[i],c=s[i+1],ax=b.x-a.x,ay=b.y-a.y,bx=c.x-b.x,by=c.y-b.y;
          if(ax*bx+ay*by<=0 || Math.abs(ax*by-ay*bx)>.5*Math.hypot(ax,ay)*Math.hypot(bx,by)){first=i;break;}
        }
        if(dx!==0||dy!==0){
          let st=0,sx=0,sy=0,stt=0,stx=0,sty=0,n=0;
          for(let i=first;i<s.length;i++){const p=s[i],t=(p.at-last.at)/1000;st+=t;sx+=p.x;sy+=p.y;stt+=t*t;stx+=t*p.x;sty+=t*p.y;n++;}
          const d=n*stt-st*st;
          if(d>1e-10){vx=(n*stx-st*sx)/d;vy=(n*sty-st*sy)/d;}
        }
      }
    }
    const curve=t.curve?.streak>=2?t.curve:null;
    if(curve){vx=-curve.radius*curve.omega*Math.sin(curve.angle);vy=curve.radius*curve.omega*Math.cos(curve.angle);}
    return {x:last.x,y:last.y,vx,vy,age:(at-last.at)/1000,weapon:t.weapon,samples:s.length,curve};
  }
  function projectile(key,weapon,speed,nominal) {
    const at=clock();
    if(projectiles.has(key)||!Number.isInteger(weapon)||weapon<0||!Number.isFinite(speed)||speed<100||speed>20000)return;
    projectiles.set(key,at);
    while(projectiles.size>256)projectiles.delete(projectiles.keys().next().value);
    // A packet for a projectile fired before a weapon switch must not teach the
    // newly equipped weapon a radically different speed.
    if(nominal>0&&Math.abs(speed-nominal)>.3*nominal)return;
    let sample=speeds.get(weapon);if(!sample){sample=[];speeds.set(weapon,sample);}
    sample.push({speed,at});if(sample.length>9)sample.shift();
    if(speeds.size>128)speeds.delete(speeds.keys().next().value);
  }
  function speedFor(weapon,profile={}) {
    const samples=(speeds.get(weapon)||[]).filter(s=>clock()-s.at<300000);
    if(settings.predictionAutoSpeed && samples.length){
      const values=samples.map(s=>s.speed).sort((a,b)=>a-b),trim=values.length>=5?1:0;
      const kept=values.slice(trim,values.length-trim);
      return {speed:kept.reduce((a,b)=>a+b,0)/kept.length,source:'server-projectiles',samples:samples.length};
    }
    if(settings.predictionAutoSpeed && profile.speed>0)return {speed:profile.speed,source:'native-weapon',samples:0};
    return {speed:settings.bulletSpeedCoefficient*1000,source:'configured',samples:0};
  }
  function intercept(rx,ry,vx,vy,speed,muzzle=0,side=0) {
    if(![rx,ry,vx,vy,speed,muzzle,side].every(Number.isFinite)||speed<=0||muzzle<0)return null;
    return offsetIntercept(rx,ry,vx,vy,speed,muzzle,side);
  }
  function offsetIntercept(rx,ry,vx,vy,speed,muzzle,side) {
    if(![rx,ry,vx,vy,speed,muzzle,side].every(Number.isFinite)||speed<=0)return null;
    const c=rx*rx+ry*ry-muzzle*muzzle-side*side;if(c<=0)return 0;
    const a=vx*vx+vy*vy-speed*speed,b=2*(rx*vx+ry*vy-speed*muzzle);
    let roots;
    if(Math.abs(a)<1e-8*Math.max(speed*speed,1))roots=Math.abs(b)>1e-9?[-c/b]:[];
    else {const d=b*b-4*a*c;if(d<0)return null;const q=-.5*(b+(b>=0?1:-1)*Math.sqrt(d));roots=q===0?[-b/(2*a)]:[q/a,c/q];}
    const positive=roots.filter(t=>Number.isFinite(t)&&t>=0);return positive.length?Math.min(...positive):null;
  }
  function nonlinearFlight(gap, speed, targetSpeed, limit, radialMinimum=speed) {
    let lo=0, remaining=gap(0);
    if (remaining<=0) return 0;
    if (radialMinimum>=targetSpeed) {
      // The expanding reach of the bullet overtakes every position along
      // the predicted path at most once when the gap can only decrease.
      let hi=limit;
      if (gap(hi)>0) return null;
      for (let i=0;i<32;i++) {
        const mid=(lo+hi)/2;
        if (gap(mid)>0) lo=mid; else hi=mid;
      }
      return hi;
    }
    // A slower bullet may have more than one intercept. Advance only as
    // far as the maximum rate of approach permits, so an earlier crossing
    // cannot be skipped by a coarse scan or a tangent extrapolation.
    const maxClosingSpeed=speed+targetSpeed;
    for (let i=0;i<512;i++) {
      if (remaining<=.005) return lo;
      if (lo>=limit) return null;
      lo=Math.min(limit,lo+remaining/maxClosingSpeed);
      remaining=gap(lo);
    }
    return null;
  }
  function resolve(selfKey,targetKey,profile={}) {
    const now=clock(),self=motion(selfKey,now),target=motion(targetKey,now);
    if(!self||!target)return {valid:false,status:'stale-position'};
    const timing=settings.VideoAimEnabled?timingInfo():null;
    const delay=timing?timing.totalDelayMs/1000:(settings.predictionLatencyMs||0)/1000;
    const selfStrafe=strafe(selfKey,self), targetStrafe=strafe(targetKey,target);
    function future(m,model,t) {
      if (model) {
        const offset = model.offset(t);
        return { x: m.x + offset.x, y: m.y + offset.y };
      }
      if (m.curve) {
        const c=m.curve,a=c.angle+c.omega*t;
        return {x:c.cx+c.radius*Math.cos(a),y:c.cy+c.radius*Math.sin(a)};
      }
      return {x:m.x+m.vx*t,y:m.y+m.vy*t};
    }
    const origin=future(self,selfStrafe,self.age+delay),ox=origin.x,oy=origin.y;
    const position=t=>future(target,targetStrafe,target.age+delay+t);
    const initial=position(0),distance=Math.hypot(initial.x-ox,initial.y-oy);
    const model=speedFor(self.weapon,profile),muzzle=profile.forward??profile.muzzle??0,side=profile.side??0;
    const motionModel=target.curve?'circle':targetStrafe?.name??'linear';
    const unavailable={valid:false,status:'unreachable',distance,...model};
    if(!Number.isFinite(model.speed)||model.speed<=0||!Number.isFinite(muzzle)||profile.forward===undefined&&muzzle<0||!Number.isFinite(side))return unavailable;
    const limit=Math.min(3,profile.range>0?profile.range/model.speed:3);
    const exactFlight=()=>{
      if(motionModel==='linear')return offsetIntercept(initial.x-ox,initial.y-oy,target.vx,target.vy,model.speed,muzzle,side);
      const speedBound=targetStrafe?.speed??Math.hypot(target.vx,target.vy);
      const gap=t=>{
        const p=position(t);
        return Math.hypot(p.x-ox,p.y-oy)-Math.hypot(model.speed*t+muzzle,side);
      };
      const radialMinimum=side===0?model.speed:model.speed*muzzle/Math.hypot(muzzle,side);
      return nonlinearFlight(gap,model.speed,speedBound,limit,radialMinimum);
    };
    let flight,iterations=0,exactFallback=false;
    if(timing){
      // Start with stationary-target flight time, then refine the predicted
      // point. A bounded Newton step avoids unbounded fixed-point oscillation.
      let candidate=Math.max(0,(distance-muzzle)/model.speed);
      const gap=(t)=>{const p=position(t);return Math.hypot(p.x-ox,p.y-oy)-Math.hypot(model.speed*t+muzzle,side);};
      const speedBound=targetStrafe?.speed??Math.hypot(target.vx,target.vy);
      const radialMinimum=side===0?model.speed:model.speed*muzzle/Math.hypot(muzzle,side);
      if(speedBound<(motionModel==='linear'?model.speed:radialMinimum)&&candidate<=limit){
        for(let step=1;step<=timing.aimSteps;step++){
          iterations++;
          const residual=gap(candidate),h=.0001;
          const lo=Math.max(0,candidate-h),hi=candidate+h;
          const derivative=(gap(hi)-gap(lo))/(hi-lo);
          if(!Number.isFinite(derivative)||derivative>=-1e-6)break;
          const next=candidate-residual/derivative;
          if(!Number.isFinite(next)||next<0||next>limit)break;
          candidate=next;
        }
        // A tiny residual certifies accuracy on the predicted path, not a
        // server hit. Fall back to the existing solver for ambiguous roots.
        flight=Math.abs(gap(candidate))<=.01?candidate:null;
      }else flight=null;
      if(flight===null){exactFallback=true;flight=exactFlight();}
    }else flight=exactFlight();
    if(flight===null || flight>limit)return unavailable;
    const {x,y}=position(flight),radians=Math.atan2(y-oy,x-ox)-Math.atan2(side,model.speed*flight+muzzle),angle=radians*180/Math.PI;
    // A lateral hand offset changes both the launch point and the direction.
    // Keep the legacy origin convention unless the new side profile is used.
    const launch=profile.side===undefined&&profile.forward===undefined?{x:ox,y:oy}:{x:ox+Math.cos(radians)*muzzle-Math.sin(radians)*side,y:oy+Math.sin(radians)*muzzle+Math.cos(radians)*side};
    const velocity=(m,strafe)=>({x:strafe?.vx??m.vx,y:strafe?.vy??m.vy});
    return {valid:true,status:'tracking',angle,x,y,ox:launch.x,oy:launch.y,distance,flight,motionModel,...model,
      selfVelocity:velocity(self,selfStrafe),targetVelocity:velocity(target,targetStrafe),...(timing?{video:{...timing,iterations,exactFallback}}:{})};
  }
  return {track,motion,projectile,speedFor,resolve,intercept,sampleRtt,timingInfo,resetTiming(){rttSamples.length=0;},reset(){tracks.clear();projectiles.clear();rttSamples.length=0;}};
}
function __ilmPlayerNickname(value,id) {
  return typeof value==='string' ? value+'#'+id : value;
}

function __ilmPatchPlayerMetadata(source) {
  const before='this.ο३︀ = ο३︀';
  if(source.split(before).length!==2) throw new Error('Unsupported native player metadata constructor');
  return source.replace(before,'this.ο३︀ = __ilmPlayerNickname(ο३︀,ᴘ५٢)');
}

function __ilmPatchNativeDirection(source,index) {
  const rules=[["function օ︃２( ){ if( ( ᴉ̡̂-ѕܓ́)>εࡀߌ) {var ᴑɑࡂ=(( ( ((ㅤ๘މ[ѕ̋̃]-ⲅᚂߌ ) *0xb4)/Math[ո᠋а])%0x168)+0x168 )%0x168; if (ᴑɑࡂ>ᅠ̡๕ ) {ﾠࠂ̶=ᴉ̡̂ ; ѕܓ́ =ᴉ̡̂; ⲅᚂߌ=ㅤ๘މ[ ѕ̋̃ ] ;ᴑɑࡂ =Math[ᴇߌ̄ ](( ( ((ㅤ๘މ[ᴉᄇ︂]*0xb4 ) /Math[ո᠋а ]) %360)  + 360 ) %0550) ;ιܕ︅(еϲᄄ.ᴎ︅ހ([06 , ᴑɑࡂ ] ));}}}","function օ︃２( ){ if( ( ᴉ̡̂-ѕܓ́)>εࡀߌ) {var ᴑɑࡂ=(( ( ((ㅤ๘މ[ѕ̋̃]-ⲅᚂߌ ) *0xb4)/Math[ո᠋а])%0x168)+0x168 )%0x168; if (ᴑɑࡂ>ᅠ̡๕ ) {ﾠࠂ̶=ᴉ̡̂ ; ѕܓ́ =ᴉ̡̂; ⲅᚂߌ=ㅤ๘މ[ ѕ̋̃ ] ;ᴑɑࡂ =Math[ᴇߌ̄ ](( ( ((ㅤ๘މ[ᴉᄇ︂]*0xb4 ) /Math[ո᠋а ]) %360)  + 360 ) %0550) ;((!__responsiveMod||!__responsiveMod.controlsAimDirection)&&ιܕ︅(еϲᄄ.ᴎ︅ހ([06 , ᴑɑࡂ ] )));}}}"],["function ᴄ९ܐ( ){if ( (ᴉ̡̂ - ѕܓ́)>ᴎᄉࡁ){ var ᴑɑࡂ=( (( ( (ㅤ๘މ [ᴉᄇ︂]-ⲅᚂߌ)* 0Xb4) /Math [ⲥᄇօ] ) %360 )+0x168)%360;if(ᴑɑࡂ > 2 ) { ﾠࠂ̶ =ᴉ̡̂; ѕܓ́=ᴉ̡̂ ;ⲅᚂߌ = ㅤ๘މ[ѕ̋̃ ];ᴑɑࡂ =Math [ ᴇߌ̄]((((( ㅤ๘މ[еϲ̇]*0xB4 ) /Math[ɑ︀ܛ] ) %0550 )+0x168)%360) ; ιܕ︅(еϲᄄ.ᴎ︅ހ([6, ᴑɑࡂ]));}}}","function ᴄ९ܐ( ){if ( (ᴉ̡̂ - ѕܓ́)>ᴎᄉࡁ){ var ᴑɑࡂ=( (( ( (ㅤ๘މ [ᴉᄇ︂]-ⲅᚂߌ)* 0Xb4) /Math [ⲥᄇօ] ) %360 )+0x168)%360;if(ᴑɑࡂ > 2 ) { ﾠࠂ̶ =ᴉ̡̂; ѕܓ́=ᴉ̡̂ ;ⲅᚂߌ = ㅤ๘މ[ѕ̋̃ ];ᴑɑࡂ =Math [ ᴇߌ̄]((((( ㅤ๘މ[еϲ̇]*0xB4 ) /Math[ɑ︀ܛ] ) %0550 )+0x168)%360) ; ((!__responsiveMod||!__responsiveMod.controlsAimDirection)&&ιܕ︅(еϲᄄ.ᴎ︅ހ([6, ᴑɑࡂ])));}}}"]];
  const rule=rules[index];
  if(!rule || source.split(rule[0]).length!==2) throw new Error("Unsupported native direction handler");
  return source.replace(rule[0],rule[1]);
}

function __jitterPatchNativeFire(source) {
  const before='function ᴎ༩༣( ) {ﾠࠂ̶=ᴉ̡̂;';
  if(source.split(before).length!==2) throw new Error('Unsupported native fire handler');
  return source.replace(before,before+'if(typeof __responsiveMod!=="undefined"&&__responsiveMod)__responsiveMod.beforeFire();');
}
