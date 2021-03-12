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

    it('should get called immediately', () => {
      expect(factory).toHaveBeenCalledWith(expect.objectContaining({
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
          disable: jest.fn(),
          onBootDevice: jest.fn(),
          onBeforeShutdownDevice: jest.fn(),
          onShutdownDevice: jest.fn(),
          onBeforeUninstallApp: jest.fn(),
          onBeforeTerminateApp: jest.fn(),
          onBeforeLaunchApp: jest.fn(),
          onLaunchApp: jest.fn(),
          onUserAction: jest.fn(),
          onBeforeAll: jest.fn(),
          onBeforeEach: jest.fn(),
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
        function itShouldCatchErrorsOnPhase(hookName, argFactory) {
          it(`should catch .${hookName} errors`, async () => {
            testPlugin[hookName].mockImplementation(() => {
              throw new Error(`test ${hookName} error`);
            });

            await artifactsManager[hookName](argFactory());
            expect(proxy.logger.warn.mock.calls).toMatchSnapshot();
          });
        }

        itShouldCatchErrorsOnPhase('onBeforeAll', () => undefined);

        itShouldCatchErrorsOnPhase('onBeforeEach', () => testSummaries.running());

        itShouldCatchErrorsOnPhase('onAfterEach', () => testSummaries.passed());

        itShouldCatchErrorsOnPhase('onAfterAll', () => undefined);

        itShouldCatchErrorsOnPhase('onTerminate', () => undefined);

        itShouldCatchErrorsOnPhase('onBootDevice', () => ({
          coldBoot: false,
          deviceId: 'testDeviceId',
        }));

        itShouldCatchErrorsOnPhase('onUserAction', () => ({
          type: 'takeScreenshot',
          options: {
            name: 'open app',
          }
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

        itShouldCatchErrorsOnPhase('onBeforeUninstallApp', () => ({
          bundleId: 'testBundleId',
          deviceId: 'testDeviceId',
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

    describe('onUserAction', () => {
      it('should call onUserAction in plugins', async () => {
        const actionInfo = {
          type: 'takeScreenshot',
          options: {
            name: 'open app',
          },
        };

        await artifactsManager.onUserAction(actionInfo);
        expect(testPlugin.onUserAction).toHaveBeenCalledWith(actionInfo);
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
