import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Every workspace installs its own copy of `ws` (nmHoistingLimits:
    // workspaces); `vi.mock('ws')` in one package must hit the same module
    // id the client sources import, so `ws` resolves from the root once.
    dedupe: ['ws'],
    // Unit tests must exercise sources: the `detox` package's entry points
    // are shims over dist/, which is a build artifact — stale or absent
    // under vitest. Mirrors the root tsconfig `paths`.
    alias: [
      {
        find: /^detox\/client$/,
        replacement: path.resolve(import.meta.dirname, 'detox/src/client.ts'),
      },
      {
        // `.` is the compat surface since spec 009 — runtime, types,
        // and this unit-test alias must all agree.
        find: /^detox$/,
        replacement: path.resolve(import.meta.dirname, 'packages/compat/src/index.ts'),
      },
    ],
  },
  test: {
    environment: 'node',
    include: ['packages/*/src/**/*.test.ts', 'detox/src/**/*.test.ts', '*.test.mjs'],
    coverage: {
      provider: 'v8',
      // Scope = unit-testable sources. SimulatorOps is a thin wrapper over
      // real simctl/applesimutils and is covered by acceptance only (its
      // natural boundary); demo/ and cli.ts are process entry points.
      include: ['packages/*/src/**/*.ts', 'detox/src/**/*.ts'],
      exclude: [
        '**/__tests__/**',
        '**/*.test.ts',
        'packages/server/src/cli.ts',
        // Same rationale as the server's: a process entry point, exercised by
        // spawn in the relay integration suite (which coverage cannot see).
        // Its logic lives in cli-config.ts/nodes.ts, which are unit-gated.
        'packages/relay/src/cli.ts',
        // The extracted CLI mains (spec 009: `detox server`/`detox relay`
        // delegate to them, the legacy bins shell over them). Process shells
        // still: process.exit, signal handlers, console — spawn-exercised by
        // the accept suite. Known debt: the server main's flag parsing is
        // not unit-gated the way the relay's resolveRelayCli is.
        'packages/server/src/cli-main.ts',
        'packages/relay/src/cli-main.ts',
        // The `detox` bin's process shell (spec 009): dispatch, spawn,
        // signals, process.exit — spawn-exercised by the accept suite. All
        // composition logic lives in this package's other modules, which
        // are unit-gated.
        'packages/cli/src/main.ts',
        // The detached helper's process orchestration (spec 011): flock-ish
        // filesystem lock, detached child spawn, IPC readiness and live HTTP
        // probes are spawn-exercised by accept 011 and verify-pack. Unit tests
        // cover the contested no-overlap refusals, but function coverage would
        // otherwise force brittle tests of private process wiring.
        'packages/cli/src/local-helper.ts',
        'packages/driver-ios/src/SimulatorOps.ts',
      ],
      // Function-call coverage is a tripwire against entirely untested
      // files, not a quality metric — branch/line thresholds are absent
      // (Goodhart trap; mutation testing is the planned quality metric).
      thresholds: {
        functions: 100,
      },
    },
  },
});
