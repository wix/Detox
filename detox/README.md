# detox

Graybox End-to-End Tests and Automation Library for Mobile

[![NPM Version](https://img.shields.io/npm/v/detox.svg?style=flat)](https://www.npmjs.com/package/detox)
[![Build Status](https://travis-ci.org/wix/detox.svg?branch=master)](https://travis-ci.org/wix/detox)
[![NPM Downloads](https://img.shields.io/npm/dm/detox.svg?style=flat)](https://www.npmjs.com/package/detox)



- [About](#about)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [See it in Action](#see-it-in-action)
- [Contributing](#contributing)
- [License](#license)

<img src="http://i.imgur.com/3QqHeGO.gif">

## About

High velocity native mobile development requires us to adopt continuous integration workflows, which means our reliance on manual QA has to drop significantly. The most difficult part of automated testing on mobile is the tip of the testing pyramid - E2E. The core problem with E2E tests is flakiness - tests are usually not deterministic. We believe the only way to tackle flakiness head on is by moving from blackbox testing to graybox testing and that's where detox comes into play.

* 📱 **Cross Platform in Mind:** Detox is designed to be cross-platform, it currently supports iOS, Android will follow soon.
* 🔃 **Synchronized Tests:** It is inherently synchronized with the app under test (never add `sleep()` in your test code again!!).
* <img src="https://raw.githubusercontent.com/wix/detox/master/docs/img/react-native.png" width="17px"/> **React Native Support:** With a special synchronization mechanism, detox supports React Native apps out of the box.
* ❗️**Test Runner Independent:** Can run with mocha, AVA, or any other JavaScript test runner.
* 🔴 **Debuggable:** API uses async-await, and all operations are promises, this means that breakpoints will work as expected.


## Getting Started

Read our [Getting Started Guide](docs/Introduction.GettingStarted.md) to get detox running in less than 10 minutes.

## Documentation

Learn more about using detox from our [docs](docs)

## See it in Action

Open the [React Native demo project](examples/demo-react-native) and follow the instructions.<br>
Not using React Native? you now have a [pure native demo project](examples/demo-native-ios) too.

## Contributing

There are still many challenges to conquer in detox. If you're interested in helping out with our roadmap, or suggest new features contact us and we'd love to get you on board.

The best way to dive in into detox's core is our contributing guide [here](docs/Guide.Contributing.md).

## License

* detox by itself and all original source code in this repo is MIT
* detox relies on some important dependencies, their respective licenses are:
  * [EarlGrey](https://github.com/google/EarlGrey/blob/master/LICENSE)
  * [FBSimulatorControl](https://github.com/facebook/FBSimulatorControl/blob/master/LICENSE)
