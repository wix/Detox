// @ts-nocheck
describe('IOS simulator driver', () => {
  const udid = 'UD-1D-MOCK';
  const type = 'Chika';
  const bundleId = 'bundle-id-mock';
  const bootArgs = { boot: 'args' };

  let client;
  let eventEmitter;
  let applesimutils;
  let simulatorLauncher;
  let uut;
  beforeEach(() => {
    const AsyncEmitter = require('../../../../utils/AsyncEmitter');
    eventEmitter = new AsyncEmitter({
      events: ['beforeLaunchApp'],
      onError: (e) => { throw e; },
    });

    const ClientMock = jest.requireMock('../../../../client/Client');
    client = new ClientMock();

    const AppleSimUtils = jest.genMockFromModule('../../../common/drivers/ios/tools/AppleSimUtils');
    applesimutils = new AppleSimUtils();

    const SimulatorLauncher = jest.genMockFromModule('../../../allocation/drivers/ios/SimulatorLauncher');
    simulatorLauncher = new SimulatorLauncher();

    const SimulatorDriver = require('./SimulatorDriver');
    uut = new SimulatorDriver({ simulatorLauncher, applesimutils, client, eventEmitter }, { udid, type, bootArgs });
  });

  it('should return the UDID as the external ID', () => {
    expect(uut.getExternalId()).toEqual(udid);
  });

  it('should return the device name', () => {
    expect(uut.getDeviceName()).toEqual(`${udid} (Chika)`);
  });

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
      expect(applesimutils.launch).toHaveBeenCalledWith(udid, bundleId, launchArgs, languageAndLocale);
    });

    it('should be passed to AppleSimUtils even if some of them were received from `beforeLaunchApp` phase', async () => {
      eventEmitter.on('beforeLaunchApp', ({ launchArgs }) => {
        launchArgs.dog3 = 'Chika, from plugin';
      });

      await uut.launchApp(bundleId, launchArgs, languageAndLocale);
      expect(applesimutils.launch).toHaveBeenCalledWith(udid, bundleId, {
        ...launchArgs,
        dog3: 'Chika, from plugin',
      }, '');
    });
  });

  describe('.resetContentAndSettings', () => {
    it('should shut the device down', async () => {
      await uut.resetContentAndSettings();
      expect(simulatorLauncher.shutdown).toHaveBeenCalledWith(udid);
    });

    it('should reset via apple-sim-utils', async () => {
      await uut.resetContentAndSettings();
      expect(applesimutils.resetContentAndSettings).toHaveBeenCalledWith(udid);
    });

    it('should relaunch the simulator', async () => {
      await uut.resetContentAndSettings();
      expect(simulatorLauncher.launch).toHaveBeenCalledWith(udid, type, bootArgs);
    });
  });

  describe('.captureViewHierarchy', () => {
    beforeEach(async () => {
      jest.spyOn(eventEmitter, 'emit');

      await uut.captureViewHierarchy('named hierarchy');
    });

    it('should call client.captureViewHierarchy', async () => {
      expect(client.captureViewHierarchy).toHaveBeenCalledWith({
        viewHierarchyURL: expect.any(String),
      });
    });

    it('should emit "createExternalArtifact" event for uiHierarchy plugin', async () => {
      expect(eventEmitter.emit).toHaveBeenCalledWith('createExternalArtifact', {
        pluginId: 'uiHierarchy',
        artifactName: 'named hierarchy',
        artifactPath: expect.any(String),
      });
    });
  });

  describe('biometrics', () => {
    it('enrolls in biometrics by passing to AppleSimUtils', async () => {
      await uut.setBiometricEnrollment('YES');
      expect(applesimutils.setBiometricEnrollment).toHaveBeenCalledWith(udid, 'YES');
    });

    it('disenrolls in biometrics by passing to AppleSimUtils', async () => {
      await uut.setBiometricEnrollment('NO');
      expect(applesimutils.setBiometricEnrollment).toHaveBeenCalledWith(udid, 'NO');
    });

    it('matches a face by passing to AppleSimUtils', async () => {
      await uut.matchFace();
      expect(applesimutils.matchBiometric).toHaveBeenCalledWith(udid, 'Face');
    });

    it('fails to match a face by passing to AppleSimUtils', async () => {
      await uut.unmatchFace();
      expect(applesimutils.unmatchBiometric).toHaveBeenCalledWith(udid, 'Face');
    });

    it('matches a face by passing to AppleSimUtils', async () => {
      await uut.matchFinger();
      expect(applesimutils.matchBiometric).toHaveBeenCalledWith(udid, 'Finger');
    });

    it('fails to match a face by passing to AppleSimUtils', async () => {
      await uut.unmatchFinger();
      expect(applesimutils.unmatchBiometric).toHaveBeenCalledWith(udid, 'Finger');
    });
  });
});
