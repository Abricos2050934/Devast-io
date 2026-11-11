const test=require('node:test'),assert=require('node:assert/strict');
const {analyze}=require('../tools/updater/static.cjs');

function fixture(width=4){
 const start=width===16?0xfe00:0xe0020,bits=width===16?4:2;
 const names=Array.from({length:101},(_,i)=>['length','window','charCodeAt','process.exit(9)'][i%4]);
 function encode(text){
  const b64=Buffer.from(text).toString('base64'),bytes=[b64.length>>8,b64.length&255,...Buffer.from(b64)],state=Array.from({length:256},(_,i)=>i);let i=0,j=0;
  return bytes.map(byte=>{i=(i+1)%256;j=(j+state[i])%256;[state[i],state[j]]=[state[j],state[i]];const cipher=byte^state[(state[i]+state[j])%256];return Array.from({length:8/bits},(_,n)=>8-bits*(n+1)).map(shift=>String.fromCodePoint(start+((cipher>>shift)&(width-1)))+(width===16?'a':'\u200d')).join('');}).join('');
 }
 const source=`const state=${JSON.stringify(Array.from({length:256},(_,i)=>i))};
 const alphabet={${Array.from({length:width},(_,n)=>`${start+n}:${n}`).join(',')}};
 const unpack=function(text){let bits='';for(let i=0;i<text.length;i++){let code=text.charCodeAt(i);if(code>=55296&&code<=56319&&i+1<text.length){code=((code-55296)<<10)+(text.charCodeAt(++i)-56320)+65536;}if(alphabet[code]!==undefined)bits+=alphabet[code].toString(2).padStart(${bits},'0');}const bytes=[];for(let i=0;i+8<=bits.length;i+=8)bytes.push(parseInt(bits.substr(i,8),2));return bytes;};
 const decrypt=function(input){const s=[...state],output=Array();let i=0,j=0;for(let k=0;k<input.length;k++){i=(i+1)%256;j=(j+s[i])%256;[s[i],s[j]]=[s[j],s[i]];output.push(input[k]^s[(s[i]+s[j])%256]);}return output;};
 const decode=function(text){const bytes=decrypt(unpack(text)),length=(bytes[0]<<8)|bytes[1];let result='';for(let i=2;i<length+2;i++)result+=window.String.fromCharCode(bytes[i]);return window.atob(result);};
 const encoded=${JSON.stringify(names.map(encode))};const table=[];
 for(let i=0;i<encoded.length;i++){table.push(decode(encoded[i]));}
 const ${names.map((_,i)=>'alias'+i+'=table['+i+']').join(',')};
 function result(){return [${names.map((_,i)=>'alias'+i).join(',')}];}`;
 return {source,names};
}

test('isolated data decoding supports a new cipher, non-BMP alphabets, filler and array swaps',()=>{
 const {source,names}=fixture(),a=analyze(source),fn=a.functions.find(f=>f.id?.name==='result');
 assert.deepEqual(fn.body.body[0].argument.elements.map(n=>a.constant(n)),names);
});

test('a familiar sixteen-symbol alphabet with a different byte cipher uses the isolated decoder',()=>{
 const {source,names}=fixture(16),a=analyze(source.replace('output=Array()', 'output=new Array()')),fn=a.functions.find(f=>f.id?.name==='result');
 assert.deepEqual(fn.body.body[0].argument.elements.map(n=>a.constant(n)),names);
});

test('isolated data dependencies cannot acquire host capabilities or access prototypes',()=>{
 for(const width of [4,16])for(const payload of ['process.exit(9)','window.fetch("https://example.com")','window.String.constructor("return process")()','({}).__proto__','"x".padStart(1000000000,"x")','new Date()','new Array(1000000000)']){
  const {source}=fixture(width),modified=source.replace('decrypt(unpack(text))',payload);
  assert.throws(()=>analyze(modified),/Unsupported string-table|Unsupported data array|Forbidden string-table|size limit/);
 }
});

test('data-table values do not leak into a shadowed local table',()=>{
 const {source}=fixture(),a=analyze(source+'function shadow(table){return table[0]}'),fn=a.functions.find(f=>f.id?.name==='shadow');
 assert.equal(a.constant(fn.body.body[0].argument),undefined);
});

test('data decoding does not initialize a local constant before its declaration',()=>{
 const {source}=fixture();assert.throws(()=>analyze(source.replace('const bytes=decrypt(unpack(text)),length=', 'const bytes=later;const later=decrypt(unpack(text));const length=')),/Unsupported string-table dependency/);
});
