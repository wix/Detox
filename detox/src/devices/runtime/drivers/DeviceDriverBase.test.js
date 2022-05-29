const _ = require('lodash');

const DetoxRuntimeErrorComposer = require('../../../errors/DetoxRuntimeErrorComposer');

describe('Device-driver base class', () => {
  const appId = 'com.wix.preconfigured.app';
  const unspecifiedAppId = 'some.app.detox.was.not.aware.of.beforehand';
  const unspecifiedAppConfig = {
    appId: unspecifiedAppId,
    binaryPath: 'stairway/to/heaven',
  };
  const appAliases = ['app-alias-mock', 'app-alias2-mock'];
  const deviceId = 'device.id-mock';
  const launchArgs = { anArg: 'aValue' };
  const languageAndLocale = 'ab-אב';
  const errorComposer = new DetoxRuntimeErrorComposer({ appsConfig: {} });

  const selectDefaultApp = () => uut.selectApp(defaultApp.alias);
  const selectSecondaryApp = () => uut.selectApp(secondaryApp.alias);
  const selectUnspecifiedApp = () => uut.selectUnspecifiedApp(unspecifiedAppConfig);

  const launchApp = (appAlias) => uut.launchApp(launchArgs, languageAndLocale, appAlias);
  const launchDefaultApp = () => launchApp(defaultApp.alias);
  const launchSecondaryApp = () => launchApp(secondaryApp.alias);
  const terminateApp = (appAlias) => uut.terminateApp(appAlias);
  const terminateDefaultApp = () => terminateApp(defaultApp.alias);

  let eventEmitter;
  let defaultApp;
  let secondaryApp;
  let unspecifiedApp;
  let uut;
  beforeEach(() => {
    unspecifiedApp = {
      appId: unspecifiedAppId,
      config: unspecifiedAppConfig,
      client: createClient(666),
      invocationManager: createInvocationManager(),
    };

    eventEmitter = {
      emit: jest.fn(),
      off: jest.fn(),
    };

    defaultApp = createTestApp(1);
    secondaryApp = createTestApp(2);
    uut = createDriver(defaultApp, secondaryApp);
  });

  it('should initialize the driver properly, given no apps', () => {
    const _uut = createDriver();
    expect(_uut.selectedApp).toBeNull();
    expect(_uut.client).toEqual(unspecifiedApp.client);
    expect(_uut.invocationManager).toEqual(unspecifiedApp.invocationManager);
  });

  it('should connect all clients is prepare()', async () => {
    await uut.prepare();
    expect(defaultApp.client.connect).toHaveBeenCalled();
    expect(secondaryApp.client.connect).toHaveBeenCalled();
    expect(unspecifiedApp.client.connect).toHaveBeenCalled();
  });

  it('should reject if a client connection fails on prepare()', async () => {
    const error = new Error('connect mock failure');
    secondaryApp.client.connect.mockRejectedValue(error);

    await expect(uut.prepare()).rejects.toThrowError(error);
  });

  describe('app selection', () => {
    it('should select the unspecified app by default', async () => {
      expect(uut.selectedApp).toBeNull();
      expect(uut.client).toEqual(unspecifiedApp.client);
      expect(uut.invocationManager).toEqual(unspecifiedApp.invocationManager);
    });

    describe('of preconfigured test apps', () => {
      it('should select an app', async () => {
        const { alias, client, invocationManager } = defaultApp;

        await selectDefaultApp();
        expect(uut.selectedApp).toEqual(alias);
        expect(uut.client).toEqual(client);
        expect(uut.invocationManager).toEqual(invocationManager);
      });

      it('should select the secondary app', async () => {
        const { alias, client, invocationManager } = secondaryApp;

        await selectSecondaryApp();
        expect(uut.selectedApp).toEqual(alias);
        expect(uut.client).toEqual(client);
        expect(uut.invocationManager).toEqual(invocationManager);
      });

      it('should query for the app\'s ID', async () => {
        await selectDefaultApp();
        expect(uut.mockFn._inferAppId).toHaveBeenCalledWith(defaultApp);
      });

      it('should cache app ID\'s', async () => {
        await selectDefaultApp();
        await selectSecondaryApp();
        await selectDefaultApp();
        expect(uut.mockFn._inferAppId).toHaveBeenCalledTimes(2);
      });
    });

    describe('of unspecified apps', () => {
      const appConfig = {
        appId: unspecifiedAppId,
        binaryPath: 'oh/my/gosh.apk',
      };

      it('should select those apps based on config', async () => {
        await uut.selectUnspecifiedApp(appConfig);

        expect(uut.selectedApp).toBeNull();
        expect(uut.client).toEqual(unspecifiedApp.client);
        expect(uut.invocationManager).toEqual(unspecifiedApp.invocationManager);
      });

      it('should allow for double selection (if the app is not running)', async () => {
        await uut.selectUnspecifiedApp(appConfig);
        await uut.selectUnspecifiedApp({
          appId: 'blah.blah',
          binaryPath: 'blah/blah.apk',
        });

        expect(uut.selectedApp).toBeNull();
        expect(uut.client).toEqual(unspecifiedApp.client);
        expect(uut.invocationManager).toEqual(unspecifiedApp.invocationManager);
      });
    });
  });

  it('should rewire client termination function to driver\'s app termination', async () => {
    const terminateSpy = jest.spyOn(uut, '_terminate');

    // Give chance to get app ID's
    await selectDefaultApp();
    await selectSecondaryApp();

    await defaultApp.client.terminateApp();
    expect(terminateSpy).toHaveBeenCalledTimes(1);
    expect(terminateSpy).toHaveBeenCalledWith(defaultApp);
    expect(uut.mockFn._inferAppId).toHaveBeenCalledWith(defaultApp);

    await secondaryApp.client.terminateApp();
    expect(terminateSpy).toHaveBeenCalledTimes(2);
    expect(terminateSpy).toHaveBeenLastCalledWith(secondaryApp);
    expect(uut.mockFn._inferAppId).toHaveBeenNthCalledWith(2, secondaryApp);
  });

  describe('app launching and termination', () => {
    const launchArgs = { anArg: 'aValue' };
    const languageAndLocale = 'ab-אב';
    const pid = 121314;

    beforeEach(() => uut.mockFn._launchApp.mockResolvedValue(pid));

    describe('of preconfigured test apps', () => {
      it('should ask concrete class to launch the app', async () => {
        await selectDefaultApp();
        await launchDefaultApp();
        expect(uut.mockFn._launchApp).toHaveBeenCalledWith(defaultApp, expect.objectContaining(launchArgs), languageAndLocale);
      });

      it('should ask concrete class to launch the app with server+session args associated with the selected app', async () => {
        const expectedSessionArgs = {
          detoxServer: 'mockUrlOf(port=2)',
          detoxSessionId: 'mockSessionIdOf(port=2)',
        };

        await selectSecondaryApp();
        await launchSecondaryApp();
        expect(uut.mockFn._launchApp).toHaveBeenCalledWith(secondaryApp, expect.objectContaining(expectedSessionArgs), languageAndLocale);
      });

      it('should properly indicate app state via isAppRunning()', async () => {
        await selectDefaultApp();
        expect(uut.isAppRunning(defaultApp.alias)).toEqual(false);
        await launchDefaultApp();
        expect(uut.isAppRunning(defaultApp.alias)).toEqual(true);
      });

      it('should terminate the select app', async () => {
        await selectDefaultApp();
        await launchDefaultApp();
        await terminateDefaultApp();
        expect(uut.mockFn._terminate).toHaveBeenCalledWith(defaultApp);
      });

      it('should clear out is-running indication following a termination', async () => {
        await selectDefaultApp();
        await launchDefaultApp();
        await terminateDefaultApp();
        expect(uut.isAppRunning(defaultApp.alias)).toEqual(false);
      });
    });

    describe('of unspecified apps', () => {
      it('should ask concrete class to launch based on selected config', async () => {
        await selectUnspecifiedApp();
        await launchApp(undefined);
        expect(uut.mockFn._launchApp).toHaveBeenCalledWith(
          expect.objectContaining(unspecifiedApp),
          expect.any(Object),
          expect.any(String));
      });

      it('should ask concrete class to launch the app with raw server+session args', async () => {
        const expectedSessionArgs = {
          detoxServer: 'mockUrlOf(port=666)',
          detoxSessionId: 'mockSessionIdOf(port=666)',
        };

        await selectUnspecifiedApp();
        await launchApp(undefined);
        expect(uut.mockFn._launchApp).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining(expectedSessionArgs),
          languageAndLocale);
      });

      it('should properly indicate app status via is-running', async () => {
        await selectUnspecifiedApp();

        expect(uut.isAppRunning()).toEqual(false);
        await launchApp(undefined);
        expect(uut.isAppRunning()).toEqual(true);
      });

      it('should terminate based on the unspecified app', async () => {
        await selectUnspecifiedApp();
        await launchApp(undefined);
        await terminateApp();
        expect(uut.mockFn._terminate).toHaveBeenCalledWith(expect.objectContaining({
          ...unspecifiedApp,
          appId: unspecifiedAppId,
        }));
      });
    });

    describe('in preselection state', () => {
      it('should throw an error', async () => {
        await expect(launchDefaultApp()).rejects.toThrowError(errorComposer.appNotSelected());
      });
    });


    it('should wait for app to become ready', async () => {
      await selectDefaultApp();
      await launchDefaultApp();
      expect(uut.mockFn._waitUntilReady).toHaveBeenCalledWith(defaultApp);
    });

    it('should emit an app-ready event', async () => {
      await selectSecondaryApp();
      await launchSecondaryApp();
      expect(eventEmitter.emit).toHaveBeenCalledWith('appReady', {
        deviceId,
        bundleId: appId,
        pid,
      });
    });
  });

  describe('cleanup', () => {
    it('should turn the emitter off', async () => {
      await uut.cleanup();
      expect(eventEmitter.off).toHaveBeenCalled();
    });

    it('should cleanup the clients of all associated apps', async () => {
      await uut.cleanup();
      expect(defaultApp.client.cleanup).toHaveBeenCalled();
      expect(secondaryApp.client.cleanup).toHaveBeenCalled();
      expect(unspecifiedApp.client.cleanup).toHaveBeenCalled();
    });

    it('should dump all pending requests associated with the clients of all associated apps', async () => {
      await uut.cleanup();
      expect(unspecifiedApp.client.dumpPendingRequests).toHaveBeenCalled();
      expect(defaultApp.client.dumpPendingRequests).toHaveBeenCalled();
      expect(secondaryApp.client.dumpPendingRequests).toHaveBeenCalled();
    });

    it('should await all cleanups', async () => {
      const error = new Error('The expected error');
      secondaryApp.client.cleanup.mockRejectedValue(error);

      try {
        await uut.cleanup();
        throw new Error('Not the expected error');
      } catch(e) {
        expect(e).toEqual(error);
      }
    });
  });

  describe('app install', () => {
    describe('of preconfigured test apps', () => {
      it('should call concrete class with associated app', async () => {
        await selectDefaultApp();
        await uut.installApp(defaultApp.alias);
        expect(uut.mockFn._installApp).toHaveBeenCalledWith(defaultApp);
      });
    });

    describe('of unspecified apps', () => {
      it('should call concrete class with associated app', async () => {
        await selectUnspecifiedApp();
        await uut.installApp(undefined);
        expect(uut.mockFn._installApp).toHaveBeenCalledWith(expect.objectContaining(unspecifiedApp));
      });
    });
  });

  describe('app uninstall', () => {
    describe('of preconfigured test apps', () => {
      it('should call concrete class with associated app', async () => {
        await selectDefaultApp();
        await uut.uninstallApp(defaultApp.alias);
        expect(uut.mockFn._uninstallApp).toHaveBeenCalledWith(defaultApp);
      });
    });

    describe('of unspecified apps', () => {
      it('should call concrete class with associated app', async () => {
        await selectUnspecifiedApp();
        await uut.uninstallApp(undefined);
        expect(uut.mockFn._uninstallApp).toHaveBeenCalledWith(expect.objectContaining(unspecifiedApp));
      });
    });
  });

  describe('test-end hook', () => {
    const testName = 'mock-test-name';

    it('should dump all pending requests', async () => {
      await uut.onTestEnd({ testName, pendingRequests: true });
      expect(defaultApp.client.dumpPendingRequests).toHaveBeenCalledWith({ testName });
      expect(secondaryApp.client.dumpPendingRequests).toHaveBeenCalledWith({ testName });
    });

    it('should dump pending requests of rouge apps', async () => {
      await uut.onTestEnd({ testName, pendingRequests: true });
      expect(unspecifiedApp.client.dumpPendingRequests).toHaveBeenCalledWith({ testName });
    });

    it('should not do anything if there are no pending requests', async () => {
      await uut.onTestEnd({ pendingRequests: false });
      expect(defaultApp.client.dumpPendingRequests).not.toHaveBeenCalled();
    });
  });

  describe('Invoke failure listener subscription', () => {
    const clientEventName = 'testFailed';

    it('should subscribe handler on all clients', async () => {
      const handler = jest.fn();

      await uut.setInvokeFailuresListener(handler);

      expect(defaultApp.client.setEventCallback).toHaveBeenCalledWith(clientEventName, handler);
      expect(secondaryApp.client.setEventCallback).toHaveBeenCalledWith(clientEventName, handler);
      expect(unspecifiedApp.client.setEventCallback).toHaveBeenCalledWith(clientEventName, handler);
    });
  });

  describe('Instruments recording', () => {
    const recordArgs = {
      recordingPath: '/tempfile',
      samplingInterval: 100,
    };

    const givenConnectedClient = ({ client }) => (client.isConnected = true);
    const expectRecordingStartCalled = ({ client }) => expect(client.startInstrumentsRecording).toHaveBeenCalledWith(recordArgs.recordingPath, recordArgs.samplingInterval);
    const expectRecordingStartNotCalled = ({ client }) => expect(client.startInstrumentsRecording).not.toHaveBeenCalled();
    const expectRecordingStopCalled = ({ client }) => expect(client.stopInstrumentsRecording).toHaveBeenCalled();
    const expectRecordingStopNotCalled = ({ client }) => expect(client.stopInstrumentsRecording).not.toHaveBeenCalled();

    it('should start recording in all apps (via clients)', async () => {
      givenConnectedClient(defaultApp);
      givenConnectedClient(secondaryApp);
      givenConnectedClient(unspecifiedApp);

      await uut.startInstrumentsRecording(recordArgs);

      expectRecordingStartCalled(defaultApp);
      expectRecordingStartCalled(secondaryApp);
      expectRecordingStartCalled(unspecifiedApp);
    });

    it('should not start recording if a client isn\'t connected', async () => {
      givenConnectedClient(defaultApp);
      givenConnectedClient(unspecifiedApp);

      await uut.startInstrumentsRecording(recordArgs);

      expectRecordingStartNotCalled(secondaryApp);
    });

    it('should fail to start recording if a client call fails', async () => {
      givenConnectedClient(defaultApp);
      givenConnectedClient(secondaryApp);
      secondaryApp.client.startInstrumentsRecording.mockRejectedValue(new Error());

      await expect(uut.startInstrumentsRecording(recordArgs)).rejects.toThrowError();
    });

    it('should stop recording in all apps (via clients)', async () => {
      givenConnectedClient(defaultApp);
      givenConnectedClient(secondaryApp);
      givenConnectedClient(unspecifiedApp);

      await uut.stopInstrumentsRecording();

      expectRecordingStopCalled(defaultApp);
      expectRecordingStopCalled(secondaryApp);
      expectRecordingStopCalled(unspecifiedApp);
    });

    it('should not record if a client isn\'t connected', async () => {
      givenConnectedClient(defaultApp);
      givenConnectedClient(unspecifiedApp);

      await uut.stopInstrumentsRecording();

      expectRecordingStopNotCalled(secondaryApp);
    });

    it('should fail if a client call fails', async () => {
      givenConnectedClient(defaultApp);
      givenConnectedClient(secondaryApp);
      secondaryApp.client.stopInstrumentsRecording.mockRejectedValue(new Error());

      await expect(uut.stopInstrumentsRecording()).rejects.toThrowError();
    });
  });

  const createClient = (port) => {
    const Client = jest.genMockFromModule('../../../client/Client');
    const client = new Client();
    client.serverUrl = `mockUrlOf(port=${port})`;
    client.sessionId = `mockSessionIdOf(port=${port})`;
    return client;
  };

  const createInvocationManager = () => {
    const InvocationManager = jest.genMockFromModule('../../../invoke').InvocationManager;
    return new InvocationManager();
  };

  const createTestApp = (index) => {
    const app = {
      alias: appAliases[index - 1],
      config: {
        binaryPath: `path/to/bin-${index}.app`,
      },
    };
    app.client = createClient(index);
    app.invocationManager = createInvocationManager();
    return app;
  };

  const createDriver = (app1, app2) => {
    const apps = {};
    if (app1) {
      apps[app1.alias] = app1;
    }
    if (app2) {
      apps[app2.alias] = app2;
    }

    const DeviceDriverBase = require('./DeviceDriverBase');
    class DeviceDriverTest extends DeviceDriverBase {
      constructor() {
        const { client, invocationManager } = unspecifiedApp;
        super({ apps, client, invocationManager, eventEmitter, errorComposer });

        // TODO (multiapps) Switch to jest.spy()?
        this.mockFn = {
          _launchApp: jest.fn(),
          _waitUntilReady: jest.fn(),
          _installApp: jest.fn(),
          _uninstallApp: jest.fn(),
          _terminate: jest.fn(),
          _inferAppId: jest.fn().mockResolvedValue(appId),
        };
      }

      getExternalId() {
        return deviceId;
      }

      async _launchApp() {
        return this.mockFn._launchApp(...arguments);
      }

      async _waitUntilReady() {
        await super._waitUntilReady();
        return this.mockFn._waitUntilReady(...arguments);
      }

      async _installApp() {
        return this.mockFn._installApp(...arguments);
      }

      async _uninstallApp() {
        return this.mockFn._uninstallApp(...arguments);
      }

      async _terminate(app) {
        this.mockFn._terminate(_.clone(app));
      }

      async _inferAppId() {
        return this.mockFn._inferAppId(...arguments);
      }
    }
    return new DeviceDriverTest();
  };
});
