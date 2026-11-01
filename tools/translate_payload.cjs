const {tokenizer} = require('./parser.cjs');
function translate(source, symbols) {
  const edits = [];
  for (const token of tokenizer(source, {ecmaVersion:'latest'})) {
    if (!Object.hasOwn(symbols, token.value)) continue;
    if (token.type.label === 'name') edits.push({...token, replacement:symbols[token.value]});
    if (token.type.label === 'string') edits.push({...token, replacement:JSON.stringify(symbols[token.value])});
  }
  const parts=[];let cursor=0;
  for(const edit of edits){parts.push(source.slice(cursor,edit.start),edit.replacement);cursor=edit.end;}
  parts.push(source.slice(cursor));
  return parts.join('');
}
module.exports = {translate};
