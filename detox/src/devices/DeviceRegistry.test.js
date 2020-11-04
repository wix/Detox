const fs = require('fs-extra');
const tempfile = require('tempfile');
const environment = require('../utils/environment');

describe('DeviceRegistry', () => {
  let DeviceRegistry;

  describe('instance', () => {
    let lockfilePath;
    let registry;

    beforeEach(() => {
      lockfilePath = tempfile('.test');
      DeviceRegistry = require('./DeviceRegistry');
      registry = new DeviceRegistry({ lockfilePath });
    });

    afterEach(async () => {
      await fs.remove(lockfilePath);
    });

    function allocateDevice(deviceId) {
      return registry.allocateDevice(() => deviceId);
    }

    function checkBusyAndDisposeDevice(deviceId) {
      return registry.disposeDevice(() => {
        expect(registry.isDeviceBusy(deviceId)).toBe(true);
        return deviceId;
      });
    }

    function disposeDevice(deviceId) {
      return registry.disposeDevice(() => deviceId);
    }

    function checkDeviceNotBusy(deviceId) {
      return registry.allocateDevice(() => {
        expect(registry.isDeviceBusy(deviceId)).toBe(false);
        throw new Error('ignored'); // So it wouldn't really allocate anything
      }).catch((e) => { if (e.message !== 'ignored') throw e });
    }

    function checkBusyListIs(...deviceIds) {
      return registry.allocateDevice(() => {
        expect(registry.getBusyDevices()).toEqual([ ...deviceIds ]);
        throw new Error('ignored'); // So it wouldn't really allocate anything
      }).catch((e) => { if (e.message !== 'ignored') throw e });
    }

    const assertForbiddenOutOfContextForIsBusy = () =>
      expect(() => registry.isDeviceBusy('whatever')).toThrowError();

    const assertForbiddenOutOfContextForGetBusyList = () =>
      expect(() => registry.getBusyDevices()).toThrowError();

    it('should be able to tell whether a device is busy', async () => {
      const deviceId = 'emulator-5554';
      await allocateDevice(deviceId);
      await checkBusyAndDisposeDevice(deviceId);
      await checkDeviceNotBusy(deviceId);
    });

    it('should be able to tell whether an object-for-a-device-ID is busy', async () => {
      const rawDeviceId = {
        'type': 'mocked-device-type',
        'adbName': 'localhost:11111',
      };
      const deviceId = {
        ...rawDeviceId,
        mockFunc: () => 'mocked-func-result',
      };

      await allocateDevice(deviceId);
      await checkBusyAndDisposeDevice(rawDeviceId);
      await checkDeviceNotBusy(deviceId);
    });

    it('should throw on attempt of checking whether a device is busy outside of allocation/disposal context', async () => {
      const deviceId = 'emulator-5554';

      assertForbiddenOutOfContextForIsBusy();

      await allocateDevice(deviceId);
      assertForbiddenOutOfContextForIsBusy();
    });

    it('should be able to return a valid busy-list', async () => {
      const deviceId = 'emulator-5554';
      const anotherDeviceId = {
        "type": "mocked-device-type",
        "adbName": "emulator-5556",
      };

      await allocateDevice(deviceId);
      await allocateDevice(anotherDeviceId);
      await checkBusyListIs(deviceId, anotherDeviceId);
      await disposeDevice(deviceId);
      await checkBusyListIs(anotherDeviceId);
      await disposeDevice(anotherDeviceId);
      await checkBusyListIs();
    });

    it('should throw on attempt of getting busy-list outside of allocation/disposal context', async () => {
      const deviceId = 'emulator-5554';

      await allocateDevice(deviceId);
      assertForbiddenOutOfContextForGetBusyList();
    });

    describe('.reset() method', () => {
      it('should create a lock file with an empty array if it does not exist', async () => {
        expect(await fs.exists(lockfilePath)).toBe(false);
        await registry.reset();
        expect(await fs.readFile(lockfilePath, 'utf8')).toBe('[]');
      });

      it('should overwrite a lock file contents with an empty array if it exists', async () => {
        await fs.writeFile(lockfilePath, '{ something }');
        await registry.reset();
        expect(await fs.readFile(lockfilePath, 'utf8')).toBe('[]');
      });
    })
  });

  describe('static methods', () => {
    let ExclusiveLockFile;

    beforeEach(() => {
      jest.doMock('../utils/ExclusiveLockfile');
      ExclusiveLockFile = require('../utils/ExclusiveLockfile');
      DeviceRegistry = require('./DeviceRegistry');
    });

    it('should expose static convenience method DeviceRegistry.forIOS()', () => {
      expect(DeviceRegistry.forIOS()).toBeInstanceOf(DeviceRegistry);
      expect(ExclusiveLockFile).toHaveBeenCalledWith(
        environment.getDeviceLockFilePathIOS(),
        expect.anything(),
      );
    });

    it('should expose static convenience method DeviceRegistry.forAndroid()', async () => {
      expect(DeviceRegistry.forAndroid()).toBeInstanceOf(DeviceRegistry);
      expect(ExclusiveLockFile).toHaveBeenCalledWith(
        environment.getDeviceLockFilePathAndroid(),
        expect.anything(),
      );
    });
  });
});
