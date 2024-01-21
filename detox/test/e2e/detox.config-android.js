const _ = require('lodash');
const { rnVersion } = require('./utils/rn-consts/rn-consts');

const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const isRNVersionBellow71 = (rnVersion.minor < 71);
const warnOnce = _.once((...args) => console.warn(...args));

function androidBaseAppConfig(buildType /* 'debug' | 'release' */) {
  const warnRNLegacy = () => warnOnce(`⚠️ Detected a legacy RN version (v${rnVersion.raw}) - Using legacy build-flavor for Android config! 🤖🛠\n`);

  const appFlavor = (isRNVersionBellow71 ? warnRNLegacy() || 'rnLegacy' : 'rnDefault');
  const appFlavorUC = capitalizeFirstLetter(appFlavor);
  const buildTypeUC = capitalizeFirstLetter(buildType);

  return {
    type: 'android.apk',
    binaryPath: `android/app/build/outputs/apk/${appFlavor}/${buildType}/app-${appFlavor}-${buildType}.apk`,
    build: `cd android && ./gradlew assemble${appFlavorUC}${buildTypeUC} assemble${appFlavorUC}${buildTypeUC}AndroidTest -DtestBuildType=${buildType} && cd ..`,
  };
}

module.exports = {
  androidBaseAppConfig,
};
