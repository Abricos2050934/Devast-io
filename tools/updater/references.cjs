// Source-controlled reviewed references. Downloaded input cannot select paths.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {hash}=require('./static.cjs');
const references=[
 {sha256:'b2752241a0a1491b5bd48146c7c3c4937f490928df5cab058ba80d32a413acc1',baseline:'baselines/current.js.gz',profile:'patches/recovered-current.json',bindings:'patches/recovered-bindings.json'},
 {sha256:'c69bfd5b520049277867b9238b0d88693715ee1ebfeb2a2cc205139cdb85f1ab',baseline:'baselines/native-2026-11-05.js.gz',profile:'patches/native-2026-11-05.json',bindings:'patches/bindings-2026-11-05.json'},
 {sha256:'f3d84ce3b601811fd834d8204d6334e5c50858824fedd1d567bbfa6ce75096d7',baseline:'baselines/native-2026-11-06.js.gz',profile:'patches/native-2026-11-06.json',bindings:'patches/bindings-2026-11-06.json'}
];
function selectReference(candidateHash){return references.find(r=>r.sha256===candidateHash)||references.at(-1);}
function loadReference(root,candidate){
 const selected=selectReference(hash(candidate));
 const source=zlib.gunzipSync(fs.readFileSync(path.join(root,selected.baseline))).toString();
 const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
 const profile=read(selected.profile),bindings=read(selected.bindings);
 if(hash(source)!==selected.sha256||profile.baseline_sha256!==selected.sha256)throw Error('Reviewed reference checksum mismatch');
 return {source,profile,bindings};
}
module.exports={selectReference,loadReference};
