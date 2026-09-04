/**
 * `detox logs`' argv (spec 013): one optional positional (the run id), the
 * views (`--all`, `--failures`, `--json` with `--out`/`--follow`), the
 * subtree filter (`--under <name>`), and the same config selectors `detox
 * test` takes (`-c`, `-C`). The views are exclusive; `--under` composes
 * with each. A stranger is a usage refusal by name — there is no runner
 * behind this verb to hand it to.
 */
import { UsageError } from './errors';

export interface LogsArgv {
  runId?: string;
  all: boolean;
  failures: boolean;
  json: boolean;
  follow: boolean;
  out?: string;
  under?: string;
  configuration?: string;
  configPath?: string;
  help: boolean;
}

const VALUE_FLAGS: Readonly<Record<string, keyof LogsArgv>> = {
  '--out': 'out',
  '--under': 'under',
  '-c': 'configuration',
  '--configuration': 'configuration',
  '-C': 'configPath',
  '--config-path': 'configPath',
};

const SWITCHES: Readonly<Record<string, keyof LogsArgv>> = {
  '--all': 'all',
  '--failures': 'failures',
  '--json': 'json',
  '--follow': 'follow',
  '--help': 'help',
  '-h': 'help',
};

export function parseLogsArgv(tokens: readonly string[]): LogsArgv {
  const parsed: LogsArgv = { all: false, failures: false, json: false, follow: false, help: false };
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    // `--under=-tagged` names a value that starts with a dash; the split form cannot.
    const equals = token.startsWith('--') ? token.indexOf('=') : -1;
    if (equals !== -1) {
      const key = VALUE_FLAGS[token.slice(0, equals)];
      if (key === undefined) throw new UsageError(`Unknown flag for \`detox logs\`: ${token.slice(0, equals)} (run \`detox logs --help\`)`);
      (parsed as unknown as Record<string, unknown>)[key] = token.slice(equals + 1);
      continue;
    }
    const valueKey = VALUE_FLAGS[token];
    if (valueKey !== undefined) {
      const value = tokens[i + 1];
      if (value === undefined || value.startsWith('-')) throw new UsageError(`Missing value for ${token}`);
      (parsed as unknown as Record<string, unknown>)[valueKey] = value;
      i++;
      continue;
    }
    const switchKey = SWITCHES[token];
    if (switchKey !== undefined) {
      (parsed as unknown as Record<string, unknown>)[switchKey] = true;
      continue;
    }
    if (token.startsWith('-')) {
      throw new UsageError(`Unknown flag for \`detox logs\`: ${token} (run \`detox logs --help\`)`);
    }
    if (parsed.runId !== undefined) {
      throw new UsageError(`\`detox logs\` takes one run id, got two: ${parsed.runId} and ${token}`);
    }
    parsed.runId = token;
  }
  if (parsed.help) return parsed;
  const views = [parsed.all ? '--all' : undefined, parsed.failures ? '--failures' : undefined, parsed.json ? '--json' : undefined].filter((v) => v !== undefined);
  if (views.length > 1) throw new UsageError(`\`detox logs\` prints one view at a time: ${views.join(' and ')} together is ambiguous`);
  if (parsed.out !== undefined && !parsed.json) throw new UsageError('--out writes the raw JSONL: it needs --json');
  if (parsed.follow && !parsed.json) throw new UsageError('--follow streams the raw JSONL as it grows: it needs --json');
  if (parsed.follow && parsed.under !== undefined) throw new UsageError('--follow cannot narrow with --under: a subtree is only known once the run has ended');
  if (parsed.runId === undefined && (parsed.all || parsed.failures || parsed.json || parsed.under !== undefined)) {
    throw new UsageError('`detox logs` with no run id lists the runs; the views need a run id');
  }
  return parsed;
}

export const LOGS_HELP = `
detox logs — read a run's log from the Detox Server this project dials

Usage:
  detox logs                          the server's runs, one line each
  detox logs <runId>                  the outline: file › describe › test / hook, every rpc under its test
  detox logs <runId> --all            the outline with the narration ticks
  detox logs <runId> --failures       the diagnosis: each innermost failure, its ancestors, its error, the ticks around it
  detox logs <runId> --json           the raw JSONL, byte for byte (--out <file> to save it, --follow to tail a live run)
  detox logs <runId> --under <name>   one subtree — a describe/test/hook by name or fullName, an rpc by its name or method, or step:<id> / rpc:<n>; composes with every view
  detox logs -c <configuration> -C <config path>   the same config resolution as detox test

The server is the project's own: client.server from the config (with its
token), else the detached local helper detox test started. Exit codes: 0
printed; 2 a refusal — unknown run, no server, unreachable server — on one
line, never a stack.
`;
