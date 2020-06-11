describe('Flows', () => {
  describe('- app termination -', () => {
    it('should exit without timeouts if app was terminated inside test', async () => {
      await device.launchApp({newInstance: true});
      await device.terminateApp();
    });

    it('should be able to start the next test with the terminated app', async () => {
      await device.launchApp({newInstance: true});
    });
  });

  describe('- beforeAll hooks -', () => {
    it.skip('trigger false test_start glitch', () => {});

    describe('inner suite', () => {
      beforeAll(async () => {
        await device.launchApp({
          newInstance: true,
          delete: true,
          permissions: {notifications: 'YES', camera: 'YES', photos: 'YES'}
        });
      });

      it('should tap on "Sanity"', async () => {
        await element(by.text('Sanity')).tap();
      });
    });
  });
});
