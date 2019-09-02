describe('Flows', () => {

  it('should exit without timeouts if app was terminated inside test', async () => {
    await device.launchApp({newInstance: true});
    await device.terminateApp();
  });
});
