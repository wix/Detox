# Third-party Drivers

Detox comes with built-in support for running on Android and iOS by choosing a driver type in your Detox configurations. For example, the following configuration uses the "ios.simulator" driver.

```
"ios.sim": {
  "binaryPath": "bin/YourApp.app",
  "type": "ios.simulator",
}
```

While React Native officially supports Android and iOS, other platforms such as [Web](https://github.com/necolas/react-native-web) and [Windows](https://github.com/microsoft/react-native-windows) can be targeted. If your app targets a third-party platform, you may swich to use a [third-party driver](#how-to-use-a-third-party-driver) to run your tests on said platform. If one doesn't already exist, you can [write your own](#Writing-a-new-third-party-driver).

## How to Use a Third-party Driver

Check to see if a [third-party driver](#Existing-Third-party-drivers) already exists for the platform you wish to target. Mostly likely, the driver will have setup instructions. Overall the setup for any third party driver is fairly simple.

1. Add the driver to your `package.json` withh `npm install --save-dev detox-driver-package` or `yarn add --dev detox-driver-package`
1. Add a new Detox configuration to your existing configurations with the `type` set to driver's package name.
```
"thirdparty.driver.config": {
  "binaryPath": "bin/YourApp.app",
  "type": "detox-driver-package",
}
```
3. Run Detox while specifying the name of your new configuration `detox test --configuration detox-driver-package`

## Writing a New Third-party Driver

### Anatomy of a Driver

The architecture of a driver is split into a few different pieces. Understanding the [overall architecture of Detox](https://github.com/wix/Detox/blob/master/docs/Introduction.HowDetoxWorks.md#architecture) will help with this section

1. The Device Driver - code runs on the Detox tester, within the test runner context. It implements the details for the
[`device` object](https://github.com/wix/Detox/blob/master/docs/APIRef.DeviceObjectAPI.md) that is exposed in your Detox tests. The implementation is responsible for managing device clients your tests will run on.
1. Matchers - code powering the `expect` `element` `waitFor` and `by` globals in your tests.
These helpers serialize your test code so they can be sent over the network to the device on which your tests are running.
1. Driver Client - code running on the device being tested. The driver client communicates with the server over
websocket where it receives information from the serialized matchers, and expectations, and also sends responses
back of whether each step of your test succeeds or fails. Typically a device client will use an underlying library specific
to the platform at hand to implement the expectations.

### Implementation Details

You may want to read through the source of both the built-in, official drivers as well as
existing third party drivers to get a sense of how the code is structured. You can also look at
`examples/demo-plugin/driver.js` for a minimal driver implementation that doesn't really do anything
useful. Your driver should extend `DeviceDriverBase` and export as `module.exports`.

```
const DeviceDriverBase = require('detox/src/devices/drivers/DeviceDriverBase');
class MyNewDriver extends DeviceDriverBase {
 // ...
}
module.exports = MyNewDriver;
```

## Existing Third-party Drivers

* [detox-puppeteer](https://github.com/ouihealth/detox-puppeteer)
