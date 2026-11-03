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
  self.meta={'release':self.release,'output_sha256':p.digest(self.body)};self.validation={'output_sha256':p.digest(self.body),'status':'passed','regression':{'status':'passed'},'candidate_function_tests':{'status':'passed'},'mod_contract':{'modules':['mod/test.js']},'module_sha256':{'mod/test.js':p.digest(b'current mod')},'mod_bundle_sha256':'bundle','resource_override_sha256':p.digest((self.root/'resource-override/Devast-io-GitHub-Resource-Override.json').read_bytes())};self.contract={'modules':['mod/test.js'],'required_browsers':['chromium','firefox']};self.validation['mod_contract']=self.contract;self.validation['browsers']={name:{'status':'passed','output_sha256':self.meta['output_sha256'],'integrity_compatibility':{'status':'passed','predicates':3}} for name in self.contract['required_browsers']};(self.root/'mod/contract.json').write_text(json.dumps(self.contract));self.save()
 def save(self):
  self.validation.setdefault('integrity_compatibility', {'status':'passed','predicates':3})
  (self.out/'current.json').write_text(json.dumps(self.meta));(self.d/'validation.json').write_text(json.dumps(self.validation))
 def test_builds_only_verified_current_mod_and_matching_zip(self):
  import io,zipfile
  files=p.artifacts(self.root,self.out);self.assertEqual(files['game.modded.js'],self.body);self.assertEqual(files['Devast-io-client.zip'],p.artifacts(self.root,self.out)['Devast-io-client.zip'])
  with zipfile.ZipFile(io.BytesIO(files['Devast-io-client.zip'])) as z:
   self.assertEqual(z.read('game.modded.js'),self.body)
   self.assertEqual(json.loads(z.read('Devast-io-GitHub-Resource-Override.json'))['v'],1)
  with zipfile.ZipFile(io.BytesIO(files['Devast-io-Resource-Override.zip'])) as z:
   self.assertEqual(z.namelist(),['Devast-io-GitHub-Resource-Override.json'])
   self.assertEqual(z.read(z.namelist()[0]),files[z.namelist()[0]])
 def test_changed_mod_after_validation_cannot_publish(self):
  (self.root/'mod/test.js').write_text('another mod')
  with self.assertRaisesRegex(ValueError,'another mod'):p.artifacts(self.root,self.out)
 def test_candidate_function_failures_cannot_publish(self):
  self.validation['candidate_function_tests']['status']='failed';self.save()
  with self.assertRaisesRegex(ValueError,'checks'):p.artifacts(self.root,self.out)
 def test_unpatched_integrity_build_cannot_publish(self):
  self.validation['integrity_compatibility']={'status':'failed','predicates':2};self.save()
  with self.assertRaisesRegex(ValueError,'integrity compatibility'):p.artifacts(self.root,self.out)
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

 def test_feature_contract_changes_cannot_publish_an_old_release(self):
  contract=dict(self.contract,features=['cursor-autobuild-native-preview'])
  (self.root/'mod/contract.json').write_text(json.dumps(contract))
  with self.assertRaisesRegex(ValueError,'feature contract'):p.artifacts(self.root,self.out)
 def test_required_firefox_failure_cannot_publish(self):
  self.validation['browsers']['firefox']['status']='failed';self.save()
  with self.assertRaisesRegex(ValueError,'firefox'):p.artifacts(self.root,self.out)
 def test_browser_report_from_another_build_cannot_publish(self):
  self.validation['browsers']['firefox']['output_sha256']='0'*64;self.save()
  with self.assertRaisesRegex(ValueError,'stale'):p.artifacts(self.root,self.out)

 def test_missing_integrity_check_in_one_browser_cannot_publish(self):
  del self.validation['browsers']['firefox']['integrity_compatibility'];self.save()
  with self.assertRaisesRegex(ValueError,'integrity.*browser'):p.artifacts(self.root,self.out)
