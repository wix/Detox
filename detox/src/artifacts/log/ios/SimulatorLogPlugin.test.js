// @ts-nocheck
jest.mock('../../../utils/logger');

const path = require('path');

const fs = require('fs-extra');
const _ = require('lodash');
const tempfile = require('tempfile');

const childProcess = require('../../../utils/childProcess');

describe('SimulatorLogPlugin', () => {
  async function majorWorkflow() {
    let fakePathBuilder = null;
    let fakeSources = null;
    let fakeAppleSimUtils = null;
    let artifactsManager = null;
    let SimulatorLogPlugin = null;
    let ArtifactsManager = null;
    let createdArtifacts = null;

    function init() {
      SimulatorLogPlugin = require('./SimulatorLogPlugin');
      ArtifactsManager = require('../../ArtifactsManager');

      createdArtifacts = [];
      fakePathBuilder = {
        buildPathForTestArtifact: jest.fn((artifactName, summary) => {
          const artifactPath = tempfile(summary ? '.log' : '.startup.log');
          if (!artifactName.includes('detox_')) {
            createdArtifacts.push(artifactPath);
          }

          return artifactPath;
        }),
      };

      fakeSources = {
        stdin: tempfile('.stdin.log'),
      };

      fakeAppleSimUtils = {
        logStream({ udid, processImagePath, level, stdout, stderr }) { // eslint-disable-line no-unused-vars
          // fs.writeFileSync(fakeSources.stdin, '');

          const handle = fs.openSync(fakeSources.stdin, 'r');
          const process = childProcess.spawnAndLog('cat', [], {
            stdio: [handle, stdout, stderr],
            silent: true,
          });

          process.catch(e => e).then(() => fs.close(handle));

          return process;
        },
        getAppContainer(udid, bundleId) {
          return `/path/to/simulators/${udid}/apps/${bundleId}.app`;
        },
      };

      artifactsManager = new ArtifactsManager({
        pathBuilder: fakePathBuilder,
        plugins: {
          log: {
            enabled: true,
            keepOnlyFailedTestsArtifacts: false,
          },
        },
      });
      artifactsManager.registerArtifactPlugins({
        log: (api) => new SimulatorLogPlugin({
          api,
          appleSimUtils: fakeAppleSimUtils,
        }),
      });
    }

    async function logToDeviceLogs(line) {
      await fs.appendFile(fakeSources.stdin, line + '\n');
      await fs.readFile(fakeSources.stdin, 'utf8');
    }

    await init();
    await artifactsManager.onBootDevice({ deviceId: 'booted' });
    await logToDeviceLogs('omit - after boot');

    await artifactsManager.onBeforeLaunchApp({ device: 'booted', bundleId: 'com.test' });
    await logToDeviceLogs('omit - during launch inside detox.init()');
    await artifactsManager.onLaunchApp({ device: 'booted', bundleId: 'com.test', pid: 8000 });
    await logToDeviceLogs('omit - after launch inside detox.init()');

    await artifactsManager.onTestStart({ title: 'test', fullName: 'some test', status: 'running' });
    await logToDeviceLogs('take - before relaunch inside test');

    await artifactsManager.onBeforeLaunchApp({ device: 'booted', bundleId: 'com.test' });
    await logToDeviceLogs('take - during relaunch inside test');
    await artifactsManager.onLaunchApp({ device: 'booted', bundleId: 'com.test', pid: 8001 });

    await logToDeviceLogs('take - after relaunch inside test');
    await artifactsManager.onTestDone({ title: 'test', fullName: 'some test', status: 'passed' });

    await logToDeviceLogs('omit - before cleanup');
    await artifactsManager.onBeforeCleanup();
    await logToDeviceLogs('omit - after cleanup');

    const result = {};

    expect(fakePathBuilder.buildPathForTestArtifact).toHaveBeenCalledTimes(4);
    for (const artifact of createdArtifacts) {
      const contents = (await fs.readFile(artifact, 'utf8')).trim().split('\n');
      const extension = path.basename(artifact).split('.').slice(1).join('.');

      result[extension] = contents;
    }

    const allCreatedFiles = [...Object.values(fakeSources), ...createdArtifacts];
    await Promise.all(allCreatedFiles.map(filename => fs.remove(filename)));

    return result;
  }

  it.skip('should work through-out boots, launches and relaunches', async () => {
    const snapshots = await majorWorkflow();
    for (const [snapshotName, value] of Object.entries(snapshots)) {
      expect(value).toMatchSnapshot(snapshotName);
    }
  });

  it.skip('should work consistently in a stressed environment', async () => {
    const results = await Promise.all(_.times(16, majorWorkflow));

    for (const result of results) {
      expect(result).toEqual(results[0]);
    }
  });
});
