describe('Device-driver base class', () => {
  const appId = 'com.wix.preconfigured.app';
  const rougeAppId = 'some.app.detox.was.not.aware.of.beforehand';
  const appAliases = ['app-alias-mock', 'app-alias2-mock'];
  const deviceId = 'device.id-mock';

  const selectDefaultApp = () => uut.selectApp(defaultApp.alias);
  const selectSecondaryApp = () => uut.selectApp(secondaryApp.alias);

  let eventEmitter;
  let defaultApp;
  let secondaryApp;
  let unspecifiedApp;
  let uut;
  beforeEach(() => {
    unspecifiedApp = {
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

  describe('app selection', () => {
    it('should select an app', async () => {
      const { alias, client, invocationManager } = defaultApp;

      await uut.selectApp(alias);
      expect(uut.selectedApp).toEqual(alias);
      expect(uut.client).toEqual(client);
      expect(uut.invocationManager).toEqual(invocationManager);
    });

    it('should select the secondary app', async () => {
      const { alias, client, invocationManager } = secondaryApp;

      await uut.selectApp(alias);
      expect(uut.selectedApp).toEqual(alias);
      expect(uut.client).toEqual(client);
      expect(uut.invocationManager).toEqual(invocationManager);
    });

    it('should clear selection', async () => {
      const { client, invocationManager } = unspecifiedApp;

      await selectDefaultApp();
      await uut.clearSelectedApp();
      expect(uut.selectedApp).toBeNull();
      expect(uut.client).toEqual(client);
      expect(uut.invocationManager).toEqual(invocationManager);
    });

    it('should query for the app\'s ID', async () => {
      await selectDefaultApp();
      expect(uut.mockFn._inferAppId).toHaveBeenCalledWith(defaultApp);
    });

    it('should cache app ID\'s', async () => {
      await selectDefaultApp();
      await uut.clearSelectedApp();
      await selectDefaultApp();
      expect(uut.mockFn._inferAppId).toHaveBeenCalledTimes(1);
    });
  });

  it('should rewire client termination function to driver\'s app termination', async () => {
    const terminateSpy = jest.spyOn(uut, 'terminate');

    // Give chance to get app ID's
    await selectDefaultApp();
    await selectSecondaryApp();
    await uut.clearSelectedApp();

    await defaultApp.client.terminateApp();
    expect(terminateSpy).toHaveBeenCalledTimes(1);
    expect(terminateSpy).toHaveBeenCalledWith(appId);
    expect(uut.mockFn._inferAppId).toHaveBeenCalledWith(defaultApp);

    await secondaryApp.client.terminateApp();
    expect(terminateSpy).toHaveBeenCalledTimes(2);
    expect(terminateSpy).toHaveBeenLastCalledWith(appId);
    expect(uut.mockFn._inferAppId).toHaveBeenNthCalledWith(2, secondaryApp);
  });

  describe('app launching and termination', () => {
    const launchArgs = { anArg: 'aValue' };
    const languageAndLocale = 'ab-אב';
    const pid = 121314;

    const launchApp = (_appId = appId) => uut.launchApp(launchArgs, languageAndLocale, _appId);
    const launchSelectedApp = () => uut.launchApp(launchArgs, languageAndLocale, undefined);
    const terminateApp = () => uut.terminate();

    beforeEach(() => uut.mockFn._launchApp.mockResolvedValue(pid));

    describe('of preconfigured test apps', () => {
      it('should ask concrete class to launch the app', async () => {
        await selectDefaultApp();
        await launchSelectedApp();
        expect(uut.mockFn._launchApp).toHaveBeenCalledWith(expect.objectContaining(launchArgs), languageAndLocale, defaultApp);
      });

      it('should ask concrete class to launch the app with server+session args associated with the selected app', async () => {
        const expectedSessionArgs = {
          detoxServer: 'mockUrlOf(port=2)',
          detoxSessionId: 'mockSessionIdOf(port=2)',
        };

        await selectSecondaryApp();
        await launchSelectedApp();
        expect(uut.mockFn._launchApp).toHaveBeenCalledWith(
          expect.objectContaining(expectedSessionArgs),
          languageAndLocale,
          secondaryApp);
      });

      it('should properly indicate pid via isAppRunning()', async () => {
        await selectDefaultApp();
        expect(uut.isAppRunning(appId)).toEqual(false);
        await launchApp();
        expect(uut.isAppRunning(appId)).toEqual(true);
      });

      it('should terminate based on the app\'s ID', async () => {
        await selectDefaultApp();
        await launchSelectedApp();
        await terminateApp();
        expect(uut.mockFn._terminate).toHaveBeenCalledWith(defaultApp);
      });

      it('should clear out is-running indication following a termination', async () => {
        await selectDefaultApp();
        await launchSelectedApp();
        await terminateApp();
        expect(uut.isAppRunning(appId)).toEqual(false);
      });
    });

    describe('of rouge apps', () => {
      it('should ask concrete class to launch the app with raw server+session args', async () => {
        const expectedSessionArgs = {
          detoxServer: 'mockUrlOf(port=666)',
          detoxSessionId: 'mockSessionIdOf(port=666)',
        };

        await selectDefaultApp();
        await launchApp(rougeAppId);
        expect(uut.mockFn._launchApp).toHaveBeenCalledWith(
          expect.objectContaining(expectedSessionArgs),
          languageAndLocale,
          expect.any(Object));
      });

      it('should ask concrete class to launch based on the unspecified app holder', async () => {
        await selectDefaultApp();
        await launchApp(rougeAppId);
        expect(uut.mockFn._launchApp).toHaveBeenCalledWith(
          expect.any(Object),
          expect.any(String),
          expect.objectContaining(unspecifiedApp));
      });

      it('should properly indicate pid via isAppRunning()', async () => {
        expect(uut.isAppRunning(rougeAppId)).toEqual(false);
        await launchApp(rougeAppId);
        expect(uut.isAppRunning(rougeAppId)).toEqual(true);
      });

      it('should terminate based on the app-ID of the last launched (rouge) app', async () => {
        await launchApp(rougeAppId);
        await terminateApp();
        expect(uut.mockFn._terminate).toHaveBeenCalledWith(expect.objectContaining({
          ...unspecifiedApp,
          appId: rougeAppId,
        }));
      });
    });

    it('should wait for app to become ready, active', async () => {
      await selectDefaultApp();
      await launchSelectedApp();
      expect(uut.mockFn._waitUntilReady).toHaveBeenCalledWith(defaultApp);
      expect(uut.mockFn.waitForActive).toHaveBeenCalled();
    });

    it('should emit an app-ready event', async () => {
      await selectDefaultApp();
      await launchSelectedApp();
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

  describe('test-end hook', () => {
    const testName = 'mock-test-name';

    it('should dump all pending requests', async () => {
      await uut.onTestEnd({ testName, pendingRequests: true });
      expect(defaultApp.client.dumpPendingRequests).toHaveBeenCalledWith({ testName });
      expect(secondaryApp.client.dumpPendingRequests).toHaveBeenCalledWith({ testName });
    });

    it('should dump pending requests of rouge apps', async () => {
      await uut.launchApp(rougeAppId, {}, '');
      await uut.onTestEnd({ testName, pendingRequests: true });
      expect(unspecifiedApp.client.dumpPendingRequests).toHaveBeenCalledWith({ testName });
    });

    it('should not do anything if there are no pending requests', async () => {
      await uut.onTestEnd({ pendingRequests: false });
      expect(defaultApp.client.dumpPendingRequests).not.toHaveBeenCalled();
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
        binaryPath: `path/to/bin${index}.app`,
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
        super({ apps, client, invocationManager, eventEmitter });

        // TODO (multiapps) Switch to jest.spy()?
        this.mockFn = {
          _launchApp: jest.fn(),
          _waitUntilReady: jest.fn(),
          waitForActive: jest.fn(),
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

      async waitForActive() {
        await super.waitForActive();
        return this.mockFn.waitForActive(...arguments);
      }

      async _terminate() {
        this.mockFn._terminate(...arguments);
      }

      async _inferAppId() {
        return this.mockFn._inferAppId(...arguments);
      }
    }
    return new DeviceDriverTest();
  };
});
