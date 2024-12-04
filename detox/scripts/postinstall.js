const { platform, env } = process;

const { patchGradleByRNVersion } = require('./updateGradle');

const isDarwin = platform === 'darwin';
const shouldInstallDetox = !env.DETOX_DISABLE_POSTINSTALL;

if (isDarwin && shouldInstallDetox) {
  const execFileSync = require('child_process').execFileSync;

  execFileSync(`${__dirname}/build_local_framework.ios.sh`, { stdio: 'inherit' });
  execFileSync(`${__dirname}/build_local_xcuitest.ios.sh`, { stdio: 'inherit' });
}

patchGradleByRNVersion();
