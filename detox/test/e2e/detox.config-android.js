const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const defaultAndroidPermissions = {
  'android.permission.CAMERA': true,
  'android.permission.ACCESS_FINE_LOCATION': true,
  'android.permission.INTERNET': true,
  'android.permission.RECORD_AUDIO': true,
};

function androidBaseAppConfig(buildType /* 'debug' | 'release' */) {
  const buildTypeUC = capitalizeFirstLetter(buildType);

  return {
    type: 'android.apk',
    binaryPath: `android/app/build/outputs/apk/${buildType}/app-${buildType}.apk`,
    build: `cd android && ./gradlew assemble${buildTypeUC} assemble${buildTypeUC}AndroidTest -DtestBuildType=${buildType} && cd ..`,
    permissions: defaultAndroidPermissions,
  };
}

module.exports = {
  androidBaseAppConfig,
};
