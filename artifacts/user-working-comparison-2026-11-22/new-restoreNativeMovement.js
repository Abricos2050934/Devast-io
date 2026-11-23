function restoreNativeMovement() {
    if(!strafeOwnsMovement)return false;
    strafeOwnsMovement=false;
    const mask=GetAllTargets.myLastMoveDirection;
    try{return __send([2,Number.isInteger(mask)&&mask>=0&&mask<=15?mask:0]);}
    catch(error){report(error);return false;}
  }