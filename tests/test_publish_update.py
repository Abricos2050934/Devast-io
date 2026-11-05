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

 def test_world_visibility_requires_three_native_renderers_in_each_browser(self):
  self.contract['features']=['received-mines-and-wires-visibility']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['world_visibility']={'status':'passed','native_renderers':3}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  self.validation['browsers']['firefox']['world_visibility']['native_renderers']=2;self.save()
  with self.assertRaisesRegex(ValueError,'world visibility.*firefox'):p.artifacts(self.root,self.out)

 def test_right_click_door_requires_native_verification_in_each_browser(self):
  self.contract['features']=['right-click-hovered-door']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'right_click_hovered_door':True}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  del self.validation['browsers']['firefox']['native']['right_click_hovered_door'];self.save()
  with self.assertRaisesRegex(ValueError,'right-click door.*firefox'):p.artifacts(self.root,self.out)

 def test_door_without_prompt_requires_real_mouse_verification(self):
  self.contract['features']=['right-click-door-independent-of-native-prompt']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'right_click_without_native_prompt':True,'right_click_real_mouse':True}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  for key in ['right_click_without_native_prompt','right_click_real_mouse']:
   self.validation['browsers']['firefox']['native'][key]=False;self.save()
   with self.assertRaisesRegex(ValueError,'E prompt.*firefox'):p.artifacts(self.root,self.out)
   self.validation['browsers']['firefox']['native'][key]=True

 def test_independent_door_control_requires_state_feedback_verification(self):
  self.contract['features']=['independent-door-control-and-server-state-feedback']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'independent_door_control':True,'door_server_state_feedback':True}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  self.validation['browsers']['firefox']['native']['door_server_state_feedback']=False;self.save()
  with self.assertRaisesRegex(ValueError,'state feedback.*firefox'):p.artifacts(self.root,self.out)

 def test_automation_backpressure_requires_browser_verification(self):
  self.contract['features']=['automation-socket-backpressure']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'automation_socket_backpressure':True}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  self.validation['browsers']['firefox']['native']['automation_socket_backpressure']=False;self.save()
  with self.assertRaisesRegex(ValueError,'backpressure.*firefox'):p.artifacts(self.root,self.out)

 def test_original_ilm_mechanics_require_both_native_browsers(self):
  self.contract['features']=['verbatim-original-ilm-aim']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'original_ilm_mechanics':True}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  for state in [False,None]:
   self.validation['browsers']['firefox']['native']['original_ilm_mechanics']=state;self.save()
   with self.assertRaisesRegex(ValueError,'Original ILM.*firefox'):p.artifacts(self.root,self.out)

 def test_coalesced_directions_require_native_idle_ping_verification(self):
  self.contract['features']=['coalesced-aim-directions']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'coalesced_aim_directions_and_native_idle':True}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  self.validation['browsers']['firefox']['native']['coalesced_aim_directions_and_native_idle']=False;self.save()
  with self.assertRaisesRegex(ValueError,'Coalesced.*firefox'):p.artifacts(self.root,self.out)

 def test_close_origin_diagnostics_require_both_browsers(self):
  self.contract['features']=['connection-close-origin-diagnostics']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'connection_close_origin_diagnostics':True}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  self.validation['browsers']['firefox']['native']['connection_close_origin_diagnostics']=False;self.save()
  with self.assertRaisesRegex(ValueError,'close origin.*firefox'):p.artifacts(self.root,self.out)

 def test_native_shot_and_render_sync_require_both_browsers(self):
  self.contract['features']=['native-shot-direction-and-render-sync']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'native_shot_direction_and_render_sync':True}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  self.validation['browsers']['firefox']['native']['native_shot_direction_and_render_sync']=False;self.save()
  with self.assertRaisesRegex(ValueError,'shot direction.*firefox'):p.artifacts(self.root,self.out)

 def test_curved_chasing_requires_native_verification_in_both_browsers(self):
  self.contract['features']=['curved-target-and-chaser-interception']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'curved_target_and_chaser_interception':True}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  self.validation['browsers']['firefox']['native']['curved_target_and_chaser_interception']=False;self.save()
  with self.assertRaisesRegex(ValueError,'Curved chasing.*firefox'):p.artifacts(self.root,self.out)

 def test_aim_backpressure_requires_native_verification_in_both_browsers(self):
  self.contract['features']=['aim-cycle-socket-backpressure']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'aim_cycle_socket_backpressure':True}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  for state in [False,None]:
   self.validation['browsers']['firefox']['native']['aim_cycle_socket_backpressure']=state;self.save()
   with self.assertRaisesRegex(ValueError,'Aim cycle.*firefox'):p.artifacts(self.root,self.out)

 def test_valid_targets_and_death_handling_require_both_native_browsers(self):
  self.contract['features']=['valid-live-aim-targets']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'valid_live_aim_targets':True,'server_death_sends_no_commands':True}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  for key in ['valid_live_aim_targets','server_death_sends_no_commands']:
   self.validation['browsers']['firefox']['native'][key]=False;self.save()
   with self.assertRaisesRegex(ValueError,'Live aim.*firefox'):p.artifacts(self.root,self.out)
   self.validation['browsers']['firefox']['native'][key]=True
