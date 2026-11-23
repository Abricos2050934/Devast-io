function __createMessage27Core(this: PublishedDynamic,MOD: PublishedDynamic,environment: PublishedDynamic): PublishedDynamic {
 let stopped: PublishedDynamic=false,started: PublishedDynamic=false,depth: PublishedDynamic=0,phase: PublishedDynamic='aim';
 const timers: PublishedDynamic=new Map(),removers: PublishedDynamic=[];
 function cycle(this: PublishedDynamic,fn: PublishedDynamic,kind: PublishedDynamic=phase): PublishedDynamic{const previous: PublishedDynamic=phase;phase=kind;if(depth++===0)environment.beginCycle(kind);try{return fn();}finally{if(--depth===0)environment.endCycle();phase=previous;}}
 function emit(this: PublishedDynamic,packet: PublishedDynamic): PublishedDynamic{if(stopped)return false;return depth?environment.send(packet,{kind:phase}):cycle((): PublishedDynamic=>environment.send(packet,{kind:phase}));}
 function timer(this: PublishedDynamic,method: PublishedDynamic,fn: PublishedDynamic,delay: PublishedDynamic): PublishedDynamic{let id: PublishedDynamic;const interval: PublishedDynamic=method==='setInterval';const wrapped: PublishedDynamic=(): PublishedDynamic=>{if(!interval)timers.delete(id);if(!stopped)cycle(fn,fn.name==='routineAntiAimbot'?'anti':'aim');};id=environment.window[method](wrapped,delay);timers.set(id,interval);return id;}
 function clear(this: PublishedDynamic,id: PublishedDynamic): PublishedDynamic{const interval: PublishedDynamic=timers.get(id);if(interval===undefined)return;environment.window[interval?'clearInterval':'clearTimeout'](id);timers.delete(id);}
 const setInterval: PublishedDynamic=(fn: PublishedDynamic,delay: PublishedDynamic): PublishedDynamic=>timer('setInterval',fn,delay),setTimeout: PublishedDynamic=(fn: PublishedDynamic,delay: PublishedDynamic): PublishedDynamic=>timer('setTimeout',fn,delay),clearTimeout: PublishedDynamic=clear,clearInterval: PublishedDynamic=clear;
 const window: PublishedDynamic={Math,JSON,setInterval,setTimeout,clearInterval,clearTimeout,addEventListener(this: PublishedDynamic,type: PublishedDynamic,fn: PublishedDynamic,options: PublishedDynamic): PublishedDynamic{environment.window.addEventListener(type,fn,options);removers.push((): PublishedDynamic=>environment.window.removeEventListener(type,fn,options));}};
 const document: PublishedDynamic=new Proxy(environment.document,{get(this: PublishedDynamic,target: PublishedDynamic,key: PublishedDynamic): PublishedDynamic{if(key==='addEventListener')return (type: PublishedDynamic,fn: PublishedDynamic,options: PublishedDynamic): PublishedDynamic=>{target.addEventListener(type,fn,options);removers.push((): PublishedDynamic=>target.removeEventListener(type,fn,options));};const value: PublishedDynamic=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
 const օܓߋ: PublishedDynamic=window;
 const localStorage: PublishedDynamic={getItem:(): PublishedDynamic=>JSON.stringify(Object.fromEntries(Object.keys(__ilmAimDefaults()).map((key: PublishedDynamic): PublishedDynamic=>[key,MOD[key]]))),setItem(this: PublishedDynamic): PublishedDynamic{environment.persist();}};
 const globalThis: PublishedDynamic={__autoPortAimbotPacketTransport:emit};
 const __gk: PublishedDynamic=(value: PublishedDynamic): PublishedDynamic=>value; // Imported integration passes plain booleans/numbers.
 const World: PublishedDynamic=environment.world,օ̖̏: PublishedDynamic='id',x: PublishedDynamic='x',y: PublishedDynamic='y';
 const network: PublishedDynamic={ε٣︀:(value: PublishedDynamic): PublishedDynamic=>emit(JSON.parse(value)),ᴉࡃϲ:(value: PublishedDynamic): PublishedDynamic=>emit(JSON.parse(value))},ո︀̜: PublishedDynamic=network,аρ３: PublishedDynamic=network;
 const AIM_RAD: PublishedDynamic=180/Math.PI,SPEAR_IDX: PublishedDynamic=5;
 function AimbotLoadConfig(this: PublishedDynamic): PublishedDynamic {
    try {
        var saved: PublishedDynamic = JSON.parse(localStorage.getItem("BestModMenuConfig"));
        if (saved && typeof saved === "object") {
            for (var field in MOD) {
                if (field in saved && typeof saved[field] === typeof MOD[field]) {
                    MOD[field] = saved[field];
                }
            }
        }
        MOD.mouseFovEnable = true;
        MOD.resolverType = "linear";
        if (!(+MOD.mouseFov > 0) || +MOD.mouseFov > 1600) MOD.mouseFov = 900;
        if (+MOD.distanceCoefficient === 100) MOD.distanceCoefficient = 80;
        if (+MOD.offsetCoefficient === 0.1 || +MOD.offsetCoefficient === 0.45) MOD.offsetCoefficient = 0.8;
        if (!(+MOD.aimStick >= 0) || +MOD.aimStick === 140) MOD.aimStick = 240;
        if (!(+MOD.aimSmooth > 0 && +MOD.aimSmooth <= 1) || +MOD.aimSmooth === 0.62) MOD.aimSmooth = 0.74;
        if (!(+MOD.aimMaxRange > 0)) MOD.aimMaxRange = 2400;
        if (!(+MOD.leadCap > 0) || +MOD.leadCap === 220) MOD.leadCap = 280;
        if (!(+MOD.aimHoldMs >= 0)) MOD.aimHoldMs = 200;
    } catch (e: any) {}
}
 // The host has already loaded and validated its versioned aim namespace.
 // Running the old BestModMenuConfig migration here would replace deliberate
 // values such as 100/.1/.62/220 and re-enable a saved disabled mouse FOV.
 var __BBY: PublishedDynamic = (function (this: PublishedDynamic): PublishedDynamic {
  var BabaConfig: PublishedDynamic = MOD;
    function calculateDistance(this: PublishedDynamic,point1: PublishedDynamic, point2: PublishedDynamic): PublishedDynamic {
        return Math.floor(Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)));
    }
    class GetAllTargetsCon {[key:string]: PublishedDynamic;
        constructor() {
            this.players = [];
            this.ghouls = [];
            for (let player: PublishedDynamic = 1; player < 121; player++) {
                this.players[player] = new GetTarget(player);
            }
            for (let ghoul: PublishedDynamic = 1; ghoul < 999; ghoul++) {
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
        getPlayerById(this: PublishedDynamic,pID: PublishedDynamic): PublishedDynamic {
            return this.players[pID];
        }
        getGhoulByUid(this: PublishedDynamic,uID: PublishedDynamic): PublishedDynamic {
            return this.ghouls[uID];
        }
    }
    class GetTarget {[key:string]: PublishedDynamic;
        constructor(ids: PublishedDynamic) {
            this.id = ids;
            this.x = -1;
            this.y = -1;
            this.prevX = [];
            this.prevY = [];
            this.active = false;
            this.weapon = -1;
            this.gear = -1;
            for (let lastpos: PublishedDynamic = 0; lastpos < 3; lastpos++) {
                this.prevX.push(-1);
                this.prevY.push(-1);
            }
        }
        update(this: PublishedDynamic,ux: PublishedDynamic, uy: PublishedDynamic, xy: PublishedDynamic): PublishedDynamic {
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
                AimbotRefresh();
            }
        }
        setInactive(this: PublishedDynamic): PublishedDynamic {
            this.x = -1;
            this.y = -1;
            for (let lastposs: PublishedDynamic = 0; lastposs < 3; lastposs++) {
                this.prevX[lastposs] = -1;
                this.prevY[lastposs] = -1;
            }
            this.active = false;
            this.weapon = -1;
            this.movedAt = 0;
            this.prevMovedAt = 0;
            this.prevMovedAt2 = 0;
            AimbotRefresh();
        }
    }
    class AimbotCon {[key:string]: PublishedDynamic;
        constructor() {
            this.lastAngle = 0;
            this.targetPlayer = null;
        }
        resolve(this: PublishedDynamic): PublishedDynamic {
            switch (MOD.resolverType) {
                case 1:
                    var myPlayerResolverType1: PublishedDynamic = GetAllTargets.getPlayerById(World.PLAYER[օ̖̏]);
                    var targetResolverType1: PublishedDynamic = this.findNearestPlayerTo(myPlayerResolverType1, MOD.aimMaxRange || 2400);
                    this.targetPlayer = targetResolverType1;
                    if (targetResolverType1 == null) {
                        return this.lastAngle;
                    }
                    var targetXResolverType1: PublishedDynamic;
                    var targetYResolverType1: PublishedDynamic;
                    var _pt1: PublishedDynamic = this.aimPoint(myPlayerResolverType1, targetResolverType1, MOD.distanceCoefficient);
                    var targetXResolverType1: PublishedDynamic = _pt1.x;
                    var targetYResolverType1: PublishedDynamic = _pt1.y;
                    var _dx1: PublishedDynamic = targetXResolverType1 - myPlayerResolverType1.x;
                    var _dy1: PublishedDynamic = targetYResolverType1 - myPlayerResolverType1.y;
                    var angleResolverType1: PublishedDynamic = (_dx1 === 0 && _dy1 === 0) ? this.lastAngle : window.Math.atan2(_dy1, _dx1) * 180 / window.Math.PI;
                    if (isFinite(angleResolverType1)) angleResolverType1 = ((angleResolverType1 % 360) + 360) % 360;
                    angleResolverType1 = this.aimSmooth(angleResolverType1);
                    if (MOD.hideAimbotAngle) {
                        if (angleResolverType1 === null) {
                            angleResolverType1 = angleResolverType1 * 180 / window.Math.PI;
                        }
                        ո︀̜.ε٣︀(window.JSON.stringify([6, angleResolverType1]));
                    }
                    this.lastAngle = angleResolverType1;
                    return angleResolverType1;
                case "linear":
                default:
                    var myPlayerResolverLinear: PublishedDynamic = GetAllTargets.getPlayerById(World.PLAYER[օ̖̏]);
                    var targetLinear: PublishedDynamic;
                    if (MOD.lockId > -1) {
                        targetLinear = GetAllTargets.getPlayerById(MOD.lockId);
                        if (!this.isPlayerCandidate(targetLinear)) targetLinear = null;
                    } else if (MOD.mouseFovEnable) {
                        var _mf: PublishedDynamic = +MOD.mouseFov;
                        if (!(_mf > 0) || _mf > 1600) _mf = 900;
                        targetLinear = this.findNearestPlayerTo(GetAllTargets.mouseMapCords, _mf);
                    } else {
                        targetLinear = this.findNearestPlayerTo(myPlayerResolverLinear, MOD.aimMaxRange || 2400);
                    }
                    this.targetPlayer = targetLinear;
                    if (targetLinear === null) {
                        return this.lastAngle;
                    }
                    var _ptL: PublishedDynamic = this.aimPoint(myPlayerResolverLinear, targetLinear, MOD.distanceCoefficient);
                    var targetXResolverLinear: PublishedDynamic = _ptL.x;
                    var targetYResolverLinear: PublishedDynamic = _ptL.y;
                    var _dxL: PublishedDynamic = targetXResolverLinear - myPlayerResolverLinear.x;
                    var _dyL: PublishedDynamic = targetYResolverLinear - myPlayerResolverLinear.y;
                    var angleResolverLinear: PublishedDynamic = (_dxL === 0 && _dyL === 0) ? this.lastAngle : window.Math.atan2(_dyL, _dxL) * 180 / window.Math.PI;
                    if (isFinite(angleResolverLinear)) angleResolverLinear = ((angleResolverLinear % 360) + 360) % 360;
                    angleResolverLinear = this.aimSmooth(angleResolverLinear);
                    if (MOD.hideAimbotAngle) {
                        if (angleResolverLinear === null) {
                            angleResolverLinear = angleResolverLinear * 180 / window.Math.PI;
                        }
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
        isPlayerCandidate(this: PublishedDynamic,player: PublishedDynamic): PublishedDynamic {
            try {
                if (!player || !player.active || player.id === World.PLAYER[օ̖̏]) return false;
                if (!isFinite(+player.x) || !isFinite(+player.y) || +player.x < 0 || +player.y < 0) return false;
                if (!World.players || !World.players[player.id]) return false;
                var ps: PublishedDynamic = World.players[player.id];
                if (!MOD.TargetTeammate && World.PLAYER.εᴎ༩ !== -1 && ps.εᴎ༩ === World.PLAYER.εᴎ༩) {
                    var clan: PublishedDynamic = World.ⲣ８ߌ && World.ⲣ８ߌ[World.PLAYER.εᴎ༩];
                    if (!clan || ps.і٥ࠂ === undefined || clan.ᴎ०︁ === undefined || ps.і٥ࠂ === clan.ᴎ०︁) return false;
                }
                return true;
            } catch (e: any) { return false; }
        }
        findNearestPlayerTo(this: PublishedDynamic,cords: PublishedDynamic, Fov: PublishedDynamic): PublishedDynamic {
            let selected: PublishedDynamic = null;
            let bestScore: PublishedDynamic = +Fov;
            if (!cords || !isFinite(+cords.x) || !isFinite(+cords.y) || !(bestScore > 0)) return null;
            var me: PublishedDynamic = null;
            try { me = GetAllTargets.getPlayerById(World.PLAYER[օ̖̏]); } catch (e: any) {}
            var maxFromMe: PublishedDynamic = +MOD.aimMaxRange || 2400;
            var stick: PublishedDynamic = +MOD.aimStick;
            if (!(stick >= 0)) stick = 240;
            var consider: PublishedDynamic = (ent: PublishedDynamic, ok: PublishedDynamic): PublishedDynamic => {
                if (!ok || !ent) return;
                if (me && isFinite(+me.x) && +me.x >= 0) {
                    var md: PublishedDynamic = calculateDistance(me, ent);
                    if (!isFinite(md) || md > maxFromMe) return;
                }
                var distance: PublishedDynamic = calculateDistance(cords, ent);
                if (!isFinite(distance)) return;
                var score: PublishedDynamic = distance;
                if (this.targetPlayer === ent && distance < +Fov + stick) score -= stick;
                if (score < bestScore) {
                    selected = ent;
                    bestScore = score;
                }
            };
            if (MOD.target === "players" || MOD.target === "all") {
                for (let id: PublishedDynamic = 1; id < GetAllTargets.players.length; id++) {
                    const player: PublishedDynamic = GetAllTargets.getPlayerById(id);
                    consider(player, this.isPlayerCandidate(player));
                }
            }
            if (MOD.target === "ghouls" || MOD.target === "all") {
                for (let uid: PublishedDynamic = 1; uid < GetAllTargets.ghouls.length; uid++) {
                    const ghoul: PublishedDynamic = GetAllTargets.getGhoulByUid(uid);
                    consider(ghoul, !!(ghoul && ghoul.active && isFinite(+ghoul.x) && +ghoul.x >= 0 && +ghoul.y >= 0));
                }
            }
            var nowHold: PublishedDynamic = Date.now();
            var held: PublishedDynamic = this._heldTarget;
            var holdMs: PublishedDynamic = +MOD.aimHoldMs;
            if (!(holdMs >= 0)) holdMs = 200;
            if (held && held !== selected && nowHold < (this._heldUntil || 0)) {
                var heldOk: PublishedDynamic = false;
                try {
                    if (GetAllTargets.players && GetAllTargets.players[held.id] === held) heldOk = this.isPlayerCandidate(held);
                    else heldOk = !!(held.active && isFinite(+held.x) && +held.x >= 0 && isFinite(+held.y) && +held.y >= 0);
                } catch (eHold: any) { heldOk = false; }
                if (heldOk && me && isFinite(+me.x) && +me.x >= 0) {
                    var hd: PublishedDynamic = calculateDistance(me, held);
                    if (isFinite(hd) && hd <= maxFromMe) selected = held;
                }
            }
            if (selected !== this._heldTarget) {
                this._heldTarget = selected || null;
                this._heldUntil = selected ? nowHold + holdMs : 0;
            }
            return selected;
        }
        targetVelocity(this: PublishedDynamic,target: PublishedDynamic): PublishedDynamic {
            if (!target || !(target.prevX && target.prevX[0] >= 0) || !(target.prevY && target.prevY[0] >= 0)) return { x: 0, y: 0 };
            var dt: PublishedDynamic = (+target.movedAt || 0) - (+target.prevMovedAt || 0);
            if (!(dt >= 12) || dt > 320) return { x: 0, y: 0 };
            if (Date.now() - (+target.movedAt || 0) > 220) return { x: 0, y: 0 };
            var vx: PublishedDynamic = (target.x - target.prevX[0]) / dt;
            var vy: PublishedDynamic = (target.y - target.prevY[0]) / dt;
            if (target.prevX[1] >= 0 && target.prevY[1] >= 0) {
                var dt2: PublishedDynamic = (+target.prevMovedAt || 0) - (+target.prevMovedAt2 || 0);
                if (dt2 >= 12 && dt2 <= 320) {
                    vx = vx * 0.7 + ((target.prevX[0] - target.prevX[1]) / dt2) * 0.3;
                    vy = vy * 0.7 + ((target.prevY[0] - target.prevY[1]) / dt2) * 0.3;
                }
            }
            var sp: PublishedDynamic = Math.sqrt(vx * vx + vy * vy);
            var capV: PublishedDynamic = 1.2;
            if (sp > capV) {
                vx = vx * capV / sp;
                vy = vy * capV / sp;
            }
            return { x: vx, y: vy };
        }
        aimPoint(this: PublishedDynamic,me: PublishedDynamic, target: PublishedDynamic, distanceCoefficient: PublishedDynamic): PublishedDynamic {
            if (!target) return { x: 0, y: 0 };
            if (!me || !isFinite(+me.x) || !isFinite(+me.y)) return { x: target.x, y: target.y };
            var dx: PublishedDynamic = +target.x - +me.x;
            var dy: PublishedDynamic = +target.y - +me.y;
            var dist: PublishedDynamic = Math.sqrt(dx * dx + dy * dy);
            if (!(dist > 0)) return { x: +target.x, y: +target.y };
            var vel: PublishedDynamic = this.targetVelocity(target);
            var off: PublishedDynamic = +MOD.offsetCoefficient;
            if (!(off >= 0)) off = 0.8;
            var vx: PublishedDynamic = vel.x * off;
            var vy: PublishedDynamic = vel.y * off;
            var perTick: PublishedDynamic = +distanceCoefficient;
            if (!(perTick > 1)) perTick = +MOD.distanceCoefficient;
            if (!(perTick > 1)) perTick = 80;
            var bullet: PublishedDynamic = perTick / 50;
            var cap: PublishedDynamic = +MOD.leadCap;
            if (!(cap > 0)) cap = 280;
            var t: PublishedDynamic = dist / bullet;
            var a: PublishedDynamic = vx * vx + vy * vy - bullet * bullet;
            var b: PublishedDynamic = 2 * (dx * vx + dy * vy);
            var c: PublishedDynamic = dist * dist;
            if (bullet > 0 && Math.abs(a) > 1e-9) {
                var disc: PublishedDynamic = b * b - 4 * a * c;
                if (disc >= 0) {
                    var root: PublishedDynamic = Math.sqrt(disc);
                    var t1: PublishedDynamic = (-b - root) / (2 * a);
                    var t2: PublishedDynamic = (-b + root) / (2 * a);
                    var best: PublishedDynamic = -1;
                    if (t1 > 16 && t1 < 1800) best = t1;
                    if (t2 > 16 && t2 < 1800 && (best < 0 || t2 < best)) best = t2;
                    if (best > 0) t = best;
                }
            }
            if (!(t > 0) || t > 1800) t = Math.min(1800, dist / Math.max(bullet, 0.05));
            var lx: PublishedDynamic = vx * t;
            var ly: PublishedDynamic = vy * t;
            var mag: PublishedDynamic = Math.sqrt(lx * lx + ly * ly);
            if (mag > cap && mag > 0) {
                lx *= cap / mag;
                ly *= cap / mag;
            }
            return { x: +target.x + lx, y: +target.y + ly };
        }
        aimSmooth(this: PublishedDynamic,angle: PublishedDynamic): PublishedDynamic {
            if (!isFinite(+angle)) return isFinite(+this._smoothAngle) ? +this._smoothAngle : (+this.lastAngle || 0);
            var k: PublishedDynamic = +MOD.aimSmooth;
            if (!(k > 0) || k > 1) k = 0.74;
            var prev: PublishedDynamic = +this._smoothAngle;
            if (!isFinite(prev)) {
                this._smoothAngle = +angle;
                return +angle;
            }
            var delta: PublishedDynamic = +angle - prev;
            delta = ((delta + 540) % 360) - 180;
            var next: PublishedDynamic = prev + delta * k;
            this._smoothAngle = next;
            return next;
        }
    }
    class LinesCon {[key:string]: PublishedDynamic;
        constructor(alpha: PublishedDynamic, width: PublishedDynamic, color: PublishedDynamic) {
            this.x1 = -10;
            this.x2 = -10;
            this.y1 = -10;
            this.y2 = -10;
            this.alpha = alpha;
            this.width = width;
            this.color = color;
        }
        reset(this: PublishedDynamic,x1: PublishedDynamic, y1: PublishedDynamic, x2: PublishedDynamic, y2: PublishedDynamic): PublishedDynamic {
            this.x1 = x1;
            this.x2 = x2;
            this.y1 = y1;
            this.y2 = y2;
        }
        set(this: PublishedDynamic,x1: PublishedDynamic, y1: PublishedDynamic, x2: PublishedDynamic, y2: PublishedDynamic): PublishedDynamic {
            this.reset(x1, y1, x2, y2);
        }
    }
    function AimbotRefresh(this: PublishedDynamic): PublishedDynamic {
        GetAllTargets.lines.forEach((line: PublishedDynamic): PublishedDynamic => line.reset(-1, -1, -1, -1));
        if (World.PLAYER[օ̖̏] === 0 || World.PLAYER[x] === -1 || World.PLAYER[y] === -1) {
            if (GetAllTargets.lastId !== 0) {
                GetAllTargets.lastId = 0;
                for (let allplayers: PublishedDynamic = 1; allplayers < 121; allplayers++) {
                    GetAllTargets.getPlayerById(allplayers).setInactive();
                }
                for (let allghouls: PublishedDynamic = 1; allghouls < 999; allghouls++) {
                    GetAllTargets.getGhoulByUid(allghouls).setInactive();
                }
            }
            return;
        }
        GetAllTargets.lastId = World.PLAYER[օ̖̏];
        if (MOD.AimBotEnabled) {
            // While jitter is enabled, the dedicated jitter loop owns angle packets.
            // This prevents normal target refreshes from instantly overwriting the side-to-side angle.
            
            var __babaAimAngle: PublishedDynamic = Aimbot.resolve();
            // Do not force the previous angle after the real target disappeared.
            if (Aimbot.targetPlayer !== null && isFinite(+__babaAimAngle)) {
                ո︀̜.ε٣︀(window.JSON.stringify([6, __babaAimAngle]));
            }
        }
    }
    
    var GetAllTargets: PublishedDynamic = new GetAllTargetsCon();
    var Aimbot: PublishedDynamic = new AimbotCon();
    

    // Jitter must actively send angle packets; merely toggling jitterActive changes no rotation.
    // Use the same CODE36 angle packet as the aimbot and alternate around the anti-aim base angle.
    
    
    
    window.Aimbot = Aimbot;
    window.GetAllTargets = GetAllTargets;
    window.AimbotRefresh = AimbotRefresh;
    window.addEventListener("mousemove", function(this: PublishedDynamic,event: PublishedDynamic): PublishedDynamic {
        GetAllTargets.mousePosition.x = event.clientX;
        GetAllTargets.mousePosition.y = event.clientY;
    });  return {G: GetAllTargets,A: Aimbot,R: AimbotRefresh};
})();
 var GetAllTargets: PublishedDynamic=__BBY.G,Aimbot: PublishedDynamic=__BBY.A,AimbotRefresh: PublishedDynamic=__BBY.R;
 Aimbot.selfId = -1;
Aimbot.dead = false;
Aimbot.mouseDown = false;
Aimbot.refreshing = false;
Aimbot._refreshTimer = null;
Aimbot.myId = function(this: PublishedDynamic): PublishedDynamic {
    try {
        var __id: PublishedDynamic = World.PLAYER[օ̖̏];
        if (__id !== undefined && __id !== null && __id !== 0) this.selfId = __id;
    } catch (e: any) {}
    return this.selfId;
};
Aimbot.send = function(this: PublishedDynamic,packet: PublishedDynamic): PublishedDynamic {
    try {
        var __t: PublishedDynamic = globalThis.__autoPortAimbotPacketTransport;
        if (typeof __t === "function") __t(packet);
    } catch (e: any) {}
};
Aimbot.isDead = function(this: PublishedDynamic): PublishedDynamic {
    if (this.dead || !World.PLAYER || this.myId() === 0)
        return true;
    return GetAllTargets.getPlayerById(this.myId()).active === false;
};
Aimbot.onDeath = function(this: PublishedDynamic): PublishedDynamic {
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
Aimbot.scheduleRefresh = function(this: PublishedDynamic): PublishedDynamic {
    if (this.isDead())
        return;
    var self: PublishedDynamic = this;
    this.refreshing = true;
    clearTimeout(this._refreshTimer);
    this._refreshTimer = setTimeout(function(this: PublishedDynamic): PublishedDynamic { self.refreshing = false; }, 140);
};
Aimbot.refresh = function(this: PublishedDynamic): PublishedDynamic { aimbotTick(); };
Aimbot.packetAngle = function(this: PublishedDynamic,fallback: PublishedDynamic): PublishedDynamic {
    if (__gk(MOD.AimBotEnabled) && this.targetPlayer)
        return ((Math.floor(this.lastAngle) % 360) + 360) % 360;
    if (MOD.hidePlayerAngle)
        return (((Math.floor(fallback) + 180) % 360) + 360) % 360;
    return fallback;
};
Aimbot.hasTarget = function(this: PublishedDynamic): PublishedDynamic { return this.targetPlayer !== null; };
Aimbot.getSelf = function(this: PublishedDynamic): PublishedDynamic {
    if (GetAllTargets.selfFromPacket && Date.now() - GetAllTargets.selfFromPacket < 2000)
        return GetAllTargets.selfPosition;
    var sid: PublishedDynamic = this.myId();
    if (sid > 0 && GetAllTargets.players[sid] && GetAllTargets.players[sid].active)
        return GetAllTargets.players[sid];
    if (GetAllTargets.cameraCenter && (GetAllTargets.cameraCenter.x !== 0 || GetAllTargets.cameraCenter.y !== 0))
        return GetAllTargets.cameraCenter;
    return GetAllTargets.selfPosition;
};
Aimbot.findTarget = function(this: PublishedDynamic,from: PublishedDynamic, maxDistance: PublishedDynamic): PublishedDynamic {
    return this.findNearestPlayerTo(from, maxDistance);
};
GetAllTargets.selfPosition = { x: 0, y: 0 };
GetAllTargets.selfFromPacket = 0;
GetAllTargets.selfWeapon = -1;
GetAllTargets.cameraCenter = { x: 0, y: 0 };
GetAllTargets.resetLines = function(this: PublishedDynamic): PublishedDynamic {
    this.lines.forEach(function(this: PublishedDynamic,line: PublishedDynamic): PublishedDynamic { line.reset(); });
};
GetAllTargets.resetAll = function(this: PublishedDynamic): PublishedDynamic {
    for (var i: PublishedDynamic = 1; i < this.players.length; i++) {
        var p: PublishedDynamic = this.players[i];
        if (p && p.active) p.setInactive();
    }
    for (var j: PublishedDynamic = 1; j < this.ghouls.length; j++) {
        var g: PublishedDynamic = this.ghouls[j];
        if (g && g.active) g.setInactive();
    }
    this.resetLines();
    this.lastId = 0;
};
Aimbot.spearResolve = function(this: PublishedDynamic): PublishedDynamic {
    var me: PublishedDynamic = this.getSelf();
    if (!me) return this.lastAngle;
    var target: PublishedDynamic = this.targetPlayer || this.currentTarget;
    var blocked: PublishedDynamic = false;
    try {
        if (target && GetAllTargets.players && GetAllTargets.players[target.id] === target)
            blocked = !this.isPlayerCandidate(target);
    } catch (e: any) { blocked = true; }
    if (!target || !target.active || blocked)
        target = this.findTarget(me, Math.min(2500, MOD.spearMaxRange || 560));
    try {
        if (target && GetAllTargets.players && GetAllTargets.players[target.id] === target && !this.isPlayerCandidate(target))
            target = null;
    } catch (e2: any) { target = null; }
    this.currentTarget = target || null;
    this.targetPlayer = target || null;
    if (!target) return this.lastAngle;
    var pt: PublishedDynamic = this.aimPoint(me, target, +MOD.spearSpeed || 46.5);
    var fwd: PublishedDynamic = MOD.spearHandFwd || 22;
    var side: PublishedDynamic = MOD.spearHandSide || -39;
    var dx: PublishedDynamic = pt.x - me.x, dy: PublishedDynamic = pt.y - me.y;
    var dist: PublishedDynamic = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux: PublishedDynamic = dx / dist, uy: PublishedDynamic = dy / dist;
    var hx: PublishedDynamic = me.x + ux * fwd + (-uy) * side;
    var hy: PublishedDynamic = me.y + uy * fwd + (ux) * side;
    var stabDeg: PublishedDynamic = MOD.spearStabDeg || 2.5;
    var stab: PublishedDynamic = stabDeg * Math.PI / 180;
    var ax: PublishedDynamic = pt.x - hx, ay: PublishedDynamic = pt.y - hy;
    var ang: PublishedDynamic = Math.atan2(ay, ax) * AIM_RAD;
    var angStab: PublishedDynamic = Math.atan2(ay * Math.cos(stab) - ax * Math.sin(stab), ax * Math.cos(stab) + ay * Math.sin(stab)) * AIM_RAD;
    var angle: PublishedDynamic = Math.floor(angStab);
    this.lastAngle = ((angle % 360) + 360) % 360;
    if (GetAllTargets.lines[1])
        GetAllTargets.lines[1].set(me.x, me.y, pt.x, pt.y, dist > (MOD.spearMaxRange || 560) ? 1 : 0);
    return this.lastAngle;
};
 var __oTouchAim: PublishedDynamic = function(this: PublishedDynamic,event: PublishedDynamic): PublishedDynamic {
    // changedTouches[0] = the finger that just moved/landed — the aim intent,
    // not a finger already parked on the joystick
    var t: PublishedDynamic = event.changedTouches && event.changedTouches.length ? event.changedTouches[0]
        : (event.touches && event.touches.length ? event.touches[0] : null);
    if (t) {
        GetAllTargets.mousePosition.x = t.clientX;
        GetAllTargets.mousePosition.y = t.clientY;
    }
};
օܓߋ.addEventListener("touchstart", __oTouchAim, { passive: true });
օܓߋ.addEventListener("touchmove", __oTouchAim, { passive: true });
document.addEventListener("mousedown", function(this: PublishedDynamic,event: PublishedDynamic): PublishedDynamic {
    if (event.button === 0)
        Aimbot.mouseDown = true;
});
document.addEventListener("mouseup", function(this: PublishedDynamic,event: PublishedDynamic): PublishedDynamic {
    if (event.button === 0)
        Aimbot.mouseDown = false;
});
օܓߋ.addEventListener("blur", function(this: PublishedDynamic): PublishedDynamic {
    Aimbot.mouseDown = false;
});
 function __isMyAimbotPlayer(this: PublishedDynamic,o: PublishedDynamic, id: PublishedDynamic): PublishedDynamic {
    var my: PublishedDynamic = World.PLAYER[օ̖̏];
    if (o === null || o === undefined || my === undefined || my === null)
        return false;
    if (id !== undefined && id !== null)
        return id === my;
    var key: PublishedDynamic = (__isMyAimbotPlayer as PublishedDynamic).key;
    if (key !== undefined && o[key] !== undefined)
        return o[key] === my;
    for (var k in o) {
        if (typeof o[k] === "number" && o[k] === my) {
            (__isMyAimbotPlayer as PublishedDynamic).key = k;
            return true;
        }
    }
    return false;
}
 function __aimShotAllowed(this: PublishedDynamic): PublishedDynamic {
    var t: PublishedDynamic = Aimbot && Aimbot.targetPlayer;
    if (!t || !t.active) return false;
    try {
        if (GetAllTargets.players && GetAllTargets.players[t.id] === t)
            return !!Aimbot.isPlayerCandidate(t);
    } catch (e: any) { return false; }
    return true;
}
 function aimbotTick(this: PublishedDynamic): PublishedDynamic {
    if (Aimbot.dead)
        return;
    var _spearOn: PublishedDynamic = __gk(MOD.AimbotSpearEnabled) && GetAllTargets.selfWeapon === SPEAR_IDX && SPEAR_IDX >= 0;
    if (_spearOn) {
        var sAngle: PublishedDynamic = Aimbot.spearResolve();
        if (sAngle !== null && isFinite(+sAngle))
            Aimbot.send([6, __gk(sAngle)]);
        if (MOD.autoFire && __aimShotAllowed()) {
            Aimbot.send([4]);
            Aimbot.send([5]);
        }
    } else if (__gk(MOD.AimBotEnabled) && MOD.autoFire && __aimShotAllowed()) {
        Aimbot.send([4]);
        Aimbot.send([5]);
    }
}
 var __antiMoveStep: PublishedDynamic = 0;
var __antiMovePattern: PublishedDynamic = [1, 2, 4, 8, 1, 2, 4, 8, 5, 9, 10, 6];
 function routineAntiAimbot(this: PublishedDynamic): PublishedDynamic {
    try {
        if (!__gk(MOD.AntiAimbot)) return;
        var coeff: PublishedDynamic = Math.max(1, +MOD.antiAimCoefficient || 100);
        __antiMoveStep += coeff;
        var idx: PublishedDynamic = Math.floor(__antiMoveStep / coeff) % __antiMovePattern.length;
        ո︀̜.ε٣︀(window.JSON.stringify([2, __antiMovePattern[idx]]));
    } catch (e: any) {}
}
 function afterFire(this: PublishedDynamic): PublishedDynamic{Aimbot.mouseDown=true;Aimbot.scheduleRefresh();}
 function start(this: PublishedDynamic): PublishedDynamic{if(started||stopped)return;started=true;setInterval((): PublishedDynamic=>environment.rotationTick(),50);setInterval(routineAntiAimbot, 50);
(function aimbotLoop(this: PublishedDynamic): PublishedDynamic {
    try {
        aimbotTick();
    } catch (e: any) {}
    setTimeout(aimbotLoop, MOD.AimBotEnabled || MOD.AntiAimbot || MOD.AimbotSpearEnabled ? 50 : 200);
})();}
 function render(this: PublishedDynamic,ctx: PublishedDynamic,view: PublishedDynamic,pixelScale: PublishedDynamic=1): PublishedDynamic{
  // The host resets the native canvas transform before overlays. Convert only
  // draw coordinates to backing pixels; source mouse/camera maths stay logical.
  if(!(pixelScale>0)||!Number.isFinite(pixelScale))pixelScale=1;
  const surface: PublishedDynamic=pixelScale===1?ctx:new Proxy(ctx,{get(this: PublishedDynamic,target: PublishedDynamic,key: PublishedDynamic): PublishedDynamic{if(key==='moveTo'||key==='lineTo')return (px: PublishedDynamic,py: PublishedDynamic): PublishedDynamic=>target[key](px*pixelScale,py*pixelScale);if(key==='lineWidth')return target.lineWidth/pixelScale;const value: PublishedDynamic=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;},set(this: PublishedDynamic,target: PublishedDynamic,key: PublishedDynamic,value: PublishedDynamic): PublishedDynamic{return Reflect.set(target,key,key==='lineWidth'?value*pixelScale:value,target);}});
  const ᴏܘ๐: PublishedDynamic=surface,ㅤο９: PublishedDynamic=view.x,ᴉᚉ̷: PublishedDynamic=view.y,о༨ε: PublishedDynamic=view.scale;function AimbotDraw(this: PublishedDynamic): PublishedDynamic {
      let aimAlpha: PublishedDynamic = ᴏܘ๐.globalAlpha
        , aimWidth: PublishedDynamic = ᴏܘ๐.lineWidth;
      for (var aimLine: PublishedDynamic = 0; aimLine < GetAllTargets.lines.length; aimLine++) {
        let pos: PublishedDynamic = GetAllTargets.lines[aimLine];
        ᴏܘ๐.lineWidth = pos.width;
        ᴏܘ๐.globalAlpha = pos.alpha;
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
      } catch (e: any) {}
      if (MOD.mouseFovEnable) {
        GetAllTargets.mouseMapCords = {
          x: GetAllTargets.mousePosition.x / о༨ε - ㅤο９,
          y: GetAllTargets.mousePosition.y / о༨ε - ᴉᚉ̷
        };
      }
    }AimbotDraw();}
 function AimbotSaveConfig(this: PublishedDynamic): PublishedDynamic {
    try {
        localStorage.setItem("BestModMenuConfig", JSON.stringify(MOD));
    } catch (e: any) {}
}
 function AimbotHookSave(this: PublishedDynamic,gui: PublishedDynamic): PublishedDynamic {
    gui.__controllers.forEach(function(this: PublishedDynamic,controller: PublishedDynamic): PublishedDynamic {
        var previous: PublishedDynamic = controller.__onFinishChange;
        controller.onFinishChange(function(this: PublishedDynamic,value: PublishedDynamic): PublishedDynamic {
            if (previous)
                previous.call(controller, value);
            AimbotSaveConfig();
        });
    });
    for (var name in gui.__folders) {
        AimbotHookSave(gui.__folders[name]);
    }
}
 function AimbotMenuSetupKey(this: PublishedDynamic,folder: PublishedDynamic, keyName: PublishedDynamic, displayName: PublishedDynamic): PublishedDynamic {
    const input: PublishedDynamic = folder.add(MOD, keyName).name(displayName);
    const element: PublishedDynamic = input.domElement.querySelector("input");
    element.readOnly = true;
    element.style.textAlign = "center";
    element.style.cursor = "pointer";
    element.addEventListener("click", (): PublishedDynamic => {
        element.blur();
        MOD[keyName] = "...";
        input.updateDisplay();
        function KeyHandler(this: PublishedDynamic,event: PublishedDynamic): PublishedDynamic {
            MOD[keyName] = event.code;
            if (keyName === "ModMenuKey") {
                MOD.ModMenuKeyCode = event.keyCode;
            }
            input.updateDisplay();
            AimbotSaveConfig();
            document.removeEventListener("keydown", KeyHandler);
        }
        document.addEventListener("keydown", KeyHandler);
    }
    );
}
 function installMenu(this: PublishedDynamic,menu: PublishedDynamic): PublishedDynamic{const aimFolder: PublishedDynamic = menu.addFolder("👑 Aim Bot 👑");
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
const spearFolder: PublishedDynamic = menu.addFolder("\ud83d\udde1 Aimbot Spear \ud83d\udde1");
spearFolder.add(MOD, "AimbotSpearEnabled").name("AimbotSpearEnabled");
spearFolder.add(MOD, "spearSpeed", 20, 60, 0.5).name("SpearSpeed");
spearFolder.add(MOD, "spearMaxRange", 200, 600, 10).name("MaxRange");
spearFolder.add(MOD, "spearHandFwd", -60, 60, 1).name("HandFwd");
spearFolder.add(MOD, "spearHandSide", -60, 60, 1).name("HandSide");
spearFolder.add(MOD, "spearStabDeg", 0.5, 10, 0.5).name("Stability");
spearFolder.add(MOD, "autoFire").name("AutoThrow");
const antiFolder: PublishedDynamic = menu.addFolder("Anti-Aim / Strafe");
antiFolder.add(MOD, "AntiAimbot").name("StrafeEnable");
antiFolder.add(MOD, "antiAimCoefficient", 10, 500, 10).name("AntiAimCoefficient");
const lineFolder: PublishedDynamic = menu.addFolder("Aim Line");
lineFolder.add(MOD, "visualizeResolving").name("ShowAimLine");
lineFolder.addColor(MOD, "visualizeResolvingColor").name("AimLineColor");
 const keyFolder: PublishedDynamic = menu.addFolder("Keyboard");
AimbotMenuSetupKey(keyFolder, "AimbotKey", "AimbotKey");
AimbotMenuSetupKey(keyFolder, "AntiAimbotKey", "AntiAimbotKey");
AimbotMenuSetupKey(keyFolder, "JitterKey", "JitterKey");
AimbotMenuSetupKey(keyFolder, "HideAngleKey", "HideAngleKey");
AimbotMenuSetupKey(keyFolder, "ModMenuKey", "ModMenuKey");
 aimFolder.open();
 const folders: PublishedDynamic=[aimFolder,spearFolder,antiFolder,lineFolder];for(const folder of [...folders,keyFolder])AimbotHookSave(folder);return {folders,controllers:folders.flatMap((folder: PublishedDynamic): PublishedDynamic=>folder.__controllers)};
 }
 return {targets:GetAllTargets,aim:Aimbot,Target:GetAllTargets.players[1].constructor,
   start,installMenu,render,tick:(): PublishedDynamic=>cycle(aimbotTick),refreshTargets:(): PublishedDynamic=>cycle(AimbotRefresh),
   position(this: PublishedDynamic,kind: PublishedDynamic,id: PublishedDynamic,px: PublishedDynamic,py: PublishedDynamic,weapon: PublishedDynamic,packed: PublishedDynamic): PublishedDynamic{return cycle((): PublishedDynamic=>{const target: PublishedDynamic=GetAllTargets[kind][id];if(kind==='players'&&Number.isFinite(packed)){target.weaponIdx=(packed>>8)&255;if(id===World.PLAYER.id)GetAllTargets.selfWeapon=target.weaponIdx;}target.update(px,py,weapon);if(kind==='players'&&id===World.PLAYER.id){Aimbot.selfId=id;GetAllTargets.selfPosition={x:px,y:py};GetAllTargets.selfFromPacket=Date.now();Aimbot.dead=false;}});},
   afterFire:(): PublishedDynamic=>cycle(afterFire),afterRelease(this: PublishedDynamic): PublishedDynamic{Aimbot.mouseDown=false;},onMove(this: PublishedDynamic,mask: PublishedDynamic): PublishedDynamic{GetAllTargets.myLastMoveDirection=mask;return true;},
   antiTick:(): PublishedDynamic=>cycle(routineAntiAimbot,'anti'),
   onHandshake(this: PublishedDynamic): PublishedDynamic{Aimbot.dead=false;},onOtherDie(this: PublishedDynamic,id: PublishedDynamic): PublishedDynamic{GetAllTargets.players[id]?.setInactive();},sync(this: PublishedDynamic): PublishedDynamic{},
   ensure(this: PublishedDynamic,id: PublishedDynamic): PublishedDynamic{if(id>0){for(const group of [GetAllTargets.players,GetAllTargets.ghouls])if(!group[id])group[id]=new this.Target(id);}},
   dispose(this: PublishedDynamic): PublishedDynamic{if(stopped)return;stopped=true;for(const id of [...timers.keys()])clear(id);for(const remove of removers)remove();Aimbot.mouseDown=false;}
 };
}
// Existing Resource Override installations recognize this entrypoint name.
// It forwards to the uploaded engine and contains no previous aim mechanics.
function __createIlmAim(this: PublishedDynamic,settings: PublishedDynamic,environment: PublishedDynamic): PublishedDynamic{return __createMessage27Core(settings,environment);}
function __createIlmAdapter(this: PublishedDynamic,settings: PublishedDynamic,environment: PublishedDynamic): PublishedDynamic{
 const pendingKeys: PublishedDynamic=new Set();
 const sourceSettings: PublishedDynamic=new Proxy(settings,{get(this: PublishedDynamic,target: PublishedDynamic,key: PublishedDynamic): PublishedDynamic{return pendingKeys.has(key)?'...':target[key];},set(this: PublishedDynamic,target: PublishedDynamic,key: PublishedDynamic,value: PublishedDynamic): PublishedDynamic{if(['AimbotKey','AntiAimbotKey','JitterKey','HideAngleKey','ModMenuKey'].includes(key)){if(value==='...'){pendingKeys.add(key);return true;}if(pendingKeys.has(key)){pendingKeys.delete(key);environment.setKey(key,value);return true;}}target[key]=value;return true;}});
 const metadata: PublishedDynamic=new Proxy([],{get(this: PublishedDynamic,target: PublishedDynamic,key: PublishedDynamic): PublishedDynamic{if(typeof key==='string'&&/^\d+$/.test(key)){const id: PublishedDynamic=+key;if(!environment.playerInfo(id).exists)return undefined;if(!target[id])target[id]={get εᴎ༩(): PublishedDynamic{return environment.playerInfo(id).team;},get і٥ࠂ(): PublishedDynamic{return environment.playerInfo(id).membership;}};}return target[key];}});
 const clans: PublishedDynamic=new Proxy([],{get(this: PublishedDynamic,target: PublishedDynamic,key: PublishedDynamic): PublishedDynamic{if(typeof key==='string'&&/^\d+$/.test(key)){const id: PublishedDynamic=+key;if(!environment.clanInfo(id).exists)return undefined;if(!target[id])target[id]={get ᴎ०︁(): PublishedDynamic{return environment.clanInfo(id).membership;}};}return target[key];}});
 const self: PublishedDynamic={get id(): PublishedDynamic{return environment.selfId();},get x(): PublishedDynamic{return environment.selfPosition().x;},get y(): PublishedDynamic{return environment.selfPosition().y;},get εᴎ༩(): PublishedDynamic{return environment.playerInfo(environment.selfId()).team;}};
 const core: PublishedDynamic=__createIlmAim(sourceSettings,{...environment,world:{PLAYER:self,players:metadata,ⲣ８ߌ:clans}}),originalEnsure: PublishedDynamic=core.ensure.bind(core);
 Object.defineProperty(core,'waitingForKey',{get:(): PublishedDynamic=>pendingKeys.size>0});
 core.ensure=originalEnsure;
 return core;
}
function __ilmAimDefaults(this: PublishedDynamic): PublishedDynamic{return {"AimBotEnabled":false,"AimbotSpearEnabled":false,"spearSpeed":46.5,"spearMaxRange":560,"spearHandFwd":22,"spearHandSide":-39,"spearStabDeg":2.5,"hideAimbotAngle":false,"hidePlayerAngle":false,"target":"players","TargetTeammate":false,"resolverType":"linear","mouseFovEnable":true,"mouseFov":900,"distanceCoefficient":80,"offsetCoefficient":0.8,"aimStick":240,"aimSmooth":0.74,"aimMaxRange":2400,"aimHoldMs":200,"leadCap":280,"visualizeResolving":true,"visualizeResolvingColor":"#FFF200","autoFire":false,"lockId":-1,"AntiAimbot":false,"antiAimCoefficient":100,"ShowRealAngles":"withAim","AimbotKey":"KeyZ","AntiAimbotKey":"NoKey","JitterKey":"KeyJ","HideAngleKey":"KeyH","ModMenuKey":"KeyM","ModMenuKeyCode":77};}
function __ilmAimConstraints(this: PublishedDynamic): PublishedDynamic{return {limits:{mouseFov:[0,12345],distanceCoefficient:[10,1000],offsetCoefficient:[0,3],aimStick:[0,800],aimHoldMs:[0,600],leadCap:[40,500],aimSmooth:[.05,1],lockId:[-1,120],aimMaxRange:[1,20000],spearSpeed:[20,60],spearMaxRange:[200,600],spearHandFwd:[-60,60],spearHandSide:[-60,60],spearStabDeg:[.5,10],antiAimCoefficient:[10,500]},choices:{target:['players','ghouls','all'],resolverType:['linear'],ShowRealAngles:['never','always','withAim']}};}
function __ilmMouseToWorld(this: PublishedDynamic,point: PublishedDynamic,view: PublishedDynamic): PublishedDynamic{return {x:point.x/view.scale-view.x,y:point.y/view.scale-view.y};}
// Physical prediction in world units and seconds. No native game code is executed here.
function __createBallisticAim(this: PublishedDynamic,settings: PublishedDynamic, clock: PublishedDynamic): PublishedDynamic {
  const tracks: PublishedDynamic=new Map(), speeds: PublishedDynamic=new Map(), projectiles: PublishedDynamic=new Map();
  const maxAge: PublishedDynamic=350, maxGap: PublishedDynamic=500, maxSpeed: PublishedDynamic=1800;
  function circle(this: PublishedDynamic,samples: PublishedDynamic): PublishedDynamic{
    for(let count: PublishedDynamic=samples.length;count>=5;count--){const fit: PublishedDynamic=fitCircle(samples.slice(-count));if(fit)return fit;}
    return null;
  }
  function fitCircle(this: PublishedDynamic,samples: PublishedDynamic): PublishedDynamic{
    if(samples.length<5||samples.at(-1).at-samples[0].at<250-1e-6)return null;
    const last: PublishedDynamic=samples.at(-1),points: PublishedDynamic=samples.map((p: PublishedDynamic): PublishedDynamic=>({x:p.x-last.x,y:p.y-last.y,t:(p.at-last.at)/1000})),n: PublishedDynamic=points.length;
    let mx: PublishedDynamic=0,my: PublishedDynamic=0,mz: PublishedDynamic=0;for(const p of points){mx+=p.x/n;my+=p.y/n;mz+=(p.x*p.x+p.y*p.y)/n;}
    let xx: PublishedDynamic=0,xy: PublishedDynamic=0,yy: PublishedDynamic=0,xz: PublishedDynamic=0,yz: PublishedDynamic=0;
    for(const p of points){const x: PublishedDynamic=p.x-mx,y: PublishedDynamic=p.y-my,z: PublishedDynamic=p.x*p.x+p.y*p.y-mz;xx+=x*x;xy+=x*y;yy+=y*y;xz+=x*z;yz+=y*z;}
    const det: PublishedDynamic=xx*yy-xy*xy,orthogonalRms: PublishedDynamic=Math.sqrt(Math.max(0,(xx+yy-Math.hypot(xx-yy,2*xy))/(2*n)));
    if(det<1e-7*(xx+yy)**2||orthogonalRms<.55)return null;
    const cx: PublishedDynamic=(xz*yy-yz*xy)/(2*det),cy: PublishedDynamic=(yz*xx-xz*xy)/(2*det),radius: PublishedDynamic=Math.sqrt(cx*cx+cy*cy+mz-2*cx*mx-2*cy*my);
    const residualTolerance: PublishedDynamic=Math.min(3,Math.max(1.5,radius*.01));
    if(!Number.isFinite(radius)||radius+residualTolerance<50||radius>5000)return null;
    let previous: PublishedDynamic=null,angle: PublishedDynamic=0,first: PublishedDynamic=0,st: PublishedDynamic=0,sa: PublishedDynamic=0,stt: PublishedDynamic=0,sta: PublishedDynamic=0;const rates: PublishedDynamic=[],angles: PublishedDynamic=[];
    for(let i: PublishedDynamic=0;i<n;i++){
      const p: PublishedDynamic=points[i];if(Math.abs(Math.hypot(p.x-cx,p.y-cy)-radius)>residualTolerance)return null;
      const a: PublishedDynamic=Math.atan2(p.y-cy,p.x-cx);
      if(previous===null)first=angle=a;
      else {const delta: PublishedDynamic=Math.atan2(Math.sin(a-previous),Math.cos(a-previous)),dt: PublishedDynamic=p.t-points[i-1].t;if(dt<=0)return null;angle+=delta;rates.push(delta/dt);}
      previous=a;angles.push(angle);st+=p.t;sa+=angle;stt+=p.t*p.t;sta+=p.t*angle;
    }
    const omega: PublishedDynamic=(n*sta-st*sa)/(n*stt-st*st),speed: PublishedDynamic=Math.abs(omega)*radius,sweep: PublishedDynamic=Math.abs(angle-first);
    // Curvature must be larger than quantization noise. Nearly straight noisy
    // samples otherwise fit a large circle and produce false curved leads.
    const sagitta: PublishedDynamic=radius*(1-Math.cos(sweep/2)),intercept: PublishedDynamic=(sa-omega*st)/n;
    const timingError: PublishedDynamic=Math.sqrt(points.reduce((sum: PublishedDynamic,p: PublishedDynamic,i: PublishedDynamic): PublishedDynamic=>sum+(radius*(angles[i]-intercept-omega*p.t))**2,0)/n);
    if(speed<30||speed>1200||sweep<.08||sweep>Math.PI||sagitta<1.5||timingError>2.5||rates.some((r: PublishedDynamic): PublishedDynamic=>r*omega<=0))return null;
    return {cx:last.x+cx,cy:last.y+cy,radius,omega,angle,at:last.at};
  }
  function track(this: PublishedDynamic,key: PublishedDynamic,x: PublishedDynamic,y: PublishedDynamic,active: PublishedDynamic,meta: PublishedDynamic={}): PublishedDynamic {
    if(!active){tracks.delete(key);return;}
    if(!Number.isFinite(x)||!Number.isFinite(y))return;
    const at: PublishedDynamic=clock();let t: PublishedDynamic=tracks.get(key),last: PublishedDynamic=t?.samples.at(-1);
    if(!t || at<last.at || at-last.at>maxGap || meta.generation!==undefined&&t.generation!==undefined&&meta.generation!==t.generation){
      t={samples:[],weapon:-1,generation:meta.generation};tracks.set(key,t);last=null;
    }
    if(last && (Math.hypot(x-last.x,y-last.y)>200 || at-last.at>=8&&Math.hypot(x-last.x,y-last.y)/(at-last.at)*1000>maxSpeed)){t.samples=[];last=null;t.curve=null;}
    if(meta.weapon!==undefined)t.weapon=meta.weapon;
    if(meta.generation!==undefined)t.generation=meta.generation;
    const newObservation: PublishedDynamic=!last||at-t.observationAt>=8;
    if(!newObservation)t.samples[t.samples.length-1]={x,y,at};
    else {t.samples.push({x,y,at});t.observationAt=at;}
    while(t.samples.length>8||t.samples.length>2&&at-t.samples[0].at>600+1e-6)t.samples.shift();
    const curve: PublishedDynamic=circle(t.samples),before: PublishedDynamic=t.curve;
    // Coalesced packets refine one observation; they cannot confirm a new window.
    if(curve){curve.streak=before&&before.omega*curve.omega>0&&Math.abs(before.radius-curve.radius)<.15*curve.radius&&Math.hypot(before.cx-curve.cx,before.cy-curve.cy)<Math.max(8,.15*curve.radius)?before.streak+(newObservation?1:0):1;}
    t.curve=curve;
  }
  function motion(this: PublishedDynamic,key: PublishedDynamic,at: PublishedDynamic=clock()): PublishedDynamic {
    const t: PublishedDynamic=tracks.get(key),last: PublishedDynamic=t?.samples.at(-1);
    if(!last || at<last.at || at-last.at>maxAge)return null;
    const s: PublishedDynamic=t.samples;let vx: PublishedDynamic=0,vy: PublishedDynamic=0;
    if(s.length>1){
      const p: PublishedDynamic=s.at(-2),dt: PublishedDynamic=(last.at-p.at)/1000;
      if(dt>0){
        const dx: PublishedDynamic=last.x-p.x,dy: PublishedDynamic=last.y-p.y;
        // A stop or turn should not drag an older velocity into the next shot.
        let first: PublishedDynamic=Math.max(0,s.length-4);
        // Retain the latest uninterrupted leg. Checking only the newest pair
        // let pre-turn samples back into the fit one packet after a turn.
        for(let i: PublishedDynamic=s.length-2;i>first;i--){
          const a: PublishedDynamic=s[i-1],b: PublishedDynamic=s[i],c: PublishedDynamic=s[i+1],ax: PublishedDynamic=b.x-a.x,ay: PublishedDynamic=b.y-a.y,bx: PublishedDynamic=c.x-b.x,by: PublishedDynamic=c.y-b.y;
          if(ax*bx+ay*by<=0 || Math.abs(ax*by-ay*bx)>.5*Math.hypot(ax,ay)*Math.hypot(bx,by)){first=i;break;}
        }
        if(dx!==0||dy!==0){
          let st: PublishedDynamic=0,sx: PublishedDynamic=0,sy: PublishedDynamic=0,stt: PublishedDynamic=0,stx: PublishedDynamic=0,sty: PublishedDynamic=0,n: PublishedDynamic=0;
          for(let i: PublishedDynamic=first;i<s.length;i++){const p: PublishedDynamic=s[i],t: PublishedDynamic=(p.at-last.at)/1000;st+=t;sx+=p.x;sy+=p.y;stt+=t*t;stx+=t*p.x;sty+=t*p.y;n++;}
          const d: PublishedDynamic=n*stt-st*st;
          if(d>1e-10){vx=(n*stx-st*sx)/d;vy=(n*sty-st*sy)/d;}
        }
      }
    }
    const curve: PublishedDynamic=t.curve?.streak>=2&&at-last.at<=200?t.curve:null;
    if(curve){vx=-curve.radius*curve.omega*Math.sin(curve.angle);vy=curve.radius*curve.omega*Math.cos(curve.angle);}
    return {x:last.x,y:last.y,vx,vy,age:(at-last.at)/1000,weapon:t.weapon,samples:s.length,curve};
  }
  function projectile(this: PublishedDynamic,key: PublishedDynamic,weapon: PublishedDynamic,speed: PublishedDynamic,nominal: PublishedDynamic): PublishedDynamic {
    const at: PublishedDynamic=clock();
    if(projectiles.has(key)||!Number.isInteger(weapon)||weapon<0||!Number.isFinite(speed)||speed<100||speed>20000)return;
    projectiles.set(key,at);
    while(projectiles.size>256)projectiles.delete(projectiles.keys().next().value);
    // A packet for a projectile fired before a weapon switch must not teach the
    // newly equipped weapon a radically different speed.
    if(nominal>0&&Math.abs(speed-nominal)>.3*nominal)return;
    let sample: PublishedDynamic=speeds.get(weapon);if(!sample){sample=[];speeds.set(weapon,sample);}
    sample.push({speed,at});if(sample.length>9)sample.shift();
    if(speeds.size>128)speeds.delete(speeds.keys().next().value);
  }
  function speedFor(this: PublishedDynamic,weapon: PublishedDynamic,profile: PublishedDynamic={}): PublishedDynamic {
    const samples: PublishedDynamic=(speeds.get(weapon)||[]).filter((s: PublishedDynamic): PublishedDynamic=>clock()-s.at<300000);
    if(settings.predictionAutoSpeed && samples.length){
      const values: PublishedDynamic=samples.map((s: PublishedDynamic): PublishedDynamic=>s.speed).sort((a: PublishedDynamic,b: PublishedDynamic): PublishedDynamic=>a-b),trim: PublishedDynamic=values.length>=5?1:0;
      const kept: PublishedDynamic=values.slice(trim,values.length-trim);
      return {speed:kept.reduce((a: PublishedDynamic,b: PublishedDynamic): PublishedDynamic=>a+b,0)/kept.length,source:'server-projectiles',samples:samples.length};
    }
    if(settings.predictionAutoSpeed && profile.speed>0)return {speed:profile.speed,source:'native-weapon',samples:0};
    return {speed:settings.bulletSpeedCoefficient*1000,source:'configured',samples:0};
  }
  function intercept(this: PublishedDynamic,rx: PublishedDynamic,ry: PublishedDynamic,vx: PublishedDynamic,vy: PublishedDynamic,speed: PublishedDynamic,muzzle: PublishedDynamic=0): PublishedDynamic {
    if(![rx,ry,vx,vy,speed,muzzle].every(Number.isFinite)||speed<=0||muzzle<0)return null;
    const c: PublishedDynamic=rx*rx+ry*ry-muzzle*muzzle;if(c<=0)return 0;
    const a: PublishedDynamic=vx*vx+vy*vy-speed*speed,b: PublishedDynamic=2*(rx*vx+ry*vy-speed*muzzle);
    let roots: PublishedDynamic;
    if(Math.abs(a)<1e-8*Math.max(speed*speed,1))roots=Math.abs(b)>1e-9?[-c/b]:[];
    else {const d: PublishedDynamic=b*b-4*a*c;if(d<0)return null;const q: PublishedDynamic=-.5*(b+(b>=0?1:-1)*Math.sqrt(d));roots=q===0?[-b/(2*a)]:[q/a,c/q];}
    const positive: PublishedDynamic=roots.filter((t: PublishedDynamic): PublishedDynamic=>Number.isFinite(t)&&t>=0);return positive.length?Math.min(...positive):null;
  }
  function resolve(this: PublishedDynamic,selfKey: PublishedDynamic,targetKey: PublishedDynamic,profile: PublishedDynamic={}): PublishedDynamic {
    const now: PublishedDynamic=clock(),self: PublishedDynamic=motion(selfKey,now),target: PublishedDynamic=motion(targetKey,now);
    if(!self||!target)return {valid:false,status:'stale-position'};
    const delay: PublishedDynamic=(settings.predictionLatencyMs||0)/1000;
    function future(this: PublishedDynamic,m: PublishedDynamic,t: PublishedDynamic): PublishedDynamic{if(m.curve){const c: PublishedDynamic=m.curve,a: PublishedDynamic=c.angle+c.omega*t;return {x:c.cx+c.radius*Math.cos(a),y:c.cy+c.radius*Math.sin(a)};}return {x:m.x+m.vx*t,y:m.y+m.vy*t};}
    const origin: PublishedDynamic=future(self,self.age+delay),ox: PublishedDynamic=origin.x,oy: PublishedDynamic=origin.y,initial: PublishedDynamic=future(target,target.age+delay),tx: PublishedDynamic=initial.x,ty: PublishedDynamic=initial.y;
    const distance: PublishedDynamic=Math.hypot(tx-ox,ty-oy),model: PublishedDynamic=speedFor(self.weapon,profile);
    let flight: PublishedDynamic=intercept(tx-ox,ty-oy,target.vx,target.vy,model.speed,profile.muzzle||0),motionModel: PublishedDynamic='linear';
    if(target.curve&&model.speed>Math.hypot(target.vx,target.vy)*1.05){
      let lo: PublishedDynamic=0,hi: PublishedDynamic=Math.min(3,profile.range>0?profile.range/model.speed:3);
      const gap: PublishedDynamic=(t: PublishedDynamic): PublishedDynamic=>{const p: PublishedDynamic=future(target,target.age+delay+t);return Math.hypot(p.x-ox,p.y-oy)-model.speed*t-(profile.muzzle||0);};
      if(gap(hi)>0)flight=null;
      else{for(let i: PublishedDynamic=0;i<32;i++){const mid: PublishedDynamic=(lo+hi)/2;if(gap(mid)>0)lo=mid;else hi=mid;}flight=(lo+hi)/2;motionModel='circle';}
    }
    if(flight===null || flight>3 || profile.range>0&&model.speed*flight>profile.range)return {valid:false,status:'unreachable',distance,...model};
    const point: PublishedDynamic=motionModel==='circle'?future(target,target.age+delay+flight):{x:tx+target.vx*flight,y:ty+target.vy*flight},x: PublishedDynamic=point.x,y: PublishedDynamic=point.y,angle: PublishedDynamic=Math.atan2(y-oy,x-ox)*180/Math.PI;
    return {valid:true,status:'tracking',angle,x,y,ox,oy,distance,flight,motionModel,...model,selfVelocity:{x:self.vx,y:self.vy},targetVelocity:{x:target.vx,y:target.vy}};
  }
  return {track,motion,projectile,speedFor,resolve,intercept,reset(this: PublishedDynamic): PublishedDynamic{tracks.clear();projectiles.clear();}};
}
function __ilmPlayerNickname(this: PublishedDynamic,value: PublishedDynamic,id: PublishedDynamic): PublishedDynamic {
  return typeof value==='string' ? value+'#'+id : value;
}

function __ilmPatchPlayerMetadata(this: PublishedDynamic,source: PublishedDynamic): PublishedDynamic{const before: PublishedDynamic="this.ᴑ︎ܔ = ᴑ︎ܔ";if(source.split(before).length!==2)throw Error('Unsupported native player metadata constructor');return source.replace(before,"this.ᴑ︎ܔ=__ilmPlayerNickname(ᴑ︎ܔ,ᴌࡄࠀ)");}

function __ilmPatchNativeDirection(this: PublishedDynamic,source: PublishedDynamic,index: PublishedDynamic): PublishedDynamic{const rules: PublishedDynamic=[["function Ꮷ५༩(){if((ᴄո︆- о๕ހ)>ᴉ٦︈){ var ᴄߋ१=(((((ѕࡈܔ[е︄︅]-οܖ̏ ) *0264)/Math[ ᴌܞߊ])  %0550 )+360)%360;if(ᴄߋ१ >02) { ᅟᄂ́= ᴄո︆;о๕ހ =ᴄո︆;οܖ̏=ѕࡈܔ [е︄︅];ᴄߋ१=Math[ᴀ̞̋ ](  ( ( ((ѕࡈܔ[ㅤ︊ᄃ]*180 ) / Math[ᅠ‌̜]) % 0550 )+0x168)%0X168);ɑ᠍ᚄ( ιаᚇ.р５އ([ іе๘, ᴄߋ१]));}  }}","function Ꮷ५༩() { if((ᴄո︆- о๕ހ)>ᴉ٦︈) {var ᴄߋ१=(((((ѕࡈܔ[е︄︅]-οܖ̏ ) *0264)/Math[ ᴌܞߊ])  %0550 )+360)%360;if(ᴄߋ१ >02){ᅟᄂ́= ᴄո︆;о๕ހ =ᴄո︆ ;οܖ̏=ѕࡈܔ [е︄︅]; ᴄߋ१=Math[ᴀ̞̋ ](  ( ( ((ѕࡈܔ[ㅤ︊ᄃ]*180 ) / Math[ᅠ‌̜]) % 0550 )+0x168)%0X168) ; ((!__responsiveMod||!__responsiveMod.controlsAimDirection)&&ɑ᠍ᚄ( ιаᚇ.р５އ([ іе๘, ᴄߋ१])));}}}"],["function Ꮷߓᄆ(){if((ᴄո︆-о๕ހ)>е︈๒){var ᴄߋ१=((  (( (ѕࡈܔ[е︄︅] -οܖ̏)* 180)/Math[ᴌܞߊ] )%0550)+360)%0550;if (ᴄߋ१ > і︉０){ᅟᄂ́=ᴄո︆ ;о๕ހ=ᴄո︆ ; οܖ̏ = ѕࡈܔ[е︄︅];ᴄߋ१ =Math[ᴀ̞̋](((((ѕࡈܔ[е︄︅]*0264) /Math[ᴌܞߊ])%0X168 )+0550)%0x168 );ɑ᠍ᚄ(ιаᚇ.р５އ(  [ 0X6,ᴄߋ१])); }}}","function Ꮷߓᄆ ( ) { if(  (ᴄո︆-о๕ހ)>е︈๒ ){var ᴄߋ१=((  (( (ѕࡈܔ[е︄︅] -οܖ̏)* 180)/Math[ᴌܞߊ] )%0550)+360)%0550;if (ᴄߋ१ > і︉０ ) {ᅟᄂ́=ᴄո︆;о๕ހ=ᴄո︆ ; οܖ̏ = ѕࡈܔ[е︄︅];ᴄߋ१ =Math[ᴀ̞̋](((((ѕࡈܔ[е︄︅]*0264) /Math[ᴌܞߊ])%0X168 )+0550)%0x168 );((!__responsiveMod||!__responsiveMod.controlsAimDirection)&&ɑ᠍ᚄ(ιаᚇ.р５އ(  [ 0X6,ᴄߋ१])));}}}"]],rule: PublishedDynamic=rules[index];if(!rule||source.split(rule[0]).length!==2)throw Error('Unsupported native direction handler');return source.replace(rule[0],rule[1]);}

function __jitterPatchNativeFire(this: PublishedDynamic,source: PublishedDynamic): PublishedDynamic{const before: PublishedDynamic="function ⲣ०ᄈ ( )  { ᅟᄂ́=ᴄո︆ ;ɑ᠍ᚄ(ιаᚇ.р５އ([ϲ८३ ]) );}";if(source.split(before).length!==2)throw Error('Unsupported native fire handler');return source.replace(before,"function ⲣ०ᄈ(){ᅟᄂ́=ᴄո︆ ;if(typeof __responsiveMod!==\"undefined\"&&__responsiveMod)if(__responsiveMod.beforeFire()===false)return;ɑ᠍ᚄ(ιаᚇ.р５އ([ϲ८३ ]) );if(__responsiveMod)__responsiveMod.afterFire();}");}

