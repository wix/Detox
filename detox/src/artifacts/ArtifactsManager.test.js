const path = require('path');
const sleep = require('../utils/sleep');
const testSummaries = require('./templates/plugin/__mocks__/testSummaries.mock');

describe('ArtifactsManager', () => {
  let proxy;

  beforeEach(() => {
    jest.mock('fs-extra');
    jest.mock('./utils/ArtifactPathBuilder');
    jest.mock('../utils/argparse');
    jest.mock('../utils/logger');

    proxy = {
      get ArtifactPathBuilder() {
        return require('./utils/ArtifactPathBuilder');
      },
      get ArtifactsManager() {
        return require('./ArtifactsManager');
      },
      get logger() {
        return require('../utils/logger');
      },
      get fs() {
        return require('fs-extra');
      },
      get argparse() {
        return require('../utils/argparse');
      },
    };
  });

  describe('when created', () => {
    let artifactsManager;

    beforeEach(() => {
      proxy.argparse.getArgValue.mockImplementation((key) => {
        return (key === 'artifacts-location') ? '/tmp' : '';
      });

      artifactsManager = new proxy.ArtifactsManager();
    });

    it('should provide partially working artifacts api, where .getDeviceId() throws', () => {
      expect(() => artifactsManager.artifactsApi.getDeviceId()).toThrowErrorMatchingSnapshot();
    });

    it('should provide partially working artifacts api, where .getBundleId() throws', () => {
      expect(() => artifactsManager.artifactsApi.getBundleId()).toThrowErrorMatchingSnapshot();
    });

    it('should provide partially working artifacts api, where .getPid() throws', () => {
      expect(() => artifactsManager.artifactsApi.getPid()).toThrowErrorMatchingSnapshot();
    });

    it('should provide artifacts location to path builder', async () => {
      expect(proxy.ArtifactPathBuilder).toHaveBeenCalledWith({
        artifactsRootDir: '/tmp',
      });
    });

    it('should correctly terminate itself (without errors)', async () => {
      await artifactsManager.onTerminate();
    });
  });

  describe('when plugin factory is registered', () => {
    let artifactsManager, factory, plugin;

    beforeEach(() => {
      factory = jest.fn().mockReturnValue(plugin = {
        onBeforeLaunchApp: jest.fn(),
      });

      artifactsManager = new proxy.ArtifactsManager();
      artifactsManager.registerArtifactPlugins({ mock: factory });
    });

    it('should not get called immediately', () => {
      expect(factory).not.toHaveBeenCalled();
    });

    describe('and the app is about to be launched for the first time', function() {
      beforeEach(async () => {
        await artifactsManager.onBeforeLaunchApp({
          deviceId: 'testDeviceId',
          bundleId: 'testBundleId',
        });
      });

      it('(factory) should get called', () => {
        expect(factory).toHaveBeenCalledWith(artifactsManager.artifactsApi);
      });

      it('should be able to get device id from artifacts API', () => {
        expect(artifactsManager.artifactsApi.getDeviceId()).toBe('testDeviceId');
      });

      it('should be able to get bundle id from artifacts API', () => {
        expect(artifactsManager.artifactsApi.getBundleId()).toBe('testBundleId');
      });

      it('still should not be able to get PID from artifacts API', () => {
        expect(() => artifactsManager.artifactsApi.getPid()).toThrowErrorMatchingSnapshot();
      });

      describe('and it launched', () => {
        beforeEach(async () => {
          await artifactsManager.onLaunchApp({
            deviceId: 'testDeviceId',
            bundleId: 'testBundleId',
            pid: 2018,
          });
        });

        it('should be able to get PID from artifacts API', () => {
          expect(artifactsManager.artifactsApi.getPid()).toBe(2018);
        });
      });
    });
  });

  describe('.artifactsApi', () => {
    let artifactsManager, artifactsApi;
    let testPluginFactory, testPlugin;
    let pathBuilder;

    beforeEach(async () => {
      testPluginFactory = (api) => {
        artifactsApi = api;

        return (testPlugin = {
          name: 'testPlugin',
          disable: jest.fn(),
          onBeforeRelaunchApp: jest.fn(),
          onRelaunchApp: jest.fn(),
          onBeforeAll: jest.fn(),
          onBeforeEach: jest.fn(),
          onBeforeResetDevice: jest.fn(),
          onResetDevice: jest.fn(),
          onAfterEach: jest.fn(),
          onAfterAll: jest.fn(),
          onTerminate: jest.fn(),
        });
      };

      pathBuilder = {
        buildPathForTestArtifact: jest.fn(),
      };

      artifactsManager = new proxy.ArtifactsManager(pathBuilder);
      artifactsManager.registerArtifactPlugins({ testPluginFactory });

      await artifactsManager.onBeforeLaunchApp({
        deviceId: 'testDeviceId',
        bundleId: 'testBundleId',
      });

      await artifactsManager.onLaunchApp({
        deviceId: 'testDeviceId',
        bundleId: 'testBundleId',
        pid: 2018,
      })
    });

    describe('.preparePathForArtifact()', () => {
      let argparse, fs;

      beforeEach(() => {
        argparse = require('../utils/argparse');
        fs = require('fs-extra');
      });

      it('should prepare directory for test artifact at given path', async () => {
        const testSummary = {};
        const givenArtifactPath = path.join('artifacts', 'something', 'startup.log');
        pathBuilder.buildPathForTestArtifact.mockReturnValue(givenArtifactPath);

        const returnedArtifactPath = await artifactsApi.preparePathForArtifact('test', testSummary);

        expect(pathBuilder.buildPathForTestArtifact).toHaveBeenCalledWith('test', testSummary);
        expect(returnedArtifactPath).toBe(givenArtifactPath);
        expect(fs.ensureDir).toHaveBeenCalledWith(path.join('artifacts', 'something'));
      });
    });

    describe('.trackArtifact()', () => {
      it('should mark artifact to be discarded when Detox is being terminated', async () => {
        const artifact = {
          discard: jest.fn(),
        };

        artifactsApi.trackArtifact(artifact);
        expect(artifact.discard).not.toHaveBeenCalled();
        await artifactsManager.onTerminate();
        expect(artifact.discard).toHaveBeenCalled();
      });
    });

    describe('.untrackArtifact()', () => {
      it('should mark artifact as the one that does not have to be discarded when Detox is being terminated', async () => {
        const artifact = {
          discard: jest.fn(),
        };

        artifactsApi.trackArtifact(artifact);
        artifactsApi.untrackArtifact(artifact);

        expect(artifact.discard).not.toHaveBeenCalled();
        await artifactsManager.onTerminate();
        expect(artifact.discard).not.toHaveBeenCalled();
      });
    });

    describe('.requestIdleCallback()', () => {
      let callbacks, resolves, rejects;

      beforeEach(() => {
        callbacks = new Array(3);
        resolves = new Array(3);
        rejects = new Array(3);

        [0, 1, 2].forEach((index) => {
          callbacks[index] = jest.fn().mockImplementation(() => {
            return new Promise((resolve, reject) => {
              resolves[index] = async (value) => { resolve(value); await sleep(0); };
              rejects[index] = async (value) => { reject(value); await sleep(0); };
            });
          });
        });
      });

      it('should enqueue an async operation to a queue that executes operations only one by one', async () => {
        artifactsApi.requestIdleCallback(callbacks[0], testPlugin); await sleep(0);
        expect(callbacks[0]).toHaveBeenCalled();

        artifactsApi.requestIdleCallback(callbacks[1], testPlugin);
        artifactsApi.requestIdleCallback(callbacks[2], testPlugin);

        expect(callbacks[1]).not.toHaveBeenCalled();
        expect(callbacks[2]).not.toHaveBeenCalled();

        await resolves[0]();
        expect(callbacks[1]).toHaveBeenCalled();
        expect(callbacks[2]).not.toHaveBeenCalled();

        await resolves[1]();
        expect(callbacks[2]).toHaveBeenCalled();
      });

      it('should catch errors, report them if callback fails, and move on ', async () => {
        artifactsApi.requestIdleCallback(callbacks[0], testPlugin); await sleep(0);
        await rejects[0](new Error('test onIdleCallback error'));

        expect(proxy.logger.error.mock.calls).toMatchSnapshot();

        artifactsApi.requestIdleCallback(callbacks[1], testPlugin); await sleep(0);
        expect(callbacks[1]).toHaveBeenCalled();
      });

      it('should gracefully handle a case when plugin object is not passed and use "unknown" as a name placeholder', async () => {
        artifactsApi.requestIdleCallback(callbacks[0]); await sleep(0);
        await rejects[0](new Error('test onIdleCallback error'));

        expect(proxy.logger.error.mock.calls).toMatchSnapshot();

        artifactsApi.requestIdleCallback(callbacks[1], testPlugin); await sleep(0);
        expect(callbacks[1]).toHaveBeenCalled();
      });

      it('should work correctly even when operations are flushed on Detox termination', async () => {
        artifactsApi.requestIdleCallback(callbacks[0], testPlugin);
        artifactsApi.requestIdleCallback(callbacks[1], testPlugin);
        artifactsApi.requestIdleCallback(callbacks[2], testPlugin);
        artifactsManager.onTerminate();
        await sleep(0);

        expect(callbacks[0]).toHaveBeenCalledTimes(1);
        expect(callbacks[1]).toHaveBeenCalledTimes(1);
        expect(callbacks[2]).toHaveBeenCalledTimes(1);

        await Promise.all(resolves.map(r => r()));

        expect(callbacks[0]).toHaveBeenCalledTimes(1);
        expect(callbacks[1]).toHaveBeenCalledTimes(1);
        expect(callbacks[2]).toHaveBeenCalledTimes(1);
      });
    });

    describe('hooks', () => {
      describe('error handling', () => {
        function itShouldCatchErrorsOnPhase(eventNames, argFactory) {
          const managerMethod = Array.isArray(eventNames) ? eventNames[0] : eventNames;
          const pluginHook = Array.isArray(eventNames) ? eventNames[1] : eventNames;

          it(`should catch .${pluginHook} errors`, async () => {
            testPlugin[pluginHook].mockImplementation(() => {
              throw new Error(`test ${pluginHook} error`);
            });

            await artifactsManager[managerMethod](argFactory());
            expect(proxy.logger.error.mock.calls).toMatchSnapshot();
          });
        }

        itShouldCatchErrorsOnPhase('onBeforeAll', () => undefined);

        itShouldCatchErrorsOnPhase('onBeforeEach', () => testSummaries.running());

        itShouldCatchErrorsOnPhase('onAfterEach', () => testSummaries.passed());

        itShouldCatchErrorsOnPhase('onAfterAll', () => undefined);

        itShouldCatchErrorsOnPhase('onTerminate', () => undefined);

        itShouldCatchErrorsOnPhase('onBeforeResetDevice', () => ({
          deviceId: 'testDeviceId'
        }));

        itShouldCatchErrorsOnPhase('onResetDevice', () => ({
          deviceId: 'testDeviceId'
        }));

        itShouldCatchErrorsOnPhase(['onBeforeLaunchApp', 'onBeforeRelaunchApp'], () => ({
          bundleId: 'testBundleId',
          deviceId: 'testDeviceId',
        }));

        itShouldCatchErrorsOnPhase(['onLaunchApp', 'onRelaunchApp'], () => ({
          bundleId: 'testBundleId',
          deviceId: 'testDeviceId',
          pid: 2018,
        }));
      });

      describe('onBeforeAll', () => {
        it('should call onBeforeAll in plugins', async () => {
          expect(testPlugin.onBeforeAll).not.toHaveBeenCalled();
          await artifactsManager.onBeforeAll();
          expect(testPlugin.onBeforeAll).toHaveBeenCalled();
        });
      });

      describe('onBeforeEach', () => {
        it('should call onBeforeEach in plugins with the passed argument', async () => {
          const testSummary = testSummaries.running();

          expect(testPlugin.onBeforeEach).not.toHaveBeenCalled();
          await artifactsManager.onBeforeEach(testSummary);
          expect(testPlugin.onBeforeEach).toHaveBeenCalledWith(testSummary);
        });
      });

      describe('onAfterEach', () => {
        it('should call onAfterEach in plugins with the passed argument', async () => {
          const testSummary = testSummaries.passed();

          expect(testPlugin.onAfterEach).not.toHaveBeenCalled();
          await artifactsManager.onAfterEach(testSummary);
          expect(testPlugin.onAfterEach).toHaveBeenCalledWith(testSummary);
        });
      });

      describe('onAfterAll', () => {
        it('should call onAfterAll in plugins', async () => {
          expect(testPlugin.onAfterAll).not.toHaveBeenCalled();
          await artifactsManager.onAfterAll();
          expect(testPlugin.onAfterAll).toHaveBeenCalled();
        });
      });

      describe('onTerminate', () => {
        it('should call onTerminate in plugins', async () => {
          expect(testPlugin.onTerminate).not.toHaveBeenCalled();
          await artifactsManager.onTerminate();
          expect(testPlugin.onTerminate).toHaveBeenCalled();
        });
      });

      describe('onBeforeResetDevice', () => {
        it('should call onBeforeResetDevice in plugins', async () => {
          const resetInfo = {
            deviceId: 'testDeviceId',
          };

          expect(testPlugin.onBeforeResetDevice).not.toHaveBeenCalled();
          await artifactsManager.onBeforeResetDevice(resetInfo);
          expect(testPlugin.onBeforeResetDevice).toHaveBeenCalledWith(resetInfo);
        });
      });

      describe('onResetDevice', () => {
        it('should call onResetDevice in plugins', async () => {
          const resetInfo = {
            deviceId: 'testDeviceId',
          };

          expect(testPlugin.onResetDevice).not.toHaveBeenCalled();
          await artifactsManager.onResetDevice(resetInfo);
          expect(testPlugin.onResetDevice).toHaveBeenCalledWith(resetInfo);
        });
      });

      describe('onBeforeLaunchApp (when called not for the first time)', () => {
        it('should call onBeforeRelaunchApp in plugins', async () => {
          const launchInfo = {
            deviceId: 'testDeviceId',
            bundleId: 'testBundleId',
          };

          expect(testPlugin.onBeforeRelaunchApp).not.toHaveBeenCalled();
          await artifactsManager.onBeforeLaunchApp(launchInfo);
          expect(testPlugin.onBeforeRelaunchApp).toHaveBeenCalledWith(launchInfo);
        });
      });

      describe('onLaunchApp (when called not for the first time)', () => {
        it('should call onRelaunchApp in plugins', async () => {
          const launchInfo = {
            deviceId: 'testDeviceId',
            bundleId: 'testBundleId',
            pid: 2019,
          };

          expect(testPlugin.onRelaunchApp).not.toHaveBeenCalled();
          await artifactsManager.onLaunchApp(launchInfo);
          expect(testPlugin.onRelaunchApp).toHaveBeenCalledWith(launchInfo);
        });
      });
    });
  });
});
