const { platform, env } = process;

const { patchGradleByRNVersion } = require('./updateGradle');

const isDarwin = platform === 'darwin';
const shouldInstallDetox = !env.DETOX_DISABLE_POSTINSTALL;

if (isDarwin && shouldInstallDetox) {
  const execFileSync = require('child_process').execFileSync;

  execFileSync(`${__dirname}/build_local_framework.ios.sh`, { stdio: 'inherit' });

  // The XCUITest runner is not wired into the v21 alpha yet; build it on demand.
  if (env.DETOX_BUILD_XCUITEST === '1') {
    execFileSync(`${__dirname}/build_local_xcuitest.ios.sh`, { stdio: 'inherit' });
  }
}

// Android is disabled on the v21 alpha branch; the gradle patch runs on demand.
if (env.DETOX_ANDROID_POSTINSTALL === '1') {
  patchGradleByRNVersion();
}
