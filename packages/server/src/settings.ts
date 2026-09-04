/** `detox server`'s settings — flag, env var and config-file key, once each. */
import { z } from 'zod';
import type { SettingDescriptor } from '@detox-remote/core';
import { DEFAULT_HOST } from './server';
import { isLogLevel } from './log-sink';
import { parseDuration } from './duration';

const zPort = z.coerce.number().int().min(0).max(65_535, 'expected 0-65535');
const zPositiveBytes = z.coerce.number().positive('expected a positive number of bytes');
const zLogLevel = z.string().refine(isLogLevel, {
  message: 'expected one of error, warn, info, debug',
});
const zNonEmpty = z.string().min(1, 'declared but empty — set a real value, or remove it entirely');
// Stays a duration STRING (not ms): this value is forwarded verbatim to a
// spawned child, which parses it itself — pre-converting it here would
// have the child re-parse ms as seconds.
const zDuration = z.string().refine((text) => parseDuration(text) !== undefined, {
  message: 'expected a duration like 10m, 2h, 1d, or seconds',
});

export const SERVER_SETTINGS = [
  {
    key: 'host',
    schema: zNonEmpty,
    flag: '--host',
    env: 'DETOX_SERVER_HOST',
    help: `Interface to bind (default: ${DEFAULT_HOST}). Use 0.0.0.0 to accept connections from the LAN.`,
  },
  {
    key: 'port',
    schema: zPort,
    flag: '--port',
    env: 'DETOX_SERVER_PORT',
    help: 'Port to listen on (default: 8080; 0 = pick a free one)',
  },
  {
    key: 'token',
    schema: zNonEmpty,
    // The file's auth shape is the nested `auth: {type, token}` instead.
    noConfigKey: true,
    // Empty must refuse, not silently mean "auth off".
    strictEnv: true,
    flag: '--token',
    env: 'DETOX_SERVER_TOKEN',
    help:
      'Bearer token; with none configured the door is open. Prefer the env var — a ' +
      'command line is visible to every process on the machine (`ps`).',
  },
  {
    key: 'maxPool',
    schema: z.coerce.number().int().min(0),
    flag: '--max-pool',
    env: 'DETOX_SERVER_MAX_POOL',
    help: 'Max device pool size (default: 4)',
  },
  {
    key: 'keepaliveWindow',
    // 7-day cap: past ~74 days the derived interval overflows Node's
    // 32-bit timer and setInterval clamps to 1ms — a ping storm.
    schema: z.coerce.number().min(0).max(604_800, 'expected seconds between 0 and 604800 (7 days); 0 = no liveness polls'),
    flag: '--keepalive-window',
    env: 'DETOX_SERVER_KEEPALIVE_WINDOW',
    help:
      'Seconds a client may stay unresponsive before its session ends and its devices ' +
      'return to the pool (default: 120, max: 604800 = 7 days). 0 turns liveness polls off entirely.',
  },
  {
    key: 'blobBudget',
    schema: zPositiveBytes,
    flag: '--blob-budget',
    env: 'DETOX_SERVER_BLOB_BUDGET',
    help: 'Byte budget of the build cache behind installApp uploads (default: 8 GiB)',
  },
  {
    key: 'blobRoot',
    schema: zNonEmpty,
    env: 'DETOX_SERVER_BLOB_ROOT',
    internal: true,
  },
  {
    key: 'logLevel',
    schema: zLogLevel,
    flag: '--log-level',
    env: 'DETOX_SERVER_LOG_LEVEL',
    help: 'What reaches stdout: error | warn | info | debug (default: info)',
  },
  {
    key: 'logRetention',
    schema: zDuration,
    flag: '--log-retention',
    env: 'DETOX_SERVER_LOG_RETENTION',
    help:
      "How long an ended connection's log stays, from its end: e.g. 10m, 2h, 1d, or " +
      'plain seconds (default: 10m; 24h for the local helper)',
  },
  {
    key: 'logBudget',
    schema: zPositiveBytes,
    flag: '--log-budget',
    env: 'DETOX_SERVER_LOG_BUDGET',
    help: 'The seatbelt under retention: when ended logs exceed it, the oldest go first (default: 8 GiB)',
  },
  {
    key: 'logRoot',
    schema: zNonEmpty,
    env: 'DETOX_SERVER_LOG_ROOT',
    internal: true,
  },
  {
    key: 'childOutputBudget',
    schema: zPositiveBytes,
    flag: '--child-output-budget',
    env: 'DETOX_SERVER_CHILD_OUTPUT_BUDGET',
    help: "How much of a spawned tool's stdout/stderr the connection log keeps per stream (default: 64 KiB)",
  },
  {
    key: 'appOutputBudget',
    schema: zPositiveBytes,
    flag: '--app-output-budget',
    env: 'DETOX_SERVER_APP_OUTPUT_BUDGET',
    help: "How much of a launched app's own stdout/stderr the connection log keeps per launch (default: 1 MiB)",
  },
] as const satisfies readonly SettingDescriptor[];
