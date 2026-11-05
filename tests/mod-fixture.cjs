const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');

function fixture(options={}) {
  const listeners = new Map(), timers = new Map(), timerPeriods = new Map(), frames = new Map(), storage = new Map(), packets = [];
  let next = 0;
  const window = {
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    setInterval(fn,delay) { const id = ++next; timers.set(id, fn); timerPeriods.set(id,delay); return id; },
    clearInterval(id) { timers.delete(id); },
    requestAnimationFrame(fn) { const id = ++next; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
  };
  let nativeCalls=0;
  const network = {state: 1, 'ᴎᚂρ': value => packets.push(JSON.parse(value)), 'ѕ᠋༢'() {nativeCalls++;}, 'ρ٨٨'() {nativeCalls++;}};
  const world = {'ᅠᏧ‍': {id: 1, x:0, y:0}, 'ᴎ︃ᄉ': [], 'ﾠࡅ‍': []};
  const entities = {border:[], 'ᴎ̂２':[]};
  world['ᴎ︃ᄉ'][1] = {'ο̏︇': 'Self', 'а༤̘': -1};
  world['ᴎ︃ᄉ'][2] = {'ο̏︇': 'Target', 'а༤̘': -1};
  const dom=options.dom?require('./dom-fixture.cjs').domFixture():null;
  if(dom)window.dat={GUI:dom.GUI};
  for(const [key,value] of Object.entries(options.saved||{}))storage.set(key,value);
  let clock=1000;
  const document=dom?.document||{readyState:'loading',getElementById:()=>null};
  const B={world,network,entities,categories:{player:1,loot:2},items:[],karma:[],graphics:{options:{}},view:()=>({x:0,y:0,scale:1,ctx:dom?.canvas.getContext('2d')}),chatActive:()=>false};
  if(options.fireKey){B.fireKey=options.fireKey;network[options.fireKey]=()=>packets.push([4]);}
  window.Math=Math;window.JSON=JSON;window.dispatchEvent=e=>{for(const fn of listeners.get(e.type)||[])fn(e);};
  window.setTimeout=(fn,delay)=>{const id=++next;timers.set(id,fn);timerPeriods.set(id,delay);return id;};window.clearTimeout=id=>{timers.delete(id);timerPeriods.delete(id);};
  window.WebSocket=class {send(){}};window.CanvasRenderingContext2D=class {fillText(){}};window.KeyboardEvent=class {constructor(type,data){this.type=type;Object.assign(this,data);}};
  document.addEventListener=window.addEventListener;document.removeEventListener=window.removeEventListener;
  const clipboard=[];
  const navigator={clipboard:{writeText:async text=>{clipboard.push(text);}}};
  const candidate=process.env.DEVAST_TEST_CANDIDATE?require('../tools/updater/candidate-fixture.cjs').candidateFixture(B,process.env.DEVAST_TEST_CANDIDATE):null;
  const context = vm.createContext({
    window, document,
    localStorage: {getItem: k => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v)},
    console, performance: {now: () => clock},Date:class extends Date{static now(){return clock;}},navigator,alert(){},B:candidate?.B||B,
  });
  vm.runInContext((candidate?.source||(fs.readFileSync('mod/message15-aim.js','utf8') + '\n' + fs.readFileSync('mod/responsive.js', 'utf8'))) + '\nglobalThis.mod = __installDevastMod(B);', context, {timeout: 1000});
  return {mod: candidate?candidate.adaptMod(context.mod):context.mod, context, B,window,document,dom,navigator,clipboard,setClock:value=>{clock=value;},network, world, entities, storage, packets, listeners, timers, timerPeriods, frames, get nativeCalls(){return nativeCalls;}};
}

function scene(f,type,items){f.entities.border[type]={border:items.length,'ⲣᴑᴏ':items.map((_,i)=>i)};f.entities['ᴎ̂２'][type]=items;}
function player(id,x=0,y=0){return {'ᴘ४１':id,x,y,angle:0,'е̝ހ':0,id:0};}
function menu(f){for(const callback of f.listeners.get('DOMContentLoaded')||[])callback();return f.mod.menu;}
function control(folder,key){const c=folder.__controllers.find(c=>c.property===key);assert.ok(c,'Missing control '+key);return c;}

module.exports={fixture,scene,player,menu,control};
