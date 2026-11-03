import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest
SPEC=importlib.util.spec_from_file_location('retarget',Path(__file__).with_name('retarget_repository.py'))
m=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(m)
class MigrationTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
  source=Path(__file__).resolve().parents[1]
  for name in m.ACTIVE+m.DOCS+['tools/make_resource_override.py']:
   target=self.root/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source/name,target)
  (self.root/'handoff').mkdir()
 def test_dry_run_does_not_modify_any_file(self):
  before={str(p):p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
  self.assertTrue(m.retarget(self.root,'BackupOwner/Devast-restored',True)['files'])
  self.assertTrue(all(Path(p).read_bytes()==data for p,data in before.items()))
  self.assertFalse((self.root/'handoff/MIGRATION-STATE.json').exists())
 def test_all_active_links_and_generated_override_move_together_and_repeating_is_safe(self):
  result=m.retarget(self.root,'BackupOwner/Devast-restored')
  for name in m.ACTIVE:
   self.assertNotIn(result['from'],(self.root/name).read_text())
   self.assertIn('BackupOwner/Devast-restored',(self.root/name).read_text())
  config=json.loads((self.root/'resource-override/Devast-io-GitHub-Resource-Override.json').read_text())
  self.assertEqual(config['data'][0]['rules'][0]['file'].replace('\r\n','\n'),(self.root/'resource-override/loader.js').read_text())
  self.assertEqual(m.retarget(self.root,'BackupOwner/Devast-restored')['files'],[])
 def test_urls_and_paths_are_not_accepted_as_repository_names(self):
  for name in ['https://github.com/owner/repo','owner/../repo','owner/repo?token=x','owner/..']:
   with self.assertRaises(ValueError):m.retarget(self.root,name)
if __name__=='__main__':unittest.main()
