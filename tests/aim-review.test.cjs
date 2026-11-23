const test = require('node:test');
const assert = require('node:assert/strict');
const { fixture, menu, control } = require('./mod-fixture.cjs');

test('gun auto fire and spear auto throw are independent and persist separately', () => {
  const f = fixture({ dom: true });
  try {
    const gui = menu(f);
    const spear = gui.__folders['🗡 Aimbot Spear 🗡'];
    control(spear, 'spearAutoThrow').setValue(true);
    assert.equal(f.mod.settings.autoFire, false);
    control(gui.__folders['👑 Aim Bot 👑'], 'autoFire').setValue(true);
    control(spear, 'spearAutoThrow').setValue(false);
    assert.equal(f.mod.settings.autoFire, true);
    const next = fixture({ saved: Object.fromEntries(f.storage) });
    try {
      assert.equal(next.mod.settings.autoFire, true);
      assert.equal(next.mod.settings.spearAutoThrow, false);
    } finally { next.mod.dispose(); }
  } finally { f.mod.dispose(); }
});

test('old shared auto-fire preference migrates once and remains independently editable', () => {
  const f = fixture({ saved: { 'DevastMessage27:aim:v1': JSON.stringify({ autoFire: true }) } });
  try {
    assert.equal(f.mod.settings.spearAutoThrow, true);
    f.mod.setSetting('spearAutoThrow', false);
    assert.equal(f.mod.settings.autoFire, true);
  } finally { f.mod.dispose(); }
});

test('unknown or removed self ID is dead and cannot crash afterFire', () => {
  const f = fixture();
  try {
    for (const id of [-1, 0, undefined, null, 90000, NaN]) {
      f.world['ᅠᏧ‍'].id = id;
      assert.equal(f.mod.aim.isDead(), true);
      assert.doesNotThrow(() => f.mod.afterFire());
    }
    f.world['ᅠᏧ‍'].id = 1;
    f.mod.targets.players[1].active = true;
    assert.equal(f.mod.aim.isDead(), false);
  } finally { f.mod.dispose(); }
});

test('line reset and character death retain finite hidden coordinates', () => {
  const f = fixture();
  try {
    f.mod.targets.lines[0].reset();
    f.mod.targets.resetLines();
    f.mod.aim.onDeath();
    for (const line of f.mod.targets.lines) {
      assert.deepEqual([line.x1, line.y1, line.x2, line.y2], [-1, -1, -1, -1]);
    }
  } finally { f.mod.dispose(); }
});

test('native fire before the first self position cannot crash the source resolver', () => {
  const f = fixture();
  try {
    f.mod.setSetting('AdaptiveAimEnabled', false);
    f.mod.trackPacket(1, 2, 1, 100, 100, true);
    f.world['ᅠᏧ‍'].id = 121;
    f.mod.setSetting('AimBotEnabled', true);
    f.mod.targets.mouseMapCords = {x: 100, y: 100};
    assert.doesNotThrow(() => f.mod.beforeFire());
    assert.equal(f.mod.aim.targetPlayer, null);
    assert.ok(Number.isFinite(f.mod.aim.resolve()));
    f.mod.trackPacket(1, 121, 1, 50, 50, true);
    f.mod.aim.resolve();
    assert.equal(f.mod.aim.targetPlayer?.id, 2);
  } finally { f.mod.dispose(); }
});

test('repeated key selection uses one handler and Escape cancels without changing a binding', () => {
  const f = fixture({ dom: true });
  try {
    const gui = menu(f), folder = gui.__folders.Keyboard;
    const input = folder.__controllers.find(c => c.property === 'AimbotKey').domElement.querySelector('input');
    const count = f.docListeners.get('keydown').size;
    for (let i = 0; i < 30; i++) for (const click of input.listeners.get('click')) click();
    assert.equal(f.docListeners.get('keydown').size, count);
    assert.equal(f.mod.aimModule.waitingForKey, true);
    for (const handler of [...f.docListeners.get('keydown')]) handler({ code: 'Escape' });
    assert.equal(f.mod.settings.AimbotKey, 'KeyZ');
    assert.equal(f.mod.aimModule.waitingForKey, false);
  } finally { f.mod.dispose(); }
});

test('Strafe coefficient changes phase advance at the same timer cadence', () => {
  function packets(coefficient) {
    const f = fixture();
    try {
      f.mod.setSetting('AntiAimbot', true);
      f.mod.setSetting('antiAimCoefficient', coefficient);
      f.packets.length = 0;
      for (let i = 0; i < 12; i++) f.mod.aimModule.antiTick();
      return f.packets.map(packet => packet[1]);
    } finally { f.mod.dispose(); }
  }
  assert.notDeepEqual(packets(100), packets(500));
  assert.equal(packets(100).length, packets(500).length);
});

test('adaptive packet bursts defer target searches to the existing refresh cycle', () => {
  const f = fixture({ adaptive: true });
  try {
    f.mod.setSetting('AimBotEnabled', true);
    f.mod.setSetting('mouseFovEnable', false);
    const resolve = f.mod.aim.resolve;
    let searches = 0;
    f.mod.aim.resolve = function (...args) { searches++; return resolve.apply(this, args); };
    f.mod.trackPacket(1, 1, 1, 1000, 1000, true);
    for (let i = 0; i < 300; i++) f.mod.trackPacket(1, 2, 1, 1300, 1000 + i / 10, true);
    assert.equal(searches, 0);
    f.mod.aimModule.refreshTargets();
    assert.equal(searches, 1);
  } finally { f.mod.dispose(); }
});

test('spear automatic attack responds only to its own toggle', () => {
  const f = fixture();
  try {
    f.mod.trackPacket(1, 1, 1, 1000, 1000, true, 0, 5 << 8);
    f.mod.trackPacket(1, 2, 1, 1300, 1050, true);
    f.mod.setSetting('AimbotSpearEnabled', true);
    f.mod.setSetting('autoFire', true);
    f.packets.length = 0;
    f.mod.aim.refresh();
    assert.ok(f.packets.every(packet => packet[0] !== 4));
    f.mod.setSetting('autoFire', false);
    f.mod.setSetting('spearAutoThrow', true);
    f.packets.length = 0;
    f.mod.aim.refresh();
    assert.ok(f.packets.some(packet => packet[0] === 4));
  } finally { f.mod.dispose(); }
});

test('line range flag is retained and clears on the next normal update', () => {
  const f = fixture();
  try {
    const line = f.mod.targets.lines[1];
    line.set(1, 2, 3, 4, true);
    assert.equal(line.outOfRange, true);
    line.set(4, 3, 2, 1);
    assert.equal(line.outOfRange, false);
  } finally { f.mod.dispose(); }
});

test('a second finger or menu touch cannot steal the active aiming finger', () => {
  const f = fixture();
  const send = (type, touches) => {
    for (const handler of f.listeners.get(type) || []) handler({ changedTouches: touches });
  };
  try {
    const point = (identifier, x, tag = 'CANVAS') => ({ identifier, clientX: x, clientY: 50, target: { tagName: tag } });
    send('touchstart', [point(1, 100)]);
    send('touchstart', [point(2, 900, 'BUTTON')]);
    send('touchmove', [point(2, 800)]);
    assert.equal(f.mod.targets.mousePosition.x, 100);
    send('touchmove', [point(1, 200)]);
    assert.equal(f.mod.targets.mousePosition.x, 200);
    send('touchend', [point(1, 200)]);
    send('touchstart', [point(2, 700)]);
    assert.equal(f.mod.targets.mousePosition.x, 700);
  } finally { f.mod.dispose(); }
});

test('invalid captured keys retain capture and a later valid key uses conflict swapping', () => {
  const f = fixture({ dom: true });
  try {
    const controller = menu(f).__folders.Keyboard.__controllers.find(c => c.property === 'AimbotKey');
    for (const click of controller.domElement.querySelector('input').listeners.get('click')) click();
    for (const handler of [...f.docListeners.get('keydown')]) handler({ code: 'Unidentified' });
    assert.equal(f.mod.aimModule.waitingForKey, true);
    assert.equal(f.mod.settings.AimbotKey, 'KeyZ');
    for (const handler of [...f.docListeners.get('keydown')]) handler({ code: 'KeyM' });
    assert.equal(f.mod.settings.AimbotKey, 'KeyM');
    assert.equal(f.mod.settings.ModMenuKey, 'KeyZ');
    assert.equal(f.mod.aimModule.waitingForKey, false);
  } finally { f.mod.dispose(); }
});
