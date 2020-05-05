describe.skip('todo', () => {
  it.todo('should handle ios.simulator');
  it.todo('should handle ios.none');
  it.todo('should handle android.attached');
  it.todo('should handle android.emulator');
  it('should handle a custom driver', async () => {
    // let instantiated = false;
    // class MockDriverPlugin {
    //   constructor(config) {
    //     instantiated = true;
    //   }
    //   on() {}
    //   declareArtifactPlugins() {}
    // }
    // jest.mock('driver-plugin', () => MockDriverPlugin, { virtual: true });
    // const pluginDeviceConfig = {
    //   "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
    //   "type": "driver-plugin",
    //   "name": "MyPlugin"
    // };
    //
    // expect(instantiated).toBe(true);
  });
});
