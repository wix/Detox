## Third-Party Drivers

Detox comes with built-in support for running on Android and iOS by choosing a driver type in your Detox configurations.
For example, the following configuration uses the "ios.simulator" driver.

```json
{
  "ios.sim": {
    "type": "ios.simulator",
    "device": "...",
    "binaryPath": "bin/YourApp.app"
  }
}
```

While Detox technically supports Android devices and iOS simulators out of the box, devices running other platforms such as [Web](https://github.com/necolas/react-native-web) or [Windows](https://github.com/microsoft/react-native-windows) can be targeted.

If your app targets a third-party platform, you may switch to use a [third-party driver](#how-to-use-a-third-party-driver) to run your tests on said platform. If one doesn't already exist, you can [write your own](#Writing-a-new-third-party-driver).

### How to Use a Third-party Driver

Check to see if a [third-party driver](#Existing-Third-party-drivers) already exists for the platform you wish to target. Mostly likely, the driver will have setup instructions.

Overall the setup for any third party driver is fairly simple.

1. Add the driver to your `package.json` with `npm install --save-dev detox-driver-package` or `yarn add --dev detox-driver-package`.
1. Add a new Detox configuration to your existing configurations with the `type` set to driver's package name.

    ```diff
    +  "thirdparty.driver.config": {
    +    "type": "detox-driver-package",
    +    "binaryPath": "bin/YourApp.app",
    +  }
    ```

1. Run Detox while specifying the name of your new configuration:

    ```sh
    detox test --configuration thirdparty.driver.config
    ```

### Writing a New Third-party Driver

#### Anatomy of the Drivers

The architecture of a driver is split into a few different pieces; Understanding the [overall architecture of Detox](Introduction.HowDetoxWorks.md#Architecture) will help with this section.

*Components running in the context of the test logic execution on the Node.js process on the host computer:*

1. **The Device Drivers layer:** The layer contains a collection of drivers, implementing - mostly, though not exclusively, the platform-specific details for the Detox [`device` object](https://github.com/wix/Detox/blob/master/docs/APIRef.DeviceObjectAPI.md) that is exposed in the Detox tests.
The implementation is responsible for managing devices your tests will run on, in terms of device allocation, app installation user interactions (e.g. taps) execution and so on.
1. **Matchers:** code powering the `expect`, `element`, `waitFor` and `by` globals in your tests.
In essence, it translates and sends test-logic commands (such as taps and assertions) over the network to the device on which your tests are running. In turn, the device natively performs these commands.

*The component running on the device being tested, injected into the test app:*

1. **Native Client:** The driver client communicates with the server over
websocket where it receives information from the serialized matchers, and expectations, and also sends responses
back of whether each step of your test succeeds or fails. Typically a device client will use an underlying library specific
to the platform at hand to implement the expectations.

#### Implementation Details

In order to introduce a third-party Driver, there is a set of core classes you must implement - each responsible for a different Detox concern:

* Allocation: The process of launching / selecting a device over which the tests would run.
* Pre-validation: The checkup of the execution-environment (e.g. verifying the Android SDK is installed).
* Artifact handlers registration: The process where platform-based artifacts generation handlers are registered (e.g. handlers for taking screenshots, which are different between the Android and iOS platforms).
* Runtime: The de-facto execution of test logic.
* Matchers: The matching of visible elements and visibility assertion.

To understand the exact contract of these classes, refer to [`examples/demo-plugin/driver.js`](https://github.com/wix/Detox/blob/master/examples/demo-plugin/driver.js) for a dummy implementation, or to [detox-puppeteer](https://github.com/ouihealth/detox-puppeteer) for an actual implementation of such as driver.

Very roughtly speaking, this is the expected skeletal implementation:

```js
const DeviceDriverBase = require('detox/src/devices/runtime/drivers/DeviceDriverBase');

class Cookie {
  constructor(id) {
    this.id = id; // hold any info necessary in order to identify the associated device
  }
}

class MyNewAllocationDriver {
  constructor(deps) {
    this.emitter = deps.eventEmitter;
  }
  
  async allocate(deviceConfig) {
    // ...
    return new Cookie(id); // This is where a cookie is formed once for the entire process
  }
  
  async free(cookie, options) {
    // ...
  }
}

class MyNewEnvValidator {
  validate() {
    // ...
  }
}

class MyNewArtifactsProvider {
  declareArtifactPlugins() {
    // ...
  }
}

class MyNewRuntimeDriver extends DeviceDriverBase {
  constructor(deps, cookie) {
    // ...
  }
  
  // ...
}

class MyExpect {
  // ...
}


module.exports = MyNewDriver;
```

### Existing Third-party Drivers

* [detox-puppeteer](https://github.com/ouihealth/detox-puppeteer)
