const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,scene,player}=require('./mod-fixture.cjs');
test('aim line shares native player coordinates across graphics ratios, zoom and camera offsets',()=>{
 for(const ratio of [.5,1,2])for(const scale of [.5,1,1.7]){
  const f=fixture({dom:true});try{
   f.B.synchronizedRender=true;const ctx=f.dom.canvas.getContext('2d'),view={x:-800,y:-600,scale,ctx};f.B.view=()=>view;f.B.graphics.options['еߎ༢']=ratio;
   Object.assign(f.world['ᅠᏧ‍'],{x:1000,y:1000});scene(f,1,[player(1,1000,1000),player(2,1500,1200)]);
   for(const[key,value]of Object.entries({AimBotEnabled:true,mouseFovEnable:false,lockId:2,ShowPlayerHitbox:true}))f.mod.setSetting(key,value);
   f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,1,1500,1200,true);
   const line=f.mod.targets.lines[0],coordinates=[line.x1,line.y1,line.x2,line.y2],angle=f.mod.aim.lastAngle;
   f.dom.calls.length=0;f.mod.render();
   const start=f.dom.calls.find(c=>c.name==='moveTo'&&c.stroke===line.color),end=f.dom.calls.find(c=>c.name==='lineTo'&&c.stroke===line.color),body=f.dom.calls.find(c=>c.name==='arc');
   const project=(x,y)=>[(view.x+x)*scale*ratio,(view.y+y)*scale*ratio];
   assert.deepEqual(start.args,project(1000,1000),'Line origin differs from native canvas at ratio '+ratio);
   assert.deepEqual(start.args,body.args.slice(0,2),'Line is detached from the player');
   assert.deepEqual(end.args,project(line.x2,line.y2),'Prediction endpoint uses another graphics scale');
   assert.deepEqual([line.x1,line.y1,line.x2,line.y2],coordinates);assert.equal(f.mod.aim.lastAngle,angle);
  }finally{f.mod.dispose();}
 }
});
