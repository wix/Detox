const path = require('path');
const sleep = require('../utils/sleep');
const testSummaries = require('./templates/plugin/__mocks__/testSummaries.mock');
const testSuite = require('./templates/plugin/__mocks__/testSuite.mock');

describe('ArtifactsManager', () => {
  let proxy, FakePathBuilder;

  beforeEach(() => {
    jest.mock('fs-extra');
    jest.mock('./__mocks__/FakePathBuilder');
    jest.mock('./utils/ArtifactPathBuilder');
    jest.mock('../utils/argparse');
    jest.mock('../utils/logger');

    FakePathBuilder = require('./__mocks__/FakePathBuilder');

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

  describe('when plugin factory is registered', () => {
    let artifactsManager, factory, plugin;

    beforeEach(() => {
      factory = jest.fn().mockReturnValue(plugin = {
        onBeforeLaunchApp: jest.fn(),
      });

      artifactsManager = new proxy.ArtifactsManager({
        pathBuilder: new proxy.ArtifactPathBuilder({
          rootDir: '/tmp',
        }),
        plugins: {
          mock: { setting: 'value' },
        },
      });
      artifactsManager.registerArtifactPlugins({ mock: factory });
    });

    it('should get called immediately', () => {
      expect(factory).toHaveBeenCalledWith(expect.objectContaining({
        userConfig: { setting: 'value' },
        preparePathForArtifact: expect.any(Function),
        trackArtifact: expect.any(Function),
        untrackArtifact: expect.any(Function),
        requestIdleCallback: expect.any(Function),
      }));
    });
  });

  describe('.artifactsApi', () => {
    let artifactsManager, artifactsApi;
    let testPluginFactory, testPlugin;
    let pathBuilder;

    beforeEach(async () => {
      testPlugin = null;
      testPluginFactory = (api) => {
        artifactsApi = api;

        return (testPlugin = {
          name: 'testPlugin',
          userConfig: api.userConfig,
          disable: jest.fn(),
          onBootDevice: jest.fn(),
          onBeforeShutdownDevice: jest.fn(),
          onShutdownDevice: jest.fn(),
          onBeforeUninstallApp: jest.fn(),
          onBeforeTerminateApp: jest.fn(),
          onTerminateApp: jest.fn(),
          onBeforeLaunchApp: jest.fn(),
          onLaunchApp: jest.fn(),
          onCreateExternalArtifact: jest.fn(),
          onTestStart: jest.fn(),
          onTestDone: jest.fn(),
          onSuiteStart: jest.fn(),
          onSuiteEnd: jest.fn(),
          onInit: jest.fn(),
          onBeforeCleanup: jest.fn(),
        });
      };

      pathBuilder = new FakePathBuilder();
      artifactsManager = new proxy.ArtifactsManager({
        pathBuilder,
        plugins: {
          testPlugin: {
            lifecycle: 'all',
          }
        }
      });
      artifactsManager.registerArtifactPlugins({ testPlugin: testPluginFactory });
    });

    describe('.userConfig', () => {
      it('should contain plugin config', async () => {
        expect(artifactsApi.userConfig).toEqual({ lifecycle: 'all' });
      });
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

    describe('.requestIdleCallback()', () => {
      let callbacks, resolves, rejects;

      beforeEach(() => {
        callbacks = new Array(3);
        resolves = new Array(3);
        rejects = new Array(3);

        for (const index of [0, 1, 2]) {
          const promise = new Promise((resolve, reject) => {
            resolves[index] = resolve;
            rejects[index] = reject;
          });

          callbacks[index] = jest.fn(() => promise);
        }
      });

      it('should enqueue an async operation to a queue that executes operations only one by one', async () => {
        artifactsApi.requestIdleCallback(callbacks[0], testPlugin);
        artifactsApi.requestIdleCallback(callbacks[1], testPlugin);

        expect(callbacks[0]).toHaveBeenCalledTimes(0);
        expect(callbacks[1]).toHaveBeenCalledTimes(0);

        await sleep(0);
        expect(callbacks[0]).toHaveBeenCalledTimes(1);
        expect(callbacks[1]).toHaveBeenCalledTimes(0);

        await (resolves[0](), sleep(0));
        expect(callbacks[1]).toHaveBeenCalledTimes(1);
      });

      it('should catch errors, report them if callback fails, and move on ', async () => {
        artifactsApi.requestIdleCallback(callbacks[0], testPlugin);
        artifactsApi.requestIdleCallback(callbacks[1], testPlugin);
        rejects[0](new Error('test onIdleCallback error'));
        resolves[1]();

        expect(callbacks[0]).not.toHaveBeenCalled();
        expect(callbacks[1]).not.toHaveBeenCalled();
        expect(proxy.logger.warn.mock.calls.length).toBe(0);

        await sleep(0);

        expect(callbacks[0]).toHaveBeenCalled();
        expect(callbacks[1]).toHaveBeenCalled();
        expect(proxy.logger.warn.mock.calls.length).toBe(1);
      });

      it('should work correctly for onBeforeCleanup', async () => {
        resolves[0](); resolves[1](); resolves[2]();
        artifactsApi.requestIdleCallback(callbacks[0], testPlugin);
        artifactsApi.requestIdleCallback(callbacks[1], testPlugin);
        artifactsApi.requestIdleCallback(callbacks[2], testPlugin);

        await artifactsManager.onBeforeCleanup();
        expect(callbacks[0]).toHaveBeenCalledTimes(1);
        expect(callbacks[1]).toHaveBeenCalledTimes(1);
        expect(callbacks[2]).toHaveBeenCalledTimes(1);
      });
    });

    describe('hooks', () => {
      describe('error handling', () => {
        function itShouldCatchErrorsOnPhase(hookName, argFactory) {
          it(`should catch .${hookName} errors`, async () => {
            testPlugin[hookName].mockImplementation(() => {
              throw new Error(`test ${hookName} error`);
            });

            await artifactsManager[hookName](argFactory());
            expect(proxy.logger.warn.mock.calls).toEqual([[
              {
                err: expect.any(Error),
                event: 'SUPPRESS_PLUGIN_ERROR',
                methodName: hookName,
                plugin: 'testPlugin',
              },
              expect.stringContaining(`Suppressed error inside function call: testPlugin.${hookName}`)
            ]]);
          });
        }

        itShouldCatchErrorsOnPhase('onTestStart', () => testSummaries.running());

        itShouldCatchErrorsOnPhase('onTestDone', () => testSummaries.passed());

        itShouldCatchErrorsOnPhase('onSuiteStart', () => (testSuite.mock()));

        itShouldCatchErrorsOnPhase('onSuiteEnd', () => (testSuite.mock()));

        itShouldCatchErrorsOnPhase('onInit', () => undefined);

        itShouldCatchErrorsOnPhase('onBeforeCleanup', () => undefined);

        itShouldCatchErrorsOnPhase('onBootDevice', () => ({
          coldBoot: false,
          deviceId: 'testDeviceId',
        }));

        itShouldCatchErrorsOnPhase('onCreateExternalArtifact', () => ({
          pluginId: 'testPlugin',
          artifactName: 'example',
          artifactPath: '/tmp/path/to/artifact',
        }));

        itShouldCatchErrorsOnPhase('onBeforeShutdownDevice', () => ({
          deviceId: 'testDeviceId'
        }));

        itShouldCatchErrorsOnPhase('onShutdownDevice', () => ({
          deviceId: 'testDeviceId'
        }));

        itShouldCatchErrorsOnPhase('onBeforeLaunchApp', () => ({
          bundleId: 'testBundleId',
          deviceId: 'testDeviceId',
        }));

        itShouldCatchErrorsOnPhase('onLaunchApp', () => ({
          bundleId: 'testBundleId',
          deviceId: 'testDeviceId',
          pid: 2018,
        }));

        itShouldCatchErrorsOnPhase('onBeforeTerminateApp', () => ({
          bundleId: 'testBundleId',
          deviceId: 'testDeviceId',
        }));

        itShouldCatchErrorsOnPhase('onTerminateApp', () => ({
          bundleId: 'testBundleId',
          deviceId: 'testDeviceId',
        }));

        itShouldCatchErrorsOnPhase('onBeforeUninstallApp', () => ({
          bundleId: 'testBundleId',
          deviceId: 'testDeviceId',
        }));
      });

      describe('onTestStart', () => {
        it('should call onTestStart in plugins with the passed argument', async () => {
          const testSummary = testSummaries.running();

          expect(testPlugin.onTestStart).not.toHaveBeenCalled();
          await artifactsManager.onTestStart(testSummary);
          expect(testPlugin.onTestStart).toHaveBeenCalledWith(testSummary);
        });
      });

      describe('onTestDone', () => {
        it('should call onTestDone in plugins with the passed argument', async () => {
          const testSummary = testSummaries.passed();

          expect(testPlugin.onTestDone).not.toHaveBeenCalled();
          await artifactsManager.onTestDone(testSummary);
          expect(testPlugin.onTestDone).toHaveBeenCalledWith(testSummary);
        });
      });

      describe('onSuiteStart', () => {
        it('should call onSuiteStart in plugins with the passed argument', async () => {
          const suite = testSuite.mock();

          expect(testPlugin.onSuiteStart).not.toHaveBeenCalled();
          await artifactsManager.onSuiteStart(suite);
          expect(testPlugin.onSuiteStart).toHaveBeenCalledWith(suite);
        });
      });

      describe('onSuiteEnd', () => {
        it('should call onSuiteEnd in plugins with the passed argument', async () => {
          const suite = testSuite.mock();

          expect(testPlugin.onSuiteEnd).not.toHaveBeenCalled();
          await artifactsManager.onSuiteEnd(suite);
          expect(testPlugin.onSuiteEnd).toHaveBeenCalledWith(suite);
        });
      });

      describe('onInit', () => {
        it('should call onInit in plugins', async () => {
          expect(testPlugin.onInit).not.toHaveBeenCalled();
          await artifactsManager.onInit();
          expect(testPlugin.onInit).toHaveBeenCalled();
        });
      });

      describe('onBeforeCleanup', () => {
        it('should call onBeforeCleanup in plugins', async () => {
          expect(testPlugin.onBeforeCleanup).not.toHaveBeenCalled();
          await artifactsManager.onBeforeCleanup();
          expect(testPlugin.onBeforeCleanup).toHaveBeenCalled();
        });
      });

      describe('onBootDevice', () => {
        it('should call onBootDevice in plugins', async () => {
          const bootInfo = {
            coldBoot: false,
            deviceId: 'testDeviceId',
          };

          expect(testPlugin.onBootDevice).not.toHaveBeenCalled();
          await artifactsManager.onBootDevice(bootInfo);
          expect(testPlugin.onBootDevice).toHaveBeenCalledWith(bootInfo);
        });
      });

      describe('onBeforeTerminateApp', () => {
        it('should call onBeforeTerminateApp in plugins', async () => {
          const terminateInfo = {
            deviceId: 'testDeviceId',
            bundleId: 'testBundleId',
          };

          expect(testPlugin.onBeforeTerminateApp).not.toHaveBeenCalled();
          await artifactsManager.onBeforeTerminateApp(terminateInfo);
          expect(testPlugin.onBeforeTerminateApp).toHaveBeenCalledWith(terminateInfo);
        });
      });

      describe('onTerminateApp', () => {
        it('should call onTerminateApp in plugins', async () => {
          const terminateInfo = {
            deviceId: 'testDeviceId',
            bundleId: 'testBundleId',
          };

          expect(testPlugin.onBeforeTerminateApp).not.toHaveBeenCalled();
          await artifactsManager.onBeforeTerminateApp(terminateInfo);
          expect(testPlugin.onBeforeTerminateApp).toHaveBeenCalledWith(terminateInfo);
        });
      });

      describe('onBeforeUninstallApp', () => {
        it('should call onBeforeUninstallApp in plugins', async () => {
          const uninstallInfo = {
            deviceId: 'testDeviceId',
            bundleId: 'testBundleId',
          };

          expect(testPlugin.onBeforeUninstallApp).not.toHaveBeenCalled();
          await artifactsManager.onBeforeUninstallApp(uninstallInfo);
          expect(testPlugin.onBeforeUninstallApp).toHaveBeenCalledWith(uninstallInfo);
        });
      });

      describe('onBeforeShutdownDevice', () => {
        it('should call onBeforeShutdownDevice in plugins', async () => {
          const shutdownInfo = {
            deviceId: 'testDeviceId',
          };

          expect(testPlugin.onBeforeShutdownDevice).not.toHaveBeenCalled();
          await artifactsManager.onBeforeShutdownDevice(shutdownInfo);
          expect(testPlugin.onBeforeShutdownDevice).toHaveBeenCalledWith(shutdownInfo);
        });
      });

      describe('onShutdownDevice', () => {
        it('should call onShutdownDevice in plugins', async () => {
          const shutdownInfo = {
            deviceId: 'testDeviceId',
          };

          expect(testPlugin.onShutdownDevice).not.toHaveBeenCalled();
          await artifactsManager.onShutdownDevice(shutdownInfo);
          expect(testPlugin.onShutdownDevice).toHaveBeenCalledWith(shutdownInfo);
        });
      });
    });

    describe('onCreateExternalArtifact', () => {
      it('should call onCreateExternalArtifact in a specific plugin', async () => {
        await artifactsManager.onCreateExternalArtifact({
          pluginId: 'testPlugin',
          artifactPath: '/tmp/path/to/artifact',
          artifactName: 'Example',
        });

        expect(testPlugin.onCreateExternalArtifact).toHaveBeenCalledWith({
          artifact: expect.any(Object),
          name: 'Example',
        });
      });
    });

    describe('onBeforeLaunchApp', () => {
      it('should call onBeforeLaunchApp in plugins', async () => {
        const launchInfo = {
          deviceId: 'testDeviceId',
          bundleId: 'testBundleId',
        };

        expect(testPlugin.onBeforeLaunchApp).not.toHaveBeenCalledWith(launchInfo);
        await artifactsManager.onBeforeLaunchApp(launchInfo);
        expect(testPlugin.onBeforeLaunchApp).toHaveBeenCalledWith(launchInfo);
      });
    });

    describe('onLaunchApp', () => {
      it('should call onLaunchApp in plugins', async () => {
        const launchInfo = {
          deviceId: 'testDeviceId',
          bundleId: 'testBundleId',
          pid: 2018,
        };

        await artifactsManager.onBeforeLaunchApp({ ...launchInfo, pid: NaN });

        expect(testPlugin.onLaunchApp).not.toHaveBeenCalled();
        await artifactsManager.onLaunchApp(launchInfo);
        expect(testPlugin.onLaunchApp).toHaveBeenCalledWith(launchInfo);
      });
    });
  });
});
