describe('Flows', () => {

  it('should exit without timeouts if app was terminated inside test', async () => {
    await device.launchApp({newInstance: true});
    await device.terminateApp();
  });

  it('should be able to start the next test with the terminated app', async () => {
    await device.launchApp({newInstance: true});
  });
});
