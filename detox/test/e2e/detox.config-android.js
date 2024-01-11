const _ = require('lodash');
const { rnVersion } = require('../src/helpers/rn-consts');

const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const isRNVersionBellow71 = (rnVersion.minor < 71);
const isRNVersionBellow72 = (rnVersion.minor < 72);
const warnOnce = _.once((...args) => console.warn(...args));

function androidBaseAppConfig(buildType /* 'debug' | 'release' */) {
  const warnRNLegacy = () => warnOnce(`⚠️ Detected a legacy RN version (v${rnVersion.raw}) - Using legacy build-flavor for Android config! 🤖🛠\n`);

  const appFlavor = (isRNVersionBellow71 ? warnRNLegacy() || 'rnLegacy' : 'rnDefault');
  const appFlavorUC = capitalizeFirstLetter(appFlavor);
  const buildTypeUC = capitalizeFirstLetter(buildType);
  const settingsFile = (isRNVersionBellow72 ? 'settings.gradle' : 'settings-rn71.gradle');

  return {
    type: 'android.apk',
    binaryPath: `android/app/build/outputs/apk/${appFlavor}/${buildType}/app-${appFlavor}-${buildType}.apk`,
    build: `cd android && ./gradlew assemble${appFlavorUC}${buildTypeUC} assemble${appFlavorUC}${buildTypeUC}AndroidTest -DtestBuildType=${buildType} -c ${settingsFile} && cd ..`,
  };
}

module.exports = {
  androidBaseAppConfig,
};
