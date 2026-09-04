const { platform, env } = process;

const { patchGradleByRNVersion } = require('./updateGradle');

const isDarwin = platform === 'darwin';
const shouldInstallDetox = !env.DETOX_DISABLE_POSTINSTALL;

/**
 * The build scripts refuse when Xcode is missing, because a caller who asked
 * for a framework build must not be told it succeeded. An install is the one
 * caller that did not ask: `npm install` on a Mac without Xcode has to finish.
 * So the check lives here too, and this is the only place that turns a missing
 * Xcode into a skip — a script that runs and then fails still fails the
 * install, as it did before.
 */
function hasXcode() {
  try {
    require('child_process').execFileSync('xcodebuild', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

if (isDarwin && shouldInstallDetox) {
  const execFileSync = require('child_process').execFileSync;

  if (hasXcode()) {
    execFileSync(`${__dirname}/build_local_framework.ios.sh`, { stdio: 'inherit' });

    // The XCUITest runner is not wired into the v21 alpha yet; build it on demand.
    if (env.DETOX_BUILD_XCUITEST === '1') {
      execFileSync(`${__dirname}/build_local_xcuitest.ios.sh`, { stdio: 'inherit' });
    }
  } else {
    console.warn(
      'detox: Xcode is not installed, so the Detox framework was not built.\n' +
        '       Install Xcode and run `detox build-framework-cache` before running tests.',
    );
  }
}

// Android is disabled on the v21 alpha branch; the gradle patch runs on demand.
if (env.DETOX_ANDROID_POSTINSTALL === '1') {
  patchGradleByRNVersion();
}
