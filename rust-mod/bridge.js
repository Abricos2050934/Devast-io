// Generic browser/ECMAScript interop. Mod functions are compiled in generated.rs.
var __devastRustOps = (() => {
  let wasm;
  const functionIds=new WeakMap();
  const U = undefined;
  function scope(parent, fn = false) { return { parent, fn, slots: new Map(), globals: parent?.globals || globalThis }; }
  function slot(env, key) {
    for (let e = env; e; e = e.parent) if (e.slots.has(key)) return e.slots.get(key);
    return null;
  }
  function read(env, key, soft = false) {
    const found = slot(env, key);
    if (found) {
      if (!found.ready) throw new ReferenceError('Cannot access ' + key + ' before initialization');
      return found.value;
    }
    if (key in env.globals) return env.globals[key];
    if (soft) return U;
    throw new ReferenceError(key + ' is not defined');
  }
  function write(env, key, value) {
    const found = slot(env, key);
    if (!found) { env.globals[key] = value; return value; }
    if (!found.ready) throw new ReferenceError('Cannot access ' + key + ' before initialization');
    if (found.kind === 'const') throw new TypeError('Assignment to constant variable');
    found.value = value;
    return value;
  }
  function decl(env, key, kind) {
    if (kind === 'var') { while (!env.fn && env.parent) env = env.parent; }
    if (!env.slots.has(key)) env.slots.set(key, { kind, ready: kind === 'var', value: U });
  }
  function init(env, key, value) {
    const found = slot(env, key);
    if (!found) throw new ReferenceError('Missing binding ' + key);
    found.value = value; found.ready = true;
    return value;
  }
  function makefn(id, env, name, arity, arrow, async, classOnly) {
    const lexicalThis = arrow ? read(env, '@this', true) : U;
    let fn;
    if (arrow) fn = (...args) => wasm.dispatch(id, env, lexicalThis, args, fn);
    else fn = function (...args) {
      if (classOnly && !new.target) throw new TypeError('Class constructor cannot be invoked without new');
      return wasm.dispatch(id, env, this, args, fn);
    };
    Object.defineProperty(fn, 'name', { value: name || '', configurable: true });
    Object.defineProperty(fn, 'length', { value: arity, configurable: true });
    functionIds.set(fn,id);
    return fn;
  }
  function binary(code, a, c) {
    switch (code) {
      case '+': return a + c; case '-': return a - c; case '*': return a * c;
      case '/': return a / c; case '%': return a % c; case '**': return a ** c;
      case '===': return a === c; case '!==': return a !== c;
      case '==': return a == c; case '!=': return a != c;
      case '<': return a < c; case '>': return a > c; case '<=': return a <= c; case '>=': return a >= c;
      case '|': return a | c; case '&': return a & c; case '^': return a ^ c;
      case '<<': return a << c; case '>>': return a >> c; case '>>>': return a >>> c;
      case 'in': return a in c; case 'instanceof': return a instanceof c;
      default: throw new Error('Unsupported binary operation ' + code);
    }
  }
  function functionScope(parent,receiver,args) {
    const e=scope(parent,true);
    e.slots.set('@this',{kind:'var',ready:true,value:receiver});
    e.slots.set('arguments',{kind:'var',ready:true,value:args});
    return e;
  }
  function fastUnary(operator,value) {
    switch(operator){case '+':return +value;case '-':return -value;case '~':return ~value;case '!':return !value;case 'typeof':return typeof value;case 'void':return U;default:throw new Error('Unsupported unary operation');}
  }
  function deref(ref) { return ref[0] === 'name' ? read(ref[1], ref[2]) : ref[1][ref[2]]; }
  function putref(ref, value) {
    if (ref[0] === 'name') return write(ref[1], ref[2], value);
    ref[1][ref[2]] = value; return value;
  }
  function op(name, a) {
    switch (name) {
      case 'scope': return scope(a[0]);
      case 'root': { const e = scope(null, true); e.globals = a[0]; return e; }
      case 'function_scope': {
        return functionScope(a[0],a[1],a[2]);
      }
      case 'clone_scope': { const e = scope(a[0].parent, a[0].fn); for (const [k,v] of a[0].slots) e.slots.set(k, {...v}); return e; }
      case 'decl': return decl(a[0], a[1], a[2]);
      case 'init': return init(a[0], a[1], a[2]);
      case 'read': return read(a[0], a[1]);
      case 'soft_read': return read(a[0], a[1], true);
      case 'write': return write(a[0], a[1], a[2]);
      case 'get': return a[0][a[1]];
      case 'set': a[0][a[1]] = a[2]; return a[2];
      case 'ref_name': return ['name', a[0], a[1]];
      case 'ref_prop': return ['prop', a[0], a[1]];
      case 'deref': return deref(a[0]);
      case 'putref': return putref(a[0], a[1]);
      case 'update': { let value = deref(a[0]); const old = value++; if (a[1] === '--') value = old - 1; putref(a[0], value); return a[2] ? value : old; }
      case 'binary': return binary(a[0], a[1], a[2]);
      case 'unary': switch (a[0]) { case '+': return +a[1]; case '-': return -a[1]; case '~': return ~a[1]; case '!': return !a[1]; case 'typeof': return typeof a[1]; case 'void': return U; default: throw new Error('Unsupported unary operation'); }
      case 'delete': return a[0][0] === 'prop' ? delete a[0][1][a[0][2]] : false;
      case 'object': return {};
      case 'array': return [];
      case 'push': a[0].push(a[1]); return a[0];
      case 'hole': a[0].length++; return a[0];
      case 'spread': for (const v of a[1]) a[0].push(v); return a[0];
      case 'object_spread': return Object.assign(a[0], a[1]);
      case 'rest_object': { const out = {}, skip = new Set(a[1]); for (const k of Reflect.ownKeys(Object(a[0]))) if (!skip.has(k) && Object.prototype.propertyIsEnumerable.call(a[0], k)) out[k] = a[0][k]; return out; }
      case 'array_from': return Array.from(a[0]);
      case 'slice': return a[0].slice(a[1]);
      case 'define': Object.defineProperty(a[0], a[1], a[2] === 'value' ? {value:a[3], writable:true, configurable:true, enumerable:a[4]} : {[a[2]]:a[3],configurable:true,enumerable:a[4]}); return a[0];
      case 'fn': return makefn(...a);
      case 'apply': return Reflect.apply(a[0], a[1], a[2]);
      case 'new': return Reflect.construct(a[0], a[1]);
      case 'regexp': return new RegExp(a[0], a[1]);
      case 'iterator': return a[0][Symbol.iterator]();
      case 'next': return a[0].next();
      case 'close_iterator': if (typeof a[0].return === 'function') a[0].return(); return U;
      case 'keys_in': { const out=[]; for (const k in a[0]) out.push(k); return out; }
      case 'error': return new Error(a[0]);
      default: throw new Error('Unknown Rust bridge operation ' + name);
    }
  }
  function alias(env,key,getter,setter){env.slots.set(key,{kind:'var',ready:true,get value(){return getter();},set value(value){setter(value);}});}
  const dispatchOp=(name,a,b,c,d,e,f,g)=>op(name,[a,b,c,d,e,f,g]);
  return { op, dispatchOp, attach(value) { wasm = value; }, scope, read, write, decl, init, alias,
    binary,functionScope,fastUnary,deref,putref,functionId:fn=>functionIds.get(fn)??-1,
    fastGet:(object,key)=>object[key],fastSet:(object,key,value)=>{object[key]=value;return value;},
    fastArray:()=>[],fastPush:(array,value)=>{array.push(value);return array;},
    fastApply:(fn,receiver,args)=>Reflect.apply(fn,receiver,args),
    call0:(fn,receiver)=>Reflect.apply(fn,receiver,[]),
    call1:(fn,receiver,a)=>Reflect.apply(fn,receiver,[a]),
    call2:(fn,receiver,a,b)=>Reflect.apply(fn,receiver,[a,b]),
    call3:(fn,receiver,a,b,c)=>Reflect.apply(fn,receiver,[a,b,c]),
    call4:(fn,receiver,a,b,c,d)=>Reflect.apply(fn,receiver,[a,b,c,d]),
    call5:(fn,receiver,a,b,c,d,e)=>Reflect.apply(fn,receiver,[a,b,c,d,e]),
    call6:(fn,receiver,a,b,c,d,e,f)=>Reflect.apply(fn,receiver,[a,b,c,d,e,f])
  };
})();
