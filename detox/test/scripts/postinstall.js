const cp = require('child_process');

function podInstallIfRequired() {
  if (process.platform === 'darwin' && !process.env.DETOX_DISABLE_POD_INSTALL) {
    console.log('[POST-INSTALL] Running test-app pod install...');

    cp.execSync('pod install', {
      cwd: `${process.cwd()}/ios`,
      stdio: 'inherit'
    });

    console.log('[POST-INSTALL] test-app pod install completed')
  }
}

podInstallIfRequired();
