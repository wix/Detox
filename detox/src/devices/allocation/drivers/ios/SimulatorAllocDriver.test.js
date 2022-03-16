// @ts-nocheck
describe('Allocation driver for iOS simulators', () => {

  let applesimutils;
  let deviceRegistry;
  let simulatorLauncher;
  beforeEach(() => {
    const AppleSimUtils = jest.genMockFromModule('../../../common/drivers/ios/tools/AppleSimUtils');
    applesimutils = new AppleSimUtils();
    applesimutils.list.mockImplementation(async () => require('../../../common/drivers/ios/tools/applesimutils.mock')['--list']);

    const DeviceRegistry = jest.genMockFromModule('../../../DeviceRegistry');
    deviceRegistry = new DeviceRegistry();
    deviceRegistry.allocateDevice.mockImplementation((func) => func());

    const SimulatorLauncher = jest.genMockFromModule('./SimulatorLauncher');
    simulatorLauncher = new SimulatorLauncher();
  });

  let allocDriver;
  beforeEach(() => {
    const SimulatorAllocDriver = require('./SimulatorAllocDriver');
    allocDriver = new SimulatorAllocDriver({ deviceRegistry, applesimutils, simulatorLauncher });
  });

  describe('allocation', () => {
    beforeEach(() => {
      jest.mock('../../../cookies/IosSimulatorCookie');

      givenNoUsedSimulators();
    });

    const aDeviceSpec = (udid) => ({
      udid,
      os: {
        identifier: 'mock-OS',
      },
    });
    const givenUsedSimulators = (...UDIDs) => {
      deviceRegistry.getRegisteredDevices.mockReturnValue({
        rawDevices: UDIDs.map((UDID) => ({ id: UDID })), // as typically returned by getRegisteredDevices()
        includes: UDIDs.includes.bind(UDIDs),
      });
    };
    const givenNoUsedSimulators = () => givenUsedSimulators([]);
    const givenSystemDevices = (...deviceSpecs) => applesimutils.list.mockResolvedValue([...deviceSpecs]);
    const givenCreatedDeviceUDID = (udid) => applesimutils.create.mockReturnValue(udid);
    const asConfig = (device) => ({ type: 'ios.simulator', device });

    it('should accept { id } as matcher', async () => {
      await allocDriver.allocate(asConfig({ id: 'C6EC2279-A6EB-40BE-99D2-5F11949F25E5' }));

      expect(applesimutils.list).toHaveBeenCalledWith(
        { byId: 'C6EC2279-A6EB-40BE-99D2-5F11949F25E5' },
        'Searching for device by UDID = "C6EC2279-A6EB-40BE-99D2-5F11949F25E5" ...'
      );
    });

    it('should accept { name } as matcher', async () => {
      await allocDriver.allocate(asConfig({ name: 'Chika' }));

      expect(applesimutils.list).toHaveBeenCalledWith(
        { byName: 'Chika' },
        'Searching for device by name = "Chika" ...'
      );
    });

    it('should accept { type } as matcher', async () => {
      await allocDriver.allocate(asConfig({ type: 'iPad Air' }));

      expect(applesimutils.list).toHaveBeenCalledWith(
        { byType: 'iPad Air' },
        'Searching for device by type = "iPad Air" ...'
      );
    });

    it('should accept { type, os } as matcher', async () => {
      await allocDriver.allocate(asConfig({ type: 'iPad 2', os: 'iOS 9.3.6' }));

      expect(applesimutils.list).toHaveBeenCalledWith(
        { byType: 'iPad 2', byOS: 'iOS 9.3.6' },
        'Searching for device by type = "iPad 2" and by OS = "iOS 9.3.6" ...'
      );
    });

    it('should create a device', async () => {
      const IosSimulatorCookie = require('../../../cookies/IosSimulatorCookie');
      const udidUsed = 'mock-used-udid';
      const udidNew = 'mock-new-udid';
      const specUsed = aDeviceSpec(udidUsed);

      givenSystemDevices(specUsed);
      givenCreatedDeviceUDID(udidNew);
      givenUsedSimulators(udidUsed);

      const result = await allocDriver.allocate(asConfig('iPhone Mock'));

      expect(applesimutils.create).toHaveBeenCalledWith(specUsed);
      expect(result.constructor.name).toEqual('IosSimulatorCookie');
      expect(IosSimulatorCookie).toHaveBeenCalledWith(udidNew);
    });

    it('should reuse a matching device', async () => {
      const IosSimulatorCookie = require('../../../cookies/IosSimulatorCookie');
      const udid = 'mock-device-udid';
      const specUsed = aDeviceSpec(udid);

      givenSystemDevices(specUsed);
      givenNoUsedSimulators();

      const result = await allocDriver.allocate(asConfig('iPhone Mock'));

      expect(applesimutils.create).not.toHaveBeenCalled();
      expect(result.constructor.name).toEqual('IosSimulatorCookie');
      expect(IosSimulatorCookie).toHaveBeenCalledWith(udid);
    });
  });

  describe('deallocation', () => {
    const udid = 'ud-1d-m0ck';

    let cookie;
    beforeEach(() => {
      jest.unmock('../../../cookies/IosSimulatorCookie');

      const Cookie = require('../../../cookies/IosSimulatorCookie');
      cookie = new Cookie(udid);
    });

    it('should dispose the device from the registry', async () => {
      await allocDriver.free(cookie);
      expect(deviceRegistry.disposeDevice).toHaveBeenCalledWith(udid);
    });

    it('should shut the device down, if specified', async () => {
      await allocDriver.free(cookie, { shutdown: true });
      expect(simulatorLauncher.shutdown).toHaveBeenCalledWith(udid);
    });

    it('should not shut the device down, by default', async () => {
      await allocDriver.free(cookie);
      expect(simulatorLauncher.shutdown).not.toHaveBeenCalled();
    });
  });
});
