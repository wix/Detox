#!/usr/bin/env node
/**
 * A pack-time warning, not a gate.
 *
 * `Detox-ios-framework.tbz` is what the tarball's postinstall extracts into
 * `~/Library/Detox/ios/framework/<hash>/`, and the server injects that binary
 * via `SIMCTL_CHILD_DYLD_INSERT_LIBRARIES` on every launch. It is built by
 * Xcode, so `prepack` cannot produce it (packing must keep working on Linux) —
 * which means a `npm publish` from a fresh clone would quietly ship a tarball
 * whose `launchApp` can never instrument an app.
 *
 * Build it first with `yarn package:ios` (sources + framework + XCUITest), or
 * framework-only:
 *
 *   cd detox && scripts/build_framework.ios.sh ios/Detox.xcodeproj /tmp/fw \
 *     && tar --exclude-from=ios/.tbzignore -cjf Detox-ios-framework.tbz -C /tmp/fw .
 */
const fs = require('node:fs');
const path = require('node:path');

const tbz = path.join(__dirname, '..', 'Detox-ios-framework.tbz');

if (fs.existsSync(tbz)) {
  const mb = (fs.statSync(tbz).size / 1e6).toFixed(1);
  console.log(`detox: packing Detox-ios-framework.tbz (${mb} MB)`);
} else {
  console.warn(
    'detox: WARNING — Detox-ios-framework.tbz is missing, so this tarball will\n' +
      '       install without a Detox.framework and `launchApp` will refuse to\n' +
      '       instrument apps. Run `yarn package:ios` before publishing.',
  );
}
