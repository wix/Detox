module.exports = {
  AndroidEmulatorRuntimeDriver: require('./android/emulator/EmulatorDriver'),
  AttachedAndroidRuntimeDriver: require('./android/attached/AttachedAndroidDriver'),
  GenycloudRuntimeDriver: require('./android/genycloud/GenyCloudDriver'),
  IosRuntimeDriver: require('./ios/IosDriver'),
  IosSimulatorRuntimeDriver: require('./ios/SimulatorDriver'),
};
