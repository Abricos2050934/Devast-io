use std::{cell::RefCell, collections::HashMap};
use wasm_bindgen::prelude::*;
type V = JsValue;
type E = Result<V, Flow>;

#[derive(Debug)]
enum Flow {
    Return(V),
    Throw(V),
    Break,
    Continue,
}
impl From<V> for Flow {
    fn from(value: V) -> Self {
        Self::Throw(value)
    }
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = __devastRustOps, js_name = functionId)]
    fn bridge_function_id(function: &V) -> i32;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = call5)]
    fn bridge_call5(function: &V, receiver: &V, a: &V, b: &V, c: &V, d: &V, e: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = call6)]
    fn bridge_call6(
        function: &V,
        receiver: &V,
        a: &V,
        b: &V,
        c: &V,
        d: &V,
        e: &V,
        f: &V,
    ) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = dispatchOp)]
    fn bridge_op(name: &str, a: &V, b: &V, c: &V, d: &V, e: &V, f: &V, g: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = read)]
    fn bridge_read(env: &V, key: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = fastGet)]
    fn bridge_get(object: &V, key: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = decl)]
    fn bridge_decl(env: &V, key: &V, kind: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = init)]
    fn bridge_init(env: &V, key: &V, value: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = fastArray)]
    fn bridge_array() -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = fastPush)]
    fn bridge_push(array: &V, value: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = fastApply)]
    fn bridge_apply(function: &V, receiver: &V, args: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = binary)]
    fn bridge_binary(operator: &V, left: &V, right: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = fastUnary)]
    fn bridge_unary(operator: &V, value: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = scope)]
    fn bridge_scope(parent: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = functionScope)]
    fn bridge_function_scope(parent: &V, receiver: &V, args: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = write)]
    fn bridge_write(env: &V, key: &V, value: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = fastSet)]
    fn bridge_set(object: &V, key: &V, value: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = deref)]
    fn bridge_deref(reference: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = putref)]
    fn bridge_putref(reference: &V, value: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = call0)]
    fn bridge_call0(function: &V, receiver: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = call1)]
    fn bridge_call1(function: &V, receiver: &V, a: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = call2)]
    fn bridge_call2(function: &V, receiver: &V, a: &V, b: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = call3)]
    fn bridge_call3(function: &V, receiver: &V, a: &V, b: &V, c: &V) -> Result<V, V>;
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = call4)]
    fn bridge_call4(function: &V, receiver: &V, a: &V, b: &V, c: &V, d: &V) -> Result<V, V>;
}
fn op(name: &str, args: &[V]) -> E {
    let undefined = V::UNDEFINED;
    let arg = |index| args.get(index).unwrap_or(&undefined);
    let result = match name {
        "call5" => bridge_call5(arg(0), arg(1), arg(2), arg(3), arg(4), arg(5), arg(6)),
        "call6" => bridge_call6(
            arg(0),
            arg(1),
            arg(2),
            arg(3),
            arg(4),
            arg(5),
            arg(6),
            arg(7),
        ),
        "read" => bridge_read(arg(0), arg(1)),
        "get" => bridge_get(arg(0), arg(1)),
        "decl" => bridge_decl(arg(0), arg(1), arg(2)),
        "init" => bridge_init(arg(0), arg(1), arg(2)),
        "array" => bridge_array(),
        "push" => bridge_push(arg(0), arg(1)),
        "apply" => bridge_apply(arg(0), arg(1), arg(2)),
        "binary" => bridge_binary(arg(0), arg(1), arg(2)),
        "unary" => bridge_unary(arg(0), arg(1)),
        "scope" => bridge_scope(arg(0)),
        "function_scope" => bridge_function_scope(arg(0), arg(1), arg(2)),
        "write" => bridge_write(arg(0), arg(1), arg(2)),
        "set" => bridge_set(arg(0), arg(1), arg(2)),
        "deref" => bridge_deref(arg(0)),
        "putref" => bridge_putref(arg(0), arg(1)),
        "call0" => bridge_call0(arg(0), arg(1)),
        "call1" => bridge_call1(arg(0), arg(1), arg(2)),
        "call2" => bridge_call2(arg(0), arg(1), arg(2), arg(3)),
        "call3" => bridge_call3(arg(0), arg(1), arg(2), arg(3), arg(4)),
        "call4" => bridge_call4(arg(0), arg(1), arg(2), arg(3), arg(4), arg(5)),
        _ => bridge_op(name, arg(0), arg(1), arg(2), arg(3), arg(4), arg(5), arg(6)),
    };
    result.map_err(Flow::Throw)
}
thread_local! {
    // Only compile-time literals enter this bounded-by-source cache. Packet
    // values and dynamic strings are never retained here.
    static STRINGS: RefCell<HashMap<&'static str,V>> = RefCell::new(HashMap::new());
    static INTEGERS: Vec<V> = (-1..=256).map(|n| V::from_f64(n as f64)).collect();
}
fn s(value: &'static str) -> V {
    STRINGS.with(|cache| {
        cache
            .borrow_mut()
            .entry(value)
            .or_insert_with(|| V::from_str(value))
            .clone()
    })
}
fn n(value: f64) -> V {
    if value >= -1.0
        && value <= 256.0
        && value.fract() == 0.0
        && !(value == 0.0 && value.is_sign_negative())
    {
        return INTEGERS.with(|values| values[(value + 1.0) as usize].clone());
    }
    V::from_f64(value)
}
fn b(value: bool) -> V {
    V::from_bool(value)
}
fn u() -> V {
    V::UNDEFINED
}
fn truth(value: &V) -> bool {
    value.is_truthy()
}
fn nullish(value: &V) -> bool {
    value.is_null() || value.is_undefined()
}
fn get(env: &V, name: &'static str) -> E {
    bridge_read(env, &s(name)).map_err(Flow::Throw)
}
fn prop(object: V, key: V) -> E {
    bridge_get(&object, &key).map_err(Flow::Throw)
}
fn finish(result: E) -> Result<V, V> {
    match result {
        Ok(value) | Err(Flow::Return(value)) => Ok(value),
        Err(Flow::Throw(value)) => Err(value),
        Err(_) => Err(js_sys::Error::new("Unexpected loop completion").into()),
    }
}
fn run_cycle(parent: &V, kind: Option<V>, run: impl FnOnce() -> E) -> E {
    if truth(&get(parent, "stopped")?) {
        return Ok(u());
    }
    let previous = get(parent, "phase")?;
    let kind = kind
        .filter(|value| !value.is_undefined())
        .unwrap_or_else(|| previous.clone());
    let _ = op("write", &[parent.clone(), s("phase"), kind.clone()])?;
    let depth = get(parent, "depth")?.as_f64().unwrap_or(f64::NAN);
    let _ = op("write", &[parent.clone(), s("depth"), n(depth + 1.0)])?;
    let environment = get(parent, "environment")?;
    if depth == 0.0 {
        let _ = op(
            "call1",
            &[
                prop(environment.clone(), s("beginCycle"))?,
                environment.clone(),
                kind,
            ],
        )?;
    }
    let completed = run();
    let depth = get(parent, "depth")?.as_f64().unwrap_or(f64::NAN) - 1.0;
    let _ = op("write", &[parent.clone(), s("depth"), n(depth)])?;
    if depth == 0.0 {
        let _ = op(
            "call0",
            &[prop(environment.clone(), s("endCycle"))?, environment],
        )?;
    }
    let _ = op("write", &[parent.clone(), s("phase"), previous])?;
    completed
}

mod frame;
mod generated;
mod motion;
mod targeting;
mod tracking;

#[wasm_bindgen]
pub fn dispatch(id: u32, env: V, receiver: V, args: V, callee: V) -> Result<V, V> {
    generated::dispatch(id, env, receiver, args, callee)
}

#[wasm_bindgen]
pub fn run_program(id: u32, env: V) -> Result<V, V> {
    generated::run_program(id, env)
}
