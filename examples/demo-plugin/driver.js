const DeviceDriverBase = require('detox/src/devices/drivers/DeviceDriverBase');
const Client = require('detox/src/client/Client');

class Expect {
  constructor(invocationManager) {
    this._invocationManager = invocationManager;

    this.by = {
      accessibilityLabel: (value) => {},
      label: (value) => {},
      id: (value) => value,
      type: (value) => {},
      traits: (value) => {},
      value: (value) => {},
      text: (value) => {},
    };

    this.element = this.element.bind(this);
    this.expect = this.expect.bind(this);
    this.waitFor = this.waitFor.bind(this);
  }

  expect(element) {
    return {
      toBeVisible: () => {
        if (!element) {
          throw new Error("Expectation failed");
        }
      }
    }
  }

  element(matcher) {
    return matcher === 'welcome';
  }

  waitFor(element) {
  }
}

class LoginTestee {
  constructor(sessionId) {
    this.type = 'login';
    this.params = { sessionId, role: 'testee' };
    this.messageId;
  }
  async handle(response) {
    if (response.type !== 'loginSuccess') throw new Error('Unexpected response type');
  }
}

class PluginTestee {
  constructor(config) {
    this.configuration = config.client.configuration;
    this.client = new Client(this.configuration);
  }

  async connect() {
    await this.client.ws.open();

    // NOTE: This is a sample way to handle events in a custom Testee client, but not needed
    // for the test suite
    // this.client.ws.ws.on('message', async (str) => {
    //   const sendResponse = async (response) => {
    //     this.client.ws.ws.send(JSON.stringify(response));
    //   };

    //   const action = JSON.parse(str);
    //   const messageId = action.messageId;
    //   if (!action.type) {
    //     return;
    //   }
    //   if (action.type === 'loginSuccess') {
    //     return;
    //   } else if (action.type === 'deliverPayload') {
    //     await sendResponse({
    //       type: 'deliverPayloadDone',
    //       messageId: action.messageId,
    //     });
    //   } else if (action.type === 'currentStatus') {
    //     await sendResponse(
    //       { type: 'currentStatusResult', params: { resources: [] } }
    //     );
    //   } else {
    //     try {
    //       await sendResponse({
    //         type: 'invokeResult',
    //         messageId: action.messageId,
    //       });
    //     } catch (error) {
    //       this.client.ws.ws.send(
    //         JSON.stringify({
    //           type: 'testFailed',
    //           messageId,
    //           params: { details: str + '\n' + error.message },
    //         }),
    //       );
    //     }
    //   }
    // });

    await this.client.sendAction(new LoginTestee(this.configuration.sessionId));
  }
}

class PluginDriver extends DeviceDriverBase {
  constructor(config) {
    super(config);
    this.matchers = {};
    this.testee = new PluginTestee(config);
    this.matchers = new Expect();
  }

  async launchApp(deviceId, bundleId, launchArgs, languageAndLocale) {
    await this.emitter.emit('beforeLaunchApp', {
      bundleId,
      deviceId,
      launchArgs,
    });

    const pid = 'PID';
    await this.emitter.emit('launchApp', {
      bundleId,
      deviceId,
      launchArgs,
      pid,
    });

    return pid;
  }


  validateDeviceConfig(deviceConfig) {
    this.deviceConfig = deviceConfig;
    if (!deviceConfig.binaryPath) {
      configuration.throwOnEmptyBinaryPath();
    }
  }

  async waitUntilReady() {
    await this.testee.connect();
  }
}

module.exports = PluginDriver;
