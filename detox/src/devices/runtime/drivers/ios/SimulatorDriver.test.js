const AsyncEmitter = require('../../../../utils/AsyncEmitter');

describe('IOS simulator driver', () => {
  const udid = 'UD-1D-MOCK';
  const bundleId = 'bundle-id-mock';

  let client;
  let emitter;
  let uut;
  beforeEach(() => {
    jest.mock('./tools/AppleSimUtils', () => mockAppleSimUtils);

    emitter = new AsyncEmitter({
      events: ['beforeLaunchApp'],
      onError: (e) => { throw e; },
    });

    const ClientMock = jest.requireMock('../../../../client/Client');
    client = new ClientMock();

    const SimulatorDriver = require('./SimulatorDriver');
    uut = new SimulatorDriver(udid, 'Chika', { client, emitter });
  });

  it('should return the UDID as the external ID', () => {
    expect(uut.getExternalId()).toEqual(udid);
  });

  it('should return the device name', () => {
    expect(uut.getDeviceName()).toEqual(`${udid} (Chika)`);
  })

  describe('launch args', () => {
    const languageAndLocale = '';
    let launchArgs;

    beforeEach(() => {
      launchArgs = {
        'dog1': 'dharma',
        'dog2': 'karma',
      };
    });

    it('should be passed to AppleSimUtils', async () => {
      await uut.launchApp(bundleId, launchArgs, languageAndLocale);
      expect(uut.applesimutils.launch).toHaveBeenCalledWith(udid, bundleId, launchArgs, languageAndLocale);
    });

    it('should be passed to AppleSimUtils even if some of them were received from `beforeLaunchApp` phase', async () => {
      emitter.on('beforeLaunchApp', ({ launchArgs }) => {
        launchArgs.dog3 = 'Chika, from plugin';
      });

      await uut.launchApp(bundleId, launchArgs, languageAndLocale);
      expect(uut.applesimutils.launch).toHaveBeenCalledWith(udid, bundleId, {
        ...launchArgs,
        dog3: 'Chika, from plugin',
      }, '');
    });
  });

  describe('.captureViewHierarchy', () => {
    beforeEach(async () => {
      jest.spyOn(emitter, 'emit');

      await uut.captureViewHierarchy('named hierarchy');
    });

    it('should call client.captureViewHierarchy', async () => {
      expect(client.captureViewHierarchy).toHaveBeenCalledWith({
        viewHierarchyURL: expect.any(String),
      });
    });

    it('should emit "createExternalArtifact" event for uiHierarchy plugin', async () => {
      expect(emitter.emit).toHaveBeenCalledWith('createExternalArtifact', {
        pluginId: 'uiHierarchy',
        artifactName: 'named hierarchy',
        artifactPath: expect.any(String),
      });
    });
  });

  describe('biometrics', () => {
    it('enrolls in biometrics by passing to AppleSimUtils', async () => {
      await uut.setBiometricEnrollment('YES');
      expect(uut.applesimutils.setBiometricEnrollment).toHaveBeenCalledWith(udid, 'YES');
    });

    it('disenrolls in biometrics by passing to AppleSimUtils', async () => {
      await uut.setBiometricEnrollment('NO');
      expect(uut.applesimutils.setBiometricEnrollment).toHaveBeenCalledWith(udid, 'NO');
    });

    it('matches a face by passing to AppleSimUtils', async () => {
      await uut.matchFace();
      expect(uut.applesimutils.matchBiometric).toHaveBeenCalledWith(udid, 'Face');
    });

    it('fails to match a face by passing to AppleSimUtils', async () => {
      await uut.unmatchFace();
      expect(uut.applesimutils.unmatchBiometric).toHaveBeenCalledWith(udid, 'Face');
    });

    it('matches a face by passing to AppleSimUtils', async () => {
      await uut.matchFinger();
      expect(uut.applesimutils.matchBiometric).toHaveBeenCalledWith(udid, 'Finger');
    });

    it('fails to match a face by passing to AppleSimUtils', async () => {
      await uut.unmatchFinger();
      expect(uut.applesimutils.unmatchBiometric).toHaveBeenCalledWith(udid, 'Finger');
    });
  });

  describe('acquireFreeDevice', () => {
    const givenUsedSimulators = (...UDIDs) => {
      jest.spyOn(uut.deviceRegistry, 'getRegisteredDevices').mockReturnValue({
        rawDevices: UDIDs.map((UDID) => ({ id: UDID })), // as typically returned by getRegisteredDevices()
        includes: UDIDs.includes.bind(UDIDs),
      });
    };
    const givenNoUsedSimulators = () => givenUsedSimulators([]);
    const givenSystemDevices = (...deviceSpecs) => uut.applesimutils.list.mockResolvedValue([...deviceSpecs]);
    const givenCreatedDeviceUDID = (udid) => uut.applesimutils.create.mockReturnValue(udid);
    const aDeviceSpec = (udid) => ({
      udid,
      os: {
        identifier: 'mock-OS',
      },
    });

    let applesimutils;

    beforeEach(() => {
      givenNoUsedSimulators();

      applesimutils = uut.applesimutils;
      applesimutils.list.mockImplementation(async () => require('./tools/applesimutils.mock')['--list']);
    });

    it('should accept string as device type', async () => {
      await uut.acquireFreeDevice('iPhone X');

      expect(applesimutils.list).toHaveBeenCalledWith(
        { byType: 'iPhone X' },
        'Searching for device by type = "iPhone X" ...'
      );
    });

    it('should accept string with comma as device type and OS version', async () => {
      await uut.acquireFreeDevice('iPhone X, iOS 12.0');

      expect(applesimutils.list).toHaveBeenCalledWith(
        { byType: 'iPhone X', byOS: 'iOS 12.0' },
        'Searching for device by type = "iPhone X" and by OS = "iOS 12.0" ...'
      );
    });

    it('should accept { byId } as matcher', async () => {
      await uut.acquireFreeDevice({ id: 'C6EC2279-A6EB-40BE-99D2-5F11949F25E5' });

      expect(applesimutils.list).toHaveBeenCalledWith(
        { byId: 'C6EC2279-A6EB-40BE-99D2-5F11949F25E5' },
        'Searching for device by UDID = "C6EC2279-A6EB-40BE-99D2-5F11949F25E5" ...'
      );
    });

    it('should accept { byName } as matcher', async () => {
      await uut.acquireFreeDevice({ name: 'Chika' });

      expect(applesimutils.list).toHaveBeenCalledWith(
        { byName: 'Chika' },
        'Searching for device by name = "Chika" ...'
      );
    });

    it('should accept { byType } as matcher', async () => {
      await uut.acquireFreeDevice({ type: 'iPad Air' });

      expect(applesimutils.list).toHaveBeenCalledWith(
        { byType: 'iPad Air' },
        'Searching for device by type = "iPad Air" ...'
      );
    });

    it('should accept { byType, byOS } as matcher', async () => {
      await uut.acquireFreeDevice({ type: 'iPad 2', os: 'iOS 9.3.6' });

      expect(applesimutils.list).toHaveBeenCalledWith(
        { byType: 'iPad 2', byOS: 'iOS 9.3.6' },
        'Searching for device by type = "iPad 2" and by OS = "iOS 9.3.6" ...'
      );
    });

    it('should create a device', async () => {
      const udidUsed = 'mock-used-udid';
      const udidNew = 'mock-new-udid';
      const specUsed = aDeviceSpec(udidUsed);

      givenSystemDevices(specUsed);
      givenCreatedDeviceUDID(udidNew);
      givenUsedSimulators(udidUsed);

      const result = await uut.acquireFreeDevice('iPhone Mock');

      expect(uut.applesimutils.create).toHaveBeenCalledWith(specUsed);
      expect(result).toEqual(udidNew);
    });

    it('should reuse a matching device', async () => {
      const udid = 'mock-device-udid';
      const specUsed = aDeviceSpec(udid);

      givenSystemDevices(specUsed);
      givenNoUsedSimulators();

      const result = await uut.acquireFreeDevice('iPhone Mock');

      expect(result).toEqual(udid);
      expect(uut.applesimutils.create).not.toHaveBeenCalled();
    });
  });
});

class mockAppleSimUtils {
  constructor() {
    this.launch = jest.fn();
    this.create = jest.fn();
    this.setBiometricEnrollment = jest.fn();
    this.matchBiometric = jest.fn();
    this.unmatchBiometric = jest.fn();
    this.boot = jest.fn();
    this.list = jest.fn();
  }
}
