const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);

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
