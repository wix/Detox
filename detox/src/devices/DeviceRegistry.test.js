const fs = require('fs-extra');
const tempfile = require('tempfile');
const environment = require('../utils/environment');

const deviceHandle = 'emulator-5554';

const deviceHandleAsRawObj = {
  type: 'mocked-device-type',
  adbName: 'emulator-5556',
};
const deviceHandleAsObj = {
  ...deviceHandleAsRawObj,
  mockFn: () => 'mock-fn-result',
};

class DeviceHandle {
  constructor() {
    this.type = 'mocked-device-type';
    this.adbName = 'localhost:11111';
  }

  mockFunc() {
    return 'mocked-func-result';
  }
}
const deviceHandleAsClassInstance = new DeviceHandle();
const deviceHandleInstanceRaw = {
  type: 'mocked-device-type',
  adbName: 'localhost:11111',
}

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

    async function checkDeviceRegisteredAndDispose(deviceHandle) {
      return registry.disposeDevice(async () => {
        expect(registry.includes(deviceHandle)).toBe(true);
        return deviceHandle;
      });
    }

    async function disposeDevice(deviceHandle) {
      return registry.disposeDevice(() => deviceHandle);
    }

    async function expectDeviceNotRegistered(deviceHandle) {
      return registry.allocateDevice(async () => {
        expect(registry.includes(deviceHandle)).toBe(false);
        throw new Error('ignored'); // So it wouldn't really allocate anything
      }).catch((e) => { if (e.message !== 'ignored') throw e });
    }

    function expectIncludedInDevicesList(deviceHandle) {
      return registry.allocateDevice(() => {
        const registeredDevices = registry.getRegisteredDevices();
        expect(registeredDevices.includes(deviceHandle)).toEqual(true);

        throw new Error('ignored'); // So it wouldn't really allocate anything
      }).catch((e) => { if (e.message !== 'ignored') throw e });
    }

    function expectDevicesListEquals(rawDevicesHandles) {
      return registry.allocateDevice(() => {
        const registeredDevices = registry.getRegisteredDevices();
        expect(registeredDevices.rawDevices).toStrictEqual(rawDevicesHandles);

        throw new Error('ignored'); // So it wouldn't really allocate anything
      }).catch((e) => { if (e.message !== 'ignored') throw e });
    }

    async function expectIncludedInReadDevicesList(deviceHandle) {
      const registeredDevices = await registry.readRegisteredDevices();
      expect(registeredDevices.includes(deviceHandle)).toEqual(true);
    }

    async function expectNotIncludedInReadDevicesList(deviceHandle) {
      const registeredDevices = await registry.readRegisteredDevices();
      expect(registeredDevices.includes(deviceHandle)).not.toEqual(true);
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
      await allocateDevice(deviceHandle);
      await checkDeviceRegisteredAndDispose(deviceHandle);
      await expectDeviceNotRegistered(deviceHandle);
    });

    it('should be able to tell whether a device is registered, given objects as handles', async () => {
      await allocateDevice(deviceHandleAsObj);
      await checkDeviceRegisteredAndDispose(deviceHandleAsObj);
      await expectDeviceNotRegistered(deviceHandleAsObj);
    });

    it('should be able to tell whether a device is registered, given class instances as handles', async () => {
      await allocateDevice(deviceHandleAsClassInstance);
      await checkDeviceRegisteredAndDispose(deviceHandleAsClassInstance);
      await expectDeviceNotRegistered(deviceHandleAsClassInstance);
    });

    it('should throw on attempt of checking whether a device is registered outside of allocation/disposal context', async () => {
      assertForbiddenOutOfContextRegistryQuery();

      await allocateDevice(deviceHandle);
      assertForbiddenOutOfContextRegistryQuery();
    });

    it('should be able to in-context get a valid list of registered devices, and query its content', async () => {
      await allocateDevice(deviceHandle);
      await allocateDevice(deviceHandleAsObj);
      await allocateDevice(deviceHandleAsClassInstance);
      await expectIncludedInDevicesList(deviceHandle);
      await expectIncludedInDevicesList(deviceHandleAsObj);
      await expectIncludedInDevicesList(deviceHandleAsClassInstance);
    });

    it('should be able to in-context-get a valid list of (raw) registered devices as an array', async () => {
      const expectedrawDevicesList = [
        deviceHandle,
        deviceHandleAsRawObj,
        deviceHandleInstanceRaw,
      ];

      await allocateDevice(deviceHandle);
      await allocateDevice(deviceHandleAsObj);
      await allocateDevice(deviceHandleAsClassInstance);
      await expectDevicesListEquals(expectedrawDevicesList);
    });

    it('should throw on an attempt of in-context getting registered devices list when outside of allocation/disposal context', async () => {
      assertForbiddenOutOfContextDeviceListQuery();

      await allocateDevice(deviceHandle);
      assertForbiddenOutOfContextDeviceListQuery();
    });

    it('should be able to out-of-context read a valid list of registered devices and query its content', async () => {
      await allocateDevice(deviceHandle);
      await allocateDevice(deviceHandleAsObj);
      await allocateDevice(deviceHandleAsClassInstance);
      await expectIncludedInReadDevicesList(deviceHandle);
      await expectIncludedInReadDevicesList(deviceHandleAsObj);
    });

    it('should be able to out-of-context-read a valid list of (raw) registered devices as an array', async () => {
      const expectedDevicesList = [
        deviceHandle,
        deviceHandleAsRawObj,
        deviceHandleInstanceRaw,
      ];

      await allocateDevice(deviceHandle);
      await allocateDevice(deviceHandleAsObj);
      await allocateDevice(deviceHandleAsClassInstance);
      await expectReadDevicesListEquals(expectedDevicesList);
    });

    it('should allow for UNSAFE (non-concurrent) reading of registered devices list, even outside of allocation/disposal context', async () => {
      const expectedDevicesList = [
        deviceHandle,
        deviceHandleAsRawObj,
        deviceHandleInstanceRaw,
      ];

      await allocateDevice(deviceHandle);
      await allocateDevice(deviceHandleAsObj);
      await allocateDevice(deviceHandleAsClassInstance);

      await expectIncludedInUnsafeDevicesList(deviceHandle);
      await expectIncludedInUnsafeDevicesList(deviceHandleAsObj);
      await expectIncludedInUnsafeDevicesList(deviceHandleAsClassInstance);
      await expectedUnsafeDevicesListEquals(expectedDevicesList);
    });

    it('should be able to dispose devices of all types', async () => {
      await allocateDevice(deviceHandle);
      await allocateDevice(deviceHandleAsObj);
      await allocateDevice(deviceHandleAsClassInstance);

      await disposeDevice(deviceHandle);
      await expectNotIncludedInReadDevicesList(deviceHandle);

      await disposeDevice(deviceHandleAsObj);
      await expectNotIncludedInReadDevicesList(deviceHandleAsObj);

      await disposeDevice(deviceHandleAsClassInstance);
      await expectNotIncludedInReadDevicesList(deviceHandleAsClassInstance);
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
