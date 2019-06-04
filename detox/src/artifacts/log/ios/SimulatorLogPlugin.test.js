jest.mock('../../../utils/argparse');
jest.mock('../../../utils/logger');

const _ = require('lodash');
const tempfile = require('tempfile');
const fs = require('fs-extra');
const exec = require('../../../utils/exec');
const path = require('path');

describe('SimulatorLogPlugin', () => {
  async function majorWorkflow() {
    let argparse = null;
    let fakePathBuilder = null;
    let fakeSources = null;
    let fakeAppleSimUtils = null;
    let artifactsManager = null;
    let SimulatorLogPlugin = null;
    let ArtifactsManager = null;
    let createdArtifacts = null;

    function init() {
      argparse = require('../../../utils/argparse');
      argparse.getArgValue.mockImplementation((key) => {
        switch (key) {
          case 'record-logs': return 'all';
          case 'loglevel': return 'trace';
          case 'artifacts-location': return path.dirname(tempfile(''));
          default: throw new Error(`unexpected argparse.getArgValue mock call: ${key}`);
        }
      });

      SimulatorLogPlugin = require('./SimulatorLogPlugin');
      ArtifactsManager = require('../../ArtifactsManager');

      createdArtifacts = [];
      fakePathBuilder = {
        buildPathForTestArtifact: jest.fn((_, summary) => {
          const artifactPath = tempfile(summary ? '.log' : '.startup.log');
          createdArtifacts.push(artifactPath);

          return artifactPath;
        }),
      };

      fakeSources = {
        stdin: tempfile('.stdin.log'),
      };

      fakeAppleSimUtils = {
        logStream({ udid, processImagePath, level, stdout, stderr }) {
          fs.writeFileSync(fakeSources.stdin, '');

          const handle = fs.openSync(fakeSources.stdin, 'r');
          const process = exec.spawnAndLog('cat', [], {
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

      artifactsManager = new ArtifactsManager(fakePathBuilder);
      artifactsManager.registerArtifactPlugins({
        log: (api) => new SimulatorLogPlugin({
          api,
          appleSimUtils: fakeAppleSimUtils,
        }),
      })
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

    await artifactsManager.onBeforeAll();
    await logToDeviceLogs('take - inside before all');

    await artifactsManager.onBeforeEach({ title: 'test', fullName: 'some test', status: 'running'});
    await logToDeviceLogs('take - inside before each');

    await logToDeviceLogs('take - before relaunch inside test');
    await artifactsManager.onBeforeLaunchApp({ device: 'booted', bundleId: 'com.test' });
    await logToDeviceLogs('take - during relaunch inside test');
    await artifactsManager.onLaunchApp({ device: 'booted', bundleId: 'com.test', pid: 8001 });
    await logToDeviceLogs('take - after relaunch inside test');

    await artifactsManager.onAfterEach({ title: 'test', fullName: 'some test', status: 'passed'});
    await logToDeviceLogs('omit - after afterEach');
    await artifactsManager.onAfterAll();
    await logToDeviceLogs('omit - after afterAll');

    const result = {};

    expect(fakePathBuilder.buildPathForTestArtifact).toHaveBeenCalledTimes(2);
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
