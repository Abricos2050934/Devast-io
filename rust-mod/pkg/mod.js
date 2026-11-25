let wasm_bindgen;
(function() {
    const __exports = {};
    let script_src;
    if (typeof document !== 'undefined' && document.currentScript !== null) {
        script_src = new URL(document.currentScript.src, location.href).toString();
    }
    let wasm = undefined;

    function isLikeNone(x) {
        return x === undefined || x === null;
    }

    let cachedDataViewMemory0 = null;

    function getDataViewMemory0() {
        if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
            cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
        }
        return cachedDataViewMemory0;
    }

    let WASM_VECTOR_LEN = 0;

    let cachedUint8ArrayMemory0 = null;

    function getUint8ArrayMemory0() {
        if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
            cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
        }
        return cachedUint8ArrayMemory0;
    }

    const cachedTextEncoder = new TextEncoder();

    if (!('encodeInto' in cachedTextEncoder)) {
        cachedTextEncoder.encodeInto = function (arg, view) {
            const buf = cachedTextEncoder.encode(arg);
            view.set(buf);
            return {
                read: arg.length,
                written: buf.length
            };
        }
    }

    function passStringToWasm0(arg, malloc, realloc) {

        if (realloc === undefined) {
            const buf = cachedTextEncoder.encode(arg);
            const ptr = malloc(buf.length, 1) >>> 0;
            getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
            WASM_VECTOR_LEN = buf.length;
            return ptr;
        }

        let len = arg.length;
        let ptr = malloc(len, 1) >>> 0;

        const mem = getUint8ArrayMemory0();

        let offset = 0;

        for (; offset < len; offset++) {
            const code = arg.charCodeAt(offset);
            if (code > 0x7F) break;
            mem[ptr + offset] = code;
        }

        if (offset !== len) {
            if (offset !== 0) {
                arg = arg.slice(offset);
            }
            ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
            const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
            const ret = cachedTextEncoder.encodeInto(arg, view);

            offset += ret.written;
            ptr = realloc(ptr, len, offset, 1) >>> 0;
        }

        WASM_VECTOR_LEN = offset;
        return ptr;
    }

    let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

    cachedTextDecoder.decode();

    function decodeText(ptr, len) {
        return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
    }

    function getStringFromWasm0(ptr, len) {
        ptr = ptr >>> 0;
        return decodeText(ptr, len);
    }

    function addToExternrefTable0(obj) {
        const idx = wasm.__externref_table_alloc();
        wasm.__wbindgen_externrefs.set(idx, obj);
        return idx;
    }

    function handleError(f, args) {
        try {
            return f.apply(this, args);
        } catch (e) {
            const idx = addToExternrefTable0(e);
            wasm.__wbindgen_exn_store(idx);
        }
    }

    const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
        ? { register: () => {}, unregister: () => {} }
        : new FinalizationRegistry(state => state.dtor(state.a, state.b));

    function makeMutClosure(arg0, arg1, dtor, f) {
        const state = { a: arg0, b: arg1, cnt: 1, dtor };
        const real = (...args) => {

            // First up with a closure we increment the internal reference
            // count. This ensures that the Rust closure environment won't
            // be deallocated while we're invoking it.
            state.cnt++;
            const a = state.a;
            state.a = 0;
            try {
                return f(a, state.b, ...args);
            } finally {
                state.a = a;
                real._wbg_cb_unref();
            }
        };
        real._wbg_cb_unref = () => {
            if (--state.cnt === 0) {
                state.dtor(state.a, state.b);
                state.a = 0;
                CLOSURE_DTORS.unregister(state);
            }
        };
        CLOSURE_DTORS.register(real, state, state);
        return real;
    }

    function takeFromExternrefTable0(idx) {
        const value = wasm.__wbindgen_externrefs.get(idx);
        wasm.__externref_table_dealloc(idx);
        return value;
    }
    /**
     * @param {number} id
     * @param {any} env
     * @param {any} receiver
     * @param {any} args
     * @param {any} callee
     * @returns {any}
     */
    __exports.dispatch = function(id, env, receiver, args, callee) {
        const ret = wasm.dispatch(id, env, receiver, args, callee);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    };

    /**
     * @param {number} id
     * @param {any} env
     * @returns {any}
     */
    __exports.run_program = function(id, env) {
        const ret = wasm.run_program(id, env);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    };

    function wasm_bindgen_8dd24b00c320514a___convert__closures_____invoke___wasm_bindgen_8dd24b00c320514a___JsValue_____(arg0, arg1, arg2) {
        wasm.wasm_bindgen_8dd24b00c320514a___convert__closures_____invoke___wasm_bindgen_8dd24b00c320514a___JsValue_____(arg0, arg1, arg2);
    }

    function wasm_bindgen_8dd24b00c320514a___convert__closures_____invoke___wasm_bindgen_8dd24b00c320514a___JsValue__wasm_bindgen_8dd24b00c320514a___JsValue_____(arg0, arg1, arg2, arg3) {
        wasm.wasm_bindgen_8dd24b00c320514a___convert__closures_____invoke___wasm_bindgen_8dd24b00c320514a___JsValue__wasm_bindgen_8dd24b00c320514a___JsValue_____(arg0, arg1, arg2, arg3);
    }

    const EXPECTED_RESPONSE_TYPES = new Set(['basic', 'cors', 'default']);

    async function __wbg_load(module, imports) {
        if (typeof Response === 'function' && module instanceof Response) {
            if (typeof WebAssembly.instantiateStreaming === 'function') {
                try {
                    return await WebAssembly.instantiateStreaming(module, imports);

                } catch (e) {
                    const validResponse = module.ok && EXPECTED_RESPONSE_TYPES.has(module.type);

                    if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                        console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                    } else {
                        throw e;
                    }
                }
            }

            const bytes = await module.arrayBuffer();
            return await WebAssembly.instantiate(bytes, imports);

        } else {
            const instance = await WebAssembly.instantiate(module, imports);

            if (instance instanceof WebAssembly.Instance) {
                return { instance, module };

            } else {
                return instance;
            }
        }
    }

    function __wbg_get_imports() {
        const imports = {};
        imports.wbg = {};
        imports.wbg.__wbg___wbindgen_is_falsy_46b8d2f2aba49112 = function(arg0) {
            const ret = !arg0;
            return ret;
        };
        imports.wbg.__wbg___wbindgen_is_function_ee8a6c5833c90377 = function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        };
        imports.wbg.__wbg___wbindgen_is_null_5e69f72e906cc57c = function(arg0) {
            const ret = arg0 === null;
            return ret;
        };
        imports.wbg.__wbg___wbindgen_is_string_fbb76cb2940daafd = function(arg0) {
            const ret = typeof(arg0) === 'string';
            return ret;
        };
        imports.wbg.__wbg___wbindgen_is_undefined_2d472862bd29a478 = function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        };
        imports.wbg.__wbg___wbindgen_jsval_eq_6b13ab83478b1c50 = function(arg0, arg1) {
            const ret = arg0 === arg1;
            return ret;
        };
        imports.wbg.__wbg___wbindgen_number_get_a20bf9b85341449d = function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        };
        imports.wbg.__wbg___wbindgen_string_get_e4f06c90489ad01b = function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        };
        imports.wbg.__wbg___wbindgen_throw_b855445ff6a94295 = function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        };
        imports.wbg.__wbg__wbg_cb_unref_2454a539ea5790d9 = function(arg0) {
            arg0._wbg_cb_unref();
        };
        imports.wbg.__wbg_atan2_d221ae92754346dd = function(arg0, arg1) {
            const ret = Math.atan2(arg0, arg1);
            return ret;
        };
        imports.wbg.__wbg_binary_532756e8dffdd0a9 = function() { return handleError(function (arg0, arg1, arg2) {
            const ret = __devastRustOps.binary(arg0, arg1, arg2);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_call0_30388dfd21bd046a = function() { return handleError(function (arg0, arg1) {
            const ret = __devastRustOps.call0(arg0, arg1);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_call1_0108b4656cd7f251 = function() { return handleError(function (arg0, arg1, arg2) {
            const ret = __devastRustOps.call1(arg0, arg1, arg2);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_call2_83e9c2c65ec1ded8 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
            const ret = __devastRustOps.call2(arg0, arg1, arg2, arg3);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_call3_67bc547544706e90 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            const ret = __devastRustOps.call3(arg0, arg1, arg2, arg3, arg4);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_call4_6a7b477cc5979eb9 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            const ret = __devastRustOps.call4(arg0, arg1, arg2, arg3, arg4, arg5);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_call5_14179e1cb096ba86 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            const ret = __devastRustOps.call5(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_call6_8cea3522a4860737 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
            const ret = __devastRustOps.call6(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_call_525440f72fbfc0ea = function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_call_e762c39fa8ea36bf = function() { return handleError(function (arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_cos_16429340393be8ae = function(arg0) {
            const ret = Math.cos(arg0);
            return ret;
        };
        imports.wbg.__wbg_decl_535f752f54f2a4ce = function() { return handleError(function (arg0, arg1, arg2) {
            const ret = __devastRustOps.decl(arg0, arg1, arg2);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_deref_0df72a47087bcdc2 = function() { return handleError(function (arg0) {
            const ret = __devastRustOps.deref(arg0);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_dispatchOp_74f3ecc5293827fb = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
            const ret = __devastRustOps.dispatchOp(getStringFromWasm0(arg0, arg1), arg2, arg3, arg4, arg5, arg6, arg7, arg8);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_fastApply_5a150c29c313f305 = function() { return handleError(function (arg0, arg1, arg2) {
            const ret = __devastRustOps.fastApply(arg0, arg1, arg2);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_fastArray_a1e03bb5bb3d7df6 = function() { return handleError(function () {
            const ret = __devastRustOps.fastArray();
            return ret;
        }, arguments) };
        imports.wbg.__wbg_fastGet_8ea092ab83004a01 = function() { return handleError(function (arg0, arg1) {
            const ret = __devastRustOps.fastGet(arg0, arg1);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_fastPush_130e552706a0ddbb = function() { return handleError(function (arg0, arg1) {
            const ret = __devastRustOps.fastPush(arg0, arg1);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_fastSet_cee9b505dd5594a5 = function() { return handleError(function (arg0, arg1, arg2) {
            const ret = __devastRustOps.fastSet(arg0, arg1, arg2);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_fastUnary_e6d9e0b0c3d24ce2 = function() { return handleError(function (arg0, arg1) {
            const ret = __devastRustOps.fastUnary(arg0, arg1);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_functionId_a18329c1c34af74d = function(arg0) {
            const ret = __devastRustOps.functionId(arg0);
            return ret;
        };
        imports.wbg.__wbg_functionScope_e4bfdab1bf1f7053 = function() { return handleError(function (arg0, arg1, arg2) {
            const ret = __devastRustOps.functionScope(arg0, arg1, arg2);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_get_7bed016f185add81 = function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        };
        imports.wbg.__wbg_hypot_05cd85926f19b8b6 = function(arg0, arg1) {
            const ret = Math.hypot(arg0, arg1);
            return ret;
        };
        imports.wbg.__wbg_init_72161cfe8454f8d3 = function() { return handleError(function (arg0, arg1, arg2) {
            const ret = __devastRustOps.init(arg0, arg1, arg2);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_isArray_96e0af9891d0945d = function(arg0) {
            const ret = Array.isArray(arg0);
            return ret;
        };
        imports.wbg.__wbg_keys_b4d27b02ad14f4be = function(arg0) {
            const ret = Object.keys(arg0);
            return ret;
        };
        imports.wbg.__wbg_length_cdd215e10d9dd507 = function(arg0) {
            const ret = arg0.length;
            return ret;
        };
        imports.wbg.__wbg_new_3c3d849046688a66 = function(arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return wasm_bindgen_8dd24b00c320514a___convert__closures_____invoke___wasm_bindgen_8dd24b00c320514a___JsValue__wasm_bindgen_8dd24b00c320514a___JsValue_____(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = new Promise(cb0);
                return ret;
            } finally {
                state0.a = state0.b = 0;
            }
        };
        imports.wbg.__wbg_new_a7442b4b19c1a356 = function(arg0, arg1) {
            const ret = new Error(getStringFromWasm0(arg0, arg1));
            return ret;
        };
        imports.wbg.__wbg_new_no_args_ee98eee5275000a4 = function(arg0, arg1) {
            const ret = new Function(getStringFromWasm0(arg0, arg1));
            return ret;
        };
        imports.wbg.__wbg_putref_0770c52efd758403 = function() { return handleError(function (arg0, arg1) {
            const ret = __devastRustOps.putref(arg0, arg1);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_queueMicrotask_34d692c25c47d05b = function(arg0) {
            const ret = arg0.queueMicrotask;
            return ret;
        };
        imports.wbg.__wbg_queueMicrotask_9d76cacb20c84d58 = function(arg0) {
            queueMicrotask(arg0);
        };
        imports.wbg.__wbg_read_01779dc023991546 = function() { return handleError(function (arg0, arg1) {
            const ret = __devastRustOps.read(arg0, arg1);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_resolve_caf97c30b83f7053 = function(arg0) {
            const ret = Promise.resolve(arg0);
            return ret;
        };
        imports.wbg.__wbg_scope_41bdee8e6dfbf795 = function() { return handleError(function (arg0) {
            const ret = __devastRustOps.scope(arg0);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_sin_8919decb200bcf3a = function(arg0) {
            const ret = Math.sin(arg0);
            return ret;
        };
        imports.wbg.__wbg_sqrt_81ab5572290d8a3b = function(arg0) {
            const ret = Math.sqrt(arg0);
            return ret;
        };
        imports.wbg.__wbg_static_accessor_GLOBAL_89e1d9ac6a1b250e = function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        };
        imports.wbg.__wbg_static_accessor_GLOBAL_THIS_8b530f326a9e48ac = function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        };
        imports.wbg.__wbg_static_accessor_SELF_6fdf4b64710cc91b = function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        };
        imports.wbg.__wbg_static_accessor_WINDOW_b45bfc5a37f6cfa2 = function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        };
        imports.wbg.__wbg_then_4f46f6544e6b4a28 = function(arg0, arg1) {
            const ret = arg0.then(arg1);
            return ret;
        };
        imports.wbg.__wbg_then_70d05cf780a18d77 = function(arg0, arg1, arg2) {
            const ret = arg0.then(arg1, arg2);
            return ret;
        };
        imports.wbg.__wbg_write_d3016624d9d47b89 = function() { return handleError(function (arg0, arg1, arg2) {
            const ret = __devastRustOps.write(arg0, arg1, arg2);
            return ret;
        }, arguments) };
        imports.wbg.__wbindgen_cast_2241b6af4c4b2941 = function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        };
        imports.wbg.__wbindgen_cast_7a9218f878f4eac5 = function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { dtor_idx: 19, function: Function { arguments: [Externref], shim_idx: 20, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm.wasm_bindgen_8dd24b00c320514a___closure__destroy___dyn_core_d941ad8722425d2e___ops__function__FnMut__wasm_bindgen_8dd24b00c320514a___JsValue____Output_______, wasm_bindgen_8dd24b00c320514a___convert__closures_____invoke___wasm_bindgen_8dd24b00c320514a___JsValue_____);
            return ret;
        };
        imports.wbg.__wbindgen_cast_d6cd19b81560fd6e = function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        };
        imports.wbg.__wbindgen_init_externref_table = function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
            ;
        };

        return imports;
    }

    function __wbg_finalize_init(instance, module) {
        wasm = instance.exports;
        __wbg_init.__wbindgen_wasm_module = module;
        cachedDataViewMemory0 = null;
        cachedUint8ArrayMemory0 = null;


        wasm.__wbindgen_start();
        return wasm;
    }

    function initSync(module) {
        if (wasm !== undefined) return wasm;


        if (typeof module !== 'undefined') {
            if (Object.getPrototypeOf(module) === Object.prototype) {
                ({module} = module)
            } else {
                console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
            }
        }

        const imports = __wbg_get_imports();

        if (!(module instanceof WebAssembly.Module)) {
            module = new WebAssembly.Module(module);
        }

        const instance = new WebAssembly.Instance(module, imports);

        return __wbg_finalize_init(instance, module);
    }

    async function __wbg_init(module_or_path) {
        if (wasm !== undefined) return wasm;


        if (typeof module_or_path !== 'undefined') {
            if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
                ({module_or_path} = module_or_path)
            } else {
                console.warn('using deprecated parameters for the initialization function; pass a single object instead')
            }
        }

        if (typeof module_or_path === 'undefined' && typeof script_src !== 'undefined') {
            module_or_path = script_src.replace(/\.js$/, '_bg.wasm');
        }
        const imports = __wbg_get_imports();

        if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
            module_or_path = fetch(module_or_path);
        }

        const { instance, module } = await __wbg_load(await module_or_path, imports);

        return __wbg_finalize_init(instance, module);
    }

    wasm_bindgen = Object.assign(__wbg_init, { initSync }, __exports);

})();
