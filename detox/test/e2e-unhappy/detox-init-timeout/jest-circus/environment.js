const WorkerAssignReporterCircus = require('detox/runners/jest/WorkerAssignReporterCircus');
const SpecReporterCircus = require('detox/runners/jest/SpecReporterCircus');
const DetoxCircusEnvironment = require('detox/runners/jest-circus/environment');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config, context) {
    super(config, context);

    this.initTimeout = 30000;
    this.registerListeners({
      SpecReporterCircus,
      WorkerAssignReporterCircus,
    });
  }

  async initDetox() {
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

module.exports = CustomDetoxEnvironment;
