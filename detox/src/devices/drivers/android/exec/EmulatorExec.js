const _ = require('lodash');
const os = require('os');
const argparse = require('../../../../utils/argparse');
const { getAndroidEmulatorPath } = require('../../../../utils/environment');
const {
  ExecCommand,
  BinaryExec,
} = require('./BinaryExec');

class EmulatorExec extends BinaryExec {
  constructor() {
    super(getAndroidEmulatorPath());
  }
}

class ListAVDsCommand extends ExecCommand {
  _getArgs() {
    return ['-list-avds', '--verbose'];
  }
}

class QueryVersionCommand extends ExecCommand {
  _getArgs() {
    return ['-version', `${argparse.getArgValue('headless')}` === 'true' ? '-no-window' : ''];
  }
}

class LaunchCommand extends ExecCommand {
  constructor(emulatorName, options) {
    super();
    this._args = this._getEmulatorArgs(emulatorName, options);
    this.port = options.port;
  }

  _getArgs() {
    return this._args;
  }

  _getEmulatorArgs(emulatorName, options) {
    const deviceLaunchArgs = (argparse.getArgValue('deviceLaunchArgs') || '').split(/\s+/);
    const emulatorArgs = _.compact([
      '-verbose',
      '-no-audio',
      '-no-boot-anim',
      `${argparse.getArgValue('headless')}` === 'true' ? '-no-window' : '',
      `${argparse.getArgValue('readOnlyEmu')}` === 'true' ? '-read-only' : '',
      options.port ? `-port` : '',
      options.port ? `${options.port}` : '',
      ...deviceLaunchArgs,
      `@${emulatorName}`
    ]);

    const gpuMethod = this._gpuMethod();
    if (gpuMethod) {
      emulatorArgs.push('-gpu', gpuMethod);
    }

    return emulatorArgs;
  }

  _gpuMethod() {
    const gpuArgument = argparse.getArgValue('gpu');
    if (gpuArgument) {
      return gpuArgument;
    }

    const headless = `${argparse.getArgValue('headless')}` === 'true';
    if (headless) {
      switch (os.platform()) {
        case 'darwin':
          return 'host';
        case 'linux':
          return 'swiftshader_indirect';
        case 'win32':
          return 'angle_indirect';
        default:
          return 'auto';
      }
    }

    return undefined;
  }
}

module.exports = {
  EmulatorExec,
  ListAVDsCommand,
  QueryVersionCommand,
  LaunchCommand,
};
