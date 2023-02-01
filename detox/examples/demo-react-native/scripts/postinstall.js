const rnVersion = function() {
  const rnPackageJson = require('react-native/package.json');
  return rnPackageJson.version;
}();

function patchHermesLocationForRN60Android() {
  const semver = require('semver');
  const fs = require('fs-extra');
  const path = require('path');

  if (semver.minor(rnVersion) === 60) {
    console.log('Detox post-install: Detected RN .60...');

    const HERMES_PATH_ROOT = path.join('node_modules', 'hermesvm');
    const HERMES_PATH_RN = path.join('node_modules', 'react-native', 'node_modules', 'hermesvm');

    const hermesIsInRoot = fs.existsSync(HERMES_PATH_ROOT);
    const hermesIsInRN = fs.existsSync(HERMES_PATH_RN);

    if (hermesIsInRoot && !hermesIsInRN) {
      console.log('Detox post-install: Applying hermes-vm patch for RN .60...');
      fs.ensureDirSync(path.join(HERMES_PATH_RN, 'android'));
      fs.copySync(path.join(HERMES_PATH_ROOT, 'android'), path.join(HERMES_PATH_RN, 'android'));
    } else {
      console.log('Detox post-install: hermes-vm patch not needed:', hermesIsInRoot, hermesIsInRN);
    }
  }
}
patchHermesLocationForRN60Android();
