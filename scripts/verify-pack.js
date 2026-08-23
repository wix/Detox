#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
/**
 * The pack-and-install proof (spec 009's integration gate for the packaging):
 * an exports map alone is not the proof — this script runs the real pack
 * script, installs the produced tarball into an empty temp project, and
 * requires it the way a migrating project would.
 *
 *   yarn build && node scripts/verify-pack.js
 *
 * Asserted, each in the installed copy (never workspace source):
 *  - `require('detox')` is the compat surface (init/cleanup/device/element/
 *    by/expect/waitFor) — a migrating project changes no import line;
 *  - the earlier draft's driver-class exports are gone;
 *  - `detox/client` and `detox/internals` are the same module instance;
 *  - `detox/server` exposes the programmatic entry point — createServer;
 *  - the bin map serves `detox` and the file exists and is runnable;
 *  - the staged `engines` equals the repo's own node pin.
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function isServerlessReceipt(value) {
  return value &&
    typeof value === 'object' &&
    typeof value.server === 'string' &&
    typeof value.hasToken === 'boolean';
}

function isHelperCookie(value) {
  return value && typeof value === 'object' && typeof value.pid === 'number';
}

function run(cmd, args, opts) {
  return execFileSync(cmd, args, { encoding: 'utf8', ...opts });
}

function fail(message) {
  console.error(`verify-pack: FAIL — ${message}`);
  process.exit(1);
}

const packDest = fs.mkdtempSync(path.join(os.tmpdir(), 'detox-verify-pack-dest-'));
const project = fs.mkdtempSync(path.join(os.tmpdir(), 'detox-verify-pack-project-'));
try {
  const tarball = run('node', [path.join(repoRoot, 'scripts', 'pack-client.js'), packDest])
    .trim()
    .split('\n')
    .pop();
  if (!tarball || !fs.existsSync(tarball)) fail(`pack-client produced no tarball (${tarball})`);

  fs.writeFileSync(
    path.join(project, 'package.json'),
    JSON.stringify({ name: 'verify-pack-consumer', version: '1.0.0', private: true }, null, 2),
  );
  // The tarball has zero dependencies, so this install needs no registry.
  run('npm', ['install', tarball, '--no-audit', '--no-fund'], { cwd: project });

  const probe = `
    const assert = require('node:assert/strict');
    const detox = require('detox');
    for (const key of ['init', 'cleanup', 'device', 'element', 'by', 'expect', 'waitFor']) {
      assert.equal(typeof detox[key] === 'function' || typeof detox[key] === 'object', true,
        'require("detox") must be the compat surface — missing ' + key);
    }
    for (const dead of ['RuntimeDriverClass', 'DeviceAllocationDriverClass', 'ExpectClass',
                        'EnvironmentValidatorClass', 'ArtifactPluginsProviderClass']) {
      assert.equal(dead in detox, false, 'legacy driver-class export survived: ' + dead);
    }
    const client = require('detox/client');
    const internals = require('detox/internals');
    assert.equal(client, internals, 'detox/client and detox/internals must be the SAME module');
    assert.equal(typeof internals.init, 'function', 'the client surface must expose init');
    const server = require('detox/server');
    assert.equal(typeof server.createServer, 'function', 'detox/server must expose createServer');
    const manifest = require('detox/package.json');
    const repoPin = ${JSON.stringify(JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')).engines.node)};
    assert.equal(manifest.engines.node, repoPin, 'the tarball engines must match the repo node pin');
    assert.equal(typeof manifest.bin.detox, 'string', 'the bin map must serve detox');
    const bin = require('node:path').join(require('node:path').dirname(require.resolve('detox/package.json')), manifest.bin.detox);
    assert.equal(require('node:fs').existsSync(bin), true, 'the detox bin file must exist in the tarball');
    const helperServerBin = require('node:path').join(require('node:path').dirname(require.resolve('detox/package.json')), 'dist/server/cli.js');
    assert.equal(require('node:fs').existsSync(helperServerBin), true,
      'the detached local helper server bin must exist in the tarball');
    console.log('verify-pack probe: all assertions passed');
  `;
  const out = run('node', ['-e', probe], { cwd: project });
  process.stdout.write(out);

  const installedBin = path.join(project, 'node_modules', '.bin', 'detox');
  const help = run('node', [installedBin, '--help'], {
    cwd: project,
  });
  if (!/detox test/.test(help) || !/detox relay/.test(help)) {
    fail('the installed bin answered --help without the four verbs');
  }

  const helperRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'detox-verify-pack-helper-'));
  const runner = path.join(project, 'probe-runner.cjs');
  fs.writeFileSync(
    runner,
    [
      "const fs = require('node:fs');",
      "const { init } = require('detox/internals');",
      '(async () => {',
      "  const snapshotPath = process.env.DETOX_CONFIG_SNAPSHOT_PATH;",
      "  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));",
      '  const detox = await init({ server: snapshot.client.server });',
      '  await detox.disconnect();',
      "  fs.writeFileSync('serverless-receipt.json', JSON.stringify({",
      '    server: snapshot.client.server,',
      "    hasToken: Object.prototype.hasOwnProperty.call(snapshot.client, 'token'),",
      '  }));',
      '})().catch((err) => { console.error(err); process.exit(1); });',
      '',
    ].join('\n'),
  );
  fs.writeFileSync(
    path.join(project, '.detoxrc.json'),
    JSON.stringify({
      testRunner: { args: { $0: `node ${runner}` } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    }),
  );
  run('node', [installedBin, 'test', '-c', 'only'], {
    cwd: project,
    env: { ...process.env, DETOX_LOCAL_HELPER_ROOT: helperRoot },
  });
  const serverlessReceipt = readJson(path.join(project, 'serverless-receipt.json'));
  if (!isServerlessReceipt(serverlessReceipt)) {
    fail('installed serverless detox test wrote a malformed receipt');
  }
  if (!/^ws:\/\/127\.0\.0\.1:\d+$/.test(serverlessReceipt.server) || serverlessReceipt.server === 'ws://127.0.0.1:8080') {
    fail(`installed serverless detox test did not use an ephemeral helper URL (${serverlessReceipt.server})`);
  }
  if (serverlessReceipt.hasToken) {
    fail('installed serverless detox test leaked a helper token into the runner snapshot');
  }
  const helperCookie = readJson(path.join(helperRoot, 'server.json'));
  if (isHelperCookie(helperCookie)) {
    try {
      process.kill(helperCookie.pid, 'SIGTERM');
    } catch {
      // The helper may already have exited; the probe's assertion is above.
    }
  }
  console.log('verify-pack serverless probe: installed detox test autostarts the detached helper');

  // The jest integration (spec 010): all four `detox/runners/jest/*` module
  // paths resolve from the installed copy, and the environment class loads
  // and instantiates against a real jest 30 resolved from the consumer
  // project (the tarball bundles no jest — the repo's own jest tree stands
  // in for the consumer's devDependencies, symlinked so the check still
  // needs no registry).
  const projectModules = path.join(project, 'node_modules');
  for (const entry of fs.readdirSync(path.join(repoRoot, 'node_modules'))) {
    if (entry === 'detox' || entry === '.bin' || entry.startsWith('.')) continue;
    const target = path.join(projectModules, entry);
    if (!fs.existsSync(target)) {
      fs.symlinkSync(path.join(repoRoot, 'node_modules', entry), target, 'dir');
    }
  }
  const jestProbe = `
    const assert = require('node:assert/strict');
    for (const p of ['testEnvironment', 'globalSetup', 'globalTeardown', 'reporter']) {
      require.resolve('detox/runners/jest/' + p);
    }
    const runnersIndex = require('detox/runners/jest');
    assert.equal(typeof runnersIndex.DetoxCircusEnvironment, 'function',
      'detox/runners/jest must keep the v20 destructuring shape');
    const envModule = require('detox/runners/jest/testEnvironment');
    const DetoxCircusEnvironment = envModule.default ?? envModule;
    assert.equal(typeof DetoxCircusEnvironment, 'function', 'the environment entry must serve a class');
    const env = new DetoxCircusEnvironment(
      { globalConfig: {}, projectConfig: { testEnvironmentOptions: {} } },
      { console, docblockPragmas: {}, testPath: '/tmp/probe.test.js' },
    );
    assert.equal(typeof env.handleTestEvent, 'function', 'the environment must handle circus events');
    const setupFn = require('detox/runners/jest/globalSetup');
    const teardownFn = require('detox/runners/jest/globalTeardown');
    assert.equal(typeof (setupFn.default ?? setupFn), 'function', 'globalSetup must be callable');
    assert.equal(typeof (teardownFn.default ?? teardownFn), 'function', 'globalTeardown must be callable');
    const reporterModule = require('detox/runners/jest/reporter');
    const Reporter = reporterModule.default ?? reporterModule;
    const reporter = new Reporter({ verbose: false }, {});
    assert.equal(typeof reporter.onRunComplete, 'function', 'the reporter must implement the interface');
    console.log('verify-pack jest probe: runners resolve, environment instantiates against project jest');
  `;
  process.stdout.write(run('node', ['-e', jestProbe], { cwd: project }));

  // The types proof: a typeless tarball is not acceptable, so a TypeScript
  // consumer under nodenext resolution must see every door's declarations
  // from the installed copy. The repo's own tsc and @types/node stand in for
  // the consumer's devDependencies so the check still needs no registry.
  fs.writeFileSync(
    path.join(project, 'consumer.ts'),
    [
      "import * as detox from 'detox';",
      "import { init } from 'detox/internals';",
      "import { init as clientInit } from 'detox/client';",
      "import { createServer } from 'detox/server';",
      "import { expect } from '@jest/globals';",
      '// Compile-time assertions — a missing or empty .d.ts fails each line.',
      'const compatDevice: typeof detox.device = detox.device;',
      'const sameDoor: typeof init = clientInit;',
      'const serverDoor: ReturnType<typeof createServer> = createServer({ port: 0, maxPool: 1 });',
      'void compatDevice; void sameDoor; void serverDoor; void detox.by;',
      '// Spec 010: jest\'s own `expect` speaks the Detox matcher vocabulary',
      '// through the bundled augmentation — never executed, only typechecked.',
      'async function jestMatcherProbe(): Promise<void> {',
      "  await expect(detox.element(detox.by.id('x'))).toBeVisible();",
      "  await expect(detox.element(detox.by.text('y'))).not.toHaveText('z');",
      '  expect(2 + 2).toBe(4);',
      '}',
      'void jestMatcherProbe;',
      '',
    ].join('\n'),
  );
  run(
    process.execPath,
    [
      path.join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc'),
      '--noEmit', '--strict', '--target', 'es2022',
      '--module', 'node16', '--moduleResolution', 'node16',
      '--types', 'node', '--typeRoots', path.join(repoRoot, 'node_modules', '@types'),
      path.join(project, 'consumer.ts'),
    ],
    { cwd: project },
  );
  console.log('verify-pack types probe: a nodenext TS consumer resolves all four doors');
  console.log(`verify-pack: PASS (${path.basename(tarball)})`);
} finally {
  fs.rmSync(packDest, { recursive: true, force: true });
  fs.rmSync(project, { recursive: true, force: true });
}
