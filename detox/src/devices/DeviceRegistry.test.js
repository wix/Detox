const fs = require('fs-extra');
const tempfile = require('tempfile');

const environment = require('../utils/environment');

const deviceId = 'emulator-5554';
const deviceId2 = 'emulator-5556';
const mockData = { mock: 'data' };

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

    async function allocateDevice(deviceId, data) {
      return registry.allocateDevice(() => deviceId, data);
    }

    async function checkDeviceRegisteredAndDispose(deviceId) {
      return registry.disposeDevice(async () => {
        expect(registry.includes(deviceId)).toBe(true);
        return deviceId;
      });
    }

    async function disposeDevice(deviceHandle) {
      return registry.disposeDevice(() => deviceHandle);
    }

    async function expectDeviceNotRegistered(deviceId) {
      return registry.allocateDevice(async () => {
        expect(registry.includes(deviceId)).toBe(false);
        throw new Error('ignored'); // So it wouldn't really allocate anything
      }).catch((e) => { if (e.message !== 'ignored') throw e; });
    }

    function expectIncludedInDevicesList(deviceId) {
      return registry.allocateDevice(() => {
        const registeredDevices = registry.getRegisteredDevices();
        expect(registeredDevices.includes(deviceId)).toEqual(true);

        throw new Error('ignored'); // So it wouldn't really allocate anything
      }).catch((e) => { if (e.message !== 'ignored') throw e; });
    }

    function expectDevicesListEquals(rawDevices) {
      return registry.allocateDevice(() => {
        const registeredDevices = registry.getRegisteredDevices();
        expect(registeredDevices.rawDevices).toStrictEqual(rawDevices);

        throw new Error('ignored'); // So it wouldn't really allocate anything
      }).catch((e) => { if (e.message !== 'ignored') throw e; });
    }

    async function expectIncludedInReadDevicesList(deviceId) {
      const registeredDevices = await registry.readRegisteredDevices();
      expect(registeredDevices.includes(deviceId)).toEqual(true);
    }

    async function expectReadDevicesListEquals(rawDeviceHandles) {
      const registeredDevices = await registry.readRegisteredDevices();
      expect(registeredDevices.rawDevices).toEqual(rawDeviceHandles);
    }

    async function expectIncludedInUnsafeDevicesList(deviceHandle) {
      const registeredDevices = await registry.readRegisteredDevicesUNSAFE();
      expect(registeredDevices.includes(deviceHandle)).toEqual(true);
    }

    async function expectedUnsafeDevicesListEquals(rawDeviceHandles) {
      const registeredDevices = await registry.readRegisteredDevicesUNSAFE();
      expect(registeredDevices.rawDevices).toEqual(rawDeviceHandles);
    }

    const assertForbiddenOutOfContextRegistryQuery = () =>
      expect(() => registry.includes('whatever')).toThrowError();

    const assertForbiddenOutOfContextDeviceListQuery = () =>
      expect(() => registry.getRegisteredDevices()).toThrowError();

    it('should be able to tell whether a device is registered - for query and disposal', async () => {
      await allocateDevice(deviceId);
      await checkDeviceRegisteredAndDispose(deviceId);
      await expectDeviceNotRegistered(deviceId);
    });

    it('should be able to tell whether a device is registered, even with custom data associated with it', async () => {
      await allocateDevice(deviceId, { mock: 'data' });
      await checkDeviceRegisteredAndDispose(deviceId);
      await expectDeviceNotRegistered(deviceId);
    });

    it('should throw on attempt of checking whether a device is registered outside of allocation/disposal context', async () => {
      assertForbiddenOutOfContextRegistryQuery();

      await allocateDevice(deviceId);
      assertForbiddenOutOfContextRegistryQuery();
    });

    it('should be able to in-context get a valid list of registered devices, and query its content', async () => {
      await allocateDevice(deviceId);
      await allocateDevice(deviceId2, { mock: 'data' });
      await expectIncludedInDevicesList(deviceId);
      await expectIncludedInDevicesList(deviceId2);
    });

    it('should be able to in-context-get a valid list of registered devices as a raw objects array, also containing custom data', async () => {
      const expectedDevicesList = [
        { id: deviceId, },
        { id: deviceId2, data: mockData, },
      ];

      await allocateDevice(deviceId);
      await allocateDevice(deviceId2, mockData);
      await expectDevicesListEquals(expectedDevicesList);
    });

    it('should throw on an attempt of in-context getting registered devices list when outside of allocation/disposal context', async () => {
      assertForbiddenOutOfContextDeviceListQuery();

      await allocateDevice(deviceId);
      assertForbiddenOutOfContextDeviceListQuery();
    });

    it('should be able to out-of-context read a valid list of registered devices and query its content', async () => {
      await allocateDevice(deviceId);
      await allocateDevice(deviceId2, { mock: 'data' });
      await expectIncludedInReadDevicesList(deviceId);
      await expectIncludedInReadDevicesList(deviceId2);
    });

    it('should be able to out-of-context-read a valid list of registered devices as a raw objects array, also containing custom data', async () => {
      const expectedDevicesList = [
        { id: deviceId, },
        { id: deviceId2, data: mockData, },
      ];

      await allocateDevice(deviceId);
      await allocateDevice(deviceId2, mockData);
      await expectReadDevicesListEquals(expectedDevicesList);
    });

    it('should allow for UNSAFE (non-concurrent) reading of registered devices list, even outside of allocation/disposal context', async () => {
      const expectedDevicesList = [
        { id: deviceId, },
        { id: deviceId2, data: mockData, },
      ];

      await allocateDevice(deviceId);
      await allocateDevice(deviceId2, mockData);

      await expectIncludedInUnsafeDevicesList(deviceId);
      await expectIncludedInUnsafeDevicesList(deviceId2);
      await expectedUnsafeDevicesListEquals(expectedDevicesList);
    });

    it('should not fail when there were no actual device to dispose', async () => {
      await expect(disposeDevice(undefined)).resolves.not.toThrowError();
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
    });
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
