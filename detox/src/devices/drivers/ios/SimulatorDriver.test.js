const AsyncEmitter = require('../../../utils/AsyncEmitter');

describe('IOS simulator driver', () => {
  let MockClient;
  let uut, sim, emitter;

  const deviceId = 'device-id-mock';
  const bundleId = 'bundle-id-mock';

  beforeEach(() => {
    jest.mock('./tools/AppleSimUtils', () => mockAppleSimUtils);

    emitter = new AsyncEmitter({
      events: ['beforeLaunchApp'],
      onError: (e) => { throw e },
    });

    MockClient = jest.requireMock('../../../client/Client');
  });

  describe('launch args', () => {
    let launchArgs, languageAndLocale;

    beforeEach(() => {
      launchArgs = {
        'dog1': 'dharma',
        'dog2': 'karma',
      };

      languageAndLocale = '';

      const SimulatorDriver = require('./SimulatorDriver');
      uut = new SimulatorDriver({ client: {}, emitter });
    });

    it('should be passed to AppleSimUtils', async () => {
      await uut.launchApp(deviceId, bundleId, launchArgs, languageAndLocale);
      expect(uut.applesimutils.launch).toHaveBeenCalledWith(deviceId, bundleId, launchArgs, languageAndLocale);
    });

    it('should be passed to AppleSimUtils even if some of them were received from `beforeLaunchApp` phase', async () => {
      emitter.on('beforeLaunchApp', ({ launchArgs }) => {
        launchArgs.dog3 = 'Chika, from plugin';
      });

      await uut.launchApp(deviceId, bundleId, launchArgs, languageAndLocale);
      expect(uut.applesimutils.launch).toHaveBeenCalledWith(deviceId, bundleId, {
        ...launchArgs,
        dog3: 'Chika, from plugin',
      }, '');
    });
  });

  describe('.captureViewHierarchy', () => {
    let client;

    beforeEach(async () => {
      const SimulatorDriver = require('./SimulatorDriver');
      client = new MockClient();
      jest.spyOn(emitter, 'emit');

      uut = new SimulatorDriver({ client, emitter });
      await uut.captureViewHierarchy('', 'named hierarchy');
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
    beforeEach(() => {
      languageAndLocale = '';

      const SimulatorDriver = require('./SimulatorDriver');
      sim = new SimulatorDriver({ client: {}, emitter });
    });

    it('enrolls in biometrics by passing to AppleSimUtils', async () => {
      await sim.setBiometricEnrollment(deviceId, 'YES');
      expect(sim.applesimutils.setBiometricEnrollment).toHaveBeenCalledWith(deviceId, 'YES');
    });

    it('disenrolls in biometrics by passing to AppleSimUtils', async () => {
      await sim.setBiometricEnrollment(deviceId, 'NO');
      expect(sim.applesimutils.setBiometricEnrollment).toHaveBeenCalledWith(deviceId, 'NO');
    });

    it('matches a face by passing to AppleSimUtils', async () => {
      await sim.matchFace(deviceId);
      expect(sim.applesimutils.matchBiometric).toHaveBeenCalledWith(deviceId, 'Face');
    });

    it('fails to match a face by passing to AppleSimUtils', async () => {
      await sim.unmatchFace(deviceId);
      expect(sim.applesimutils.unmatchBiometric).toHaveBeenCalledWith(deviceId, 'Face');
    });

    it('matches a face by passing to AppleSimUtils', async () => {
      await sim.matchFinger(deviceId);
      expect(sim.applesimutils.matchBiometric).toHaveBeenCalledWith(deviceId, 'Finger');
    });

    it('fails to match a face by passing to AppleSimUtils', async () => {
      await sim.unmatchFinger(deviceId);
      expect(sim.applesimutils.unmatchBiometric).toHaveBeenCalledWith(deviceId, 'Finger');
    })
  });

  describe('acquireFreeDevice', () => {
    let applesimutils;

    beforeEach(() => {
      const SimulatorDriver = require('./SimulatorDriver');
      uut = new SimulatorDriver({ client: {}, emitter });
      jest.spyOn(uut.deviceRegistry, 'includes').mockResolvedValue(false);
      jest.spyOn(uut.deviceRegistry, 'getRegisteredDevices').mockResolvedValue([]);
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
  });
});

class mockAppleSimUtils {
  constructor() {
    this.launch = jest.fn();
    this.setBiometricEnrollment = jest.fn();
    this.matchBiometric = jest.fn();
    this.unmatchBiometric = jest.fn();
    this.boot = jest.fn();
    this.list = jest.fn();
  }
}
