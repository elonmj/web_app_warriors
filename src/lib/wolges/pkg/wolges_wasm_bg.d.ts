/* Hand-written types for the wasm-bindgen JS glue (bundler target).
 * Only the surface we use is declared; the __wbg_* import shims are
 * accessed by the wasm module itself, not by our code. */

export function analyze(req_str: string): Promise<string>;
export function play_score(req_str: string): string;
export function do_this_on_startup(): void;
export function precache_kwg(key: string, value: Uint8Array): void;
export function precache_klv(key: string, value: Uint8Array): void;
export function precache_kbwg(key: string, value: Uint8Array): void;
export function __wbg_set_wasm(val: unknown): void;
