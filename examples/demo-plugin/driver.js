const DeviceDriverBase = require('detox/src/devices/runtime/drivers/DeviceDriverBase');
const Client = require('detox/src/client/Client');

//
// The following is needed in order to make the various expect() API's work (e.g. element(), waitFor()).

class PluginExpect {
  constructor({ invocationManager }) {
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

//
// The following is needed in order to make the various device API's work (e.g. device.launchApp()).

class LoginApp {
  constructor(sessionId) {
    this.type = 'login';
    this.params = { sessionId, role: 'app' };
    this.messageId;
  }
  async handle(response) {
    if (response.type !== 'loginSuccess') throw new Error('Unexpected response type');
  }
}

class PluginApp {
  constructor(deps) {
    this.configuration = deps.client.configuration;
    this.client = new Client(this.configuration);
  }

  async connect() {
    await this.client.ws.open();

    // NOTE: This is a sample way to handle events in a custom app client, but not needed
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

    await this.client.sendAction(new LoginApp(this.configuration.sessionId));
  }
}

class PluginAllocationCookie {
  constructor(id) {
    this.id = id;
  }
}

class PluginDeviceAllocationDriver {
  constructor(deps) {
    this.emitter = deps.eventEmitter;
  }

  async allocate(deviceConfig) {
    console.log('TODO Allocate an actual device here', deviceConfig.device);
    return new PluginAllocationCookie('device ID');
  }

  async free(cookie, { shutdown }) {
    console.log('TODO: Free up device and resources, here');

    if (shutdown) {
      await this.emitter.emit('beforeShutdownDevice', { deviceId: id });
      await this.emitter.emit('shutdownDevice', { deviceId: id });
    }
  }
}

class PluginEnvironmentValidator {
  async validate() {
    console.log('TODO: perform some validations');
  }
}

class PluginArtifactsProvider {
  declareArtifactPlugins() {
    console.log('TODO: Set up artifact generation handlers');
    return {};
  }
}

class PluginRuntimeDriver extends DeviceDriverBase {
  constructor(deps, cookie) {
    super(deps);

    this.cookie = cookie;
    this.app = new PluginApp(deps);
  }

  getExternalId() {
    return this.cookie.id;
  }

  getDeviceName() {
    return 'Plugin'; // TODO
  }

  async launchApp(bundleId, launchArgs, languageAndLocale) {
    const deviceId = this.cookie.id;

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

    if (!this.deviceConfig.binaryPath) {
      throw new Error(
        "'binaryPath' property is missing, should hold the app binary path:\n" +
        JSON.stringify(deviceConfig, null, 2)
      );
    }
  }

  async waitUntilReady() {
    await this.app.connect();
  }
}

module.exports = {
  ExpectClass: PluginExpect,
  EnvironmentValidatorClass: PluginEnvironmentValidator,
  ArtifactPluginsProviderClass: PluginArtifactsProvider,
  DeviceAllocationDriverClass: PluginDeviceAllocationDriver,
  RuntimeDriverClass: PluginRuntimeDriver,
};
