function verifyAimSearch(m,n,s,playerType=0){
 const check=(value,message)=>{if(!value)throw Error(message);},world=n.world,self=world[s['ᅠᏧ‍']],metaKey=s['ᴎ︃ᄉ'],metadata=world[metaKey],clans=world[s['ﾠࡅ‍']];
 const savedId=self.id,savedState=n.network.state,savedEnded=m.reconnect.sessionEnded,keys=['AimBotEnabled','autoFire','jitterActive','JitterEnabled','target','lockId'],saved=Object.fromEntries(keys.map(k=>[k,m.settings[k]]));
 const oldMeta=[1,2,3,4].map(id=>[id,metadata[id]]),oldClans=[clans[0],clans[1]],reads=[];
 try{
  n.network.state=1;self.id=1;m.reconnect.sessionEnded=false;m.onSessionStart();m.onHandshake();
  for(const[k,v]of Object.entries({AimBotEnabled:false,autoFire:false,jitterActive:false,JitterEnabled:false,target:'all',lockId:-1}))m.setSetting(k,v);
  for(let id=1;id<=120;id++)m.trackPacket(playerType,id,1,1000+id*10,1000+id*5,true);
  for(let id=1;id<=128;id++)m.trackPacket(13,0,id,2000+id*10,2000+id*5,true);
  metadata[1]={[s['а༤̘']]:-1};
  world[metaKey]=new Proxy(metadata,{get(target,key,receiver){if(typeof key==='string'&&/^\d+$/.test(key))reads.push(Number(key));return Reflect.get(target,key,receiver);}});
  const point={x:1000,y:1000};
  check(m.aim.findNearestPlayerTo(point,2500)===m.targets.players[2],'Optimized query selected the wrong nearest player');
  check(JSON.stringify(reads)==='[1]','Clanless query read other players or ghoul metadata: '+JSON.stringify(reads));
  const clanlessReads=reads.length;reads.length=0;
  clans[0]={[s['ոᚄރ']]:7};clans[1]={[s['ոᚄރ']]:8};
  for(const id of [1,2,3,4])metadata[id]={[s['а༤̘']]:id===4?1:0,[s['ᴌ̗ⲟ']]:id===4?8:7};
  check(m.aim.findNearestPlayerTo(point,2500)===m.targets.players[4],'Optimized query admitted a teammate');
  check(JSON.stringify(reads)==='[1,2,3,4]','Query swept noncompetitive or ghoul clan metadata: '+JSON.stringify(reads));
  const clanReads=reads.length;reads.length=0;
  metadata[2]={[s['а༤̘']]:1,[s['ᴌ̗ⲟ']]:8};
  check(m.aim.findNearestPlayerTo(point,2500)===m.targets.players[2],'Changed clan membership left a stale target');
  clans[0][s['ոᚄރ']]=99;reads.length=0;
  check(m.aim.findNearestPlayerTo(point,2500)===m.targets.players[2]&&JSON.stringify(reads)==='[1]','Reused clan slot left a stale filter');
  return {status:'passed',players:120,ghouls:128,clanless_metadata_reads:clanlessReads,competitive_clan_metadata_reads:clanReads,clan_changes_immediate:true,no_cross_update_target_cache:true};
 }finally{
  world[metaKey]=metadata;for(const[id,value]of oldMeta){if(value===undefined)delete metadata[id];else metadata[id]=value;}clans[0]=oldClans[0];clans[1]=oldClans[1];
  m.onSessionStart();m.onHandshake();self.id=savedId;n.network.state=savedState;m.reconnect.sessionEnded=savedEnded;for(const[k,v]of Object.entries(saved))m.setSetting(k,v);
 }
}
module.exports={verifyAimSearch};
