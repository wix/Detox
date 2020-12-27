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

    async function allocateDevice(deviceHandle) {
      return registry.allocateDevice(() => deviceHandle);
    }

    function expectRegisteredDevices(...deviceHandles) {
      return registry.allocateDevice(() => {
        expect(registry.getRegisteredDevices()).toEqual([ ...deviceHandles ]);
        throw new Error('ignored'); // So it wouldn't really allocate anything
      }).catch((e) => { if (e.message !== 'ignored') throw e });
    }

    async function checkDeviceRegisteredAndDispose(deviceHandle) {
      return registry.disposeDevice(async () => {
        expect(registry.includes(deviceHandle)).toBe(true);
        return deviceHandle;
      });
    }

    async function disposeDevice(deviceHandle) {
      return registry.disposeDevice(() => deviceHandle);
    }

    async function checkDeviceIsNotRegistered(deviceHandle) {
      return registry.allocateDevice(async () => {
        expect(registry.includes(deviceHandle)).toBe(false);
        throw new Error('ignored'); // So it wouldn't really allocate anything
      }).catch((e) => { if (e.message !== 'ignored') throw e });
    }

    async function checkRegisteredDevicesEqual(...deviceHandles) {
      expect(await registry.readRegisteredDevices()).toEqual([ ...deviceHandles ]);
    }

    const assertForbiddenOutOfContextRegistryQuery = () =>
      expect(() => registry.includes('whatever')).toThrowError();

    const assertForbiddenOutOfContextDeviceListQuery = () =>
      expect(() => registry.getRegisteredDevices()).toThrowError();

    it('should be able to tell whether a device is registered', async () => {
      const deviceHandle = 'emulator-5554';
      await allocateDevice(deviceHandle);
      await checkDeviceRegisteredAndDispose(deviceHandle);
      await checkDeviceIsNotRegistered(deviceHandle);
    });

    it('should be able to tell whether a device is registered, given objects for handles', async () => {
      const rawDeviceHandle = {
        type: 'mocked-device-type',
        adbName: 'localhost:11111',
      };
      const deviceHandle = {
        ...rawDeviceHandle,
        mockFunc: () => 'mocked-func-result',
      };

      await allocateDevice(deviceHandle);
      await checkDeviceRegisteredAndDispose(rawDeviceHandle);
      await checkDeviceIsNotRegistered(deviceHandle);
    });

    it('should throw on attempt of checking whether a device is registered outside of allocation/disposal context', async () => {
      const deviceHandle = 'emulator-5554';

      assertForbiddenOutOfContextRegistryQuery();

      await allocateDevice(deviceHandle);
      assertForbiddenOutOfContextRegistryQuery();
    });

    it('should be able to fast-get a valid list of registered devices', async () => {
      const deviceHandle = 'emulator-5554';
      const anotherDeviceHandle = {
        type: 'mocked-device-type',
        adbName: 'emulator-5556',
      };

      await allocateDevice(deviceHandle);
      await allocateDevice(anotherDeviceHandle);
      await expectRegisteredDevices(deviceHandle, anotherDeviceHandle);
    });

    it('should throw on attempt of fast-getting registered devices list outside of allocation/disposal context', async () => {
      const deviceHandle = 'emulator-5554';

      assertForbiddenOutOfContextDeviceListQuery();

      await allocateDevice(deviceHandle);
      assertForbiddenOutOfContextDeviceListQuery();
    });

    it('should allow UNSAFE-getting of registered devices list, even outside of allocation/disposal context', async () => {
      const deviceHandle = 'emulator-5554';

      await allocateDevice(deviceHandle);
      const result = registry.readRegisteredDevicesUNSAFE();
      expect(result).toEqual([ deviceHandle ]);
    });

    it('should be able to read a valid list of registered devices', async () => {
      const deviceHandle = 'emulator-5554';
      const anotherDeviceHandle = 'emulator-5556';

      await allocateDevice(deviceHandle);
      await allocateDevice(anotherDeviceHandle);
      await checkRegisteredDevicesEqual(deviceHandle, anotherDeviceHandle);
      await disposeDevice(deviceHandle);
      await checkRegisteredDevicesEqual(anotherDeviceHandle);
    });

    it('should be able to dispose devices with object-like handles', async () => {
      const deviceId = {
        type: 'mocked-device-type',
        adbName: 'emulator-5554',
      };

      await allocateDevice(deviceId);
      await checkRegisteredDevicesEqual(deviceId);
      await disposeDevice(deviceId);
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
  });
});
