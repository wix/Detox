'use strict';
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
/**
 * The probe test runner for spec 009 (editable helper). Configs name it as
 * their `testRunner.args.$0`; the `detox test` CLI spawns it the same way it
 * would spawn jest. It consumes the runner-side contract where spec 010's
 * jest integration will:
 *
 *  1. reads the snapshot file named by `DETOX_CONFIG_SNAPSHOT_PATH`;
 *  2. dials `snapshot.client.server` — with a bearer header only when
 *     `snapshot.client.token` exists (auth is opt-in and off by default) —
 *     through the built client bundle
 *     (`detox/dist/internals.js`, the real artifact a runner
 *     loads), then disconnects;
 *  3. writes a receipt (atomically: temp + rename) with its argv, cwd, pid,
 *     the snapshot verbatim, the snapshot's path (so the accept can assert
 *     post-run deletion), `DETOX_CONFIGURATION` as seen (the variable the
 *     CLI exports to its runner), and the dial's outcome.
 *
 * Modes, all via its own argv (which double as the forwarding fixture):
 *  --receipt <path>   where to write the receipt (resolved against cwd —
 *                     the spawn contract fixes cwd to the CLI's own);
 *  --exit <code>      exit with this code after receipt + dial
 *                     (exit-code-propagation fixture);
 *  --park             never exit (Ctrl+C fixture) — receipt is written first.
 *  --holdSession      keep the Detox client session open while parked
 *                     (helper-restart fixture).
 * Unknown tokens are ignored: forwarded flags and positionals land here
 * verbatim and must not crash the probe.
 */
const fs = require('node:fs');
const path = require('node:path');

function argValue(argv, flag) {
  const index = argv.indexOf(flag);
  return index !== -1 ? argv[index + 1] : undefined;
}

async function main() {
  const argv = process.argv.slice(2);
  const receiptArg = argValue(argv, '--receipt');
  if (receiptArg === undefined) {
    console.error('probe-runner: no --receipt <path> among configured args');
    process.exit(97);
  }
  const receiptPath = path.resolve(process.cwd(), receiptArg);
  const exitArg = argValue(argv, '--exit');
  const park = argv.includes('--park');
  const holdSession = argv.includes('--holdSession') || argv.includes('--hold-session');

  const snapshotPath = process.env.DETOX_CONFIG_SNAPSHOT_PATH;
  if (!snapshotPath) {
    console.error('probe-runner: DETOX_CONFIG_SNAPSHOT_PATH is not set');
    process.exit(98);
  }
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

  let initOk = false;
  let initErrorCode;
  let initErrorMessage;
  let detox;
  try {
    const { init } = require(path.resolve(__dirname, '../../detox/dist/internals.js'));
    detox = await init({
      server: {
        url: snapshot.client.server,
        ...(snapshot.client.token !== undefined
          ? { headers: { Authorization: `Bearer ${snapshot.client.token}` } }
          : {}),
      },
    });
    if (holdSession) {
      initOk = true;
    } else {
      await detox.disconnect();
      detox = undefined;
      initOk = true;
    }
  } catch (err) {
    initErrorCode = err && err.code;
    initErrorMessage = String((err && err.message) || err);
  }

  const receipt = {
    pid: process.pid,
    cwd: process.cwd(),
    argv,
    snapshot,
    snapshotPath,
    configurationEnv: process.env.DETOX_CONFIGURATION,
    initOk,
    initErrorCode,
    initErrorMessage,
  };
  const tmp = `${receiptPath}.tmp`;
  // 0600 like the snapshot itself — the receipt embeds the snapshot, token
  // and all, and must not be the one world-readable copy of it.
  fs.writeFileSync(tmp, JSON.stringify(receipt, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, receiptPath);

  if (park) {
    // Stay alive until a signal kills us — the Ctrl+C fixture. The interval
    // keeps the event loop busy and is never cleared.
    setInterval(() => {}, 1 << 30);
    return;
  }
  if (detox) await detox.disconnect();
  process.exit(exitArg !== undefined ? Number(exitArg) : initOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(96);
});
