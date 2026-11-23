// Generate a source-inspection copy without changing the verified runtime file.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { js: beautify } = require('js-beautify');
const parser = require('./parser.cjs');

const root = path.resolve(__dirname, '..');
const input = path.join(root, 'dist/game.modded.js');
const output = path.join(root, 'dist/game.modded.readable.js');
const original = fs.readFileSync(input, 'utf8');
// The game uses Unicode identifiers outside the formatter's identifier table.
// Give those tokens temporary ASCII names, then restore their exact spelling.
const names = new Map();
let prefix = '__r';
while (original.includes(prefix)) prefix += '_';
function rewriteNames(source, protect) {
  const parts = [];
  let end = 0;
  for (const token of parser.tokenizer(source, { ecmaVersion: 'latest' })) {
    if (token.type.label !== 'name') continue;
    const raw = source.slice(token.start, token.end);
    let replacement;
    if (protect && /[^\x00-\x7f]/.test(raw)) {
      replacement = prefix + names.size.toString(36);
      names.set(replacement, raw);
    } else if (!protect) replacement = names.get(raw);
    if (replacement === undefined) continue;
    parts.push(source.slice(end, token.start), replacement);
    end = token.end;
  }
  parts.push(source.slice(end));
  return parts.join('');
}
const readable = rewriteNames(beautify(rewriteNames(original, true), {
  indent_size: 2,
  indent_char: ' ',
  preserve_newlines: true,
  max_preserve_newlines: 2,
  wrap_line_length: 110,
  end_with_newline: true,
  unescape_strings: false,
  break_chained_methods: true,
}), false);

function syntaxHash(source) {
  const tree = parser.parse(source, { ecmaVersion: 'latest', sourceType: 'script' });
  const syntax = JSON.stringify(tree, (key, value) => {
    if (key === 'start' || key === 'end') return undefined;
    return typeof value === 'bigint' ? { bigint: value.toString() } : value;
  });
  return crypto.createHash('sha256').update(syntax).digest('hex');
}

function tokenHash(source) {
  const hash = crypto.createHash('sha256');
  for (const token of parser.tokenizer(source, { ecmaVersion: 'latest' })) {
    hash.update(JSON.stringify([token.type.label, source.slice(token.start, token.end)]));
  }
  return hash.digest('hex');
}

assert.equal(tokenHash(readable), tokenHash(original), 'Formatting changed JavaScript tokens');
assert.equal(syntaxHash(readable), syntaxHash(original), 'Formatting changed JavaScript syntax');
fs.writeFileSync(output + '.tmp', readable);
fs.renameSync(output + '.tmp', output);
console.log(JSON.stringify({
  file: path.relative(root, output),
  lines: readable.split('\n').length,
  bytes: Buffer.byteLength(readable),
  syntax: 'equivalent',
  purpose: 'source inspection; runtime checks use dist/game.modded.js',
}));
