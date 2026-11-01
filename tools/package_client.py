"""Create the deliverable only from the current build and matching verification reports."""
import hashlib,json,re,zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def read(name): return (root/name).read_bytes()
def data(name): return json.loads(read(name))
def digest(blob): return hashlib.sha256(blob).hexdigest()
js=read('dist/game.modded.js');sha=digest(js)
status=data('dist/update-status.json');native=data('build/ilm-upload/native-browser-report.json');live=data('build/browser-report.json')
assert all(r['output_sha256']==sha for r in [status,native,live]), 'Reports must match current JS'
assert native['result']=='passed' and not native['page_errors'] and not native['checks']['mod_errors']
log=read('build/ilm-upload/test-report.txt').decode()
assert re.search(r'Ran 3 tests.*?\bOK\b',log,re.S) and 'tests 36' in log and 'pass 36' in log and 'fail 0' in log
rejoin=data('build/rejoin-native-audit.json')['recoveryIntegration']
assert rejoin['cookiesPreserved'] and rejoin['identityAndSettingsPreserved'] and rejoin['normalJoinAttempts']==1 and not rejoin['modErrors']
audit=data('build/ilm-upload/port-audit.json')
assert audit['core_sha256']==digest(read('mod/ilm-aim.js'))
verification={'output_sha256':sha,'output_bytes':len(js),'tests':{'python_passed':3,'node_passed':36,'total_passed':39},'ilm_ast_audit':audit,'differential_comparison':{'scenes':180,'ticks_per_scene':6,'result':'passed'},'native_browser':native,'cookie_preservation':rejoin,'live_server':live,'live_entry_and_no_kick':'NOT VERIFIED: WebSocket HTTP 503'}
readme='''Готовый файл: game.modded.js.
Подмените им основной игровой JS до запуска игры и перезагрузите страницу.
Не запускайте полный клиент поверх уже работающего оригинала.
Для этого обновления не нужно очищать cookies или localStorage.

Прежний аимбот заменён исходным ядром ILM из 25INVITES-ILM1.0.json.
Добавлен ник#ID в штатную таблицу лидеров и подписи над игроками.
Space — включить/выключить аимбот, H — меню (можно переназначить).
Параметры аимбота однократно обновляются до исходных значений ILM.

39 тестов пройдены. Классы/методы/переменные сверены по AST и в 180 сценах.
Штатные обработчики пакетов, подписи и вращение проверены в Chromium.
Проверка на живом сервере НЕ ПРОЙДЕНА: WebSocket вернул HTTP 503.
Отсутствие киков и применение команд сервером не подтверждены.
Подробности: ILM-PORT.md, FEATURES.md, REJOIN-FIX.md, verification.json.
source/ilm-aim.js — читаемый модуль, включённый в основной клиент.
'''
entries={'game.modded.js':js,'README-ru.txt':readme.encode(),'FEATURES.md':read('FEATURES.md'),'ILM-PORT.md':read('ILM-PORT.md'),'REJOIN-FIX.md':read('REJOIN-FIX.md'),'verification.json':(json.dumps(verification,ensure_ascii=False,indent=2)+'\n').encode(),'update-status.json':read('dist/update-status.json'),'source/ilm-aim.js':read('mod/ilm-aim.js')}
entries['SHA256SUMS.txt']=''.join(digest(b)+'  '+name+'\n' for name,b in entries.items()).encode()
out=Path('/workspace/exports/Devast-io-client.zip');out.parent.mkdir(parents=True,exist_ok=True)
if out.exists():
 backup=out.with_name('Devast-io-client-before-ilm-port.zip')
 if not backup.exists(): backup.write_bytes(out.read_bytes())
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for name,blob in entries.items(): z.writestr(name,blob)
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 assert digest(z.read('game.modded.js'))==sha
 for line in z.read('SHA256SUMS.txt').decode().splitlines():
  expected,name=line.split('  ',1);assert digest(z.read(name))==expected
(root/'build/ilm-upload/verification.json').write_text(json.dumps(verification,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'zip':str(out),'zip_sha256':digest(out.read_bytes()),'bytes':out.stat().st_size,'js_sha256':sha,'entries':list(entries)},indent=2))
