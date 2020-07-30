const WorkerAssignReporterCircus = require('detox/runners/jest/WorkerAssignReporterCircus');
const SpecReporterCircus = require('detox/runners/jest/SpecReporterCircus');
const DetoxCircusEnvironment = require('detox/runners/jest-circus/environment');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config) {
    super(config);

    if (process.env.TIMEOUT_E2E_TEST) {
      this.initTimeout = 30000;
    }

    this.registerListeners({
      SpecReporterCircus,
      WorkerAssignReporterCircus,
    });
  }

  async initDetox() {
    let instance;

    if (process.env.TIMEOUT_E2E_TEST) {
      instance = await this._initDetoxWithHangingServer();
    } else {
      instance = await super.initDetox();
    }

    this.global.detox.__waitUntilArtifactsManagerIsIdle__ = () => {
      return instance._artifactsManager._idlePromise;
    };

    return instance;
  }

  async _initDetoxWithHangingServer() {
    console.log('Making problems with server');
    const instance = await this.detox.init(undefined, { launchApp: false });
    const sendActionOriginal = instance._server.sendAction;
    instance._server.sendAction = function(ws, action) {
      if (action.type !== 'ready') {
        sendActionOriginal.call(this, ws, action);
      }
    };

    await instance.device.launchApp();
    return instance;
  }
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

module.exports = CustomDetoxEnvironment;
