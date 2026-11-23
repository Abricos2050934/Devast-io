try{console.log(JSON.stringify(require('./build_verified_mod.cjs').build({target:'video-aim-release'}),null,2));}
catch(error){console.error(error.message);process.exitCode=1;}
