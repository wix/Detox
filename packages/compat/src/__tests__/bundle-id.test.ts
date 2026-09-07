/**
 * `bundleId` derivation units (spec 009): derived from a real
 * `Info.plist` through the real PlistBuddy (macOS is this repo's platform),
 * memoized per binary path, evicted on failure, refusal in v20's own words.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it, beforeEach } from 'vitest';

import { clearBundleIdCache, getBundleIdFromBinary } from '../bundle-id';
import { init } from '../index';

const PLIST = (bundleId: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>${bundleId}</string>
</dict>
</plist>
`;

function writeApp(bundleId: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'detox-bundle-id-'));
  const app = path.join(dir, 'example.app');
  mkdirSync(app);
  writeFileSync(path.join(app, 'Info.plist'), PLIST(bundleId));
  return app;
}

describe('getBundleIdFromBinary', () => {
  beforeEach(() => clearBundleIdCache());

  it.skipIf(process.platform !== 'darwin')(
    'reads CFBundleIdentifier out of the app bundle',
    async () => {
      const app = writeApp('com.wix.detox-example');
      await expect(getBundleIdFromBinary(app)).resolves.toBe('com.wix.detox-example');
    },
  );

  it.skipIf(process.platform !== 'darwin')(
    'memoizes per binary path — one PlistBuddy child per app, v20 behaviour',
    async () => {
      const app = writeApp('com.wix.memoized');
      const first = getBundleIdFromBinary(app);
      const second = getBundleIdFromBinary(app);
      expect(second).toBe(first);
      await expect(first).resolves.toBe('com.wix.memoized');
    },
  );

  it('refuses a bundle with no Info.plist, naming the path in v20\'s words', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'detox-bundle-id-'));
    const app = path.join(dir, 'hollow.app');
    mkdirSync(app);
    await expect(getBundleIdFromBinary(app)).rejects.toThrow(
      /CFBundleIdentifier not found inside Info\.plist/,
    );
  });

  /**
   * @issue DTX-4033
   * A failed read is evicted from the cache — this cache is module-scoped, so it outlives one
   * init, and a transient failure must not poison every later init in the process.
   */
  it.skipIf(process.platform !== 'darwin')(
    'does not cache a failure — the module cache outlives one init, a transient red must not',
    async () => {
      const dir = mkdtempSync(path.join(tmpdir(), 'detox-bundle-id-'));
      const app = path.join(dir, 'late.app');
      mkdirSync(app);
      await expect(getBundleIdFromBinary(app)).rejects.toThrow();
      writeFileSync(path.join(app, 'Info.plist'), PLIST('com.wix.late'));
      await expect(getBundleIdFromBinary(app)).resolves.toBe('com.wix.late');
    },
  );

  it('takes an AbortSignal and rejects when it is already aborted', async () => {
    const app = writeApp('com.wix.aborted');
    const controller = new AbortController();
    controller.abort();
    await expect(getBundleIdFromBinary(app, controller.signal)).rejects.toThrow();
  });
});

describe('init with a derivable app config', () => {
  it('an app with NEITHER bundleId nor binaryPath refuses at init, naming both — never a deferred failure', async () => {
    await expect(
      init({
        server: { url: 'ws://127.0.0.1:9' },
        device: {},
        apps: [{ name: 'hollow' }],
      }),
    ).rejects.toThrow(/neither bundleId nor binaryPath/);
  });
});
