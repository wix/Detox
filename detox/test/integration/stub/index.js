module.exports = {
  EnvironmentValidatorClass: require('./StubEnvValidator'),
  ArtifactPluginsProviderClass: require('./StubArtifactPluginsProvider'),
  DeviceAllocationDriverClass: require('./StubDeviceAllocationDriver').StubDeviceAllocationDriver,
  DeviceDeallocationDriverClass: require('./StubDeviceAllocationDriver').StubDeviceDeallocationDriver,
  RuntimeDriverClass: require('./StubRuntimeDriver'),
  ExpectClass: require('./StubExpect'),
};
