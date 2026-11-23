function trackPacket(type, playerId, uid, x, y, active, weapon, packed, packet={}) {
    if(type===B.categories.projectile){
      if(active&&playerId===B.world.ᴑᴏᏧ?.id&&Number.isInteger(packet.state)){
        const self=ballistic.motion('p:'+playerId);
        if(self)ballistic.projectile(playerId+':'+uid+':'+packet.entityId,self.weapon,(packet.state>>>8)*10,ballisticWeaponProfile(self.weapon).speed);
      }
      return;
    }
    const kind=type===B.categories.player?'players':type===13?'ghouls':null;
    const id=kind==='players'?playerId:uid;
    if(!kind||!Number.isInteger(id)||id<0||id>65535)return;
    if(id===0)return;
    ballistic.track((kind==='players'?'p:':'g:')+id,Number.isFinite(packet.x)?packet.x:x,Number.isFinite(packet.y)?packet.y:y,active,{generation:uid,weapon:kind==='players'&&Number.isFinite(packed)?(packed>>>8)&255:undefined});
    aimModule.ensure(id);const group=GetAllTargets[kind];
    if(!active){group[id].setInactive();return;}
    if(Number.isFinite(x)&&Number.isFinite(y))aimModule.position(kind,id,x,y,weapon,packed);
  }