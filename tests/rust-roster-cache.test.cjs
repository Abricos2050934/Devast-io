const test=require('node:test'),assert=require('node:assert/strict');
process.env.DEVAST_RUST_MOD=process.env.DEVAST_RUST_MOD||'rust-mod';
const {fixture}=require('./mod-fixture.cjs');
test('Rust roster cache observes in-place names, clans, colors, hiding and reopening',()=>{
 const f=fixture({dom:true});
 try{
  f.world['ﾠࡅ‍'][0]={name:'A','ոᚄރ':7};
  Object.assign(f.world['ᴎ︃ᄉ'][2],{'а༤̘':0,'ᴌ̗ⲟ':7});
  f.mod.setSetting('PlayersListEnabled',true);f.mod.step(0);
  const panel=f.mod.playerList,rows=()=>panel.children[1].children[1].children;
  assert.equal(rows()[1].children[2].textContent,'[A]');
  let writes=0;panel.style=new Proxy(panel.style,{set(t,k,v){writes++;t[k]=v;return true;}});
  f.mod.render(1);assert.equal(writes,0,'unchanged roster must not rewrite panel styles');
  f.world['ᴎ︃ᄉ'][2]['ο̏︇']='Changed';f.mod.render(2);
  assert.equal(rows()[1].children[1].textContent,'Changed');
  f.world['ﾠࡅ‍'][0].name='B';f.mod.render(3);assert.equal(rows()[1].children[2].textContent,'[B]');
  f.world['ﾠࡅ‍'][0]['ոᚄރ']=8;f.mod.render(4);assert.equal(rows()[1].children[2].textContent,'—');
  f.mod.setSetting('NicknameColor','#abcdef');f.mod.render(5);assert.equal(rows()[1].children[1].style.color,'#abcdef');
  f.mod.setSetting('PlayersListEnabled',false);f.mod.render(6);assert.equal(panel.style.display,'none');
  f.mod.setSetting('PlayersListEnabled',true);f.mod.render(7);assert.equal(panel.style.display,'flex');
 }finally{f.mod.dispose();}
});
