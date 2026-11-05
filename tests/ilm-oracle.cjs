// Execute only reviewed pure ILM declarations and its packet/render hooks.
// The uploaded bundle's startup, account, license and network code is never run.
const fs=require('node:fs'),z=require('node:zlib'),vm=require('node:vm');
const core=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-aim-reference.json.gz')));
const hooks=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-integration-reference.json.gz')));
function oracle(settings){
 const context=vm.createContext({initialSettings:JSON.parse(JSON.stringify(settings)),window:{Uint16Array,Math,JSON}});
 const run=code=>vm.runInContext(code,context,{timeout:1000});
 run([
  'var _0x225287=()=>{throw Error("Decoder must not execute");},_0x507242=_0x225287,_0x349c=_0x225287;',
  'var _0x2ea565=initialSettings,connected=true,packets=[],_0x10898e={PLAYER:{id:1,team:-1},players:Array.from({length:1000},()=>({team:-1}))};',
  `var wireAngle=null,wirePlayer=0,framePlayer=0;
   function _0x4c996c(packet){
    if(!connected)return;
    const self=_0x6cc5f2.players[_0x10898e.PLAYER.id],target=_0x41e779.targetPlayer;
    if(target===self||![self,target].every(p=>p?.active&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.y>=0)){wireAngle=null;return;}
    if(packet[0]===6){const angle=(Math.round(packet[1])%360+360)%360;if(angle===wireAngle&&wirePlayer===_0x10898e.PLAYER.id)return;wireAngle=angle;wirePlayer=_0x10898e.PLAYER.id;}
    packets.push(packet);
   }`,
  ...core.blocks.map(b=>b.source),
  'var _0x6cc5f2=new _0x3e2cd1(),_0x41e779=new _0x4b5d6f();',
  'var _0x4cc032={remove(){},removeAll(){},get(){return {};}};',
  'var _0x62aeb8=()=>{},_0x55bbc4=Array.from({length:20},()=>({}));',
  'var _0x555618=1,_0x4212a3=0,_0x260b24=0;',
  'var _0x3bfd3a={globalAlpha:1,lineWidth:1,beginPath(){},moveTo(){},lineTo(){},stroke(){}};',
  ...['_0x144500','_0x4b25f3','_0x341470'].map(name=>hooks.find(h=>h.name===name).source)
 ].join('\n'));
 return {
  set(key,value){context.change={key,value};run("if(change.key==='AimBotEnabled'&&_0x2ea565[change.key]!==change.value)wireAngle=null;_0x2ea565[change.key]=change.value;");},
  team(id,team){context.change={id,team};run('_0x10898e.players[change.id].team=change.team;_0x10898e.PLAYER.team=_0x10898e.players[_0x10898e.PLAYER.id].team;');},
  self(id){context.id=id;run('_0x10898e.PLAYER.id=id;_0x10898e.PLAYER.team=_0x10898e.players[id].team;');},
  connected(value){context.connected=value;},
  move(x,y){context.point={x,y};run('_0x6cc5f2.mousePosition=point;');},
  frame(view){Object.assign(context,{_0x4212a3:view.x,_0x260b24:view.y,_0x555618:view.scale});run('var active=connected?_0x10898e.PLAYER.id:0;if(!active||active!==framePlayer)wireAngle=null;framePlayer=active;if(active)_0x341470();');},
  tick(){run('_0x4a7389();');},
  fire(){run('if(connected)packets.push([4]);');},
  packet({type=0,id=2,uid=1,x=0,y=0,active=true}){
   // Feed the original receiver its original 18-byte record, not a rewritten
   // imitation of the current 20-byte protocol's history hook.
   const buffer=new ArrayBuffer(20),u8=new Uint8Array(buffer),u16=new Uint16Array(buffer);
   u8[2]=id;u8[3]=uid;u8[5]=type;u16[3]=active?1:0;u16[7]=x;u16[8]=y;
   context.buffer=buffer;context.u8=u8;context.removal=!active;context.slotId=type===13?uid:id;context.slotGroup=type===13?'ghouls':'players';run('if(removal){const t=_0x6cc5f2[slotGroup][slotId];if(t===_0x41e779.targetPlayer||t===_0x6cc5f2.players[_0x10898e.PLAYER.id])wireAngle=null;}_0x144500(buffer,u8);');
  },
  snapshot(){return JSON.parse(run('JSON.stringify({lastId:_0x6cc5f2.lastId,lastAngle:_0x41e779.lastAngle,target:_0x41e779.targetPlayer?.id,mouse:_0x6cc5f2.mouseMapCords,lines:_0x6cc5f2.lines,players:_0x6cc5f2.players.filter(p=>p.active),ghouls:_0x6cc5f2.ghouls.filter(p=>p.active)})'));},
  drain(){const result=JSON.parse(run('JSON.stringify(packets)'));run('packets.length=0;');return result.map(p=>p[0]===6?[6,(Math.round(p[1])%360+360)%360]:p);}
 };
}
module.exports={oracle};
