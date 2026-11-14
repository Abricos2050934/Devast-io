import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import hashlib
SPEC=importlib.util.spec_from_file_location('publisher',Path(__file__).resolve().parents[1]/'tools/publish_update.py')
p=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(p)
class PublicationTests(unittest.TestCase):
 def test_native_rejection_recovery_requires_no_retries_and_manual_play_in_both_browsers(self):
  self.contract['features']=['native-rejection-stops-auto-reconnect']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  good={'status':'passed','automatic_retries':0,'manual_play_available':True,'saved_identity_unchanged':True,'native_close_restore_bit':True}
  for report in self.validation['browsers'].values():report['native']={'rejection_recovery':dict(good)}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  for field,value in [('automatic_retries',1),('automatic_retries',False),('manual_play_available',False),('saved_identity_unchanged',False),('native_close_restore_bit',False)]:
   self.validation['browsers']['firefox']['native']['rejection_recovery']={**good,field:value};self.save()
   with self.assertRaisesRegex(ValueError,'Native rejection recovery.*firefox'):p.artifacts(self.root,self.out)

 def test_fast_loot_mid_burst_backpressure_requires_both_browsers(self):
  self.contract['features']=['fast-loot-stops-on-new-backlog']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'fast_loot_mid_burst_backpressure':True}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  for value in [None,False,1,'true']:
   self.validation['browsers']['firefox']['native']['fast_loot_mid_burst_backpressure']=value;self.save()
   with self.assertRaisesRegex(ValueError,'Mid-burst fast loot.*firefox'):p.artifacts(self.root,self.out)

 def test_first_server_death_requires_both_browsers(self):
  self.contract['features']=['first-server-death-preserved']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'first_server_death_preserved':True}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  for value in [None,False,1,'true']:
   self.validation['browsers']['firefox']['native']['first_server_death_preserved']=value;self.save()
   with self.assertRaisesRegex(ValueError,'First server death.*firefox'):p.artifacts(self.root,self.out)

 def test_native_wire_diagnostics_require_both_browsers(self):
  self.contract['features']=['native-wire-traffic-diagnostics']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'native_aim_transport':{'native_wire_metadata':True}}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  for value in [None,False,1,'true']:
   self.validation['browsers']['firefox']['native']['native_aim_transport']['native_wire_metadata']=value;self.save()
   with self.assertRaisesRegex(ValueError,'Native wire traffic.*firefox'):p.artifacts(self.root,self.out)

 def test_death_opcode_diagnostics_require_a_mapped_byte_in_both_browsers(self):
  self.contract['features']=['native-death-opcode-diagnostics']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'native_death_opcode':27}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  for opcode in [None,True,-1,256,'27']:
   self.validation['browsers']['firefox']['native']['native_death_opcode']=opcode;self.save()
   with self.assertRaisesRegex(ValueError,'Native death opcode.*firefox'):p.artifacts(self.root,self.out)

 def test_cadence_prediction_requires_both_native_browsers(self):
  self.contract['features']=['packet-rate-aware-curved-prediction']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  keys=['cadence_aware_curved_prediction','straight_quantization_rejected','ak_and_laser_native_profiles']
  for report in self.validation['browsers'].values():report['native']={'adaptive_aim':dict.fromkeys(keys,True)}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  for key in keys:
   self.validation['browsers']['firefox']['native']['adaptive_aim'][key]=False;self.save()
   with self.assertRaisesRegex(ValueError,'Cadence-aware.*firefox'):p.artifacts(self.root,self.out)
   self.validation['browsers']['firefox']['native']['adaptive_aim'][key]=True

 def test_adaptive_aim_requires_native_packet_speed_and_shot_evidence_in_both_browsers(self):
  self.contract['features']=['native-weapon-ballistic-interception']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  keys=['native_weapon_speed_and_range','native_projectile_speed','native_speed_equality','packet_server_positions','shooter_and_target_velocity','fresh_angle_before_native_attack','jitter_priority','line_matches_shot','stale_target_releases_input']
  for report in self.validation['browsers'].values():report['native']={'adaptive_aim':dict(status='passed',**dict.fromkeys(keys,True))}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  for key in keys:
   self.validation['browsers']['firefox']['native']['adaptive_aim'][key]=False;self.save()
   with self.assertRaisesRegex(ValueError,'Adaptive.*firefox'):p.artifacts(self.root,self.out)
   self.validation['browsers']['firefox']['native']['adaptive_aim'][key]=True

 def test_restored_spin_requires_speed_and_non_jitter_burst_evidence(self):
  self.contract['features']=['restored-original-jitter','jitter-shot-priority']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  keys=['original_rotation','configurable_speed','imported_jitter_removed','manual_angle_before_attack','automatic_angle_before_attack','held_fire_tracks_target','cursor_cannot_overwrite','non_jitter_cursor_cannot_overwrite','repeated_bursts_aligned','resumes_on_release','standing_rotation','targetless_manual_alignment','blocked_attack_rejected','local_rotation','death_stops_packets']
  for report in self.validation['browsers'].values():report['native']={'jitter':dict(status='passed',**dict.fromkeys(keys,True)),'message27_menu':{'status':'passed','controls':28,'original_jitter_controls':True}}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  for key in keys:
   self.validation['browsers']['firefox']['native']['jitter'][key]=False;self.save()
   with self.assertRaisesRegex(ValueError,'Jitter.*firefox'):p.artifacts(self.root,self.out)
   self.validation['browsers']['firefox']['native']['jitter'][key]=True

 def test_jitter_shot_priority_requires_both_native_browsers(self):
  self.contract['features']=['jitter-shot-priority']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  keys=['manual_angle_before_attack','automatic_angle_before_attack','held_fire_tracks_target','cursor_cannot_overwrite','resumes_on_release','standing_and_stop_option','local_rotation','death_stops_packets']
  for report in self.validation['browsers'].values():report['native']={'jitter':dict(status='passed',**dict.fromkeys(keys,True))}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  for key in keys:
   self.validation['browsers']['firefox']['native']['jitter'][key]=False;self.save()
   with self.assertRaisesRegex(ValueError,'Jitter.*firefox'):p.artifacts(self.root,self.out)
   self.validation['browsers']['firefox']['native']['jitter'][key]=True

 def test_line_projection_live_settings_and_saved_values_require_both_browsers(self):
  self.contract['features']=['aim-line-native-projection','live-aim-setting-effects','versioned-aim-settings-preserved']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():
   report['native']={'message27_aim':{'pixel_projection_cases':18},'message27_settings':{'status':'passed','gui_controls_live':True,'checked':17}}
   report['physical_numeric']={'status':'passed','explicit_saved_values':True}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  report=self.validation['browsers']['firefox']
  for group,key,value in [(report['native']['message27_aim'],'pixel_projection_cases',17),(report['native']['message27_settings'],'checked',16),(report['native']['message27_settings'],'gui_controls_live',False),(report['physical_numeric'],'explicit_saved_values',False)]:
   previous=group[key];group[key]=value;self.save()
   with self.assertRaisesRegex(ValueError,'not verified.*firefox'):p.artifacts(self.root,self.out)
   group[key]=previous

 def test_uploaded_message27_requires_source_menu_and_native_pipeline_in_both_browsers(self):
  self.contract['features']=['verbatim-message27-aim','message27-native-pipeline','message27-original-menu-layout']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  aim={'status':'passed','upload_sha256':'f3001e45554d86505e89532faaa2aff5be69dec90b713e7966428273d2b1abd0','comparison_points':2149,'mouse_cases':18}
  for key in ['exact_states','exact_raw_packets','source_timing','spear','jitter','strafe','valid_target_admission','session_target_reset','server_death_sends_no_commands','native_angles']:aim[key]=True
  menu={'status':'passed','controls':32,'exact_order_labels_ranges_steps_options':True,'keyboard':True,'default_bindings':{'menu':'KeyM','hide':'KeyH'}}
  for report in self.validation['browsers'].values():report['native']={'message27_aim':dict(aim),'message27_menu':dict(menu)}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  native=self.validation['browsers']['firefox']['native']
  for key in ['exact_states','exact_raw_packets','source_timing','spear','jitter','strafe','valid_target_admission','session_target_reset','server_death_sends_no_commands','native_angles']:
   native['message27_aim'][key]=False;self.save()
   with self.assertRaisesRegex(ValueError,'message27.*firefox'):p.artifacts(self.root,self.out)
   native['message27_aim'][key]=True
  for group,key,value in [('message27_aim','comparison_points',1999),('message27_aim','mouse_cases',17),('message27_aim','upload_sha256','wrong'),('message27_menu','controls',31),('message27_menu','exact_order_labels_ranges_steps_options',False),('message27_menu','keyboard',False),('message27_menu','default_bindings',{'menu':'KeyH','hide':'NoKey'})]:
   previous=native[group][key];native[group][key]=value;self.save()
   with self.assertRaisesRegex(ValueError,'message27.*firefox'):p.artifacts(self.root,self.out)
   native[group][key]=previous
  native.pop('message27_aim');self.save()
  with self.assertRaisesRegex(ValueError,'message27.*firefox'):p.artifacts(self.root,self.out)

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
 def test_loot_budget_and_session_history_require_both_browsers(self):
  self.contract['features']=['bounded-fast-loot','session-mod-traffic-history','bounded-auto-build','aim-session-history-reset']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'bounded_fast_loot':True,'session_mod_traffic_history':True,'bounded_auto_build':True,'aim_session_history_reset':True}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  for key in ['bounded_fast_loot','session_mod_traffic_history','bounded_auto_build','aim_session_history_reset']:
   self.validation['browsers']['firefox']['native'][key]=False;self.save()
   with self.assertRaisesRegex(ValueError,'traffic behavior.*firefox'):p.artifacts(self.root,self.out)
   self.validation['browsers']['firefox']['native'][key]=True

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

 def test_last_source_check_runs_before_remote_write_and_can_reject_an_unchanged_tree(self):
  import subprocess
  remote=self.root/'source-guard.git'
  subprocess.run(['git','init','--quiet','--bare',str(remote)],check=True)
  subprocess.run(['git','init','--quiet',str(self.root)],check=True)
  subprocess.run(['git','remote','add','origin',str(remote)],cwd=self.root,check=True)
  first=p.publish(self.root,{'game.modded.js':b'old'})
  checks=[]
  def reject():
   checks.append(True)
   raise ValueError('source changed before push')
  for body in [b'new',b'old']:
   with self.assertRaisesRegex(ValueError,'source changed'):p.publish(self.root,{'game.modded.js':body},before_push=reject)
   self.assertEqual(subprocess.check_output(['git','rev-parse','refs/heads/updates'],cwd=remote).decode().strip(),first)
  self.assertEqual(len(checks),2)

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
  for report in self.validation['browsers'].values():report['native']={'ilm_aim':{'status':'passed','comparison_points':2400,'native_direction_ownership':True,'whole_auto_fire_cycle':True,'server_death_sends_no_commands':True}}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  for state in [False,None]:
   self.validation['browsers']['firefox']['native']['ilm_aim']['status']=state;self.save()
   with self.assertRaisesRegex(ValueError,'Original ILM.*firefox'):p.artifacts(self.root,self.out)

 def test_original_ilm_mouse_and_server_angle_require_both_browsers(self):
  self.contract['features']=['ilm-native-mouse-and-server-angle-parity']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():
   report['native']={'ilm_mouse':{'status':'passed','cases':18,'exact_target_and_sent_angle':True},'ilm_server_angle':{'status':'passed','cases':72,'actual_server_packet_angle':True,'zero_position_sentinels_ignored':True,'manual_fire_keeps_source_direction':True}}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  for name in ['ilm_mouse','ilm_server_angle']:
   report=self.validation['browsers']['firefox']['native'][name]
   report['status']='failed';self.save()
   with self.assertRaisesRegex(ValueError,'mouse and native server-angle.*firefox'):p.artifacts(self.root,self.out)
   report['status']='passed'

 def test_original_ilm_pointer_ownership_during_target_loss_is_required(self):
  self.contract['features']=['ilm-pointer-ownership-between-ticks']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'ilm_aim':{'source_pointer_ownership_on_target_loss':True}}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  self.validation['browsers']['firefox']['native']['ilm_aim']['source_pointer_ownership_on_target_loss']=False;self.save()
  with self.assertRaisesRegex(ValueError,'pointer ownership.*firefox'):p.artifacts(self.root,self.out)

 def test_coalesced_directions_require_native_idle_ping_verification(self):
  self.contract['features']=['coalesced-aim-directions']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'coalesced_aim_directions_and_native_idle':True}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  self.validation['browsers']['firefox']['native']['coalesced_aim_directions_and_native_idle']=False;self.save()
  with self.assertRaisesRegex(ValueError,'Coalesced.*firefox'):p.artifacts(self.root,self.out)

 def test_original_ilm_menu_requires_matching_controls_and_source_line_in_both_browsers(self):
  self.contract['features']=['ilm-original-menu-layout']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  keys=['exact_order_labels_ranges_steps_options','no_extra_aim_controls','source_line_color']
  for report in self.validation['browsers'].values():report['native']={'ilm_menu':dict(status='passed',**dict.fromkeys(keys,True))}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  for key in keys:
   self.validation['browsers']['firefox']['native']['ilm_menu'][key]=False;self.save()
   with self.assertRaisesRegex(ValueError,'menu layout.*firefox'):p.artifacts(self.root,self.out)
   self.validation['browsers']['firefox']['native']['ilm_menu'][key]=True

 def test_message15_source_and_numeric_proofs_are_required_in_both_browsers(self):
  self.contract['features']=['verbatim-message15-aim','message15-native-lifecycle','immediate-aim-numeric-settings']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():
   report['native']={'message15_comparison':{'status':'passed','comparison_points':1496},'message15_extra':{'status':'passed','comparison_points':5856},'message15_transport':{'status':'passed'}}
   report['physical_numeric']={'status':'passed'}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  report=self.validation['browsers']['firefox']
  for owner in [report['native']['message15_comparison'],report['native']['message15_extra'],report['native']['message15_transport'],report['physical_numeric']]:
   owner['status']='failed';self.save()
   with self.assertRaisesRegex(ValueError,'verified in browser: firefox'):p.artifacts(self.root,self.out)
   owner['status']='passed'

 def test_close_origin_diagnostics_require_both_browsers(self):
  self.contract['features']=['connection-close-origin-diagnostics']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'connection_close_origin_diagnostics':True}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  self.validation['browsers']['firefox']['native']['connection_close_origin_diagnostics']=False;self.save()
  with self.assertRaisesRegex(ValueError,'close origin.*firefox'):p.artifacts(self.root,self.out)

 def test_small_queue_admission_is_required_in_both_browsers(self):
  self.contract['features']=['aim-small-queue-admission']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'message15_transport':{'small_queue_admission':True}}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  self.validation['browsers']['firefox']['native']['message15_transport']['small_queue_admission']=False;self.save()
  with self.assertRaisesRegex(ValueError,'small-queue admission.*firefox'):p.artifacts(self.root,self.out)

 def test_immediate_message15_directions_are_required_in_each_browser(self):
  self.contract['features']=['immediate-message15-directions-and-bounded-auto-fire']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'message15_transport':{'immediate_directions':{'status':'passed'}}}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  self.validation['browsers']['firefox']['native']['message15_transport']['immediate_directions']['status']='failed';self.save()
  with self.assertRaisesRegex(ValueError,'Immediate Message15.*firefox'):p.artifacts(self.root,self.out)

 def test_efficient_target_search_requires_both_native_browsers(self):
  self.contract['features']=['equivalent-efficient-aim-target-search']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'efficient_aim_search':{'status':'passed'}}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  self.validation['browsers']['firefox']['native']['efficient_aim_search']['status']='failed';self.save()
  with self.assertRaisesRegex(ValueError,'Efficient aim target search.*firefox'):p.artifacts(self.root,self.out)

 def test_uploaded_untitled_source_requires_complete_comparison_in_each_browser(self):
  self.contract['features']=['verbatim-untitled-v4-aim']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'untitled_aim':{'status':'passed','comparison_points':1984,'native_direction_transforms':True,'native_movement_hooks':True,'whole_auto_fire_cycle':True,'server_death_sends_no_commands':True}}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  self.validation['browsers']['firefox']['native']['untitled_aim']['comparison_points']=100;self.save()
  with self.assertRaisesRegex(ValueError,'Untitled aim source comparison.*firefox'):p.artifacts(self.root,self.out)

 def test_original_ilm_requires_full_source_and_native_lifecycle_in_each_browser(self):
  self.contract['features']=['verbatim-original-ilm-aim']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'ilm_aim':{'status':'passed','comparison_points':2400,'native_direction_ownership':True,'whole_auto_fire_cycle':True,'server_death_sends_no_commands':True}}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  self.validation['browsers']['firefox']['native']['ilm_aim']['comparison_points']=50;self.save()
  with self.assertRaisesRegex(ValueError,'Original ILM source comparison.*firefox'):p.artifacts(self.root,self.out)

 def test_aim_ownership_resync_requires_both_native_browsers(self):
  self.contract['features']=['aim-pointer-ownership-resync']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'aim_ownership':{'status':'passed'}}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  self.validation['browsers']['firefox']['native']['aim_ownership']['status']='failed';self.save()
  with self.assertRaisesRegex(ValueError,'ownership resync.*firefox'):p.artifacts(self.root,self.out)

 def test_native_aim_transport_requires_heartbeat_checks_in_each_browser(self):
  self.contract['features']=['native-aim-transport-preserves-idle']
  (self.root/'mod/contract.json').write_text(json.dumps(self.contract))
  for report in self.validation['browsers'].values():report['native']={'native_aim_transport':{'status':'passed'}}
  self.save();self.assertIn('game.modded.js',p.artifacts(self.root,self.out))
  self.validation['browsers']['firefox']['native']['native_aim_transport']['status']='failed';self.save()
  with self.assertRaisesRegex(ValueError,'periodic idle packets.*firefox'):p.artifacts(self.root,self.out)

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
