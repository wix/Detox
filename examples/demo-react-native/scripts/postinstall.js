const cp = require('child_process');

function podInstallIfRequired() {
  if (process.platform === 'darwin' && !process.env.DETOX_DISABLE_POD_INSTALL) {
    console.log('[POST-INSTALL] Running example-app pod install...');

    cp.execSync('pod install', {
      cwd: `${process.cwd()}/ios`,
      stdio: 'inherit'
    });

    console.log('[POST-INSTALL] example-app pod install completed')
  }
}

podInstallIfRequired();
