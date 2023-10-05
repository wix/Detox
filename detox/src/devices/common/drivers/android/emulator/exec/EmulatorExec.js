const os = require('os');

const _ = require('lodash');

const { getAndroidEmulatorPath } = require('../../../../../../utils/environment');
const {
  BinaryExec,
  ExecCommand,
} = require('../../exec/BinaryExec');

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
  constructor({ headless }) {
    super();
    this._headless = headless;
  }

  _getArgs() {
    return ['-version', this._headless ? '-no-window' : ''];
  }
}

class LaunchCommand extends ExecCommand {
  constructor(options) {
    super();
    this._options = options;
    this._args = this._getEmulatorArgs();
  }

  get adbName() {
    return this._options.adbName;
  }

  get avdName() {
    return this._options.avdName;
  }

  get port() {
    return this._options.port;
  }

  _getArgs() {
    return this._args;
  }

  _getEmulatorArgs() {
    const {
      avdName,
      bootArgs,
      gpuMode = this._getDefaultGPUMode(),
      headless,
      readonly = true,
      port,
    } = this._options;

    const deviceBootArgs = (bootArgs || '').split(/\s+/);
    const emulatorArgs = _.compact([
      '-verbose',
      '-no-audio',
      '-no-boot-anim',
      headless ? '-no-window' : '',
      readonly ? '-read-only' : '',
      gpuMode !== undefined ? '-gpu' : '',
      gpuMode !== undefined ? `${gpuMode}` : '',
      port ? '-port' : '',
      port ? `${port}` : '',
      ...deviceBootArgs,
      `@${avdName}`
    ]);

    return emulatorArgs;
  }

  _getDefaultGPUMode() {
    if (this._options.headless) {
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
