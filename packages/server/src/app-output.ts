/**
 * The seam's half of the app's own output (spec 013): where a driver hands
 * a launched app's stdout/stderr lines — the launch request's trace, one
 * `debug` line per output line under the launch node, and one `warn` when
 * the per-launch budget (`--app-output-budget`) is exhausted. How the lines
 * are obtained is the driver's (on iOS: `simctl launch --stdout/--stderr`
 * into the simulator's own `data/tmp`, tailed by `@detox-remote/driver-ios`).
 */
import type { LogLevel } from './log-sink';

export interface AppOutputSink {
  line(level: LogLevel, msg: string, fields?: Record<string, unknown>): void;
}

export const DEFAULT_APP_OUTPUT_BUDGET_BYTES = 1024 * 1024;
