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
    const [detoxConnection] = [...instance._server._sessionManager._connectionsByWs.values()];
    const sendActionOriginal = detoxConnection.sendAction;
    detoxConnection.sendAction = function(action) {
      if (action.type !== 'ready') {
        sendActionOriginal.call(this, action);
      }
    };

    await instance.device.selectApp('example');
    await instance.device.launchApp();
    return instance;
  }
}

module.exports = CustomDetoxEnvironment;
