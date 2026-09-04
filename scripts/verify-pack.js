#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
/**
 * The pack-and-install proof (spec 009's integration gate for the packaging):
 * a manifest alone is not the proof — this script packs the real `detox`
 * package, installs the produced tarball into an empty temp project, and
 * requires it the way a migrating project would.
 *
 * It packs what `publish-local.mjs` publishes: `npm pack` in `detox/`, the
 * manifest as written, its `prepack` build and all. That is the point — the
 * published package resolves every entry point through one-line CommonJS
 * shims at its root (`client.js` -> `dist/client.js`), and a proof that runs
 * against any other manifest proves nothing about what users install.
 *
 *   yarn build && node scripts/verify-pack.js
 *
 * Asserted, each in the installed copy (never workspace source):
 *  - `require('detox')` is the compat surface (init/cleanup/device/element/
 *    by/expect/waitFor) — a migrating project changes no import line;
 *  - the earlier draft's driver-class exports are gone;
 *  - `detox/internals` is gone — `detox/client` is the only client door;
 *  - `detox/server` exposes the programmatic entry point — createServer;
 *  - the bin map serves `detox` and the file exists and is runnable;
 *  - the published `engines` equals the repo's own node pin;
 *  - the tarball declares no runtime dependencies — every one of them is
 *    bundled into dist/, so a declared dep would only make each install
 *    fetch a package the shipped code never loads;
 *  - the framework-cache verbs find the build scripts the tarball ships;
 *  - the doors a user runs inside their own process ship self-contained
 *    source maps, so a debugger steps into TypeScript rather than a bundle.
 */
const { execFileSync, spawnSync } = require('node:child_process');
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
  // `npm pack` runs the package's own `prepack` (the build + the iOS
  // framework check), so this is the publish path end to end, not a shortcut.
  const packed = run('npm', ['pack', '--pack-destination', packDest], {
    cwd: path.join(repoRoot, 'detox'),
  })
    .trim()
    .split('\n')
    .pop();
  const tarball = path.join(packDest, packed);
  if (!packed || !fs.existsSync(tarball)) fail(`npm pack produced no tarball (${packed})`);

  fs.writeFileSync(
    path.join(project, 'package.json'),
    JSON.stringify({ name: 'verify-pack-consumer', version: '1.0.0', private: true }, null, 2),
  );
  // The real package has a postinstall that builds the iOS framework into
  // $HOME, which a verification run must not do — hence the documented
  // opt-out. HOME itself is left alone here on purpose: npm reads its config,
  // credentials and cache from it, and the package declares a dependency, so
  // this install resolves through the registry the way a user's does. The
  // scratch HOME below fences the one command that reads the cache path.
  run('npm', ['install', tarball, '--no-audit', '--no-fund'], {
    cwd: project,
    env: { ...process.env, DETOX_DISABLE_POSTINSTALL: '1' },
  });
  const scratchHome = fs.mkdtempSync(path.join(os.tmpdir(), 'detox-verify-pack-home-'));

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
    assert.equal(typeof client.connect, 'function', 'the client surface must expose connect');
    assert.equal('init' in client, false, 'the client surface must not carry the compat init');
    let internalsDoor;
    try { internalsDoor = require('detox/internals'); } catch { internalsDoor = undefined; }
    assert.equal(internalsDoor, undefined, 'detox/internals must be gone; detox/client is the only client door');
    const server = require('detox/server');
    assert.equal(typeof server.createServer, 'function', 'detox/server must expose createServer');
    const manifest = require('detox/package.json');
    const repoPin = ${JSON.stringify(JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')).engines.node)};
    assert.equal(manifest.engines.node, repoPin, 'the tarball engines must match the repo node pin');
    // npm allows either spelling; the published manifest uses the string form.
    const binPath = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin.detox;
    assert.equal(typeof binPath, 'string', 'the manifest must serve a detox bin');
    const bin = require('node:path').join(require('node:path').dirname(require.resolve('detox/package.json')), binPath);
    assert.equal(require('node:fs').existsSync(bin), true, 'the detox bin file must exist in the tarball');
    const helperServerBin = require('node:path').join(require('node:path').dirname(require.resolve('detox/package.json')), 'dist/server/cli.js');
    assert.equal(require('node:fs').existsSync(helperServerBin), true,
      'the detached local helper server bin must exist in the tarball');
    // esbuild inlines ws (and zod, inside the CLI) into the bundles, so the
    // published package needs nothing at install time. Anything declared here
    // would be downloaded by every user and then never required.
    assert.deepEqual(Object.keys(manifest.dependencies || {}), [],
      'the tarball must declare no runtime dependencies — they are bundled');
    console.log('verify-pack probe: all assertions passed');
  `;
  const out = run('node', ['-e', probe], { cwd: project });
  process.stdout.write(out);

  // The same claim from the outside: a dependency-free install puts nothing
  // in node_modules but detox itself (npm's own bookkeeping dotfiles aside).
  const installedPackages = fs
    .readdirSync(path.join(project, 'node_modules'))
    .filter((entry) => !entry.startsWith('.'));
  if (installedPackages.join(',') !== 'detox') {
    fail(`installing the tarball pulled in more than detox: ${installedPackages.join(', ')}`);
  }

  // Debugging symbols: the bundles a user executes in
  // their own test process — the compat surface, the client, and the jest
  // runners — ship maps that carry their TypeScript inline, so no source
  // resolution and no second download is needed. The server/relay/CLI
  // bundles run as separate processes and deliberately ship none: their maps
  // are 4.4 MB of the 6.3 MB total.
  const installedPkg = path.join(project, 'node_modules', 'detox');
  for (const bundle of ['dist/index.js', 'dist/client.js', 'dist/runners/jest/testEnvironment.js']) {
    const js = path.join(installedPkg, bundle);
    const map = `${js}.map`;
    if (!fs.existsSync(map)) fail(`${bundle}.map is missing — a debugger cannot step into the sources`);
    if (!/# sourceMappingURL=/.test(fs.readFileSync(js, 'utf8'))) {
      fail(`${bundle} carries no sourceMappingURL, so its map will never be loaded`);
    }
    const parsed = readJson(map);
    if (!Array.isArray(parsed.sourcesContent) || parsed.sourcesContent.length !== parsed.sources.length) {
      fail(`${bundle}.map does not embed its sources, so the sources must be found some other way`);
    }
    if (!parsed.sources.some((src) => src.endsWith('.ts'))) {
      fail(`${bundle}.map names no TypeScript source`);
    }
  }
  console.log('verify-pack sourcemap probe: the in-process doors ship self-contained TypeScript maps');

  const installedBin = path.join(project, 'node_modules', '.bin', 'detox');
  const help = run('node', [installedBin, '--help'], {
    cwd: project,
  });
  if (!/detox test/.test(help) || !/detox relay/.test(help)) {
    fail('the installed bin answered --help without its verbs');
  }

  // The framework-cache verbs (spec 016). The published package ships the
  // build scripts under `scripts/`, so here the verbs must actually work —
  // this is the one place that proves the CLI finds those scripts from the
  // installed layout (`dist/cli/../../scripts`), which no source-tree run can.
  const cacheHelp = run('node', [installedBin, 'clean-framework-cache', '--help'], { cwd: project });
  if (!/--detox/.test(cacheHelp) || !/--xcuitest/.test(cacheHelp)) {
    fail('the installed bin answered clean-framework-cache --help without its flags');
  }
  const installedPkgRoot = path.join(project, 'node_modules', 'detox');
  for (const script of ['build_local_framework.ios.sh', 'build_local_xcuitest.ios.sh']) {
    // Where the CLI bundle looks: dist/cli/../../scripts, i.e. the package root.
    const scriptPath = path.join(installedPkgRoot, 'scripts', script);
    if (!fs.existsSync(scriptPath)) fail(`the tarball does not ship ${script} where the bin looks (${scriptPath})`);
    try {
      fs.accessSync(scriptPath, fs.constants.X_OK);
    } catch {
      fail(`${script} is not executable in the installed tarball`);
    }
  }
  // A real run of the one verb that builds nothing: it must find its scripts,
  // report the cache it cleaned, and touch only the scratch home.
  const cleaned = spawnSync('node', [installedBin, 'clean-framework-cache'], {
    cwd: project,
    env: { ...process.env, HOME: scratchHome },
    encoding: 'utf8',
  });
  if (cleaned.status !== 0) {
    fail(`clean-framework-cache failed from the installed tarball:\n${cleaned.stdout}${cleaned.stderr}`);
  }
  if (!cleaned.stdout.includes(path.join(scratchHome, 'Library', 'Detox', 'ios', 'framework'))) {
    fail(`clean-framework-cache did not name the cache under HOME:\n${cleaned.stdout}`);
  }
  console.log('verify-pack framework-cache probe: the verbs find their build scripts in the installed layout');

  const helperRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'detox-verify-pack-helper-'));
  const runner = path.join(project, 'probe-runner.cjs');
  fs.writeFileSync(
    runner,
    [
      "const fs = require('node:fs');",
      "const { connect } = require('detox/client');",
      '(async () => {',
      "  const snapshotPath = process.env.DETOX_CONFIG_SNAPSHOT_PATH;",
      "  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));",
      '  const detox = await connect({ server: snapshot.client.server });',
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
      "import { connect } from 'detox/client';",
      "import { createServer } from 'detox/server';",
      "import { expect } from '@jest/globals';",
      '// Compile-time assertions — a missing or empty .d.ts fails each line.',
      'const compatDevice: typeof detox.device = detox.device;',
      'const compatInit: typeof detox.init = detox.init;',
      'const clientDoor: ReturnType<typeof connect> = connect({ server: "ws://127.0.0.1:1" });',
      'const serverDoor: ReturnType<typeof createServer> = createServer({ port: 0, maxPool: 1 });',
      'void compatDevice; void compatInit; void clientDoor; void serverDoor; void detox.by;',
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
