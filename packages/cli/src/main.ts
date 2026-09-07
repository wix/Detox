/**
 * The `detox` bin (spec 009): one binary, five verbs — `test`, `build`,
 * `server`, `relay`, and `logs` (spec 013) — plus the framework-cache verbs
 * kept from v20 (`build-framework-cache`, `clean-framework-cache`,
 * `rebuild-framework-cache`, spec 016). A process shell over the unit-gated
 * modules of this package: dispatch, spawn, signals, exit codes — no
 * composition logic lives here.
 *
 * Signals: SIGINT/SIGTERM forward to the runner
 * child once — its own teardown is the graceful path — and a second signal
 * is SIGKILL. A framework build script gets the same forward-once contract,
 * aimed at its own process group (it is spawned detached): `xcodebuild` is
 * the script's child, and a signal delivered to bash alone is deferred
 * until the build it is waiting on finishes. The price of that group: a
 * SIGKILL of this process itself, which cannot be forwarded, leaves the
 * build running to completion — a supervisor should send a catchable
 * signal first. No timer of any kind exists in this file: the child's
 * death is observable, and the grace an unattended supervisor needs lives
 * one layer up (systemd/docker/k8s own that clock and kill the process
 * group).
 */
import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';

import { runServerCli } from '@detox-remote/server';
import { runRelayCli, reportRelayCliError, RelayCliError } from 'detox-relay';

import { ConfigError, UsageError } from './errors';
import { resolveRun, resolveServing } from './resolve';
import { writeSnapshotFile, deleteSnapshotFile } from './io';
import { ensureLocalHelper, readLocalHelperAddress, restartLocalHelper } from './local-helper';
import { runLogs } from './logs';
import { formatRunLines, readRunRows } from './run-lines';
import {
  frameworkCacheDirs,
  frameworkCacheUsage,
  isFrameworkCacheVerb,
  locateBuildScripts,
  parseFrameworkCacheArgs,
  runFrameworkCacheVerb,
  type FrameworkCacheVerb,
} from './framework-cache';
import {
  splitCliArgv,
  refuseUnknownFlags,
  buildRunnerInvocation,
  buildRunnerEnv,
  serverSectionToArgs,
  collectBuildCommands,
} from './argv';

const USAGE = `
detox — the Detox 21 command line

Usage:
  detox test  [-c <configuration>] [-C <config path>] [anything else…]
  detox build [-c <configuration>] [-C <config path>]
  detox server [options]         start a device-owning Detox Server here
  detox relay  --nodes <file>    front a fleet of Detox Servers at one address
  detox logs  [<runId>] [--all | --failures | --json] [--under <name>]
                                 read a run's log from the project's server
  detox build-framework-cache   [--detox] [--xcuitest]   build ~/Library/Detox/ios (macOS)
  detox clean-framework-cache   [--detox] [--xcuitest]   remove it
  detox rebuild-framework-cache [--detox] [--xcuitest]   remove it, then build it again

\`detox test\` consumes ONLY -c/--configuration and -C/--config-path (env
mirrors: DETOX_CONFIGURATION, DETOX_CONFIG_PATH). EVERY other flag and
positional is passed to your configured test runner verbatim, in your order —
that is a feature, not an accident: your runner's whole surface stays
reachable without detox having to learn it, so \`detox test --headless x.js\`
hands --headless to the runner and the runner's own answer is the honest one.

\`detox test\` starts or attaches to a detached local helper when
\`client.server\` is absent. Set \`server.autostart: false\` to keep the
explicit-server path at ws://127.0.0.1:8080.

\`detox test\` ends by naming every run it made — \`detox run <id> → <viewer URL>\` —
and \`detox logs <id>\` reads it back as text (\`detox logs --help\`).

\`detox server --help\` and \`detox relay --help\` describe the serving verbs.
`;

/**
 * Where a serverless run points: the `detox server` verb's
 * own default bind — the operator's standing server, never one we spawn.
 */
const DEFAULT_LOCAL_SERVER_URL = 'ws://127.0.0.1:8080';

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

async function runTest(rest: readonly string[]): Promise<void> {
  const split = splitCliArgv(rest);
  const resolved = await resolveRun({
    cwd: process.cwd(),
    env: process.env,
    flags: { configuration: split.configuration, configPath: split.configPath },
  });
  for (const warning of resolved.warnings) console.warn(`detox: ${warning}`);

  // No `client.server` now means the post-alpha helper path (spec 011).
  // `server.autostart: false` keeps the alpha explicit-server behavior
  // forever, including the no-preflight dial and the runner's own typed
  // `DETOX_SERVER_UNREACHABLE` answer when nothing is listening.
  const clientDraft = resolved.snapshot.client as Record<string, unknown>;
  if (clientDraft.server === undefined) {
    if (resolved.autostart === false) {
      clientDraft.server = DEFAULT_LOCAL_SERVER_URL;
      console.log(
        `detox test: server.autostart is false — expecting a Detox Server at ${DEFAULT_LOCAL_SERVER_URL}. ` +
          'Start one with `detox server`, or point client.server at a remote one.',
      );
    } else {
      clientDraft.server = await ensureLocalHelper();
      console.log(`detox test: using local helper at ${String(clientDraft.server)}`);
    }
  }

  const snapshotPath = writeSnapshotFile(resolved.snapshot);
  let cleaned = false;
  const cleanup = (): void => {
    if (cleaned) return;
    cleaned = true;
    deleteSnapshotFile(snapshotPath);
  };
  // The synchronous half of the cleanup also rides `process.on('exit')`,
  // registered before the signal handlers exist: a signal landing in that
  // window must not leave a token-bearing file behind.
  process.on('exit', () => deleteSnapshotFile(snapshotPath));

  const invocation = buildRunnerInvocation(resolved.runnerArgs, split.forwarded);
  const child = spawn(invocation.command, invocation.argv, {
    cwd: process.cwd(),
    env: buildRunnerEnv({
      base: process.env,
      snapshotPath,
      configurationName: resolved.configurationName,
      cwd: process.cwd(),
    }),
    stdio: 'inherit',
  });

  // First signal forwards — the runner's own teardown (compat cleanup →
  // socket close → the server reclaims in ms) is the graceful
  // path. The second is the insist.
  let forwarded = false;
  const onSignal = (signal: NodeJS.Signals): void => {
    if (!forwarded) {
      forwarded = true;
      child.kill(signal);
      return;
    }
    child.kill('SIGKILL');
  };
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);
  // A closed terminal is a real exit path too — same forward-once contract.
  process.on('SIGHUP', onSignal);

  // The last thing printed, whatever the exit code (spec 013): every run a
  // worker opened, by id and viewer URL — read before the snapshot dir goes,
  // and written with a callback: stdout to a pipe is asynchronous on macOS,
  // and `process.exit` right behind a bare `console.log` can drop the line.
  const nameRuns = (then: () => void): void => {
    const lines = formatRunLines(readRunRows(snapshotPath));
    if (lines.length === 0) return then();
    process.stdout.write(`${lines.join('\n')}\n`, () => then());
  };

  child.on('error', (err) => {
    nameRuns(() => {
      cleanup();
      fail(`detox test: could not spawn the test runner \`${invocation.command}\`: ${err.message}`);
    });
  });
  child.on('close', (code, signalCode) => {
    nameRuns(() => {
      cleanup();
      // The runner's exit code propagates verbatim (CI matrices key on it);
      // a signal-killed runner exits non-zero (exact code unpinned).
      process.exit(code ?? (signalCode !== null ? 130 : 1));
    });
  });
}

async function runBuild(rest: readonly string[]): Promise<void> {
  const split = splitCliArgv(rest);
  if (split.forwarded.length > 0) {
    throw new UsageError(
      `Unknown argument for \`detox build\`: ${split.forwarded[0]} — build takes only -c/--configuration and -C/--config-path`,
    );
  }
  const resolved = await resolveRun({
    cwd: process.cwd(),
    env: process.env,
    flags: { configuration: split.configuration, configPath: split.configPath },
  });
  for (const warning of resolved.warnings) console.warn(`detox: ${warning}`);
  const commands = collectBuildCommands(resolved.snapshot.apps, resolved.configPath);
  for (const command of commands) {
    // The build string is the user's own, run where the user stands,
    // through the shell, stdio inherited — v20's contract, kept.
    const result = spawnSync(command, { cwd: process.cwd(), shell: true, stdio: 'inherit' });
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  }
}

const SERVER_FLAGS = new Set([
  '--restart', '--port', '--host', '--token', '--max-pool', '--blob-budget', '--keepalive-window',
  '--help', '-h', '-c', '--configuration', '-C', '--config-path',
]);
// A relay has no pool flags of any kind: it owns no devices.
const RELAY_FLAGS = new Set([
  '--nodes', '--port', '--host', '--token', '--blob-budget', '--keepalive-window',
  '--help', '-h', '-c', '--configuration', '-C', '--config-path',
]);

async function runServe(verb: 'server' | 'relay', rest: readonly string[]): Promise<void> {
  refuseUnknownFlags(verb, rest, verb === 'server' ? SERVER_FLAGS : RELAY_FLAGS);
  // Help goes straight to the delegated main — a broken discoverable config
  // in some ancestor directory must not suppress `--help`.
  if (rest.includes('--help') || rest.includes('-h')) {
    await (verb === 'server'
      ? runServerCli({ argv: rest, env: process.env })
      : runRelayCli({ argv: rest, env: process.env }));
    return;
  }
  if (verb === 'server' && rest.includes('--restart')) {
    const servingFlags = ['--port', '--host', '--token', '--max-pool', '--blob-budget', '--keepalive-window'];
    const conflicting = servingFlags.find((flag) => rest.includes(flag));
    if (conflicting !== undefined) {
      throw new UsageError(
        `detox server --restart manages the detached local helper; ${conflicting} starts an operator-owned server. Use one mode at a time.`,
      );
    }
    const restarted = await restartLocalHelper();
    if (restarted.replacedActiveSessions > 0) {
      console.log(
        `detox server --restart: replaced a helper with ${String(restarted.replacedActiveSessions)} active session(s)/holder(s).`,
      );
    }
    console.log(`detox server --restart: local helper listening on ${restarted.url}`);
    return;
  }
  const split = splitCliArgv(rest);
  const { serverSection, configPath } = await resolveServing({
    cwd: process.cwd(),
    env: process.env,
    flags: { configuration: split.configuration, configPath: split.configPath },
  });
  // An operator deserves to know which file just supplied bind/auth
  // defaults — discovery walks up to the filesystem root.
  if (serverSection !== undefined && configPath !== undefined) {
    console.log(`detox ${verb}: serving defaults read from ${configPath}`);
  }
  if (verb === 'server') {
    await runServerCli({
      argv: serverSectionToArgs(serverSection, split.forwarded, 'server', process.env),
      env: process.env,
    });
    return;
  }
  // A config-sourced roster travels in process — node tokens never touch a
  // temp file; an explicit --nodes (or env) wins over the config's list.
  const inlineNodes =
    serverSection?.nodes !== undefined &&
    !split.forwarded.includes('--nodes') &&
    !process.env.DETOX_RELAY_NODES
      ? serverSection.nodes
      : undefined;
  await runRelayCli({
    argv: serverSectionToArgs(serverSection, split.forwarded, 'relay', process.env),
    env: process.env,
    nodes: inlineNodes,
  });
}

async function runFrameworkCache(verb: FrameworkCacheVerb, rest: readonly string[]): Promise<void> {
  const args = parseFrameworkCacheArgs(verb, rest);
  if (args.help) {
    console.log(frameworkCacheUsage(verb));
    return;
  }
  const code = await runFrameworkCacheVerb(verb, args.selection, frameworkCacheDirs(), () => locateBuildScripts(__dirname), {
    platform: process.platform,
    runScript: (script) =>
      new Promise((resolve, reject) => {
        // Its own process group, so a forwarded signal reaches `xcodebuild`
        // and everything under it, not only the bash script waiting on it.
        // Executed directly, never via `bash <script>`: the scripts' `-e`
        // rides their shebang, which a wrapper interpreter would drop.
        const child = spawn(script, [], { stdio: 'inherit', detached: true });
        let forwarded = false;
        const onSignal = (signal: NodeJS.Signals): void => {
          if (child.pid === undefined) return;
          try {
            process.kill(-child.pid, forwarded ? 'SIGKILL' : signal);
          } catch {
            // The group is already gone; `close` is about to fire.
          }
          forwarded = true;
        };
        process.on('SIGINT', onSignal);
        process.on('SIGTERM', onSignal);
        process.on('SIGHUP', onSignal);
        const done = (): void => {
          process.off('SIGINT', onSignal);
          process.off('SIGTERM', onSignal);
          process.off('SIGHUP', onSignal);
        };
        child.on('error', (err) => {
          done();
          reject(new UsageError(`detox: could not run ${script}: ${err.message}`));
        });
        child.on('close', (exitCode, signalCode) => {
          done();
          resolve(exitCode ?? (signalCode !== null ? 130 : 1));
        });
      }),
    // `force` swallows only absence; a permission or busy-tree failure is
    // still a one-line refusal, not a stack.
    removeDir: async (dir) => {
      try {
        await rm(dir, { recursive: true, force: true });
      } catch (err) {
        throw new UsageError(`detox: could not remove ${dir}: ${(err as Error).message}`);
      }
    },
    // Written with a callback: stdout to a pipe is asynchronous on macOS, and
    // the script spawned right behind a bare `console.log` shares the fd —
    // its first line could land before ours.
    log: (line) =>
      new Promise<void>((resolve) => {
        process.stdout.write(`${line}\n`, () => resolve());
      }),
  });
  if (code !== 0) process.exit(code);
}

async function main(): Promise<void> {
  const [verb, ...rest] = process.argv.slice(2);
  if (verb === undefined) {
    // Usage-on-error goes to stderr — a pipeline grepping stdout for the
    // verb list must not see it on the failure path.
    console.error(USAGE);
    process.exit(1);
  }
  if (verb === '--help' || verb === '-h') {
    console.log(USAGE);
    process.exit(0);
  }
  switch (verb) {
    case 'test':
      return runTest(rest);
    case 'build':
      return runBuild(rest);
    case 'server':
    case 'relay':
      return runServe(verb, rest);
    case 'logs': {
      // Argv in, exit code out; refusals are the verb's own (exit 2, one line).
      const code = await runLogs(rest, {
        cwd: process.cwd(),
        env: process.env,
        io: {
          stdout: (text) => void process.stdout.write(text),
          stderr: (text) => void process.stderr.write(text),
          writeFile: (file, text) => writeFileSync(file, text),
        },
        helperAddress: readLocalHelperAddress,
      });
      process.exitCode = code;
      return;
    }
    default:
      if (isFrameworkCacheVerb(verb)) return runFrameworkCache(verb, rest);
      throw new UsageError(
        `Unknown command \`detox ${verb}\` — the verbs are test, build, server, relay, logs, ` +
          `build-framework-cache, clean-framework-cache, rebuild-framework-cache${USAGE}`,
      );
  }
}

main().catch((err: unknown) => {
  if (err instanceof ConfigError || err instanceof UsageError) {
    fail(err.message);
  }
  if (err instanceof RelayCliError) {
    reportRelayCliError(err);
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});
