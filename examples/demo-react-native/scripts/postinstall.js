const fs = require('fs-extra');
const path = require('path');
const cp = require('child_process');

function patchBoostPodspec() {
  // Patch boost.podspec.json to use a different source URL due to an issue with the original
  // one https://github.com/boostorg/boost/issues/843
  console.log('[POST-INSTALL] Applying boost.podspec patch...');

  const boostPodspecPath = path.join(process.cwd(), 'node_modules', 'react-native', 'third-party-podspecs', 'boost.podspec');
  const boostPodspec = fs.readFileSync(boostPodspecPath, 'utf8');
  const boostPodspecPatched = boostPodspec.replace(
    'https://boostorg.jfrog.io/artifactory/main/release/1.76.0/source/boost_1_76_0.tar.bz2',
    'https://sourceforge.net/projects/boost/files/boost/1.76.0/boost_1_76_0.tar.bz2'
  );

  fs.writeFileSync(boostPodspecPath, boostPodspecPatched, 'utf8');
}

function podInstallIfRequired() {
  if (process.platform === 'darwin' && !process.env.DETOX_DISABLE_POD_INSTALL) {
    console.log('[POST-INSTALL] Running pod install...');
    patchBoostPodspec();

    cp.execSync('pod install', {
      cwd: path.join(process.cwd(), 'ios'),
      stdio: 'inherit'
    });
  }
}

console.log('[POST-INSTALL] Running Detox\'s example-app post-install script...');
podInstallIfRequired();
console.log('[POST-INSTALL] Completed!');
