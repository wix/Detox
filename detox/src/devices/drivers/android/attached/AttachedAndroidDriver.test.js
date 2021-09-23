const _ = require('lodash');
const latestInstanceOf = (clazz) => _.last(clazz.mock.instances);

const mockBaseClassesDependencies = () => {
  jest.mock('../exec/ADB');
  jest.mock('../exec/AAPT');
  jest.mock('../tools/APKPath');
  jest.mock('../tools/TempFileXfer');
  jest.mock('../tools/AppInstallHelper');
  jest.mock('../tools/AppUninstallHelper');
  jest.mock('../tools/MonitoredInstrumentation');
  jest.mock('../../../../artifacts/utils/AndroidDevicePathBuilder');
  jest.mock('../../../../android/espressoapi/UiDeviceProxy');
  jest.mock('../../../../utils/logger');
};

const mockDirectDependencies = () => {
  jest.mock('../../../DeviceRegistry');
  jest.mock('../tools/FreeDeviceFinder');
};

describe('Attached android device driver', () => {
  beforeEach(mockBaseClassesDependencies);
  beforeEach(mockDirectDependencies);

  const adbNamePattern =  '9A291FFAZ005S9';
  const deviceConfigWithObject = {
    device: {
      adbName: adbNamePattern,
    },
  };

  const deviceConfigWithString = {
    device: {
      adbName: adbNamePattern,
    },
  };

  let emitter;
  let adbObj;
  let deviceRegistry;
  let FreeDeviceFinder;
  let freeDeviceFinderObj;
  let uut;

  beforeEach(() => {
    const Emitter = jest.genMockFromModule('../../../../utils/AsyncEmitter');
    emitter = new Emitter();

    const { InvocationManager } = jest.genMockFromModule('../../../../invoke');
    const invocationManager = new InvocationManager();

    const ADB = require('../exec/ADB');
    adbObj = () => latestInstanceOf(ADB);

    const DeviceRegistry = require('../../../DeviceRegistry');
    deviceRegistry = new DeviceRegistry();
    deviceRegistry.allocateDevice.mockImplementation((doAllocateFn) => doAllocateFn());
    DeviceRegistry.forAndroid.mockReturnValue(deviceRegistry);

    FreeDeviceFinder = require('../tools/FreeDeviceFinder');
    freeDeviceFinderObj = () => latestInstanceOf(FreeDeviceFinder);

    const AttachedAndroidDriver = require('./AttachedAndroidDriver');
    uut = new AttachedAndroidDriver({
      invocationManager,
      emitter,
      client: {},
    });
  });

  describe('device acquiring', () => {
    it('should allocate a device', async () => {
      deviceRegistry.allocateDevice.mockImplementation(async (userFn) => {
        try {
          return await userFn();
        } finally {
          expect(freeDeviceFinderObj().findFreeDevice).toHaveBeenCalledWith(adbNamePattern);
        }
      });

      await uut.acquireFreeDevice(void 0, deviceConfigWithString);
      expect(deviceRegistry.allocateDevice).toHaveBeenCalled();
    });

    it('should allocate a device based on an object-like configuration', async () => {
      deviceRegistry.allocateDevice.mockImplementation(async (userFn) => {
        try {
          return await userFn();
        } finally {
          expect(freeDeviceFinderObj().findFreeDevice).toHaveBeenCalledWith(adbNamePattern);
        }
      });

      await uut.acquireFreeDevice(deviceConfigWithObject.device, deviceConfigWithObject);
      expect(deviceRegistry.allocateDevice).toHaveBeenCalled();
    });

    it('should create a device finder', async () => {
      expect(FreeDeviceFinder).toHaveBeenCalledWith(adbObj(), deviceRegistry);
    });

    it('should emit a bootDevice event', async () => {
      const adbName = `${adbNamePattern}_allocated`;
      deviceRegistry.allocateDevice.mockReturnValue(adbName);

      await uut.acquireFreeDevice(void 0, deviceConfigWithString);

      expect(emitter.emit).toHaveBeenCalledWith('bootDevice', { coldBoot: false, deviceId: adbName, type: 'device' });
    });

    it('should init ADB\'s API-level', async () => {
      const adbName = `${adbNamePattern}_allocated`;
      deviceRegistry.allocateDevice.mockReturnValue(adbName);

      await uut.acquireFreeDevice(void 0, deviceConfigWithString);
      expect(adbObj().apiLevel).toHaveBeenCalledWith(adbName);
    });

    it('should unlock the screen using ADB', async () => {
      const adbName = `${adbNamePattern}_allocated`;
      deviceRegistry.allocateDevice.mockReturnValue(adbName);

      await uut.acquireFreeDevice(void 0, deviceConfigWithString);
      expect(adbObj().unlockScreen).toHaveBeenCalledWith(adbName);
    });

    it('should initialize the name', async () => {
      const adbName = `${adbNamePattern}_allocated`;
      deviceRegistry.allocateDevice.mockReturnValue(adbName);

      expect(uut.name).toEqual('Unnamed Android Device');
      await uut.acquireFreeDevice(void 0, deviceConfigWithString);
      expect(uut.name).toEqual(adbName);
    });
  });

  describe('clean-up', () => {
    const adbName = 'mock-adb-name';
    const instrumentationObj = () => latestInstanceOf(Instrumentation);

    let Instrumentation;
    beforeEach(() => {
      Instrumentation = require('../tools/MonitoredInstrumentation');
    });

    it('should dispose an instance based on its UUID', async () => {
      await uut.cleanup(adbName, 'bundle-id');
      expect(deviceRegistry.disposeDevice).toHaveBeenCalledWith(adbName);
    });

    it('should kill instrumentation', async () => {
      await uut.cleanup(adbName, 'bundle-id');
      expect(instrumentationObj().terminate).toHaveBeenCalled();
    });
  });
});
