const {expectToThrow} = require('./utils/custom-expects');

describe('System Dialogs', () => {
  describe(':ios:', () => {
    beforeEach(async () => {
      await device.launchApp({delete: true});
      await element(by.text('System Dialogs')).tap();
    });

    afterEach(async () => {
      await device.terminateApp();
    });

    describe('request permission dialog', () => {
      const permissionStatus = element(by.id('permissionStatus'));
      const requestPermissionButton = element(by.id('requestPermissionButton'));

      it('should start with unavailable permission status', async () => {
        await expect(permissionStatus).toHaveText('unavailable');
      });

      it('should find system alert button', async () => {
        await requestPermissionButton.tap();

        await expect(system.element(by.system.label('Allow'))).toExist();
      });

      it('should tap on permission request alert button by label ("Allow")', async () => {
        await requestPermissionButton.tap();

        await system.element(by.system.label('Allow')).tap();

        await expect(permissionStatus).toHaveText('granted');
      });

      it('should tap on permission request alert button by type and index ("Deny")', async () => {
        await requestPermissionButton.tap();

        await system.element(by.system.type('button')).atIndex(1).tap();

        await expect(permissionStatus).toHaveText('denied');
      });
    });

    it('should not find elements that does not exist', async () => {
      await expect(system.element(by.system.label('NonExistent'))).not.toExist();
    });

    it('should raise when trying to match system element that does not exist', async () => {
      await expectToThrow(async () => {
        await expect(system.element(by.system.label('NonExistent'))).toExist();
      }, 'Error: Cannot find system element by label: NonExistent');
    });

    it('should raise when trying to tap on system element that does not exist', async () => {
      await expectToThrow(async () => {
        await system.element(by.system.label('NonExistent')).tap();
      }, 'Error: Cannot find system element by label: NonExistent');
    });
  });

  describe(':android: not supported on Android', () => {
    it('should throw on expectation call', async () => {
      await expectToThrow(async () => {
        await expect(system.element(by.system.label('Allow'))).toExist();
      }, 'System interactions are not supported on Android, use UiDevice APIs directly instead');
    });

    it('should throw on action call', async () => {
      await expectToThrow(async () => {
        await system.element(by.system.type('button')).atIndex(0).tap();
      }, 'System interactions are not supported on Android, use UiDevice APIs directly instead');
    });
  });
});
