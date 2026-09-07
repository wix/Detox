/**
 * `device.appLaunchArgs` — a port of Detox 20's `LaunchArgsEditor`
 * (`src/devices/runtime/utils/LaunchArgsEditor.js` +
 * `ScopedLaunchArgsEditor.js` + `Storage.js`), with its measured semantics
 * kept verbatim (spec 006's compat mapping):
 *
 *  - @issue DTX-4034: `modify`/`reset` act on the local scope only; `shared`
 *    is its own scope, and `get()` deep-merges shared ← local with local
 *    winning (v20 `_.merge`).
 *  - @issue DTX-4038: `get()`'s merge follows lodash's array behaviour, which
 *    merges index-wise rather than replacing.
 *  - @issue DTX-4035: a `null`/`undefined` value deletes the key rather than
 *    storing it (v20 `Storage.set`), so `modify({a: undefined})` is a
 *    delete, not a set.
 *  - @issue DTX-4036: `get()` hands back a deep clone (v20 `_.cloneDeep`) —
 *    a caller mutating the result must not reach into the editor's own state.
 *  - `modify`/`reset` return the editor, so v20's chained
 *    `device.appLaunchArgs.reset().modify({...})` keeps working.
 *
 * It lives in compat and never in the client: a synchronous accessor is
 * never a wire call, and the v21 API takes launch arguments as an explicit
 * parameter instead of accumulating them in device state.
 *
 * `lodash` is not a dependency of this workspace, so `merge`/`cloneDeep` are
 * reimplemented here to lodash's own semantics for the values launch args
 * can hold: plain objects and arrays recurse (arrays index-wise).
 * Arrays clone rather than alias; `RegExp`/`Date` are cloned rather than shared (a
 * `detoxURLBlacklistRegex` value is a RegExp by design); everything else rides as-is.
 */

/** What a launch-arg map may hold: v20 stores whatever it is handed. */
export type LaunchArgValue = unknown;
export type LaunchArgs = Record<string, LaunchArgValue>;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

/** `_.cloneDeep` for the value kinds a launch arg can hold. */
function cloneDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return (value as unknown[]).map((item) => cloneDeep(item)) as unknown as T;
  }
  if (value instanceof RegExp) return new RegExp(value.source, value.flags) as unknown as T;
  if (value instanceof Date) return new Date(value.getTime()) as unknown as T;
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) out[key] = cloneDeep(value[key]);
    return out as T;
  }
  return value;
}

/**
 * `_.merge`: plain objects merge recursively, arrays merge index-wise (a
 * shorter local array does not truncate the shared one), everything else
 * replaces.
 */
function mergeDeep(target: LaunchArgs, source: LaunchArgs): LaunchArgs {
  for (const key of Object.keys(source)) {
    const incoming = source[key];
    // `_.merge` skips undefined sources, keeping the target's value.
    if (incoming === undefined) continue;
    const existing = target[key];
    if (isPlainObject(existing) && isPlainObject(incoming)) {
      mergeDeep(existing, incoming);
    } else if (Array.isArray(existing) && Array.isArray(incoming)) {
      mergeArrays(existing, incoming);
    } else {
      target[key] = cloneDeep(incoming);
    }
  }
  return target;
}

/** `_.merge`'s array rule: element by element, longer target survives. */
function mergeArrays(target: unknown[], source: readonly unknown[]): unknown[] {
  source.forEach((incoming, index) => {
    if (incoming === undefined) return;
    const existing = target[index];
    if (isPlainObject(existing) && isPlainObject(incoming)) {
      mergeDeep(existing, incoming);
    } else if (Array.isArray(existing) && Array.isArray(incoming)) {
      mergeArrays(existing, incoming);
    } else {
      target[index] = cloneDeep(incoming);
    }
  });
  return target;
}

/** One scope of launch args (v20 `ScopedLaunchArgsEditor` over `Storage`). */
export class ScopedLaunchArgsEditor {
  #map: LaunchArgs = {};

  get(): LaunchArgs {
    return cloneDeep(this.#map);
  }

  reset(): this {
    this.#map = {};
    return this;
  }

  modify(launchArgs?: LaunchArgs | null): this {
    // v20 `Storage.assign` short-circuits on an empty map — including on
    // `undefined`, which `selectApp` hands it for an app that declares none.
    if (launchArgs === undefined || launchArgs === null) return this;
    for (const key of Object.keys(launchArgs)) {
      const value = launchArgs[key];
      // `value != null` — null and undefined both delete (v20 `Storage.set`).
      if (value === undefined || value === null) delete this.#map[key];
      else this.#map[key] = value;
    }
    return this;
  }
}

/** v20's two-scope editor: `device.appLaunchArgs` with its `.shared` sibling. */
export class LaunchArgsEditor {
  readonly #local = new ScopedLaunchArgsEditor();
  readonly #shared = new ScopedLaunchArgsEditor();

  get shared(): ScopedLaunchArgsEditor {
    return this.#shared;
  }

  modify(launchArgs?: LaunchArgs | null): this {
    this.#local.modify(launchArgs);
    return this;
  }

  reset(): this {
    this.#local.reset();
    return this;
  }

  get(): LaunchArgs {
    return mergeDeep(this.#shared.get(), this.#local.get());
  }
}
