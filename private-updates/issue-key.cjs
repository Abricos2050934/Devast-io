// Issued JSON files contain bearer keys: keep them out of Git and public URLs.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const defaultDirectory = path.resolve(__dirname, '..', '.private-updates');
function issue({endpoint, name, directory = defaultDirectory}) {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/' || (url.port && url.port !== '443')) throw new Error('Use an HTTPS server origin without credentials or a path');
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,48}$/.test(name)) throw new Error('Use a short name with letters, digits, - or _');
  fs.mkdirSync(directory, {recursive: true, mode: 0o700});
  const manifestPath = path.join(directory, 'licenses.json');
  const licenses = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
  if (Object.values(licenses).some(record => record.label === name)) throw new Error('This name already has a key');
  const filename = path.join(directory, 'Devast-private-' + name + '.json');
  if (fs.existsSync(filename)) throw new Error('Import file already exists');
  const key = 'dvu_' + crypto.randomBytes(32).toString('base64url');
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const loader = fs.readFileSync(path.join(__dirname, 'loader-template.js'), 'utf8')
    .replace('__ENDPOINT__', JSON.stringify(url.origin)).replace('__ACCESS_KEY__', JSON.stringify(key));
  const config = {v: 1, data: [{id: 'd1', matchUrl: 'https://devast.io/*', on: true,
    rules: [{type: 'fileOverride', match: '**://devast.io/js/*.js', file: loader.replace(/\n/g, '\r\n'), fileId: 'f1', on: true}]}]};
  licenses[hash] = {label: name, enabled: true, createdAt: new Date().toISOString()};
  // Save the server record first. Never silently overwrite an already issued file.
  fs.writeFileSync(manifestPath, JSON.stringify(licenses, null, 2) + '\n', {mode: 0o600});
  fs.chmodSync(manifestPath, 0o600);
  fs.writeFileSync(filename, JSON.stringify(config, null, 2) + '\n', {mode: 0o600, flag: 'wx'});
  return {file: filename, licenses: manifestPath, name};
}
function revoke({name, directory = defaultDirectory}) {
  const filename = path.join(directory, 'licenses.json'), records = JSON.parse(fs.readFileSync(filename, 'utf8'));
  const record = Object.values(records).find(record => record.label === name);
  if (!record) throw new Error('Unknown key name');
  record.enabled = false;
  fs.writeFileSync(filename, JSON.stringify(records, null, 2) + '\n', {mode: 0o600});
  return {name, licenses: filename, enabled: false};
}
if (require.main === module) {
  const args = process.argv.slice(2), command = args.shift(), options = {};
  while (args.length) {
    const key = args.shift(), value = args.shift();
    if (!['--endpoint', '--name'].includes(key) || !value) throw new Error('Use issue --endpoint https://host --name NAME, or revoke --name NAME');
    options[key.slice(2)] = value;
  }
  if (!['issue', 'revoke'].includes(command)) throw new Error('Use issue or revoke');
  console.log(JSON.stringify(command === 'issue' ? issue(options) : revoke(options)));
}
module.exports = {issue, revoke};
