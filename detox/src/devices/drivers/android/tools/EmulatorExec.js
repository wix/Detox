const _ = require('lodash');
const os = require('os');
const spawn = require('child-process-promise').spawn;
const exec = require('../../../../utils/exec').execWithRetriesAndLogs;
const argparse = require('../../../../utils/argparse');
const {getAndroidEmulatorPath} = require('../../../../utils/environment');

class EmulatorExec {
  constructor() {
    this.binary = getAndroidEmulatorPath();
  }

  toString() {
    return this.binary;
  }

  async exec(command) {
    return (await exec(`"${this.binary}" ${command._getArgsString()}`)).stdout;
  }

  spawn(command, stdout, stderr) {
    return spawn(this.binary, command._getArgs(), { detached: true, stdio: ['ignore', stdout, stderr] });
  }
}

class EmulatorCommand {
  toString() {
    return this._getArgsString();
  }

  _getArgs() {}
  _getArgsString() {
    return this._getArgs().join(' ');
  }
}

class ListAVDsCommand extends EmulatorCommand {
  _getArgs() {
    return ['-list-avds', '--verbose'];
  }
}

class QueryVersionCommand extends EmulatorCommand {
  _getArgs() {
    return ['-version'];
  }
}

class LaunchCommand extends EmulatorCommand {
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
      argparse.getArgValue('headless') === 'true' ? '-no-window' : '',
      argparse.getArgValue('readOnlyEmu') === 'true' ? '-read-only' : '',
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

    if (argparse.getArgValue('headless')) {
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
