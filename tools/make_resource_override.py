"""Build the importable v1 Resource Override configuration used by the supplied sample."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
NAME='Devast-io-GitHub-Resource-Override.json'
def configuration(root=ROOT):
    loader=(root/'resource-override/loader.js').read_text().replace('\r\n','\n').replace('\n','\r\n')
    return {'v':1,'data':[{'id':'d1','matchUrl':'https://devast.io/*','rules':[
        {'type':'fileOverride','match':'**://devast.io/js/*.js','file':loader,'fileId':'f1','on':True}], 'on':True}]}
if __name__=='__main__':
    target=ROOT/'resource-override'/NAME
    target.write_text(json.dumps(configuration(),ensure_ascii=False,indent=2)+'\n')
    print(target)
