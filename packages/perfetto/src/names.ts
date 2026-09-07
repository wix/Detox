/**
 * Human names for slices (spec 012a). Everything here is derived from
 * what the line already carries — `params` on an rpc begin, `result`
 * on its end — never from narration prose. A shape this file does not
 * recognise falls back to the node's own name, so an unknown verb is never
 * hidden, only plain.
 */

type Dict = Record<string, unknown>;

function isDict(value: unknown): value is Dict {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function short(hex: string): string {
  return hex.length > 12 ? `${hex.slice(0, 12)}…` : hex;
}

/** `"text"` for a literal, `/re/` for a regex, JSON for anything else. */
function literal(value: unknown, isRegex?: unknown): string {
  if (typeof value === 'string') return isRegex === true ? value : JSON.stringify(value);
  return JSON.stringify(value) ?? String(value);
}

/**
 * The frozen native matcher dialect, rendered the way a tester wrote it:
 * `by.id("x")`, `by.text(/re/)`, `by.type("RCTView")`, `by.traits(["button"])`,
 * `by.id("a").withAncestor(by.id("b"))`, `by.id("a").and(by.text("t"))`.
 */
export function describeMatcher(predicate: unknown): string {
  if (!isDict(predicate)) return '?';
  const type = str(predicate.type);
  switch (type) {
    case 'id':
    case 'text':
    case 'label':
    case 'value':
      return `by.${type}(${literal(predicate.value, predicate.isRegex)})`;
    case 'type':
      return `by.type(${literal(predicate.value)})`;
    case 'traits':
      return `by.traits(${JSON.stringify(predicate.value) ?? '?'})`;
    case 'ancestor':
      return `.withAncestor(${describeMatcher(predicate.predicate)})`;
    case 'descendant':
      return `.withDescendant(${describeMatcher(predicate.predicate)})`;
    case 'and': {
      const parts = Array.isArray(predicate.predicates) ? predicate.predicates.map(describeMatcher) : [];
      // `by.id("a").withAncestor(...)` reads better than `.and(...)` when a part is a relation.
      return parts.reduce<string>((acc, part) => (acc === '' ? part : part.startsWith('.') ? `${acc}${part}` : `${acc}.and(${part})`), '');
    }
    default:
      return type === undefined ? '?' : `by.${type}(${literal(predicate.value)})`;
  }
}

function describeArgs(params: unknown): string {
  if (!Array.isArray(params) || params.length === 0) return '';
  const shown = params.filter((p) => p !== null && p !== undefined).map((p) => (typeof p === 'string' ? JSON.stringify(p) : (JSON.stringify(p) ?? '?')));
  return shown.length > 0 ? `(${shown.join(', ')})` : '';
}

/**
 * `tap by.id("x")`, `swipe("down", "fast", 0.7) by.text("Index").atIndex(0)`,
 * `expect by.text("x") toBeVisible`, `expect by.id("x") not.toExist`,
 * `waitFor by.id("x") toBeVisible within 3000ms`, `waitFor by.id("x")
 * toBeVisible while scroll("down", 50) by.id("list")`.
 */
export function describeInvocation(invocation: unknown): string | undefined {
  if (!isDict(invocation)) return undefined;
  const target = (inv: Dict): string => {
    let matcher = describeMatcher(inv.predicate);
    if (typeof inv.atIndex === 'number') matcher += `.atIndex(${String(inv.atIndex)})`;
    return matcher;
  };
  const modifiers = Array.isArray(invocation.modifiers) ? invocation.modifiers.filter((m): m is string => typeof m === 'string') : [];
  const prefix = modifiers.length > 0 ? `${modifiers.join('.')}.` : '';
  const type = str(invocation.type);
  if (type === 'action') {
    const action = str(invocation.action) ?? 'action';
    const head = `${action}${describeArgs(invocation.params)} ${target(invocation)}`;
    if (isDict(invocation.while)) {
      const w = invocation.while;
      return `waitFor ${target(w)} ${prefix}${str(w.expectation) ?? '?'} while ${head}`;
    }
    return head;
  }
  if (type === 'expectation') {
    const expectation = `${prefix}${str(invocation.expectation) ?? '?'}${describeArgs(invocation.params)}`;
    if (typeof invocation.timeout === 'number') return `waitFor ${target(invocation)} ${expectation} within ${String(invocation.timeout)}ms`;
    return `expect ${target(invocation)} ${expectation}`;
  }
  return undefined;
}

/** The allocation query as a tester would read it: `iPhone 17 Pro`, `udid ABCD…`, `"my sim"`. */
export function describeDeviceQuery(request: unknown): string | undefined {
  if (!isDict(request)) return undefined;
  const device = isDict(request.device) ? request.device : undefined;
  if (!device) return str(request.type);
  // `id` is the wire's own key (the client maps the public `deviceId` onto it); the others are older spellings.
  const byId = str(device.id) ?? str(device.deviceId) ?? str(device.byId) ?? str(device.udid);
  if (byId !== undefined) return `udid ${byId}`;
  return str(device.type) ?? str(device.name) ?? str(request.type);
}

/** The name an rpc slice wears. `method` and `params` stay in `args`; this only reads them. */
export function describeRpc(method: string, params: unknown): string {
  const p = isDict(params) ? params : undefined;
  switch (method) {
    case 'invoke':
      return describeInvocation(p?.invocation) ?? method;
    case 'allocateDevice': {
      const query = describeDeviceQuery(params);
      return query === undefined ? method : `${method} ${query}`;
    }
    case 'installApp': {
      const appId = str(p?.appId);
      const blob = isDict(p?.blob) ? str(p.blob.hex) : undefined;
      return appId !== undefined ? `${method} ${appId}` : blob !== undefined ? `${method} sha256/${short(blob)}` : method;
    }
    case 'launchApp':
    case 'terminateApp':
    case 'uninstallApp': {
      const appId = str(p?.appId);
      return appId !== undefined ? `${method} ${appId}` : method;
    }
    default:
      return method;
  }
}

/** How much of a spawn's command line a row shows before `…` (the file keeps all of it). */
const SPAWN_NAME_MAX = 96;

/** A token as a shell would need it typed: bare when plain, quoted when not. */
function shellToken(token: string): string {
  return /^[A-Za-z0-9_@%+=:,./-]+$/.test(token) ? token : JSON.stringify(token);
}

/**
 * A spawned child as the command that ran (spec 013): `applesimutils --list
 * --byType "iPhone 17 Pro"`, `simctl launch <udid> com.x …` — the argv the
 * file stores, its interpreter dropped (`/usr/bin/xcrun simctl` reads
 * `simctl`), capped so a launch's long argv does not swallow the row. A
 * child with no argv (a progress sub-operation, `boot`) keeps its name.
 */
export function describeSpawn(fields: Dict | undefined, fallback: string): string {
  const argv = Array.isArray(fields?.argv) ? fields.argv.filter((t): t is string => typeof t === 'string') : [];
  if (argv.length === 0) return fallback;
  const [file, ...args] = argv;
  const base = file.slice(file.lastIndexOf('/') + 1);
  const words = base === 'xcrun' && args.length > 0 ? args : [base, ...args];
  const text = words.map(shellToken).join(' ');
  return text.length > SPAWN_NAME_MAX ? `${text.slice(0, SPAWN_NAME_MAX - 1)}…` : text;
}

/**
 * What a node's end adds to its name: `✗` with the wire code, a failed
 * child's `exit 149` / `SIGTERM`, a step's `skipped` / `aborted`, a
 * synthesized end's reason — and, for the two verbs that mint handles,
 * what they minted (`→ FD83…`, `→ pid 4242`): the udid is what "which
 * simulator was that" asks for.
 */
export function describeOutcome(method: string | undefined, end: Dict | undefined): string {
  if (end === undefined) return '';
  const parts: string[] = [];
  const status = str(end.status);
  const result = isDict(end.result) ? end.result : undefined;
  if (end.ok === false) {
    const error = isDict(end.error) ? end.error : undefined;
    const code = typeof error?.code === 'number' ? ` ${String(error.code)}` : '';
    parts.push(`✗${code}`);
    if (typeof end.exitCode === 'number' && end.exitCode !== 0) parts.push(`exit ${String(end.exitCode)}`);
    if (typeof end.signal === 'string') parts.push(end.signal);
    if (status === 'aborted') parts.push('aborted');
    if (typeof end.reason === 'string') parts.push(end.reason);
  } else if (status === 'skipped') {
    parts.push('○ skipped');
  }
  if (result !== undefined) {
    if (method === 'allocateDevice' && typeof result.udid === 'string') parts.push(`→ ${result.udid}`);
    if (method === 'launchApp' && typeof result.pid === 'number') parts.push(`→ pid ${String(result.pid)}`);
  }
  return parts.length === 0 ? '' : ` ${parts.join(' ')}`;
}

/** `iPhone 17 Pro (FD83…-…)` — the udid is the practical key; the name is what a human calls it. */
export function describeDevice(result: Dict): string {
  const name = str(result.name);
  const udid = str(result.udid);
  if (name !== undefined && udid !== undefined) return `${name} (${udid})`;
  return name ?? udid ?? str(result.allocationId) ?? 'device';
}

/** `com.wix.detox-example (pid 19767)`. */
export function describeApp(appId: string | undefined, result: Dict): string {
  const pid = typeof result.pid === 'number' ? ` (pid ${String(result.pid)})` : '';
  return `${appId ?? str(result.appHandleId) ?? 'app'}${pid}`;
}

/** `f5a17d3c-… from 127.0.0.1:56123` — the run id is the key a tester has in hand; the peer address says who. */
export function describeConnection(fields: Dict | undefined, fallback: string): string {
  const runId = str(fields?.runId);
  const remote = str(fields?.remoteAddress);
  if (runId === undefined) return remote === undefined ? fallback : `${fallback} from ${remote}`;
  return remote === undefined ? runId : `${runId} from ${remote}`;
}
