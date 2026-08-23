const fs = require('fs');
const cp = require('child_process');
const { patchGradleByRNVersion } = require('../../scripts/updateGradle');

const patchBoostPodspec = () => {
  const log = message => console.log(`[POST-INSTALL] ${message}`);
  const boostPodspecPath = `${process.cwd()}/node_modules/react-native/third-party-podspecs/boost.podspec`;
  const originalUrl = 'https://boostorg.jfrog.io/artifactory/main/release/1.76.0/source/boost_1_76_0.tar.bz2';
  const patchedUrl = 'https://archives.boost.io/release/1.76.0/source/boost_1_76_0.tar.bz2';

  if (!fs.existsSync(boostPodspecPath)) {
    log('boost.podspec does not exist, skipping patch...');
    return;
  }

  let boostPodspec = fs.readFileSync(boostPodspecPath, 'utf8');

  if (!boostPodspec.includes(originalUrl)) {
    log('boost.podspec is already patched or the URL is different, skipping patch...');
    return;
  }

  log('Applying boost.podspec patch...');
  boostPodspec = boostPodspec.replace(originalUrl, patchedUrl);
  fs.writeFileSync(boostPodspecPath, boostPodspec, 'utf8');
};

function podInstallIfRequired() {
  if (process.platform === 'darwin' && !process.env.DETOX_DISABLE_POD_INSTALL) {
    console.log('[POST-INSTALL] Running pod install...');
    patchBoostPodspec();

    cp.execSync('pod install', {
      cwd: `${process.cwd()}/ios`,
      stdio: 'inherit'
    });
  }
}

console.log('[POST-INSTALL] Running Detox\'s test-app post-install script...');
podInstallIfRequired();
// Android is disabled on the v21 alpha branch; the gradle patch runs on demand.
if (process.env.DETOX_ANDROID_POSTINSTALL === '1') {
  patchGradleByRNVersion();
}
console.log('[POST-INSTALL] Completed!');
