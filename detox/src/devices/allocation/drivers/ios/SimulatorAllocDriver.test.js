describe('Allocation driver for iOS simulators', () => {

  let applesimutils;
  let deviceRegistry;
  let simulatorLauncher;
  let allocDriver;
  beforeEach(() => {
    const AppleSimUtils = jest.genMockFromModule('../../../runtime/drivers/ios/tools/AppleSimUtils');
    applesimutils = new AppleSimUtils();
    applesimutils.list.mockImplementation(async () => require('../../../runtime/drivers/ios/tools/applesimutils.mock')['--list']);

    const DeviceRegistry = jest.genMockFromModule('../../../DeviceRegistry');
    deviceRegistry = new DeviceRegistry();
    deviceRegistry.allocateDevice.mockImplementation((func) => func());

    const SimulatorLauncher = jest.genMockFromModule('./SimulatorLauncher');
    simulatorLauncher = new SimulatorLauncher();
  });

  describe('allocation', () => {
    beforeEach(() => {
      const EventEmitter = jest.genMockFromModule('../../../../utils/AsyncEmitter');
      const eventEmitter = new EventEmitter();

      jest.mock('../../../cookies/IosSimulatorCookie');

      givenNoUsedSimulators();

      const { SimulatorAllocDriver } = require('./SimulatorAllocDriver');
      allocDriver = new SimulatorAllocDriver({ deviceRegistry, eventEmitter, applesimutils, simulatorLauncher });
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

    it('should accept string as device type', async () => {
      await allocDriver.allocate('iPhone X');

      expect(applesimutils.list).toHaveBeenCalledWith(
        { byType: 'iPhone X' },
        'Searching for device by type = "iPhone X" ...'
      );
    });

    it('should accept string with comma as device type and OS version', async () => {
      await allocDriver.allocate('iPhone X, iOS 12.0');

      expect(applesimutils.list).toHaveBeenCalledWith(
        { byType: 'iPhone X', byOS: 'iOS 12.0' },
        'Searching for device by type = "iPhone X" and by OS = "iOS 12.0" ...'
      );
    });

    it('should accept { byId } as matcher', async () => {
      await allocDriver.allocate({ id: 'C6EC2279-A6EB-40BE-99D2-5F11949F25E5' });

      expect(applesimutils.list).toHaveBeenCalledWith(
        { byId: 'C6EC2279-A6EB-40BE-99D2-5F11949F25E5' },
        'Searching for device by UDID = "C6EC2279-A6EB-40BE-99D2-5F11949F25E5" ...'
      );
    });

    it('should accept { byName } as matcher', async () => {
      await allocDriver.allocate({ name: 'Chika' });

      expect(applesimutils.list).toHaveBeenCalledWith(
        { byName: 'Chika' },
        'Searching for device by name = "Chika" ...'
      );
    });

    it('should accept { byType } as matcher', async () => {
      await allocDriver.allocate({ type: 'iPad Air' });

      expect(applesimutils.list).toHaveBeenCalledWith(
        { byType: 'iPad Air' },
        'Searching for device by type = "iPad Air" ...'
      );
    });

    it('should accept { byType, byOS } as matcher', async () => {
      await allocDriver.allocate({ type: 'iPad 2', os: 'iOS 9.3.6' });

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

      const result = await allocDriver.allocate('iPhone Mock');

      expect(applesimutils.create).toHaveBeenCalledWith(specUsed);
      expect(result.constructor.name).toEqual('IosSimulatorCookie');
      expect(IosSimulatorCookie).toHaveBeenCalledWith(udidNew, 'iPhone Mock');
    });

    it('should reuse a matching device', async () => {
      const IosSimulatorCookie = require('../../../cookies/IosSimulatorCookie');
      const udid = 'mock-device-udid';
      const specUsed = aDeviceSpec(udid);

      givenSystemDevices(specUsed);
      givenNoUsedSimulators();

      const result = await allocDriver.allocate('iPhone Mock');

      expect(applesimutils.create).not.toHaveBeenCalled();
      expect(result.constructor.name).toEqual('IosSimulatorCookie');
      expect(IosSimulatorCookie).toHaveBeenCalledWith(udid, 'iPhone Mock');
    });
  });

  describe('deallocation', () => {
    const udid = 'ud-1d-m0ck';
    let deallocDriver;
    beforeEach(() => {
      const { SimulatorDeallocDriver } = require('./SimulatorAllocDriver');
      deallocDriver = new SimulatorDeallocDriver(udid, { deviceRegistry, simulatorLauncher });
    });

    it('should dispose the device from the registry', async () => {
      await deallocDriver.free();
      expect(deviceRegistry.disposeDevice).toHaveBeenCalledWith(udid);
    });

    it('should shut the device down, if specified', async () => {
      await deallocDriver.free({ shutdown: true });
      expect(simulatorLauncher.shutdown).toHaveBeenCalledWith(udid);
    });

    it('should not shut the device down, by default', async () => {
      await deallocDriver.free();
      expect(simulatorLauncher.shutdown).not.toHaveBeenCalled();
    });
  });
});
