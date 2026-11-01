import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import hashlib
SPEC=importlib.util.spec_from_file_location('publisher',Path(__file__).resolve().parents[1]/'tools/publish_update.py')
p=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(p)
class PublicationTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name);self.out=self.root/'output';self.release='a'*64
  (self.root/'mod').mkdir();(self.root/'mod/test.js').write_text('current mod');self.d=self.out/'versions'/self.release;self.d.mkdir(parents=True);self.body=b'current bundled client';(self.d/'game.modded.js').write_bytes(self.body)
  (self.root/'resource-override').mkdir();(self.root/'resource-override/Devast-io-GitHub-Resource-Override.json').write_bytes((p.ROOT/'resource-override/Devast-io-GitHub-Resource-Override.json').read_bytes())
  self.meta={'release':self.release,'output_sha256':p.digest(self.body)};self.validation={'output_sha256':p.digest(self.body),'status':'passed','regression':{'status':'passed'},'candidate_function_tests':{'status':'passed'},'mod_contract':{'modules':['mod/test.js']},'module_sha256':{'mod/test.js':p.digest(b'current mod')},'mod_bundle_sha256':'bundle','resource_override_sha256':p.digest((self.root/'resource-override/Devast-io-GitHub-Resource-Override.json').read_bytes())};self.save()
 def save(self):
  (self.out/'current.json').write_text(json.dumps(self.meta));(self.d/'validation.json').write_text(json.dumps(self.validation))
 def test_builds_only_verified_current_mod_and_matching_zip(self):
  import io,zipfile
  files=p.artifacts(self.root,self.out);self.assertEqual(files['game.modded.js'],self.body);self.assertEqual(files['Devast-io-client.zip'],p.artifacts(self.root,self.out)['Devast-io-client.zip'])
  with zipfile.ZipFile(io.BytesIO(files['Devast-io-client.zip'])) as z:
   self.assertEqual(z.read('game.modded.js'),self.body)
   self.assertEqual(json.loads(z.read('Devast-io-GitHub-Resource-Override.json'))['v'],1)
 def test_changed_mod_after_validation_cannot_publish(self):
  (self.root/'mod/test.js').write_text('another mod')
  with self.assertRaisesRegex(ValueError,'another mod'):p.artifacts(self.root,self.out)
 def test_candidate_function_failures_cannot_publish(self):
  self.validation['candidate_function_tests']['status']='failed';self.save()
  with self.assertRaisesRegex(ValueError,'checks'):p.artifacts(self.root,self.out)
 def test_corrupted_client_cannot_publish(self):
  (self.d/'game.modded.js').write_bytes(b'broken')
  with self.assertRaisesRegex(ValueError,'checksum'):p.artifacts(self.root,self.out)

 def test_publication_keeps_immutable_versions_and_does_not_rewrite_unchanged_tree(self):
  import subprocess
  remote=self.root/'remote.git'
  subprocess.run(['git','init','--quiet','--bare',str(remote)],check=True)
  subprocess.run(['git','init','--quiet',str(self.root)],check=True)
  subprocess.run(['git','remote','add','origin',str(remote)],cwd=self.root,check=True)
  first=p.publish(self.root,{'game.modded.js':b'first','versions/first/game.modded.js':b'first'})
  second=p.publish(self.root,{'game.modded.js':b'second','versions/second/game.modded.js':b'second'})
  self.assertNotEqual(first,second)
  old=subprocess.check_output(['git','show',second+':versions/first/game.modded.js'],cwd=self.root)
  self.assertEqual(old,b'first')
  self.assertEqual(p.publish(self.root,{'game.modded.js':b'second','versions/second/game.modded.js':b'second'}),second)

 def test_changed_override_after_validation_cannot_publish(self):
  (self.root/'resource-override/Devast-io-GitHub-Resource-Override.json').write_text('{}')
  with self.assertRaisesRegex(ValueError,'Resource Override'):p.artifacts(self.root,self.out)
