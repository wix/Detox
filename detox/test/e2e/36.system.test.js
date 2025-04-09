const {expectToThrow} = require('./utils/custom-expects');

describe('System Dialogs', () => {
  describe(':ios: supported', () => {
    beforeAll(async () => {
      await device.reloadReactNative();
    });

    describe('request permission dialog', () => {
      beforeEach(async () => {
        await device.launchApp({
          delete: true,
          newInstance: true,
        });

        await element(by.text('System Dialogs')).tap();
      });

      const permissionStatus = element(by.id('permissionStatus'));
      const requestPermissionButton = element(by.id('requestPermissionButton'));

      it('should start with `denied` permission status', async () => {
        await expect(permissionStatus).toHaveText('denied');
      });

      it('should tap on permission request alert button by label ("Allow")', async () => {
        await requestPermissionButton.tap();

        const allowButton = system.element(by.system.label('Allow'));

        await expect(allowButton).toExist();
        await allowButton.tap();

        await expect(permissionStatus).toHaveText('granted');
      });

      it('should tap on permission request alert button by type and index ("Deny")', async () => {
        await requestPermissionButton.tap();

        const denyButton = system.element(by.system.type('button')).atIndex(0);

        await expect(denyButton).toExist();
        await denyButton.tap();

        await expect(permissionStatus).toHaveText('blocked');
      });
    });

    it('should not find elements that does not exist', async () => {
      await expect(system.element(by.system.label('NonExistent'))).not.toExist();
    });

    it('should raise when trying to match system element that does not exist', async () => {
      await expectToThrow(async () => {
        await expect(system.element(by.system.label('NonExistent'))).toExist();
      }, 'Expectation failed, element with matcher `label == "NonExistent"` does not exist');
    });

    it('should raise when trying to tap on system element that does not exist', async () => {
      await expectToThrow(async () => {
        await system.element(by.system.label('NonExistent')).tap();
      }, 'Action failed, element with matcher `label == "NonExistent"` does not exist');
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
