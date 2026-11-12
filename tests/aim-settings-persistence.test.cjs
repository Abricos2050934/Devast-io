const test=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('./mod-fixture.cjs');
test('explicit saved aim values are not reinterpreted as legacy defaults on reload',()=>{
 const saved={distanceCoefficient:100,offsetCoefficient:.1,aimStick:140,aimSmooth:.62,leadCap:220,mouseFovEnable:false,mouseFov:600};
 const f=fixture({saved:{'DevastMessage27:aim:v1':JSON.stringify(saved),token:'identity-keep'}});
 try{for(const[key,value]of Object.entries(saved))assert.equal(f.mod.settings[key],value,key);assert.equal(f.storage.get('token'),'identity-keep');}
 finally{f.mod.dispose();}
});
