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

    async function allocateDevice(deviceId) {
      return registry.allocateDevice(() => deviceId);
    }

    async function checkDeviceRegistered(deviceId) {
      expect(await registry.includes(deviceId)).toBe(true);
    }

    async function checkDeviceRegisteredAndDispose(deviceId) {
      return registry.disposeDevice(async () => {
        expect(await registry.includes(deviceId)).toBe(true);
        return deviceId;
      });
    }

    async function disposeDevice(deviceId) {
      return registry.disposeDevice(() => deviceId);
    }

    async function checkDeviceNotRegistered(deviceId) {
      return registry.allocateDevice(async () => {
        expect(await registry.includes(deviceId)).toBe(false);
        throw new Error('ignored'); // So it wouldn't really allocate anything
      }).catch((e) => { if (e.message !== 'ignored') throw e });
    }

    async function checkRegisteredDevicesEqual(...deviceIds) {
      expect(await registry.getRegisteredDevices()).toEqual([ ...deviceIds ]);
    }

    it('should be able to tell whether a device is registered', async () => {
      const deviceId = 'emulator-5554';
      await allocateDevice(deviceId);
      await checkDeviceRegistered(deviceId);
      await checkDeviceRegisteredAndDispose(deviceId);
      await checkDeviceNotRegistered(deviceId);
    });

    it('should be able to tell whether a device is registered for object-like IDs', async () => {
      const rawDeviceId = {
        'type': 'mocked-device-type',
        'adbName': 'localhost:11111',
      };
      const deviceId = {
        ...rawDeviceId,
        mockFunc: () => 'mocked-func-result',
      };

      await allocateDevice(deviceId);
      await checkDeviceRegistered(rawDeviceId);
      await checkDeviceRegisteredAndDispose(rawDeviceId);
      await checkDeviceNotRegistered(deviceId);
    });

    it('should be able to return a valid list of registered devices', async () => {
      const deviceId = 'emulator-5554';
      const anotherDeviceId = {
        "type": "mocked-device-type",
        "adbName": "emulator-5556",
      };

      await allocateDevice(deviceId);
      await allocateDevice(anotherDeviceId);
      await checkRegisteredDevicesEqual(deviceId, anotherDeviceId);
      await disposeDevice(deviceId);
      await checkRegisteredDevicesEqual(anotherDeviceId);
      await disposeDevice(anotherDeviceId);
      await checkRegisteredDevicesEqual();
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

  describe('instantiation methods', () => {
    let ExclusiveLockFile;

    beforeEach(() => {
      jest.doMock('../utils/ExclusiveLockfile');
      ExclusiveLockFile = require('../utils/ExclusiveLockfile');
      DeviceRegistry = require('./DeviceRegistry');
    });

    it('should expose method for iOS-lock-based method', () => {
      expect(DeviceRegistry.forIOS()).toBeInstanceOf(DeviceRegistry);
      expect(ExclusiveLockFile).toHaveBeenCalledWith(
        environment.getDeviceLockFilePathIOS(),
        expect.anything(),
      );
    });

    it('should expose method for Android-lock-based method', () => {
      expect(DeviceRegistry.forAndroid()).toBeInstanceOf(DeviceRegistry);
      expect(ExclusiveLockFile).toHaveBeenCalledWith(
        environment.getDeviceLockFilePathAndroid(),
        expect.anything(),
      );
    });

    it('should expose method for custom Genymotion-cloud registry instantiation', () => {
      expect(DeviceRegistry.forGenyCloudCleanup()).toBeInstanceOf(DeviceRegistry);
      expect(ExclusiveLockFile).toHaveBeenCalledWith(
        environment.getGenyCloudPostCleanupFilePath(),
        expect.anything(),
      );
    });
  });
});
