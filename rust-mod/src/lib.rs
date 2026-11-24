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
    #[wasm_bindgen(catch, js_namespace = __devastRustOps, js_name = dispatchOp)]
    fn bridge_op(name: &str, a: &V, b: &V, c: &V, d: &V, e: &V, f: &V, g: &V) -> Result<V, V>;
}
fn op(name: &str, args: &[V]) -> E {
    let undefined = V::UNDEFINED;
    let arg = |index| args.get(index).unwrap_or(&undefined);
    bridge_op(name, arg(0), arg(1), arg(2), arg(3), arg(4), arg(5), arg(6)).map_err(Flow::Throw)
}
fn s(value: &str) -> V {
    V::from_str(value)
}
fn n(value: f64) -> V {
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
fn get(env: &V, name: &str) -> E {
    op("read", &[env.clone(), s(name)])
}
fn prop(object: V, key: V) -> E {
    op("get", &[object, key])
}
fn finish(result: E) -> Result<V, V> {
    match result {
        Ok(value) | Err(Flow::Return(value)) => Ok(value),
        Err(Flow::Throw(value)) => Err(value),
        Err(_) => Err(js_sys::Error::new("Unexpected loop completion").into()),
    }
}

mod generated;

#[wasm_bindgen]
pub fn dispatch(id: u32, env: V, receiver: V, args: V, callee: V) -> Result<V, V> {
    generated::dispatch(id, env, receiver, args, callee)
}

#[wasm_bindgen]
pub fn run_program(id: u32, env: V) -> Result<V, V> {
    generated::run_program(id, env)
}
