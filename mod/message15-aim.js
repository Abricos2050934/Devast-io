// Compatibility marker for existing Resource Override loaders: function __createIlmAim

function __createMessage15Aim(MOD, World, environment) {
  let disposed=false,scaleby=1,ctx=null,vertst=0,horist=0;
  const actualWindow=environment.window,actualDocument=environment.document;
  const pendingFrames=new Set(),pendingIntervals=new Set(),pendingTimeouts=new Set(),listeners=[];
  const window={Math:actualWindow.Math,JSON:actualWindow.JSON,
    dispatchEvent:event=>actualWindow.dispatchEvent(event),
    requestAnimationFrame:callback=>{if(disposed)return 0;let id=actualWindow.requestAnimationFrame(time=>{pendingFrames.delete(id);if(!disposed)callback(time);});pendingFrames.add(id);return id;},
    setInterval:(callback,delay)=>{const backup=delay===1;const id=actualWindow.setInterval(()=>{if(!disposed){if(backup)Aimbot.refresh();else callback();}},backup?50:delay);pendingIntervals.add(id);return id;},
    clearInterval:id=>{pendingIntervals.delete(id);actualWindow.clearInterval(id);}
  };
  const setInterval=window.setInterval,setTimeout=(callback,delay)=>{const id=actualWindow.setTimeout(()=>{pendingTimeouts.delete(id);if(!disposed)callback();},delay);pendingTimeouts.add(id);return id;},clearTimeout=id=>{pendingTimeouts.delete(id);actualWindow.clearTimeout(id);};
  const document={addEventListener:(name,callback,capture)=>{actualDocument.addEventListener(name,callback,capture);listeners.push([name,callback,capture]);}};
  const WebSocket=actualWindow.WebSocket,CanvasRenderingContext2D=actualWindow.CanvasRenderingContext2D,KeyboardEvent=actualWindow.KeyboardEvent;
  const Client={get state(){environment.sync();return environment.state();},sendPacket:text=>environment.send(JSON.parse(text))};
  const Entitie=environment.entities,__ENTITIE_BULLET__=environment.bulletType;
// BEGIN EXACT UPLOADED DECLARATIONS
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
        this.obstacles = [], this.lines = [], this.lines.push(new LinesCon(0.95, 1, "#FFFFFF")), this.lines.push(new LinesCon(0.85, 1, "#FFFFFF")), this.lines.push(new LinesCon(0.95, 2, "#FFFFFF")), this.lines.push(new LinesCon(0.95, 2, "#FFFFFF")), this.mousePosition = {
            x: 0,
            y: 0
        }, this.mouseMapCords = {
            x: 0,
            y: 0
        }, this.shifting = false, this.menuActive = false, this.menuX = 0, this.menuY = 0, this.menuWidth = 0, this.menuHeight = 0, this.lastId = 0, this.myLastMoveDirection = 0;
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
        this.active = false;
        this.gear = -1;
        // 8-кадровая история позиций + временные метки для точного предсказания
        this.prevX = new Array(8).fill(-1);
        this.prevY = new Array(8).fill(-1);
        this.prevT = new Array(8).fill(0);
        this._hp = 255;
    }
    update(ux, uy) {
        if (this.x !== ux || this.y !== uy) {
            this.active = true;
            const now = Date.now();
            for (let i = 7; i > 0; i--) {
                this.prevX[i] = this.prevX[i-1];
                this.prevY[i] = this.prevY[i-1];
                this.prevT[i] = this.prevT[i-1];
            }
            this.prevX[0] = this.x;
            this.prevY[0] = this.y;
            this.prevT[0] = now;
            this.x = ux;
            this.y = uy;
        }
        Aimbot.scheduleRefresh();
    }
    setInactive() {
        this.x = -1;
        this.y = -1;
        this.prevX.fill(-1);
        this.prevY.fill(-1);
        this.prevT.fill(0);
        this.active = false;
    }
}

class AimbotCon {
    constructor() {
        this.lastAngle    = 0;
        this.targetPlayer = null;
        this.dead         = false;
        this.mouseDown    = false;
        this._dodgeKeys   = { w: false, a: false, s: false, d: false };
    }

    onDeath() {
        this.dead         = true;
        this.targetPlayer = null;
        this.lastAngle    = 0;
        this.mouseDown    = false;
        GetAllTargets.lines.forEach(l => l.reset(-1,-1,-1,-1));
        GetAllTargets.lastId = 0;
        for (let i = 1; i < 121; i++) { const p = GetAllTargets.getPlayerById(i); if (p.active) p.setInactive(); }
        for (let i = 1; i < 999; i++) { const g = GetAllTargets.getGhoulByUid(i); if (g.active) g.setInactive(); }
    }

    scheduleRefresh() { if (!this.isDead()) this.refresh(); }

    isDead() {
        if (typeof Client === 'undefined' || Client.state !== 1) return true;
        if (this.dead || !World.PLAYER || World.PLAYER.id === 0) return true;
        return !GetAllTargets.getPlayerById(World.PLAYER.id).active;
    }

    refresh() {
        GetAllTargets.lines.forEach(l => l.reset(-1,-1,-1,-1));
        if (this.isDead()) return;
        GetAllTargets.lastId = World.PLAYER.id;
        if (!MOD.AimBotEnabled) return;

        if (MOD.jitterActive) {
            if (!GetAllTargets.tappedForLast140mills) {
                if (!MOD.stopJittersOnStop || GetAllTargets.myLastMoveDirection !== 0) {
                    const ja = Jitter.getJitterAngle();
                    Client.sendPacket(window.JSON.stringify([6, ja]));
                }
            } else {
                Client.sendPacket(window.JSON.stringify([6, this.resolve()]));
            }
        } else {
            const angle = this.resolve();
            Client.sendPacket(window.JSON.stringify([6, angle]));
            if (MOD.autoFire && this.wannaFire()) {
                Client.sendPacket(window.JSON.stringify([4]));
                Client.sendPacket(window.JSON.stringify([5]));
            }
        }
    }

    wannaFire(target = this.targetPlayer) {
        if (target == null) return false;
        if (
            (target.x - target.prevX[0] > 0) !== (target.prevX[0] - target.prevX[1] > 0) ||
            (target.y - target.prevY[0] > 0) !== (target.prevY[0] - target.prevY[1] > 0)
        ) return true;
        return false;
    }

    resolve() {
        try {
            const myPlayer = GetAllTargets.getPlayerById(World.PLAYER.id);
            let target = null;

            if (MOD.resolverType === "linear" || MOD.resolverType === 1) {
                if (MOD.lockId > -1) {
                    target = GetAllTargets.getPlayerById(MOD.lockId);
                    if (!target || !target.active) target = null;
                }
                if (!target) {
                    if (MOD.mouseFovEnable) {
                        target = this.findNearestPlayerTo(GetAllTargets.mouseMapCords, MOD.mouseFov);
                    } else {
                        target = this.findNearestPlayerTo(myPlayer, 2500);
                    }
                }
                this.targetPlayer = target;
                if (target === null) return this.lastAngle;

                let targetX, targetY;
                if (target.prevX[0] === -1) {
                    targetX = target.x;
                    targetY = target.y;
                } else {
                    const dist = Math.floor(Math.sqrt(
                        Math.pow(myPlayer.x - target.x, 2) + Math.pow(myPlayer.y - target.y, 2)
                    ));
                    const offset = dist / MOD.distanceCoefficient + MOD.offsetCoefficient;
                    targetX = target.x + offset * (target.x - target.prevX[0]);
                    targetY = target.y + offset * (target.y - target.prevY[0]);
                }

                let angle = Math.floor(
                    Math.atan2(targetY - myPlayer.y, targetX - myPlayer.x) * (180 / Math.PI)
                );

                if (MOD.hideAimbotAngle) Client.sendPacket(window.JSON.stringify([6, angle]));
                if (MOD.visualizeResolving)
                    GetAllTargets.lines[0].reset(myPlayer.x, myPlayer.y, targetX, targetY);
                if (MOD.ShowAimTrace) {
                    GetAllTargets.lines[2].color = MOD.visualizeResolvingColor || "#FFF200";
                    GetAllTargets.lines[2].reset(myPlayer.x, myPlayer.y, target.x, target.y);
                } else {
                    GetAllTargets.lines[2].reset(-1, -1, -1, -1);
                }

                this.lastAngle = angle;
                return angle;
            }

            if (MOD.resolverType === "trygonometrical") {
                if (MOD.lockId > -1) {
                    target = GetAllTargets.getPlayerById(MOD.lockId);
                    if (!target || !target.active) target = null;
                }
                if (!target) {
                    if (MOD.mouseFovEnable) {
                        target = this.findNearestPlayerTo(GetAllTargets.mouseMapCords, MOD.mouseFov);
                    } else {
                        target = this.findNearestPlayerTo(myPlayer, 2500);
                    }
                }
                this.targetPlayer = target;
                if (target === null) return this.lastAngle;

                const moveLen = Math.sqrt(
                    Math.pow(target.y - target.prevY[0], 2) +
                    Math.pow(target.x - target.prevX[0], 2)
                );
                const normY = (target.y - target.prevY[0]) / (moveLen || 1);
                const normX = (target.x - target.prevX[0]) / (moveLen || 1);
                const dist = Math.floor(Math.sqrt(
                    Math.pow(myPlayer.x - target.x, 2) + Math.pow(myPlayer.y - target.y, 2)
                ));
                const cosArg = Math.max(-1, Math.min(1,
                    (normY * (target.x - myPlayer.x) - normX * (target.y - myPlayer.y)) /
                    (Math.max(1, dist) * MOD.bulletSpeedCoefficient)
                ));
                let angle = Math.floor(
                    (Math.atan2(target.y - myPlayer.y, target.x - myPlayer.x) + Math.acos(cosArg))
                    * (180 / Math.PI)
                );

                const inter = _lineIntersect(
                    target.x, target.y,
                    target.x + (target.x - target.prevX[0]) * 50,
                    target.y + (target.y - target.prevY[0]) * 50,
                    myPlayer.x, myPlayer.y,
                    myPlayer.x + Math.cos(angle * Math.PI / 180) * 3000,
                    myPlayer.y + Math.sin(angle * Math.PI / 180) * 3000
                );
                if (MOD.visualizeResolving)
                    GetAllTargets.lines[0].reset(myPlayer.x, myPlayer.y, inter ? inter.x : target.x, inter ? inter.y : target.y);
                if (MOD.ShowAimTrace) {
                    GetAllTargets.lines[2].color = MOD.visualizeResolvingColor || "#FFF200";
                    GetAllTargets.lines[2].reset(myPlayer.x, myPlayer.y, target.x, target.y);
                } else {
                    GetAllTargets.lines[2].reset(-1, -1, -1, -1);
                }

                if (!isFinite(angle)) angle = this.lastAngle;
                if (MOD.hideAimbotAngle) Client.sendPacket(window.JSON.stringify([6, angle]));
                this.lastAngle = angle;
                return angle;
            }

        } catch (e) {}
        return this.lastAngle;
    }

    findNearestPlayerTo(point, fovLimit) {
        let minDist = fovLimit;
        let nearest = null;
        if (MOD.target === "players" || MOD.target === "all") {
            for (let i = 1; i < GetAllTargets.players.length; i++) {
                const p = GetAllTargets.getPlayerById(i);
                if (!p || !p.active || p.id === World.PLAYER.id) continue;
                try {
                    if (World.players && World.players[p.id] &&
                        World.players[p.id].team === World.PLAYER.team &&
                        World.PLAYER.team !== -1) continue;
                } catch(_) {}
                const d = Math.floor(Math.sqrt(
                    Math.pow(point.x - p.x, 2) + Math.pow(point.y - p.y, 2)
                ));
                if (d < minDist) { nearest = p; minDist = d; }
            }
        }
        if (MOD.target === "ghouls" || MOD.target === "all") {
            for (let i = 1; i < GetAllTargets.ghouls.length; i++) {
                const g = GetAllTargets.getGhoulByUid(i);
                if (!g || !g.active) continue;
                const d = Math.floor(Math.sqrt(
                    Math.pow(point.x - g.x, 2) + Math.pow(point.y - g.y, 2)
                ));
                if (d < minDist) { nearest = g; minDist = d; }
            }
        }
        return nearest;
    }

    dodgePlayer() {
        if (!MOD.DodgePlayerEnabled) { this._releaseDodgeKeys(); return; }
        if (this.isDead())            { this._releaseDodgeKeys(); return; }
        const myPlayer = GetAllTargets.getPlayerById(World.PLAYER.id);
        if (!myPlayer || !myPlayer.active) { this._releaseDodgeKeys(); return; }
        const myX = myPlayer.x, myY = myPlayer.y, myPid = World.PLAYER.id;
        const DANGER_R = MOD.DodgeDetectRadius || 300;
        const DANGER_R2 = DANGER_R * DANGER_R;
        let worstThreat = null, worstDist2 = Infinity;
        try {
            const bullets      = Entitie.units[__ENTITIE_BULLET__];
            const bulletBorder = Entitie.border[__ENTITIE_BULLET__];
            const bLen         = bulletBorder.border;
            for (let i = 0; i < bLen; i++) {
                const b = bullets[bulletBorder.cycle[i]];
                if (!b || b.removed !== 0 || b.pid === myPid) continue;
                let bVx = b.angleX, bVy = b.angleY;
                if (bVx === 0 && bVy === 0 && b.nx !== -1) {
                    const ddx = b.nx - b.x, ddy = b.ny - b.y;
                    const dlen = Math.sqrt(ddx*ddx + ddy*ddy);
                    if (dlen > 0) { bVx = ddx/dlen; bVy = ddy/dlen; }
                }
                if (bVx === 0 && bVy === 0) continue;
                let threat = false;
                for (let step = 1; step <= 15; step++) {
                    const fx = b.x + bVx*step*50 - myX;
                    const fy = b.y + bVy*step*50 - myY;
                    if (fx*fx + fy*fy < DANGER_R2) { threat = true; break; }
                }
                if (!threat) continue;
                const dx2 = b.x - myX, dy2 = b.y - myY;
                const d2  = dx2*dx2 + dy2*dy2;
                if (d2 < worstDist2) { worstDist2 = d2; worstThreat = b; }
            }
        } catch(_) {}
        if (!worstThreat) { this._releaseDodgeKeys(); return; }
        const bulletAngle = Math.atan2(worstThreat.angleY || 0, worstThreat.angleX || 0);
        const perp1 = bulletAngle + Math.PI/2;
        const perp2 = bulletAngle - Math.PI/2;
        const srcX  = worstThreat.x - (worstThreat.angleX||0)*200;
        const srcY  = worstThreat.y - (worstThreat.angleY||0)*200;
        const o1x = myX + Math.cos(perp1)*100 - srcX, o1y = myY + Math.sin(perp1)*100 - srcY;
        const o2x = myX + Math.cos(perp2)*100 - srcX, o2y = myY + Math.sin(perp2)*100 - srcY;
        this._pressDodgeDirection((o1x*o1x + o1y*o1y) > (o2x*o2x + o2y*o2y) ? perp1 : perp2);
    }

    _pressDodgeDirection(angleRad) {
        const deg = ((angleRad * 180 / Math.PI) % 360 + 360) % 360;
        const want = { w: deg > 202.5 && deg < 337.5, s: deg > 22.5 && deg < 157.5, a: deg > 112.5 && deg < 247.5, d: deg < 67.5 || deg > 292.5 };
        const keyMap = { w:87, a:65, s:83, d:68 };
        for (const k of ['w','a','s','d']) {
            if (want[k] && !this._dodgeKeys[k]) { window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: keyMap[k], which: keyMap[k], bubbles:true, cancelable:true })); this._dodgeKeys[k] = true; }
            else if (!want[k] && this._dodgeKeys[k]) { window.dispatchEvent(new KeyboardEvent('keyup', { keyCode: keyMap[k], which: keyMap[k], bubbles:true, cancelable:true })); this._dodgeKeys[k] = false; }
        }
    }

    _releaseDodgeKeys() {
        const keyMap = { w:87, a:65, s:83, d:68 };
        for (const k of ['w','a','s','d']) {
            if (this._dodgeKeys[k]) { window.dispatchEvent(new KeyboardEvent('keyup', { keyCode: keyMap[k], which: keyMap[k], bubbles:true, cancelable:true })); this._dodgeKeys[k] = false; }
        }
    }
}

class JitterCon {
    constructor() {
        this.roflAngle = 0;
        this.roflStep = 1;
        this.jitterStep = false;
    }
    getJitterAngle() {
        this.jitterStep = !this.jitterStep;
        const base = this.getAntiAimAngle();
        return this.jitterStep ? base + MOD.jitterOffset : base - MOD.jitterOffset;
    }
    getJitter2Angle() {
        this._spin2 = ((this._spin2 || 0) + 20);
        let spinAngle = (this._spin2 % 360 + 360) % 360;
        this._spin2rad = spinAngle * Math.PI / 180;
        return spinAngle;
    }
    getAntiAimAngle() {
        if (MOD.antiAimMode == "At target") {
            return Aimbot.resolve() + 180;
        }
        Aimbot.resolve();
        if (MOD.antiAimMode == "Round") {
            this.roflStep++;
            return this.roflAngle += 4 + window.Math.floor(window.Math.abs(this.roflStep % 600 - 300) / 12);
        }
        if (MOD.antiAimMode == "Round2") {
            this.roflStep++;
            return window.Math.floor(this.roflStep % 20 * 18);
        }
        return MOD.antiAimMode;
    }
}

class LinesCon {
    constructor(alpha, width, color) {
        this.active = false;
        this.x1 = 0; this.y1 = 0;
        this.x2 = 0; this.y2 = 0;
        // текущие отображаемые координаты (плавно догоняют целевые)
        this.cx1 = 0; this.cy1 = 0;
        this.cx2 = 0; this.cy2 = 0;
        this.alpha = alpha;
        this.width = width;
        this.color = color;
        this._firstSet = true;
        this._lerpSpeed = 1.0; // мгновенный снап, без сглаживания
    }
    reset(x1, y1, x2, y2) {
        if (x1 === -1 || y1 === -1 || x2 === -1 || y2 === -1) {
            this.active = false;
            this._firstSet = true;
            return;
        }
        this.active = true;
        this.x1 = x1; this.y1 = y1;
        this.x2 = x2; this.y2 = y2;
        // При первом появлении линии — мгновенно ставим без сглаживания
        if (this._firstSet) {
            this.cx1 = x1; this.cy1 = y1;
            this.cx2 = x2; this.cy2 = y2;
            this._firstSet = false;
        }
    }
    draw(ctx, vertst, horist) {
        if (!this.active) return;
        // Плавно интерполируем текущие координаты к целевым
        const LERP = this._lerpSpeed;
        this.cx1 += (this.x1 - this.cx1) * LERP;
        this.cy1 += (this.y1 - this.cy1) * LERP;
        this.cx2 += (this.x2 - this.cx2) * LERP;
        this.cy2 += (this.y2 - this.cy2) * LERP;
        ctx.save();
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo((vertst + this.cx1) * scaleby, (horist + this.cy1) * scaleby);
        ctx.lineTo((vertst + this.cx2) * scaleby, (horist + this.cy2) * scaleby);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.globalAlpha = this.alpha;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.restore();
    }
}

function _lineIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 0.0001) return null;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
}
// END EXACT UPLOADED DECLARATIONS
  var GetAllTargets=new GetAllTargetsCon(),Aimbot=new AimbotCon(),Jitter=new JitterCon();
function GetMouseCords() {
        GetAllTargets.lines[0].color = MOD.visualizeResolvingColor;
        let aplha = ctx.globalAlpha,
            width = ctx.lineWidth;
        for (var lines = 0; lines < GetAllTargets.lines.length; lines++) {
            GetAllTargets.lines[lines].draw(ctx, vertst, horist);
        }
        ctx.globalAlpha = aplha, ctx.lineWidth = width;
        if (MOD.mouseFovEnable) {
            GetAllTargets.mouseMapCords = _getMapCordsFromScreenMouseCords(GetAllTargets.mousePosition);
        }
    }

function _getMapCordsFromScreenMouseCords(cords) {
        return {
            x: cords.x / scaleby - vertst,
            y: cords.y / scaleby - horist
        };
    }
  let originalWSSend,originalFill,originalRAF,installedRAF;
  return {targets:GetAllTargets,aim:Aimbot,jitter:Jitter,Target:GetTarget,
    start(){originalWSSend=WebSocket.prototype.send;originalFill=CanvasRenderingContext2D.prototype.fillText;originalRAF=actualWindow.requestAnimationFrame;
(function _hookFireDetect() {
    var _tappedTimer = null;
    function _setTapped() {
        GetAllTargets.tappedForLast140mills = true;
        clearTimeout(_tappedTimer);
        _tappedTimer = setTimeout(function() {
            GetAllTargets.tappedForLast140mills = false;
        }, 140);
    }
    // Primary: mousedown on the canvas (player clicks to shoot)
    document.addEventListener('mousedown', function(e) {
        if (e.button === 0 && MOD && MOD.jitterActive && MOD.AimBotEnabled) _setTapped();
    }, true);
    // Secondary: intercept WebSocket send for packet [4]
    var _origWSSend = WebSocket.prototype.send;
    WebSocket.prototype.send = function(data) {
        try {
            if (typeof data === 'string') {
                var p = window.JSON.parse(data);
                if (Array.isArray(p) && p[0] === 4) _setTapped();
            }
        } catch(_) {}
        return _origWSSend.call(this, data);
    };
})();

(function _ultraFastAimbotLoop() {
    // rAF loop — основной, каждый кадр (60+ fps)
    function _rafLoop() {
        try {
            if (typeof Aimbot !== 'undefined' && typeof MOD !== 'undefined' && MOD.AimBotEnabled) {
                if (!Aimbot.isDead()) {
                    Aimbot.refresh();
                }
            }
        } catch(e) {}
        window.requestAnimationFrame(_rafLoop);
    }
    window.requestAnimationFrame(_rafLoop);

    // Резервный setInterval 1ms — гарантирует отправку пакетов даже при лаге rAF
    setInterval(function() {
        try {
            if (typeof Aimbot !== 'undefined' && typeof MOD !== 'undefined'
                && MOD.AimBotEnabled && !Aimbot.isDead()) {
                const angle = Aimbot.lastAngle;
                if (isFinite(angle)) {
                    Client.sendPacket(window.JSON.stringify([6, angle]));
                }
            }
        } catch(e) {}
    }, 1);
})();

(function _labelFilter() {
    var _origFill = CanvasRenderingContext2D.prototype.fillText;
    // Exact strings the script draws above/below player heads
    var _BLOCKED = {
        'AimBot': 1, 'Aim Bot': 1, 'AimBotEnabled': 1, 'Aim': 1,
        'Auto Build': 1, 'AutoBuild': 1, 'AutoBuiledEnabled': 1,
        'Slow': 1,
        'Jitter': 1, 'JitterActive': 1, 'jitterActive': 1,
        'AntiAim': 1, 'Anti-Aim': 1, 'AntiAimbot': 1,
        'AutoDodge': 1, 'Auto Dodge': 1,
        'SpinBot': 1, 'Spin': 1,
        'ESP': 1, 'Hack': 1, 'Mod': 1
    };
    CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxW) {
        // Fast path: labels allowed OR MOD not ready
        if (typeof MOD === 'undefined' || !MOD.HidePlayerLabels) {
            return maxW !== undefined
                ? _origFill.call(this, text, x, y, maxW)
                : _origFill.call(this, text, x, y);
        }
        if (typeof text === 'string' && _BLOCKED[text]) return;
        return maxW !== undefined
            ? _origFill.call(this, text, x, y, maxW)
            : _origFill.call(this, text, x, y);
    };
})();
{const window=actualWindow;(function() {
    var _raf = window.requestAnimationFrame;
    window.requestAnimationFrame = function(cb) {
        return _raf.call(window, function(ts) {
            try { if (typeof Aimbot !== 'undefined') Aimbot.dodgePlayer(); } catch(e) {}
            cb(ts);

        });
    };
})();}
installedRAF=actualWindow.requestAnimationFrame;
    },
    afterFire(){
      if (MOD.jitterActive && MOD.AimBotEnabled) {
            Client.sendPacket(window.JSON.stringify([6, Aimbot.resolve()]));
        }
        Aimbot.mouseDown = true;
        Aimbot.scheduleRefresh();
    },
    afterRelease(){Aimbot.mouseDown = false;Aimbot.scheduleRefresh();},
    onMove(move){GetAllTargets.myLastMoveDirection=move;},
    onHandshake(){Aimbot.dead=false;},
    onOtherDie(id){const player=GetAllTargets.getPlayerById(id),ghoul=GetAllTargets.getGhoulByUid(id);player.setInactive();ghoul.setInactive();},
    render(context,view){ctx=context;scaleby=view.scale;vertst=view.x;horist=view.y;
      const canvas=ctx.canvas,rect=canvas.getBoundingClientRect(),position=GetAllTargets.mousePosition;
      GetAllTargets.mousePosition={x:(position.x-rect.left)*canvas.width/rect.width,y:(position.y-rect.top)*canvas.height/rect.height};
      try{GetMouseCords();}finally{GetAllTargets.mousePosition=position;}
    },
    dispose(){MOD.DodgePlayerEnabled=false;Aimbot._releaseDodgeKeys();disposed=true;if(actualWindow.requestAnimationFrame===installedRAF)actualWindow.requestAnimationFrame=originalRAF;for(const id of pendingFrames)actualWindow.cancelAnimationFrame(id);for(const id of pendingIntervals)actualWindow.clearInterval(id);for(const id of pendingTimeouts)actualWindow.clearTimeout(id);for(const [name,fn,capture]of listeners)actualDocument.removeEventListener(name,fn,capture);if(originalWSSend)WebSocket.prototype.send=originalWSSend;if(originalFill)CanvasRenderingContext2D.prototype.fillText=originalFill;}
  };
}
function _normColor(v) {
    if (typeof v === 'string') {
        // Handle CSS rgb(r,g,b) or rgba(r,g,b,a) strings returned by dat.GUI
        var m = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (m) return '#' + [m[1],m[2],m[3]].map(function(x){return parseInt(x).toString(16).padStart(2,'0');}).join('');
        return v; // already hex string
    }
    if (Array.isArray(v) && v.length >= 3)
        return '#' + v.slice(0, 3).map(function(x) { return Math.round(x).toString(16).padStart(2, '0'); }).join('');
    if (v && typeof v === 'object' && 'r' in v)
        return '#' + ['r', 'g', 'b'].map(function(c) { return Math.round(v[c]).toString(16).padStart(2, '0'); }).join('');
    return '#ffffff';
}
function __installMessage15AimMenu(root,MOD){const gui=root;
const _colorsFolder=gui.__folders.Visuals.addFolder('Colors');_colorsFolder.close();
function _mkColorCtrl(prop, label, extraFn) {
        _colorsFolder.addColor(MOD, prop).name(label).onChange(function(v) {
            MOD[prop] = _normColor(v);
            if (extraFn) extraFn(MOD[prop]);
        });
    }
_mkColorCtrl("visualizeResolvingColor", "Aim Line Color");
const _aimFolder = gui.addFolder("Best Aim Bot #1");
    _aimFolder.close();
    const _aim_bot_input = _aimFolder.add(MOD, "AimBotEnabled").name("AimBotEnabled");
    _aimFolder.add(MOD, "hideAimbotAngle").name("HideAimbotAngle");
    _aimFolder.add(MOD, "ShowRealAngles", ["always", "withAim"]).name("ShowRealAngles");
    _aimFolder.add(MOD, "target", ["players", "ghouls", "all"]).name("Target");
    _aimFolder.add(MOD, "resolverType", ["linear", "trygonometrical"]).name("ResolverType");
    _aimFolder.add(MOD, "distanceCoefficient", 10, 1000, 10).name("DistanceCoefficient");
    _aimFolder.add(MOD, "bulletSpeedCoefficient", 1, 15, 0.25).name("BulletSpeedCoeff");
    _aimFolder.add(MOD, "offsetCoefficient", 0, 3, 0.05).name("OffsetCoefficient");
    _aimFolder.add(MOD, "mouseFovEnable").name("MouseFovEnable");
    _aimFolder.add(MOD, "mouseFov", 0, 696969, 100).name("MouseFov");
    _aimFolder.add(MOD, "autoFire").name("AutoFire");
    _aimFolder.add(MOD, "lockId", -1, 120, 1).name("LockId");
    _aimFolder.add(MOD, "antiAimMode", ["At target", "Round", "Round2"]).name("AntiAimMode");
    const _jitter_active_input = _aimFolder.add(MOD, "jitterActive").name("JitterActive");
    _aimFolder.add(MOD, "jitterOffset", 0, 360, 1).name("JitterOffset");
    _aimFolder.add(MOD, "stopJittersOnStop").name("StopJittersOnStop");
    _aimFolder.add(MOD, "visualizeResolving").name("VisualizeResolving");
    _aimFolder.add(MOD, "ShowAimTrace").name("ShowAimTrace");
    _aimFolder.add(MOD, "DodgePlayerEnabled").name("DodgePlayer");
    _aimFolder.add(MOD, "DodgeDetectRadius", 100, 800, 10).name("DodgeRadius");
    _aimFolder.add(MOD, "HidePlayerLabels").name("Hide Hack Labels");
  return _aimFolder;
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
