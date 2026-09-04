/**
 * Acceptance: spec 016 — the framework-cache verbs.
 *
 * This file is frozen and append-only once the spec is accepted. It speaks
 * only the public dialect: the `detox` bin's argv, environment, exit code
 * and output, and the documented per-user cache layout
 * (`~/Library/Detox/ios/framework`, `~/Library/Detox/ios/xcuitest-runner`);
 * the only other imports are `./helpers/*` and test scaffolding.
 *
 * Style is part of the contract: straight-line awaits, no function
 * definitions in this file (inline predicates over helper results are the
 * 006 precedent). Output is pinned by the lines the verb itself prints and
 * their order relative to the build script's own, never by padding.
 *
 * Machine policy: every test hands the CLI a throwaway `HOME` — the one seam
 * the verbs, the build scripts and the server's framework resolver share —
 * so the machine's real cache under the real home is never read or written
 * by this suite. Tests 3–5 run real Xcode builds (a warm build is seconds;
 * a cold one is minutes, which the runner's per-test timeout covers). No
 * simulator is booted.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { runDetoxCli, spawnDetoxCli } from './helpers/cli';
import {
  detoxXcodebuildsUnder,
  exists,
  pathWithoutXcode,
  fileKindExternally,
  frameworkBinariesIn,
  frameworkCacheOf,
  scratchHome,
  seedFile,
  xctestrunsIn,
} from './helpers/framework-cache';
import { isPidAlive } from './helpers/project';
import { waitUntil } from './helpers/simctl';

const VERBS = ['build-framework-cache', 'clean-framework-cache', 'rebuild-framework-cache'] as const;

/**
 * Test 1 — every verb answers `--help`, and refuses any flag it does not
 * take before touching anything. The refusal is the 009 usage family: one
 * line on stderr naming the token, no stack, nothing on stdout — and a
 * `rebuild` refused this way has removed nothing, which is what the seeded
 * entry proves.
 */
void test('every framework-cache verb answers --help, and refuses an unknown flag before touching the cache', async () => {
  const home = await scratchHome();
  const seeded = await seedFile(frameworkCacheOf(home).framework, 'seed/Detox.framework/Detox');

  for (const verb of VERBS) {
    const help = await runDetoxCli([verb, '--help'], { cwd: home, env: { HOME: home } });
    assert.equal(help.exitCode, 0, `${verb} --help must exit 0, stderr:\n${help.stderr}`);
    assert.ok(help.stdout.includes(`detox ${verb} [--detox] [--xcuitest]`), `${verb} --help names its own usage line`);
    assert.ok(help.stdout.includes('--detox') && help.stdout.includes('--xcuitest'), `${verb} --help describes both flags`);
    assert.ok(help.stdout.includes('~/Library/Detox/ios'), `${verb} --help names the cache root`);

    const refused = await runDetoxCli([verb, '--android'], { cwd: home, env: { HOME: home } });
    assert.notEqual(refused.exitCode, 0, `${verb} --android is a usage refusal`);
    assert.equal(refused.stdout, '', 'a refusal prints nothing on stdout');
    assert.ok(refused.stderr.includes('--android') && refused.stderr.includes(verb), 'the refusal names the token and the verb');
    assert.equal(refused.stderr.trim().split('\n').length, 1, `one line, no stack:\n${refused.stderr}`);
  }

  // Help wins over everything else on the line, including a bad token.
  const helpWins = await runDetoxCli(['rebuild-framework-cache', '--android', '-h'], { cwd: home, env: { HOME: home } });
  assert.equal(helpWins.exitCode, 0);
  assert.ok(helpWins.stdout.includes('detox rebuild-framework-cache [--detox] [--xcuitest]'));

  assert.equal(await exists(seeded), true, 'no refusal removed anything');

  const top = await runDetoxCli(['--help'], { cwd: home, env: { HOME: home } });
  assert.equal(top.exitCode, 0);
  for (const verb of VERBS) assert.ok(top.stdout.includes(`detox ${verb}`), `detox --help lists ${verb}`);
});

/**
 * Test 2 — `clean` removes exactly the selected cache directory (the whole
 * directory, every hash under it and the build logs beside them), names
 * what it removes, leaves the other component and every neighbour under
 * `~/Library/Detox` alone, and treats an absent cache as nothing to do —
 * exit 0, the same line, so a `clean` before a first `build` is not an
 * error.
 */
void test('clean removes only the selected cache, names it, and an absent cache is not an error', async () => {
  const home = await scratchHome();
  const cache = frameworkCacheOf(home);
  const framework = await seedFile(cache.framework, 'aaaa/Detox.framework/Detox');
  const frameworkLog = await seedFile(cache.framework, 'aaaa.log');
  const olderFramework = await seedFile(cache.framework, 'bbbb/Detox.framework/Detox');
  const runner = await seedFile(cache.xcuitest, 'aaaa/Products/DetoxXCUITestRunner.xctestrun');
  const neighbour = await seedFile(path.join(home, 'Library', 'Detox', 'ios'), 'keep-me');
  const android = await seedFile(path.join(home, 'Library', 'Detox'), 'android/keep-me');

  const xcuitestOnly = await runDetoxCli(['clean-framework-cache', '--xcuitest'], { cwd: home, env: { HOME: home } });
  assert.equal(xcuitestOnly.exitCode, 0, `stderr:\n${xcuitestOnly.stderr}`);
  assert.ok(xcuitestOnly.stdout.includes(`detox: cleaning the XCUITest runner cache at ${cache.xcuitest}`), xcuitestOnly.stdout);
  assert.ok(!xcuitestOnly.stdout.includes('Detox framework'), 'the unselected component is not even named');
  assert.equal(await exists(runner), false);
  assert.equal(await exists(cache.xcuitest), false, 'the cache directory itself goes, not only its entries');
  assert.equal(await exists(framework), true, '--xcuitest leaves the framework cache alone');

  const both = await runDetoxCli(['clean-framework-cache'], { cwd: home, env: { HOME: home } });
  assert.equal(both.exitCode, 0, `stderr:\n${both.stderr}`);
  const frameworkLine = both.stdout.indexOf(`detox: cleaning the Detox framework cache at ${cache.framework}`);
  const runnerLine = both.stdout.indexOf(`detox: cleaning the XCUITest runner cache at ${cache.xcuitest}`);
  assert.ok(frameworkLine >= 0 && runnerLine > frameworkLine, `framework first, then the runner:\n${both.stdout}`);
  assert.equal(await exists(framework), false);
  assert.equal(await exists(olderFramework), false, 'every hash under the cache goes');
  assert.equal(await exists(frameworkLog), false, 'the build logs beside the hashes go too');
  assert.equal(await exists(cache.framework), false);
  assert.equal(await exists(neighbour), true, 'a neighbour under ~/Library/Detox/ios survives');
  assert.equal(await exists(android), true, 'nothing outside the two cache directories is touched');

  const again = await runDetoxCli(['clean-framework-cache'], { cwd: home, env: { HOME: home } });
  assert.equal(again.exitCode, 0, 'an absent cache is nothing to do, not an error');
  assert.ok(again.stdout.includes(`detox: cleaning the Detox framework cache at ${cache.framework}`), 'and it still says what it did');
});

/**
 * Test 3 — `build` with no flags produces both caches in the exact shape
 * the server's resolver scans (`framework/<sha1>/Detox.framework/Detox`, a
 * Mach-O dynamic library) and the runner's (`xcuitest-runner/<same
 * sha1>/…/*.xctestrun`); the verb's own line precedes the script's output
 * on a pipe; and a second `build` skips both components, leaving the
 * artifacts byte-for-byte alone.
 */
void test('build produces the cache the server injects from, and a second build skips what is built', async () => {
  const home = await scratchHome();
  const cache = frameworkCacheOf(home);

  const built = await runDetoxCli(['build-framework-cache'], { cwd: home, env: { HOME: home } });
  assert.equal(built.exitCode, 0, `stderr:\n${built.stderr}\nstdout:\n${built.stdout}`);
  const ourFrameworkLine = built.stdout.indexOf(`detox: building the Detox framework cache at ${cache.framework}`);
  const scriptFrameworkLine = built.stdout.search(/Dev mode, building from|Extracting Detox framework/);
  const ourRunnerLine = built.stdout.indexOf(`detox: building the XCUITest runner cache at ${cache.xcuitest}`);
  const scriptRunnerLine = built.stdout.search(/Dev mode, building XCUITest runner|Extracting Detox XCUITest runner/);
  assert.ok(ourFrameworkLine >= 0 && scriptFrameworkLine > ourFrameworkLine, `the verb announces the framework before its script speaks:\n${built.stdout}`);
  assert.ok(ourRunnerLine > scriptFrameworkLine && scriptRunnerLine > ourRunnerLine, `then the runner, after the framework is done:\n${built.stdout}`);

  const binaries = await frameworkBinariesIn(home);
  assert.equal(binaries.length, 1, `exactly one framework build:\n${JSON.stringify(binaries)}`);
  assert.match(binaries[0].entry, /^[0-9a-f]{40}$/, 'the entry is the sha-1 the build script keys on');
  assert.match(await fileKindExternally(binaries[0].path), /Mach-O.*dynamically linked shared library/);
  // The script names the entry directory when it builds from source (this
  // checkout); a tarball install extracts a prebuilt framework instead and
  // prints no directory. The accept runner always runs in the checkout.
  assert.ok(built.stdout.includes(path.join(cache.framework, binaries[0].entry)), 'the build names the entry it produced');
  const runners = await xctestrunsIn(home);
  assert.equal(runners.length, 1, `exactly one runner build:\n${JSON.stringify(runners)}`);
  assert.equal(runners[0].entry, binaries[0].entry, 'both caches key on the same hash');

  const again = await runDetoxCli(['build-framework-cache'], { cwd: home, env: { HOME: home } });
  assert.equal(again.exitCode, 0, `stderr:\n${again.stderr}`);
  assert.match(again.stdout, /Detox\.framework exists, skipping/);
  assert.match(again.stdout, /XCUITest-runner exists, skipping/);
  assert.deepEqual(await frameworkBinariesIn(home), binaries, 'the framework binary is the same file, untouched');
  assert.deepEqual(await xctestrunsIn(home), runners, 'the runner is the same file, untouched');
});

/**
 * Test 4 — `rebuild --detox` removes and rebuilds the framework and only
 * the framework: a new binary under the same hash, the runner's file
 * untouched, and the clean line printed before the build line.
 */
void test('rebuild replaces only the selected component', async () => {
  const home = await scratchHome();
  const cache = frameworkCacheOf(home);
  const seeded = await runDetoxCli(['build-framework-cache'], { cwd: home, env: { HOME: home } });
  assert.equal(seeded.exitCode, 0, `stderr:\n${seeded.stderr}`);
  const [before] = await frameworkBinariesIn(home);
  const [runnerBefore] = await xctestrunsIn(home);
  assert.ok(before !== undefined && runnerBefore !== undefined, 'the seed built both');

  const rebuilt = await runDetoxCli(['rebuild-framework-cache', '--detox'], { cwd: home, env: { HOME: home } });
  assert.equal(rebuilt.exitCode, 0, `stderr:\n${rebuilt.stderr}\nstdout:\n${rebuilt.stdout}`);
  const cleanLine = rebuilt.stdout.indexOf(`detox: cleaning the Detox framework cache at ${cache.framework}`);
  const buildLine = rebuilt.stdout.indexOf(`detox: building the Detox framework cache at ${cache.framework}`);
  assert.ok(cleanLine >= 0 && buildLine > cleanLine, `clean, then build:\n${rebuilt.stdout}`);
  assert.ok(!rebuilt.stdout.includes('XCUITest'), 'the runner is not mentioned, let alone touched');
  assert.doesNotMatch(rebuilt.stdout, /exists, skipping/, 'a rebuild never skips');

  const [after] = await frameworkBinariesIn(home);
  assert.ok(after !== undefined);
  assert.equal(after.entry, before.entry, 'same Detox and Xcode versions, same hash');
  assert.ok(after.mtimeMs > before.mtimeMs, 'a fresh binary, not the old one');
  assert.deepEqual(await xctestrunsIn(home), [runnerBefore], 'the runner file is exactly the one from before');
});

/**
 * Test 5 — Ctrl+C during a build reaches `xcodebuild` itself (the
 * AbortSignal-first constraint at process rank: the CLI forwards the signal
 * to the script's whole process group, since bash alone would wait for the
 * build it started), the verb exits non-zero and reports the code it saw,
 * no half-built artifact is left where the server would pick it up, and
 * the next `build` recovers on its own — the script sees the interrupted
 * entry and rebuilds it. Both components, in turn: each script has its own
 * skip rule, so each must recover on its own. The `xcodebuild` pids are
 * taken while the CLI is alive and checked by pid afterwards: an orphan
 * would be reparented to pid 1 and be invisible to a walk from the CLI.
 */
void test('Ctrl+C during a build reaches xcodebuild, leaves no artifact behind, and the next build recovers', async (t) => {
  const home = await scratchHome();

  const framework = spawnDetoxCli(['build-framework-cache', '--detox'], { cwd: home, env: { HOME: home }, signal: t.signal });
  const frameworkPid = framework.pid;
  assert.ok(frameworkPid !== undefined, 'the CLI spawned');
  await framework.waitForOutput(/Building Detox\.framework from/, { signal: t.signal });
  let frameworkBuilds: number[] = [];
  await waitUntil(async () => (frameworkBuilds = await detoxXcodebuildsUnder(frameworkPid, 'framework')).length > 0, {
    signal: t.signal,
    description: 'xcodebuild to start building the framework under the CLI',
  });

  framework.interrupt();
  const interrupted = await framework.wait();
  assert.notEqual(interrupted.exitCode, 0, 'an interrupted build must not report success');
  assert.ok(
    interrupted.stdout.includes(`detox: building the Detox framework failed (exit ${String(interrupted.exitCode)})`),
    `the verb reports the code it exited with:\n${interrupted.stdout}`,
  );
  await waitUntil(() => frameworkBuilds.every((pid) => !isPidAlive(pid)), {
    signal: t.signal,
    timeoutMs: 30_000,
    description: `xcodebuild ${frameworkBuilds.join(', ')} to die with the interrupt`,
  });
  assert.deepEqual(await frameworkBinariesIn(home), [], 'an interrupted build leaves no binary the server could pick');

  const recovered = await runDetoxCli(['build-framework-cache', '--detox'], { cwd: home, env: { HOME: home } });
  assert.equal(recovered.exitCode, 0, `stderr:\n${recovered.stderr}\nstdout:\n${recovered.stdout}`);
  assert.doesNotMatch(recovered.stdout, /exists, skipping/, 'an interrupted entry is rebuilt, never skipped');
  assert.equal((await frameworkBinariesIn(home)).length, 1, 'the next build produced the binary');

  const runner = spawnDetoxCli(['build-framework-cache', '--xcuitest'], { cwd: home, env: { HOME: home }, signal: t.signal });
  const runnerPid = runner.pid;
  assert.ok(runnerPid !== undefined, 'the CLI spawned');
  await runner.waitForOutput(/Building XCUITest runner from/, { signal: t.signal });
  let runnerBuilds: number[] = [];
  await waitUntil(async () => (runnerBuilds = await detoxXcodebuildsUnder(runnerPid, 'xcuitest')).length > 0, {
    signal: t.signal,
    description: 'xcodebuild to start building the runner under the CLI',
  });

  runner.interrupt();
  const runnerInterrupted = await runner.wait();
  assert.notEqual(runnerInterrupted.exitCode, 0, 'an interrupted runner build must not report success');
  await waitUntil(() => runnerBuilds.every((pid) => !isPidAlive(pid)), {
    signal: t.signal,
    timeoutMs: 30_000,
    description: `xcodebuild ${runnerBuilds.join(', ')} to die with the interrupt`,
  });
  assert.deepEqual(await xctestrunsIn(home), [], 'an interrupted runner build leaves no xctestrun');

  const runnerRecovered = await runDetoxCli(['build-framework-cache', '--xcuitest'], { cwd: home, env: { HOME: home } });
  assert.equal(runnerRecovered.exitCode, 0, `stderr:\n${runnerRecovered.stderr}\nstdout:\n${runnerRecovered.stdout}`);
  assert.doesNotMatch(runnerRecovered.stdout, /exists, skipping/, 'an interrupted runner entry is rebuilt, never skipped');
  assert.equal((await xctestrunsIn(home)).length, 1, 'the next build produced the runner');
});

/**
 * Test 6 — without Xcode, a build refuses rather than reporting success.
 *
 * A caller who asked for a framework and was told "done" would go on to a
 * `launchApp` that cannot instrument anything, so the scripts refuse: one
 * message naming Xcode, a non-zero exit, nothing built. The two documented
 * ways out stay open — `DETOX_DISABLE_POSTINSTALL` turns the refusal back
 * into a logged skip for anyone who wants the old behaviour, and `clean`,
 * which runs no build at all, is unaffected either way. (An install is the
 * remaining caller that never asked for a build; `postinstall` makes that
 * check itself, so a machine without Xcode still installs.)
 */
void test('without Xcode a build refuses, unless the step is disabled; clean is unaffected', async () => {
  const home = await scratchHome();
  const PATH = await pathWithoutXcode();

  const refused = await runDetoxCli(['build-framework-cache', '--detox'], { cwd: home, env: { HOME: home, PATH } });
  assert.notEqual(refused.exitCode, 0, 'a build with no Xcode must not report success');
  assert.match(refused.output, /Xcode is not installed/, `the refusal names Xcode:\n${refused.output}`);
  assert.match(refused.output, /DETOX_DISABLE_POSTINSTALL/, 'and names the documented way to skip it');
  assert.deepEqual(await frameworkBinariesIn(home), [], 'a refused build leaves no binary');

  const skipped = await runDetoxCli(['build-framework-cache', '--detox'], {
    cwd: home,
    env: { HOME: home, PATH, DETOX_DISABLE_POSTINSTALL: '1' },
  });
  assert.equal(skipped.exitCode, 0, `an explicitly disabled build is not an error:\n${skipped.output}`);
  assert.match(skipped.stdout, /skipping the Detox framework build/, 'and says it skipped');
  assert.deepEqual(await frameworkBinariesIn(home), [], 'a skipped build leaves no binary either');

  await seedFile(frameworkCacheOf(home).framework, 'seed/Detox.framework/Detox');
  const cleaned = await runDetoxCli(['clean-framework-cache'], { cwd: home, env: { HOME: home, PATH } });
  assert.equal(cleaned.exitCode, 0, `clean runs no build, so Xcode is irrelevant to it:\n${cleaned.output}`);
  assert.equal(await exists(frameworkCacheOf(home).framework), false, 'and it still cleaned');
});
