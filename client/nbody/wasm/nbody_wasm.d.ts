/* tslint:disable */
/* eslint-disable */
/**
 * @param {number} num_bodies
 * @returns {Universe}
 */
export function start_simulation(num_bodies: number): Universe;
/**
 * @param {number} num_threads
 * @returns {Promise<any>}
 */
export function initThreadPool(num_threads: number): Promise<any>;
/**
 * @param {number} receiver
 */
export function wbg_rayon_start_worker(receiver: number): void;
export class Universe {
  free(): void;
  /**
   * @param {number} num_bodies
   * @returns {Universe}
   */
  static new(num_bodies: number): Universe;
  init(): void;
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
  get_velocities(): number;
  /**
   * @returns {number}
   */
  get_num_bodies(): number;
}
export class wbg_rayon_PoolBuilder {
  free(): void;
  /**
   * @returns {number}
   */
  numThreads(): number;
  /**
   * @returns {number}
   */
  receiver(): number;
  build(): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly __wbg_universe_free: (a: number, b: number) => void;
  readonly universe_new: (a: number) => number;
  readonly universe_init: (a: number) => void;
  readonly universe_step_n: (a: number, b: number) => void;
  readonly universe_get_positions: (a: number) => number;
  readonly universe_get_masses: (a: number) => number;
  readonly universe_get_velocities: (a: number) => number;
  readonly universe_get_num_bodies: (a: number) => number;
  readonly start_simulation: (a: number) => number;
  readonly __wbg_wbg_rayon_poolbuilder_free: (a: number, b: number) => void;
  readonly wbg_rayon_poolbuilder_numThreads: (a: number) => number;
  readonly wbg_rayon_poolbuilder_receiver: (a: number) => number;
  readonly wbg_rayon_poolbuilder_build: (a: number) => void;
  readonly initThreadPool: (a: number) => number;
  readonly wbg_rayon_start_worker: (a: number) => void;
  readonly memory: WebAssembly.Memory;
  readonly __wbindgen_export_1: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_thread_destroy: (a?: number, b?: number, c?: number) => void;
  readonly __wbindgen_start: (a: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput, memory?: WebAssembly.Memory, thread_stack_size?: number }} module - Passing `SyncInitInput` directly is deprecated.
* @param {WebAssembly.Memory} memory - Deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput, memory?: WebAssembly.Memory, thread_stack_size?: number } | SyncInitInput, memory?: WebAssembly.Memory): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput>, memory?: WebAssembly.Memory, thread_stack_size?: number }} module_or_path - Passing `InitInput` directly is deprecated.
* @param {WebAssembly.Memory} memory - Deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput>, memory?: WebAssembly.Memory, thread_stack_size?: number } | InitInput | Promise<InitInput>, memory?: WebAssembly.Memory): Promise<InitOutput>;
