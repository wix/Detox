jest.mock('../../../utils/argparse');
jest.mock('../../../utils/logger');

const tempfile = require('tempfile');
const fs = require('fs-extra');
const path = require('path');

describe('SimulatorLogPlugin', () => {
  let argparse;
  let fakePathBuilder;
  let fakeAppleSimUtils;
  let artifactsManager;
  let SimulatorLogPlugin;
  let ArtifactsManager;
  let createdArtifacts;

  beforeEach(() => {
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

    fakeAppleSimUtils = {
      logs: Object.freeze({
        stdout: tempfile('.stdout.log'),
        stderr: tempfile('.stderr.log'),
      }),

      getLogsPaths() {
        return this.logs;
      }
    };

    artifactsManager = new ArtifactsManager(fakePathBuilder);
    artifactsManager.registerArtifactPlugins({
      log: (api) => new SimulatorLogPlugin({
        api,
        appleSimUtils: fakeAppleSimUtils,
      }),
    })
  });

  async function logToDeviceLogs(line) {
    await Promise.all([
      fs.appendFile(fakeAppleSimUtils.logs.stdout, line + '\n'),
      fs.appendFile(fakeAppleSimUtils.logs.stderr, line + '\n'),
    ]);
  }

  async function deleteDeviceLogs() {
    await Promise.all([
      fs.remove(fakeAppleSimUtils.logs.stdout),
      fs.remove(fakeAppleSimUtils.logs.stderr),
    ]);
  }

  it('should work through-out boots, launches and relaunches', async () => {
    await artifactsManager.onBootDevice({ deviceId: 'booted' });
    await logToDeviceLogs('after boot');

    await artifactsManager.onBeforeLaunchApp({ device: 'booted', bundleId: 'com.test' });
    await deleteDeviceLogs();

    await logToDeviceLogs('during launch inside detox.init()');
    await artifactsManager.onLaunchApp({ device: 'booted', bundleId: 'com.test', pid: 8000 });
    await logToDeviceLogs('after launch inside detox.init()');

    await artifactsManager.onBeforeAll();
    await logToDeviceLogs('inside before all');

    await artifactsManager.onBeforeEach({ title: 'test', fullName: 'some test', status: 'running'});
    await logToDeviceLogs('inside before each');

    await logToDeviceLogs('before relaunch inside test');
    await artifactsManager.onBeforeLaunchApp({ device: 'booted', bundleId: 'com.test' });
    await deleteDeviceLogs();
    await logToDeviceLogs('during relaunch inside test');
    await artifactsManager.onLaunchApp({ device: 'booted', bundleId: 'com.test', pid: 8001 });
    await logToDeviceLogs('after relaunch inside test');

    await artifactsManager.onAfterEach({ title: 'test', fullName: 'some test', status: 'passed'});
    await logToDeviceLogs('after afterEach');
    await artifactsManager.onAfterAll();
    await logToDeviceLogs('after afterAll');

    expect(fakePathBuilder.buildPathForTestArtifact).toHaveBeenCalledTimes(2);
    for (const artifact of createdArtifacts) {
      const contents = (await fs.readFile(artifact, 'utf8')).split('\n');
      const extension = path.basename(artifact).split('.').slice(1).join('.');

      expect(contents.filter(s => s.indexOf('stdout: ') === 0)).toMatchSnapshot(`stdout.${extension}`);
      expect(contents.filter(s => s.indexOf('stderr: ') === 0)).toMatchSnapshot(`stderr.${extension}`);
    }

    const allCreatedFiles = [...Object.values(fakeAppleSimUtils.logs), ...createdArtifacts];
    await Promise.all(allCreatedFiles.map(filename => fs.remove(filename)));
  });
});
