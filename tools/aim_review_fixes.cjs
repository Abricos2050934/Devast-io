// Explicit, regression-tested corrections to the historical imported blocks.
function reviewedBlock(name, source) {
  const ending = source.includes('\r\n') ? '\r\n' : '\n';
  let code = source.replace(/\r\n/g, '\n');
  function replace(before, after) {
    if (code.split(before).length !== 2) throw Error('Aim review anchor changed: ' + name);
    code = code.replace(before, () => after);
  }
  switch (name) {
    case 'AimbotLoadConfig':
      return '// Settings are loaded and validated by the host before creating the core.';
    case 'AimbotSaveConfig':
      return 'function AimbotSaveConfig() { environment.persist(); }';
    case 'active-core':
      replace('this.color = color;', 'this.color = color;\n            this.outOfRange = false;');
      replace('reset(x1, y1, x2, y2) {', 'reset(x1 = -1, y1 = -1, x2 = -1, y2 = -1) {');
      replace('this.x1 = x1;', 'this.outOfRange = false;\n            this.x1 = x1;');
      replace('set(x1, y1, x2, y2) {\n            this.reset(x1, y1, x2, y2);',
        'set(x1, y1, x2, y2, outOfRange = false) {\n            this.reset(x1, y1, x2, y2);\n            this.outOfRange = Boolean(outOfRange);');
      for (const angle of ['angleResolverType1', 'angleResolverLinear']) {
        replace(`                        if (${angle} === null) {\n                            ${angle} = ${angle} * 180 / window.Math.PI;\n                        }\n`, '');
      }
      // Packet batches in Adaptive Aim are resolved by the existing 50 ms loop.
      code = code.replace(/\bAimbotRefresh\(\);/g, 'if (!MOD.AdaptiveAimEnabled) AimbotRefresh();');
      break;
    case 'integration':
      replace('if (this.dead || !World.PLAYER || this.myId() === 0)\n        return true;\n    return GetAllTargets.getPlayerById(this.myId()).active === false;',
        'if (this.dead || !World.PLAYER) return true;\n    const id = World.PLAYER[օ̖̏];\n    const player = Number.isInteger(id) && id > 0 ? GetAllTargets.getPlayerById(id) : null;\n    return !player || player.active !== true;');
      replace('line.reset();', 'line.reset(-1, -1, -1, -1);');
      replace('    var ang = Math.atan2(ay, ax) * AIM_RAD;\n', '');
      break;
    case 'aim-menu':
      replace('spearFolder.add(MOD, "autoFire").name("AutoThrow");', 'spearFolder.add(MOD, "spearAutoThrow").name("AutoThrow");');
      break;
    case 'aimbotTick':
      replace('if (MOD.autoFire && __aimShotAllowed())', 'if (MOD.spearAutoThrow && __aimShotAllowed())');
      break;
    case 'routineAntiAimbot':
      replace('__antiMoveStep += coeff;', '__antiMoveStep++;');
      replace('Math.floor(__antiMoveStep / coeff)', 'Math.floor(__antiMoveStep * 100 / coeff)');
      break;
    case 'self-player-helper':
      // Callers must supply the identity field rather than guess from numbers.
      code = `function __isMyAimbotPlayer(object, id) {
    if (!object || !World.PLAYER) return false;
    const self = World.PLAYER[օ̖̏];
    if (!Number.isInteger(self) || self <= 0) return false;
    return (id === undefined ? object[օ̖̏] : id) === self;
}`;
      break;
    case 'aim-input': {
      const marker = 'document.addEventListener("mousedown",';
      const tail = code.indexOf(marker);
      if (tail < 0) throw Error('Aim touch input anchor changed');
      code = `let aimTouchId = null;
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
` + code.slice(tail);
      break;
    }
    case 'AimbotMenuSetupKey':
      code = `const keyCapture = {current: null};
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
}`;
      break;
    case 'render':
      replace('ᴏܘ๐.globalAlpha = pos.alpha;', 'ᴏܘ๐.globalAlpha = pos.outOfRange ? pos.alpha * .3 : pos.alpha;');
      replace(`      if (MOD.mouseFovEnable) {
        GetAllTargets.mouseMapCords = {
          x: GetAllTargets.mousePosition.x / о༨ε - ㅤο９,
          y: GetAllTargets.mousePosition.y / о༨ε - ᴉᚉ̷
        };
      }
`, '');
      break;
    default:
      return source;
  }
  return code.replace(/\n/g, ending);
}
module.exports = { reviewedBlock };
