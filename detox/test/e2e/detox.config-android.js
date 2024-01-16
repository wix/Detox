const _ = require('lodash');
const { rnVersion } = require('./utils/rn-consts/rn-consts');

const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const isRNVersionBellow71 = (rnVersion.minor < 71);
const warnOnce = _.once((...args) => console.warn(...args));

function androidBaseAppConfig(buildType /* 'debug' | 'release' */) {
  const buildTypeUC = capitalizeFirstLetter(buildType);

  return {
    type: 'android.apk',
    binaryPath: `android/app/build/outputs/apk/${buildType}/app-${buildType}.apk`,
    build: `cd android && ./gradlew assemble${buildTypeUC} assemble${buildTypeUC}AndroidTest -DtestBuildType=${buildType} && cd ..`,
  };
}

module.exports = {
  androidBaseAppConfig,
};
