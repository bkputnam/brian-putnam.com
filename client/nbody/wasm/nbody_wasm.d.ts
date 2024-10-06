/* tslint:disable */
/* eslint-disable */
/**
* @param {number} num_bodies
* @param {number} side_len
* @returns {Universe}
*/
export function start_simulation(num_bodies: number, side_len: number): Universe;
/**
*/
export class Universe {
  free(): void;
/**
* @param {number} num_bodies
* @param {number} side_len
* @returns {Universe}
*/
  static new(num_bodies: number, side_len: number): Universe;
/**
* @param {number} n
*/
  step_n(n: number): void;
/**
* @returns {number}
*/
  get_positions(): number;
/**
* @returns {number}
*/
  get_masses(): number;
/**
* @returns {number}
*/
  get_num_bodies(): number;
/**
* @returns {number}
*/
  get_side_len(): number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly start_simulation: (a: number, b: number) => number;
  readonly __wbg_universe_free: (a: number, b: number) => void;
  readonly universe_new: (a: number, b: number) => number;
  readonly universe_step_n: (a: number, b: number) => void;
  readonly universe_get_positions: (a: number) => number;
  readonly universe_get_masses: (a: number) => number;
  readonly universe_get_num_bodies: (a: number) => number;
  readonly universe_get_side_len: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
