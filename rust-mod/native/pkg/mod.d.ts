declare namespace wasm_bindgen {
	/* tslint:disable */
	/* eslint-disable */
	export function dispatch(id: number, env: any, receiver: any, args: any, callee: any): any;
	export function run_program(id: number, env: any): any;
	
}

declare type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

declare interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly dispatch: (a: number, b: any, c: any, d: any, e: any) => [number, number, number];
  readonly run_program: (a: number, b: any) => [number, number, number];
  readonly wasm_bindgen_14e4876b1f393bc___convert__closures_____invoke___wasm_bindgen_14e4876b1f393bc___JsValue_____: (a: number, b: number, c: any) => void;
  readonly wasm_bindgen_14e4876b1f393bc___closure__destroy___dyn_core_d941ad8722425d2e___ops__function__FnMut__wasm_bindgen_14e4876b1f393bc___JsValue____Output_______: (a: number, b: number) => void;
  readonly wasm_bindgen_14e4876b1f393bc___convert__closures_____invoke___wasm_bindgen_14e4876b1f393bc___JsValue__wasm_bindgen_14e4876b1f393bc___JsValue_____: (a: number, b: number, c: any, d: any) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
declare function wasm_bindgen (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
