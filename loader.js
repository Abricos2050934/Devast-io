(function(){
 if(window.__bestScriptOriginal)return;
 var state=window.__bestScriptRemoteLoader;if(state&&(state.loading||state.loaded))return;
 state=window.__bestScriptRemoteLoader={loading:true};
 var url='https://raw.githubusercontent.com/Abricos2050934/Devast-io/bestscript-updates/game.bestscript.js';
 try{var request=new XMLHttpRequest();request.open('GET',url+'?t='+Date.now(),false);request.send(null);
 if(request.status<200||request.status>=300)throw Error('BestScript HTTP '+request.status);
 var code=request.responseText;if(code.indexOf('function __createBestScriptOriginalBridge(')<0)throw Error('Invalid BestScript client');
 (0,eval)(code);if(!window.__bestScriptOriginal)throw Error('BestScript did not initialize');state.loaded=true;
 }catch(error){state.error=String(error);console.error('[BestScript auto-update]',error);}finally{state.loading=false;}
})();