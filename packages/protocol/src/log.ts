/**
 * `$/log` — the client's one addition to the wire (spec 012).
 *
 * A `$/`-prefixed notification, client to server, like `$/progress` and
 * `$/cancelAck`: ignorable by an older server, routed by the peer to the
 * registered handler like any other notification. Three phases, mirroring
 * the log file's own line kinds: `begin` opens a step (a test, a hook, a
 * user-named section), `end` closes one by id, `log` is a single line under
 * whatever step is open. The server is the judge of `kind`, `attrs`,
 * `level` and `fields`; the client forwards them unvalidated (so an
 * acceptance test can reach the server's refusal through a raw spelling).
 *
 * `id` is client-minted, unique per connection. Steps end by id, in any
 * order (`test.concurrent` is a supported shape); an end for an unknown or
 * already-ended id is one `warn` line in the log and nothing else.
 */
export const LOG_METHOD = '$/log';

/** The closed set of step kinds; `attach` is reserved for a later revision. */
export const LOG_KINDS = ['file', 'describe', 'test', 'hook', 'step'] as const;
export type LogKind = (typeof LOG_KINDS)[number];

export const LOG_STATUSES = ['passed', 'failed', 'skipped', 'aborted'] as const;
export type LogStatus = (typeof LOG_STATUSES)[number];

export const LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const;
export type LogLineLevel = (typeof LOG_LEVELS)[number];

/** A JSON scalar, or an array of them — the only shapes `attrs` may carry. */
export type LogAttrScalar = string | number | boolean | null;
export type LogAttrs = Record<string, LogAttrScalar | LogAttrScalar[]>;

export interface LogError {
  name: string;
  message: string;
}

export interface LogBeginParams {
  id: string;
  phase: 'begin';
  kind: LogKind;
  name: string;
  attrs?: LogAttrs;
  /**
   * The step this one nests under (spec 013): another step's client-minted
   * `id`. Absent, the server applies its own rule — the most recently begun
   * still-open step — which is right for sequential runs and wrong under
   * `test.concurrent`; the client fills it from its step context. An
   * unknown or already-ended parent is refused at warn and the step lands
   * under the connection. Ignored by an older server.
   */
  parent?: string;
}

export interface LogEndParams {
  id: string;
  phase: 'end';
  status: LogStatus;
  error?: LogError;
}

/** One line under `step` when it names an open step (spec 013), else under the most recently begun still-open step, else the connection's own node. */
export interface LogLineParams {
  phase: 'log';
  level: LogLineLevel;
  msg: string;
  fields?: Record<string, unknown>;
  /** The step the writer is inside, from the client's step context; ignored by an older server. */
  step?: string;
}

export type LogNotification = LogBeginParams | LogEndParams | LogLineParams;

export function isLogKind(value: unknown): value is LogKind {
  return typeof value === 'string' && (LOG_KINDS as readonly string[]).includes(value);
}

export function isLogStatus(value: unknown): value is LogStatus {
  return typeof value === 'string' && (LOG_STATUSES as readonly string[]).includes(value);
}

export function isLogLineLevel(value: unknown): value is LogLineLevel {
  return typeof value === 'string' && (LOG_LEVELS as readonly string[]).includes(value);
}
