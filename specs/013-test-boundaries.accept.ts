/**
 * Acceptance: spec 013 — test boundaries, process output, and `detox logs`.
 *
 * This file is frozen and append-only. It speaks only
 * the public dialect: `detox/client` here, `require('detox')` (the compat
 * surface, staged from the real tarball) inside the fixture test files, the
 * `detox` bin's argv/stdout/exit code, and the JSONL the server serves; the
 * only other imports are `./helpers/*`, test scaffolding, never product API.
 *
 * Style is part of the contract: straight-line awaits, no function
 * definitions in this file (the fixture TEST FILES inline below are user
 * code and are themselves contract — each is written as a v20 user writes an
 * e2e file). The outline and the failure cut are pinned by the names and
 * their order, never by padding.
 *
 * Simulator policy: the fixture projects hold ONE real simulator (the compat
 * surface allocates at init — a warm handoff after the first boot); every
 * in-test Detox call is a refused `allocateDevice` on the worker's own run
 * through `detox.session`. Test 4 creates and deletes one probe simulator.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { connect, DetoxErrorCode } from 'detox/client';

import { startServer } from './helpers/server';
import { buildHelloAppExternally, resolveDetoxFrameworkExternally } from './helpers/real-app';
import { runDetoxCli } from './helpers/cli';
import { tokenOf, writeProject } from './helpers/project';
import { exampleDevice, writeJestProject } from './helpers/jest-project';
import { dialConnectionLog, parseNdjson } from './helpers/session-log';
import { blockAfter, indentOf, lineAt, nameColumn, nonEmptyLines } from './helpers/outline-text';
import { createSimulatorExternally, deleteSimulatorExternally, shutdownSimulatorExternally } from './helpers/simctl';

const NO_SUCH_DEVICE = '00000000-0000-0000-0000-000000000000';

/** The migrant's `e2e/jest.config.js`, spec 010's shape, one worker. */
const JEST_CONFIG = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.js'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  maxWorkers: 1,
  testTimeout: 120_000,
};

/**
 * The one fixture file tests 1–3 share: a `describe` with a `beforeAll`, a
 * nested `describe` with a second `beforeAll`, a passing test that makes a
 * refused `allocateDevice` on the worker's own run, a failing test, a skip.
 */
const SANITY_FIXTURE = `
const detox = require('detox');

describe('Sanity', () => {
  beforeAll(async () => {});

  describe('inner', () => {
    beforeAll(async () => {});

    it('passes', async () => {
      await expect(
        detox.session.allocateDevice({ type: 'ios.simulator', device: { deviceId: '${NO_SUCH_DEVICE}' } }),
      ).rejects.toThrow();
    });

    it('fails', () => {
      expect(1).toBe(2);
    });

    it.skip('skipped', () => {});
  });
});
`;

/** Run-id line: `detox run <uuid> → http://host:port/v1/runs/<uuid>/perfetto`, the gated-server hint optional. */
const RUN_LINE_RE = /^detox run ([0-9a-f-]{36}) → (http:\/\/[^\s]+\/v1\/runs\/\1\/perfetto)( \(add #token=… for a gated server\))?$/;
const DURATION_RE = /(\d+ ms|\d+\.\d s)$/;

/**
 * Test 1 — the tree is in the log, declared, not inferred.
 */
void test('the jest environment declares file › describe › hook / test steps with explicit parents, and a test\'s RPC is its child', async (t) => {
  await using server = await startServer({ dedicated: true, isolatedLogRoot: true, signal: t.signal });
  const token = tokenOf(server.address);
  const project = await writeJestProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: 'jest', config: 'e2e/jest.config.js' } },
      client: { server: server.address.url, token },
      devices: { sim: { type: 'ios.simulator', device: { type: exampleDevice() } } },
      apps: { app: { type: 'ios.app', name: 'app', bundleId: 'com.example.fixture' } },
      configurations: { 'ios.sim': { device: 'sim', app: 'app' } },
    },
    'e2e/jest.config.js': JEST_CONFIG,
    'e2e/sanity.test.js': SANITY_FIXTURE,
  });
  const lane = dialConnectionLog(server.address);

  const result = await runDetoxCli(['test', '-c', 'ios.sim'], { cwd: project.dir, signal: t.signal });
  assert.equal(result.exitCode, 1, `expected exactly the one failing test, output:\n${result.output}`);

  const index = await lane.index();
  assert.equal(index.length, 1, 'one worker, one session, one run');
  const runId = index[0].runId;
  const lines = parseNdjson(await lane.fetchUntil(runId, (ls) => ls.some((l) => l.kind === 'end' && l.node.id === 'conn'), { signal: t.signal }));

  const steps = lines.filter((l) => l.kind === 'begin' && l.node.type === 'step');
  const file = steps.find((l) => l.fields?.kind === 'file');
  assert.ok(file, 'a file step');
  assert.equal(file.node.name, 'e2e/sanity.test.js');
  assert.deepEqual(file.fields?.attrs, { filePath: 'e2e/sanity.test.js' });
  assert.equal(file.node.parent, undefined, 'the file step is the root of the tree');

  const initAllocation = lines.find((l) => l.kind === 'begin' && l.node.type === 'rpc' && l.fields?.method === 'allocateDevice');
  assert.ok(initAllocation, 'the session allocated at init');
  assert.equal(initAllocation.node.parent, file.node.id, 'the init allocation is an rpc under the first file');

  const sanity = steps.find((l) => l.fields?.kind === 'describe' && l.node.name === 'Sanity');
  assert.ok(sanity);
  assert.deepEqual(sanity.fields?.attrs, { fullName: 'Sanity' });
  assert.equal(sanity.node.parent, file.node.id);
  assert.ok(sanity.seq > initAllocation.seq, 'the describe begins after the file\'s own init');

  const inner = steps.find((l) => l.fields?.kind === 'describe' && l.node.name === 'inner');
  assert.ok(inner);
  assert.deepEqual(inner.fields?.attrs, { fullName: 'Sanity inner' });
  assert.equal(inner.node.parent, sanity.node.id);

  const hooks = steps.filter((l) => l.fields?.kind === 'hook');
  assert.equal(hooks.length, 2, 'two beforeAll hooks');
  for (const hook of hooks) {
    assert.equal(hook.node.name, 'beforeAll');
    assert.deepEqual(hook.fields?.attrs, { hookType: 'beforeAll' });
    const end = lines.find((l) => l.kind === 'end' && l.node.id === hook.node.id);
    assert.equal(end?.fields?.status, 'passed');
  }
  assert.deepEqual(hooks.map((h) => h.node.parent), [sanity.node.id, inner.node.id], 'each hook under its own describe, in run order');

  const tests = steps.filter((l) => l.fields?.kind === 'test');
  assert.deepEqual(tests.map((l) => l.node.name), ['passes', 'fails', 'skipped'], 'the three tests, in declaration order');
  for (const step of tests) {
    assert.equal(step.node.parent, inner.node.id);
    assert.deepEqual(step.fields?.attrs, { fullName: `Sanity inner ${step.node.name}`, filePath: 'e2e/sanity.test.js', invocation: 1 });
  }
  const [passes, fails, skipped] = tests;
  const passesEnd = lines.find((l) => l.kind === 'end' && l.node.id === passes.node.id);
  assert.ok(passesEnd);
  assert.deepEqual({ ok: passesEnd.fields?.ok, status: passesEnd.fields?.status }, { ok: true, status: 'passed' });
  const failsEnd = lines.find((l) => l.kind === 'end' && l.node.id === fails.node.id);
  assert.deepEqual({ ok: failsEnd?.fields?.ok, status: failsEnd?.fields?.status }, { ok: false, status: 'failed' });
  assert.deepEqual(Object.keys(failsEnd?.fields?.error ?? {}).sort(), ['message', 'name'], 'the error travels as name + message, nothing else');
  assert.ok(String(failsEnd?.fields?.error?.message).includes('toBe'), 'the jest assertion is named');
  assert.ok(!String(failsEnd?.fields?.error?.message).includes('\n    at '), 'never the stack');
  const skippedEnd = lines.find((l) => l.kind === 'end' && l.node.id === skipped.node.id);
  assert.ok(skippedEnd);
  assert.deepEqual({ ok: skippedEnd.fields?.ok, status: skippedEnd.fields?.status }, { ok: true, status: 'skipped' });
  assert.equal(skippedEnd.seq, skipped.seq + 1, 'a skipped test begins and ends at once');

  const refused = lines.find((l) => l.kind === 'begin' && l.node.type === 'rpc' && l.fields?.method === 'allocateDevice' && l.seq > passes.seq);
  assert.ok(refused, 'the test\'s own allocateDevice');
  assert.equal(refused.node.parent, passes.node.id, 'the refused rpc is the passing test\'s child');
  const refusedEnd = lines.find((l) => l.kind === 'end' && l.node.id === refused.node.id);
  assert.equal(refusedEnd?.fields?.ok, false);
  assert.equal(refusedEnd?.fields?.error?.code, DetoxErrorCode.DETOX_NO_MATCHING_DEVICE);
  assert.ok(refusedEnd.seq < passesEnd.seq, 'the rpc ends before its test');

  const fileEnd = lines.find((l) => l.kind === 'end' && l.node.id === file.node.id);
  assert.ok(fileEnd);
  assert.deepEqual({ ok: fileEnd.fields?.ok, status: fileEnd.fields?.status }, { ok: false, status: 'failed' }, 'a file with a failed test ends failed');
  for (const step of steps) {
    if (step.node.id === file.node.id) continue;
    const end = lines.find((l) => l.kind === 'end' && l.node.id === step.node.id);
    assert.ok(end && end.seq < fileEnd.seq, `${step.node.name} ends before the file step`);
  }
  const connEnd = lines.find((l) => l.kind === 'end' && l.node.id === 'conn');
  assert.ok(connEnd && fileEnd.seq < connEnd.seq, 'the file step ends before the connection');
});

/**
 * Test 2 — `detox test` names the run; `detox logs` reads it.
 */
void test('detox test prints the run id and viewer URL last; detox logs prints the outline, narrows with --under, streams --json, lists runs, and refuses typed', async (t) => {
  await using server = await startServer({ dedicated: true, isolatedLogRoot: true, signal: t.signal });
  const token = tokenOf(server.address);
  const project = await writeJestProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: 'jest', config: 'e2e/jest.config.js' } },
      client: { server: server.address.url, token },
      devices: { sim: { type: 'ios.simulator', device: { type: exampleDevice() } } },
      apps: { app: { type: 'ios.app', name: 'app', bundleId: 'com.example.fixture' } },
      configurations: { 'ios.sim': { device: 'sim', app: 'app' } },
    },
    'e2e/jest.config.js': JEST_CONFIG,
    'e2e/sanity.test.js': SANITY_FIXTURE,
  });
  const lane = dialConnectionLog(server.address);

  const result = await runDetoxCli(['test', '-c', 'ios.sim'], { cwd: project.dir, signal: t.signal });
  assert.equal(result.exitCode, 1, `expected exactly the one failing test, output:\n${result.output}`);
  const stdoutLines = nonEmptyLines(result.stdout);
  const runLines = stdoutLines.filter((l) => RUN_LINE_RE.test(l));
  assert.equal(runLines.length, 1, `exactly one run line, stdout:\n${result.stdout}`);
  assert.equal(stdoutLines[stdoutLines.length - 1], runLines[0], 'the run line is the last thing on stdout');
  const runMatch = RUN_LINE_RE.exec(runLines[0]);
  assert.ok(runMatch);
  const runId = runMatch[1];
  assert.ok(runMatch[3] !== undefined, 'this server is gated, so the first line carries the #token hint');
  assert.ok(!result.output.includes(token), 'the token itself appears in no output line');
  const viewerUrl = new URL(runMatch[2]);
  const serverUrl = new URL(server.address.url);
  assert.deepEqual({ host: viewerUrl.hostname, port: viewerUrl.port }, { host: serverUrl.hostname, port: serverUrl.port }, 'the viewer URL is the server\'s HTTP origin');
  const lines = parseNdjson(await lane.fetchUntil(runId, (ls) => ls.some((l) => l.kind === 'end' && l.node.id === 'conn'), { signal: t.signal }));
  assert.ok(lines.length > 0, 'the named run is the one the JSONL is served under');

  // The outline.
  const outline = await runDetoxCli(['logs', runId], { cwd: project.dir, signal: t.signal });
  assert.equal(outline.exitCode, 0, `detox logs failed:\n${outline.output}`);
  const out = nonEmptyLines(outline.stdout);
  const RPC_NAME = `allocateDevice udid ${NO_SUCH_DEVICE}`;
  for (const prefix of ['e2e/sanity.test.js', 'Sanity', 'beforeAll', 'inner', 'passes', RPC_NAME, 'fails', 'skipped']) {
    assert.notEqual(lineAt(out, prefix), -1, `an outline line for ${prefix}, output:\n${outline.stdout}`);
    assert.match(out[lineAt(out, prefix)], DURATION_RE, `${prefix} ends with a duration`);
  }
  assert.ok(lineAt(out, 'e2e/sanity.test.js') < lineAt(out, 'Sanity') && lineAt(out, 'Sanity') < lineAt(out, 'beforeAll') && lineAt(out, 'beforeAll') < lineAt(out, 'inner') && lineAt(out, 'inner') < lineAt(out, 'passes'), 'file, describe, hook, describe, test — in tree order');
  assert.ok(lineAt(out, 'passes') < lineAt(out, RPC_NAME) && lineAt(out, RPC_NAME) < lineAt(out, 'fails') && lineAt(out, 'fails') < lineAt(out, 'skipped'), 'the rpc under its test, then the siblings');
  assert.ok(indentOf(out[lineAt(out, 'e2e/sanity.test.js')]) < indentOf(out[lineAt(out, 'Sanity')]) && indentOf(out[lineAt(out, 'Sanity')]) < indentOf(out[lineAt(out, 'inner')]) && indentOf(out[lineAt(out, 'inner')]) < indentOf(out[lineAt(out, 'passes')]) && indentOf(out[lineAt(out, 'passes')]) < indentOf(out[lineAt(out, RPC_NAME)]), 'depth grows down the tree');
  assert.equal(indentOf(out[lineAt(out, 'fails')]), indentOf(out[lineAt(out, 'passes')]), 'siblings share a depth');
  assert.ok(out[lineAt(out, 'fails')].includes('✗'), 'the failed test wears the mark');
  assert.ok(out[lineAt(out, RPC_NAME)].includes('✗'), 'so does the refused rpc');
  assert.ok(!out[lineAt(out, 'passes')].includes('✗'));
  assert.ok(!outline.stdout.includes('Looking for a matching device'), 'narration ticks are not in the default outline');
  const all = await runDetoxCli(['logs', runId, '--all'], { cwd: project.dir, signal: t.signal });
  assert.equal(all.exitCode, 0);
  const tick = all.stdout.split('\n').find((l) => l.includes('Looking for a matching device'));
  assert.ok(tick, '--all prints the ticks');
  assert.match(tick, /^\s+(debug|info|warn|error)│/, 'a tick is indented under its node with its level');

  // --under narrows every view.
  const underInner = await runDetoxCli(['logs', runId, '--under', 'inner'], { cwd: project.dir, signal: t.signal });
  assert.equal(underInner.exitCode, 0);
  const innerOut = nonEmptyLines(underInner.stdout);
  assert.ok(innerOut[0].startsWith('inner'), 'the subtree root is first, at depth 0');
  assert.ok(lineAt(innerOut, 'passes') !== -1 && lineAt(innerOut, 'fails') !== -1 && lineAt(innerOut, 'skipped') !== -1);
  assert.equal(lineAt(innerOut, 'Sanity'), -1, 'the ancestors are not printed');
  const underPasses = await runDetoxCli(['logs', runId, '--under', 'passes'], { cwd: project.dir, signal: t.signal });
  const passesOut = nonEmptyLines(underPasses.stdout);
  assert.ok(passesOut[0].startsWith('passes'));
  assert.notEqual(lineAt(passesOut, RPC_NAME), -1, 'the rpc under it');
  assert.equal(lineAt(passesOut, 'fails'), -1);
  const underFullName = await runDetoxCli(['logs', runId, '--under', 'Sanity inner'], { cwd: project.dir, signal: t.signal });
  assert.equal(underFullName.stdout, underInner.stdout, 'a fullName selects the same subtree as the name');
  const underNothing = await runDetoxCli(['logs', runId, '--under', 'no-such-node'], { cwd: project.dir, signal: t.signal });
  assert.equal(underNothing.exitCode, 2);
  assert.ok(underNothing.output.includes('no-such-node'), 'the refusal names what was searched');
  const underHooks = await runDetoxCli(['logs', runId, '--under', 'beforeAll'], { cwd: project.dir, signal: t.signal });
  assert.equal(underHooks.exitCode, 0);
  const hookRoots = nonEmptyLines(underHooks.stdout).filter((l) => l.startsWith('beforeAll'));
  assert.equal(hookRoots.length, 2, 'two matches, each subtree printed at depth 0');
  assert.ok(nonEmptyLines(underHooks.stdout).length > 2, 'a heading line between the subtrees');

  // --json is the file, byte for byte; --under --json is the subtree's lines.
  const json = await runDetoxCli(['logs', runId, '--json'], { cwd: project.dir, signal: t.signal });
  assert.equal(json.exitCode, 0);
  assert.equal(json.stdout, await lane.fetch(runId), '--json is GET /v1/runs/<id>/log, byte for byte');
  const innerBegin = lines.find((l) => l.kind === 'begin' && l.node.type === 'step' && l.node.name === 'inner');
  assert.ok(innerBegin);
  const subtree = new Set([innerBegin.node.id]);
  for (const l of lines) if (l.kind === 'begin' && l.node.parent !== undefined && subtree.has(l.node.parent)) subtree.add(l.node.id);
  const innerJson = await runDetoxCli(['logs', runId, '--under', 'inner', '--json'], { cwd: project.dir, signal: t.signal });
  assert.equal(innerJson.exitCode, 0);
  assert.deepEqual(parseNdjson(innerJson.stdout).map((l) => l.seq), lines.filter((l) => subtree.has(l.node.id)).map((l) => l.seq), 'the subtree\'s own lines, in seq order');

  // The index, and the refusals.
  const list = await runDetoxCli(['logs'], { cwd: project.dir, signal: t.signal });
  assert.equal(list.exitCode, 0);
  const index = await lane.index();
  const rows = nonEmptyLines(list.stdout);
  assert.equal(rows.length, index.length, 'one line per run');
  const row = rows.find((l) => l.includes(runId));
  assert.ok(row);
  assert.ok(row.includes(index[0].startedAt) && row.includes('ended') && row.includes(String(index[0].lastSeq)));
  const unknown = await runDetoxCli(['logs', 'no-such-run'], { cwd: project.dir, signal: t.signal });
  assert.equal(unknown.exitCode, 2);
  assert.ok(unknown.output.includes('no-such-run') && unknown.output.includes(serverUrl.host), 'the refusal names the id and the server');
  assert.ok(!unknown.output.includes('\n    at '), 'never a stack');
  const serverless = await writeProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: 'jest', config: 'e2e/jest.config.js' } },
      devices: { sim: { type: 'ios.simulator', device: { type: exampleDevice() } } },
      apps: { app: { type: 'ios.app', name: 'app', bundleId: 'com.example.fixture' } },
      configurations: { 'ios.sim': { device: 'sim', app: 'app' } },
    },
  });
  const noServer = await runDetoxCli(['logs', runId], {
    cwd: serverless.dir,
    env: { DETOX_LOCAL_HELPER_ROOT: mkdtempSync(path.join(tmpdir(), 'detox-spec013-no-helper-')) },
    signal: t.signal,
  });
  assert.equal(noServer.exitCode, 2, 'no client.server and no helper cookie is a typed refusal, never a spawned helper');
  assert.ok(noServer.output.includes('client.server'));
  assert.ok(!noServer.output.includes('\n    at '));
});

/**
 * Test 3 — `--failures` is the diagnosis, not the file.
 */
void test('--failures prints one block per innermost failed node — ancestors, the node, its error, the ticks under it — in seq order, and says so when there is none', async (t) => {
  await using server = await startServer({ dedicated: true, isolatedLogRoot: true, signal: t.signal });
  const token = tokenOf(server.address);
  const project = await writeJestProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: 'jest', config: 'e2e/jest.config.js' } },
      client: { server: server.address.url, token },
      devices: { sim: { type: 'ios.simulator', device: { type: exampleDevice() } } },
      apps: { app: { type: 'ios.app', name: 'app', bundleId: 'com.example.fixture' } },
      configurations: { 'ios.sim': { device: 'sim', app: 'app' } },
    },
    'e2e/jest.config.js': JEST_CONFIG,
    'e2e/sanity.test.js': SANITY_FIXTURE,
  });
  const lane = dialConnectionLog(server.address);

  const result = await runDetoxCli(['test', '-c', 'ios.sim'], { cwd: project.dir, signal: t.signal });
  assert.equal(result.exitCode, 1, `expected exactly the one failing test, output:\n${result.output}`);
  const runId = (await lane.index())[0].runId;
  const lines = parseNdjson(await lane.fetchUntil(runId, (ls) => ls.some((l) => l.kind === 'end' && l.node.id === 'conn'), { signal: t.signal }));
  const refusedEnd = lines.find((l) => l.kind === 'end' && l.node.type === 'rpc' && l.fields?.ok === false && l.fields?.error?.code === DetoxErrorCode.DETOX_NO_MATCHING_DEVICE);
  assert.ok(refusedEnd);

  const failures = await runDetoxCli(['logs', runId, '--failures'], { cwd: project.dir, signal: t.signal });
  assert.equal(failures.exitCode, 0, `--failures failed:\n${failures.output}`);
  const out = failures.stdout.split('\n');
  const RPC_NAME = `allocateDevice udid ${NO_SUCH_DEVICE}`;
  const rpcLine = lineAt(out, RPC_NAME);
  const failsLine = lineAt(out, 'fails');
  assert.notEqual(rpcLine, -1, `a block for the refused rpc, output:\n${failures.stdout}`);
  assert.notEqual(failsLine, -1, `a block for the failed test, output:\n${failures.stdout}`);
  assert.ok(rpcLine < failsLine, 'blocks in seq order: the passing test\'s rpc ran before the failing test');
  assert.ok(out[rpcLine].includes(`✗ ${String(DetoxErrorCode.DETOX_NO_MATCHING_DEVICE)}`), 'the rpc line wears the mark and the code');
  assert.ok(out[failsLine].includes('✗'));
  assert.match(out[rpcLine], DURATION_RE);
  assert.match(out[failsLine], DURATION_RE);
  // Each block: the ancestor chain from the file down, in order, directly above the node.
  assert.deepEqual(out.slice(rpcLine - 4, rpcLine).map(nameColumn), ['e2e/sanity.test.js', 'Sanity', 'inner', 'passes'], 'the rpc\'s chain: file › Sanity › inner › passes');
  assert.deepEqual(out.slice(failsLine - 3, failsLine).map(nameColumn), ['e2e/sanity.test.js', 'Sanity', 'inner'], 'the failed test\'s chain: file › Sanity › inner');
  assert.equal(out[failsLine - 4], '', 'blocks are separated by a blank line');
  // The rpc block: its wire error, then the ticks under it.
  const rpcBlock = blockAfter(out, rpcLine);
  assert.ok(rpcBlock.some((l) => l.includes(String(DetoxErrorCode.DETOX_NO_MATCHING_DEVICE)) && l.includes(String(refusedEnd.fields?.error?.message))), 'the wire error code and message');
  assert.ok(rpcBlock.some((l) => l.includes('│') && l.includes('allocateDevice — query')), 'the query tick under the rpc');
  assert.ok(rpcBlock.some((l) => l.includes('│') && l.includes('Looking for a matching device')), 'the narration tick under the rpc');
  // The failed test's block: its error, and honestly no ticks (nothing narrated under it).
  const failsBlock = blockAfter(out, failsLine);
  assert.ok(failsBlock.some((l) => l.includes('toBe')), 'the jest assertion, as name: message');
  assert.ok(failsBlock.every((l) => !l.includes('│')), 'no tick landed under the failed test');
  // Only what a diagnosis needs.
  assert.equal(lineAt(out, 'skipped'), -1, 'a skipped test is not a failure');
  assert.equal(lineAt(out, 'beforeAll'), -1, 'a passing hook is nobody\'s ancestor here');
  assert.ok(!failures.stdout.includes('"seq"') && !failures.stdout.includes('step:') && !failures.stdout.includes('rpc:'), 'no ids, no JSON — a human\'s text');
  assert.ok(out.every((l) => !l.trimStart().startsWith('{')), 'no raw lines');

  const clean = await connect({ server: server.address, signal: t.signal });
  const cleanId = clean.runId;
  await clean.disconnect();
  await lane.fetchUntil(cleanId, (ls) => ls.some((l) => l.kind === 'end' && l.node.id === 'conn'), { signal: t.signal });
  const none = await runDetoxCli(['logs', String(cleanId), '--failures'], { cwd: project.dir, signal: t.signal });
  assert.equal(none.exitCode, 0);
  assert.equal(none.stdout.trim(), `no failures in run ${String(cleanId)}`);
});

/**
 * Test 4 — what the processes printed is in the log.
 */
void test('a spawned tool is a sub-operation with argv, exit code and (at debug) its stdout lines; the app\'s own stdout/stderr stream in under its launch until terminate, within the budget', async (t) => {
  // Part A: the registry's own child process, under the request it served.
  await using server = await startServer({ dedicated: true, isolatedLogRoot: true, logLevel: 'debug', signal: t.signal });
  const token = tokenOf(server.address);
  const project = await writeJestProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: 'jest', config: 'e2e/jest.config.js' } },
      client: { server: server.address.url, token },
      devices: { sim: { type: 'ios.simulator', device: { type: exampleDevice() } } },
      apps: { app: { type: 'ios.app', name: 'app', bundleId: 'com.example.fixture' } },
      configurations: { 'ios.sim': { device: 'sim', app: 'app' } },
    },
    'e2e/jest.config.js': JEST_CONFIG,
    'e2e/refuse.test.js': `
const detox = require('detox');

it('asks for a device that does not exist', async () => {
  await expect(
    detox.session.allocateDevice({ type: 'ios.simulator', device: { deviceId: '${NO_SUCH_DEVICE}' } }),
  ).rejects.toThrow();
});
`,
  });
  const lane = dialConnectionLog(server.address);
  const result = await runDetoxCli(['test', '-c', 'ios.sim'], { cwd: project.dir, signal: t.signal });
  assert.equal(result.exitCode, 0, `expected a green run, output:\n${result.output}`);
  const runId = (await lane.index())[0].runId;
  const lines = parseNdjson(await lane.fetchUntil(runId, (ls) => ls.some((l) => l.kind === 'end' && l.node.id === 'conn'), { signal: t.signal }));
  const refused = lines.find((l) => l.kind === 'begin' && l.node.type === 'rpc' && l.fields?.method === 'allocateDevice' && l.node.parent !== undefined && lines.some((s) => s.kind === 'begin' && s.node.id === l.node.parent && s.fields?.kind === 'test'));
  assert.ok(refused, 'the test\'s refused allocateDevice');
  const child = lines.find((l) => l.kind === 'begin' && l.node.parent === refused.node.id && l.fields?.op === 'applesimutils');
  assert.ok(child, 'the listing the registry ran to refuse it is a child of the request');
  assert.match(child.node.id, /^rpc:\d+\/applesimutils$/);
  assert.equal(child.node.type, 'rpc');
  assert.deepEqual(child.fields?.argv, ['applesimutils', '--list', '--byId', NO_SUCH_DEVICE], 'the full argv, never a shell string');
  const childEnd = lines.find((l) => l.kind === 'end' && l.node.id === child.node.id);
  assert.ok(childEnd);
  assert.deepEqual({ ok: childEnd.fields?.ok, exitCode: childEnd.fields?.exitCode }, { ok: true, exitCode: 0 });
  assert.equal(typeof childEnd.fields?.durationMs, 'number');
  assert.ok(childEnd.seq < (lines.find((l) => l.kind === 'end' && l.node.id === refused.node.id)?.seq ?? 0), 'the child ends before its request');
  const childStdout = lines.filter((l) => l.kind === 'log' && l.node.id === child.node.id && l.fields?.stream === 'stdout');
  assert.ok(childStdout.length >= 1, 'at --log-level debug a healthy child\'s stdout is stored');
  assert.equal(childStdout[0].fields?.line, 1, 'lines count from 1');
  assert.equal(childStdout[0].level, 'debug');
  // applesimutils prints an empty listing as `[`, a blank line, `]` — the first line is `[`.
  assert.equal(childStdout[0].msg, '[', 'the first line of the tool\'s JSON: nothing matched');

  // Part B: the app's own output, under its launch, until terminate.
  const frameworkPath = await resolveDetoxFrameworkExternally(t.signal);
  const probe = await createSimulatorExternally('detox-spec013-output', t.signal);
  try {
    const appPath = await buildHelloAppExternally('com.detox.hello.output', t.signal);
    await using nodeA = await startServer({ dedicated: true, isolatedLogRoot: true, isolatedBlobStore: true, iosDetoxFrameworkPath: frameworkPath, signal: t.signal });
    const laneA = dialConnectionLog(nodeA.address);
    const detox = await connect({ server: nodeA.address, signal: t.signal });
    const runA = detox.runId;
    const device = await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid }, signal: t.signal });
    await device.installApp(appPath);
    const app = await device.launchApp('com.detox.hello.output');
    // The injected Detox framework prints its own stderr lines before the app's, so the app's line is found by its text, never as stderr line 1.
    const seen = parseNdjson(await laneA.fetchUntil(runA, (ls) => ls.some((l) => l.kind === 'log' && l.fields?.pid === app.pid && l.fields?.stream === 'stdout') && ls.some((l) => l.kind === 'log' && l.fields?.pid === app.pid && l.fields?.stream === 'stderr' && l.msg === 'DetoxHello: stderr is live'), { signal: t.signal, timeoutMs: 60_000 }));
    const launch = seen.find((l) => l.kind === 'begin' && l.node.type === 'rpc' && l.fields?.method === 'launchApp');
    assert.ok(launch);
    const stdoutLine = seen.find((l) => l.kind === 'log' && l.fields?.pid === app.pid && l.fields?.stream === 'stdout');
    const stderrLine = seen.find((l) => l.kind === 'log' && l.fields?.pid === app.pid && l.fields?.stream === 'stderr' && l.msg === 'DetoxHello: stderr is live');
    assert.ok(stdoutLine && stderrLine);
    assert.deepEqual({ node: stdoutLine.node.id, level: stdoutLine.level, msg: stdoutLine.msg, line: stdoutLine.fields?.line }, { node: launch.node.id, level: 'debug', msg: 'DetoxHello: launched', line: 1 }, 'the app\'s stdout line, under the launch node');
    assert.deepEqual({ node: stderrLine.node.id, level: stderrLine.level, msg: stderrLine.msg }, { node: launch.node.id, level: 'debug', msg: 'DetoxHello: stderr is live' }, 'the app\'s stderr line, under the launch node');
    assert.equal(typeof stderrLine.fields?.line, 'number', 'numbered within its stream, after the framework\'s own lines');
    assert.ok(stdoutLine.seq > launch.seq && stderrLine.seq > launch.seq);
    await app.terminate();
    await detox.disconnect();
    const all = parseNdjson(await laneA.fetchUntil(runA, (ls) => ls.some((l) => l.kind === 'end' && l.node.id === 'conn'), { signal: t.signal }));
    const terminateEnd = all.find((l) => l.kind === 'end' && l.node.type === 'rpc' && all.some((b) => b.kind === 'begin' && b.node.id === l.node.id && b.fields?.method === 'terminateApp'));
    assert.ok(terminateEnd);
    assert.ok(all.every((l) => !(l.kind === 'log' && l.fields?.pid === app.pid && l.seq > terminateEnd.seq)), 'after terminateApp no further line for that pid');
    assert.ok(!all.some((l) => l.level === 'warn' && l.msg === 'app output truncated'), 'two short lines are well within the default budget');

    // The budget: past it, one warn line and nothing more for that pid.
    await using nodeB = await startServer({ dedicated: true, isolatedLogRoot: true, isolatedBlobStore: true, iosDetoxFrameworkPath: frameworkPath, appOutputBudget: 8, signal: t.signal });
    const laneB = dialConnectionLog(nodeB.address);
    const tight = await connect({ server: nodeB.address, signal: t.signal });
    const runB = tight.runId;
    const deviceB = await tight.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid }, signal: t.signal });
    await deviceB.installApp(appPath);
    const appB = await deviceB.launchApp('com.detox.hello.output');
    const truncated = parseNdjson(await laneB.fetchUntil(runB, (ls) => ls.some((l) => l.level === 'warn' && l.msg === 'app output truncated' && l.fields?.pid === appB.pid), { signal: t.signal, timeoutMs: 60_000 }));
    const warns = truncated.filter((l) => l.level === 'warn' && l.msg === 'app output truncated' && l.fields?.pid === appB.pid);
    assert.equal(warns.length, 1, 'exactly one warn');
    assert.equal(warns[0].fields?.budget, 'exhausted');
    assert.equal(truncated.filter((l) => l.kind === 'log' && l.fields?.pid === appB.pid && l.fields?.stream !== undefined).length, 0, 'an 8-byte budget stores no line at all');
    await appB.terminate();
    await tight.disconnect();
    const afterB = parseNdjson(await laneB.fetchUntil(runB, (ls) => ls.some((l) => l.kind === 'end' && l.node.id === 'conn'), { signal: t.signal }));
    assert.equal(afterB.filter((l) => l.kind === 'log' && l.fields?.pid === appB.pid).length, 1, 'still just the one warn for that pid');

    // The outline prints the app's lines under its launch.
    const viewer = await writeProject({
      '.detoxrc.js': {
        testRunner: { args: { $0: 'jest', config: 'e2e/jest.config.js' } },
        client: { server: nodeA.address.url, token: tokenOf(nodeA.address) },
        devices: { sim: { type: 'ios.simulator', device: { type: exampleDevice() } } },
        apps: { app: { type: 'ios.app', name: 'app', bundleId: 'com.detox.hello.output' } },
        configurations: { 'ios.sim': { device: 'sim', app: 'app' } },
      },
    });
    const underLaunch = await runDetoxCli(['logs', String(runA), '--under', 'launchApp', '--all'], { cwd: viewer.dir, signal: t.signal });
    assert.equal(underLaunch.exitCode, 0, `detox logs failed:\n${underLaunch.output}`);
    const out = nonEmptyLines(underLaunch.stdout);
    assert.ok(out[0].startsWith('launchApp com.detox.hello.output'), 'the launch is the subtree root');
    const stdoutRow = out[lineAt(out, 'stdout│')];
    // The framework's own stderr rows print first; the app's is found by its text.
    const stderrRow = out[lineAt(out, 'stderr│ DetoxHello: stderr is live')];
    assert.ok(stdoutRow !== undefined && stdoutRow.includes('DetoxHello: launched'), 'stdout│ prefixed, indented under the launch');
    assert.ok(stderrRow !== undefined && stderrRow.includes('DetoxHello: stderr is live'), 'stderr│ prefixed, indented under the launch');
    assert.ok(indentOf(stdoutRow) > 0);
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 5 — `test.concurrent` never mis-parents.
 */
void test('two overlapping test.concurrent bodies each own their RPC: explicit parenting, never "most recently begun"', async (t) => {
  await using server = await startServer({ dedicated: true, isolatedLogRoot: true, signal: t.signal });
  const token = tokenOf(server.address);
  const project = await writeJestProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: 'jest', config: 'e2e/jest.config.js' } },
      client: { server: server.address.url, token },
      devices: { sim: { type: 'ios.simulator', device: { type: exampleDevice() } } },
      apps: { app: { type: 'ios.app', name: 'app', bundleId: 'com.example.fixture' } },
      configurations: { 'ios.sim': { device: 'sim', app: 'app' } },
    },
    'e2e/jest.config.js': JEST_CONFIG,
    'e2e/concurrent.test.js': `
const detox = require('detox');

const refuse = (marker) =>
  detox.session.allocateDevice({ type: 'ios.simulator', device: { deviceId: '00000000-0000-0000-0000-00000000000' + marker } });

test.concurrent('first', async () => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  await expect(refuse('1')).rejects.toThrow();
});

test.concurrent('second', async () => {
  await expect(refuse('2')).rejects.toThrow();
});
`,
  });
  const lane = dialConnectionLog(server.address);

  const result = await runDetoxCli(['test', '-c', 'ios.sim'], { cwd: project.dir, signal: t.signal });
  assert.equal(result.exitCode, 0, `expected a green run, output:\n${result.output}`);
  const runId = (await lane.index())[0].runId;
  const lines = parseNdjson(await lane.fetchUntil(runId, (ls) => ls.some((l) => l.kind === 'end' && l.node.id === 'conn'), { signal: t.signal }));

  const first = lines.find((l) => l.kind === 'begin' && l.node.type === 'step' && l.fields?.kind === 'test' && l.node.name === 'first');
  const second = lines.find((l) => l.kind === 'begin' && l.node.type === 'step' && l.fields?.kind === 'test' && l.node.name === 'second');
  assert.ok(first && second);
  const firstEnd = lines.find((l) => l.kind === 'end' && l.node.id === first.node.id);
  const secondEnd = lines.find((l) => l.kind === 'end' && l.node.id === second.node.id);
  assert.ok(firstEnd && secondEnd);
  assert.ok(first.seq < second.seq && second.seq < firstEnd.seq, 'both tests were open at once: the second began before the first ended');
  assert.deepEqual([firstEnd.fields?.status, secondEnd.fields?.status], ['passed', 'passed']);

  const refusals = lines.filter((l) => l.kind === 'begin' && l.node.type === 'rpc' && l.fields?.method === 'allocateDevice' && l.seq > first.seq);
  assert.equal(refusals.length, 2, 'one refused allocateDevice per test');
  const ofFirst = refusals.find((l) => JSON.stringify(l.fields?.params).includes('00000000-0000-0000-0000-000000000001'));
  const ofSecond = refusals.find((l) => JSON.stringify(l.fields?.params).includes('00000000-0000-0000-0000-000000000002'));
  assert.ok(ofFirst && ofSecond);
  assert.equal(ofFirst.node.parent, first.node.id, 'the first test\'s rpc is parented to the first test');
  assert.equal(ofSecond.node.parent, second.node.id, 'the second test\'s rpc is parented to the second test — not to whichever test began last');
  assert.ok(ofSecond.seq < ofFirst.seq, 'and the second\'s rpc was in fact sent first (the jitter made the tests overlap)');

  const underFirst = await runDetoxCli(['logs', runId, '--under', 'first'], { cwd: project.dir, signal: t.signal });
  assert.equal(underFirst.exitCode, 0);
  const firstRpcs = nonEmptyLines(underFirst.stdout).filter((l) => l.trimStart().startsWith('allocateDevice udid'));
  assert.equal(firstRpcs.length, 1);
  assert.ok(firstRpcs[0].includes('00000000-0000-0000-0000-000000000001'));
  const underSecond = await runDetoxCli(['logs', runId, '--under', 'second'], { cwd: project.dir, signal: t.signal });
  const secondRpcs = nonEmptyLines(underSecond.stdout).filter((l) => l.trimStart().startsWith('allocateDevice udid'));
  assert.equal(secondRpcs.length, 1);
  assert.ok(secondRpcs[0].includes('00000000-0000-0000-0000-000000000002'));
});
