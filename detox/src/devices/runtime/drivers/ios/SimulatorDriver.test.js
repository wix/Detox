jest.mock('../../../../ios/XCUITestRunner');

// @ts-nocheck
describe('IOS simulator driver', () => {
  const udid = 'UD-1D-MOCK';
  const type = 'Chika';
  const bundleId = 'bundle-id-mock';
  const bootArgs = { boot: 'args' };
  const headless = true;

  let client;
  let eventEmitter;
  let applesimutils;
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

    const SimulatorDriver = require('./SimulatorDriver');
    uut = new SimulatorDriver(
      { applesimutils, client, eventEmitter },
      { udid, type, bootArgs, headless }
    );
  });

  it('should return the UDID as the external ID', () => {
    expect(uut.getExternalId()).toEqual(udid);
  });

  it('should return the device name', () => {
    expect(uut.getDeviceName()).toEqual(`${udid} (Chika)`);
  });

  describe('device-level gestures', () => {
    let mockExecute;
    let XCUITestRunner;

    beforeEach(() => {
      mockExecute = jest.fn().mockResolvedValue();

      // Setup XCUITestRunner mock
      jest.mock('../../../../ios/XCUITestRunner', () => {
        return jest.fn().mockImplementation(() => ({
          execute: mockExecute
        }));
      });

      // Get fresh copy of mocked XCUITestRunner
      XCUITestRunner = require('../../../../ios/XCUITestRunner');
    });

    describe('tap', () => {
      it('should create XCUITestRunner with device info', async () => {
        await uut.tap();

        expect(XCUITestRunner).toHaveBeenCalledWith({
          runtimeDevice: {
            id: udid,
            _bundleId: undefined
          }
        });
      });

      it('should tap with default coordinates when no point provided', async () => {
        await uut.tap();

        expect(mockExecute).toHaveBeenCalledWith({
          type: 'systemAction',
          systemAction: 'coordinateTap',
          params: ['100', '100']
        });
      });

      it('should tap with provided coordinates', async () => {
        await uut.tap({ x: 200, y: 300 });

        expect(mockExecute).toHaveBeenCalledWith({
          type: 'systemAction',
          systemAction: 'coordinateTap',
          params: ['200', '300']
        });
      });

      it('should pass bundleId to XCUITestRunner when provided', async () => {
        await uut.tap(null, false, 'test.bundle');

        expect(XCUITestRunner).toHaveBeenCalledWith({
          runtimeDevice: {
            id: udid,
            _bundleId: 'test.bundle'
          }
        });
      });
    });

    describe('longPress', () => {
      it('should create XCUITestRunner with device info', async () => {
        await uut.longPress();

        expect(XCUITestRunner).toHaveBeenCalledWith({
          runtimeDevice: {
            id: udid,
            _bundleId: undefined
          }
        });
      });

      it('should long press with default coordinates and duration when no params provided', async () => {
        await uut.longPress();

        expect(mockExecute).toHaveBeenCalledWith({
          type: 'systemAction',
          systemAction: 'coordinateLongPress',
          params: ['100', '100', '1']
        });
      });

      it('should long press with provided coordinates and duration', async () => {
        await uut.longPress({ x: 200, y: 300 }, 2000);

        expect(mockExecute).toHaveBeenCalledWith({
          type: 'systemAction',
          systemAction: 'coordinateLongPress',
          params: ['200', '300', '2']
        });
      });

      it('should convert press duration from milliseconds to seconds', async () => {
        await uut.longPress({ x: 100, y: 100 }, 3500);

        expect(mockExecute).toHaveBeenCalledWith({
          type: 'systemAction',
          systemAction: 'coordinateLongPress',
          params: ['100', '100', '3.5']
        });
      });

      it('should pass bundleId to XCUITestRunner when provided', async () => {
        await uut.longPress(null, null, false, 'test.bundle');

        expect(XCUITestRunner).toHaveBeenCalledWith({
          runtimeDevice: {
            id: udid,
            _bundleId: 'test.bundle'
          }
        });
      });
    });

    afterEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
    });
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
      expect(applesimutils.shutdown).toHaveBeenCalledWith(udid);
    });

    it('should reset via apple-sim-utils', async () => {
      await uut.resetContentAndSettings();
      expect(applesimutils.resetContentAndSettings).toHaveBeenCalledWith(udid);
    });

    it('should relaunch the simulator', async () => {
      await uut.resetContentAndSettings();
      expect(applesimutils.boot).toHaveBeenCalledWith(udid, bootArgs, true);
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
