module.exports = {
  AndroidEmulatorRuntimeDriver: require('./android/emulator/EmulatorDriver'),
  AttachedAndroidRuntimeDriver: require('./android/attached/AttachedAndroidDriver'),
  GenycloudRuntimeDriver: require('./android/genycloud/GenyCloudDriver'),
  IosSimulatorRuntimeDriver: require('./ios/SimulatorDriver'),
};
