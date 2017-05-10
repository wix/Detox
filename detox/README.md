# detox

Graybox E2E Tests and Automation Library for Mobile

[![NPM Version](https://img.shields.io/npm/v/detox.svg?style=flat)](https://www.npmjs.com/package/detox)
[![Build Status](https://travis-ci.org/wix/detox.svg?branch=master)](https://travis-ci.org/wix/detox)
[![NPM Downloads](https://img.shields.io/npm/dm/detox.svg?style=flat)](https://www.npmjs.com/package/detox)



- [About](#about)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Options](#configuration-options)
- [See it in Action](#see-it-in-action)
- [The Detox API](#the-detox-api)
- [Dealing with flakiness](#dealing-with-flakiness)
- [Contributing to detox](#contributing-to-detox)
- [Some implementation details](#some-implementation-details)
- [License](#license)

<img src="http://i.imgur.com/3QqHeGO.gif">

## About

High velocity native mobile development requires us to adopt continuous integration workflows, which means our reliance on manual QA has to drop significantly. The most difficult part of automated testing on mobile is the tip of the testing pyramid - E2E. The core problem with E2E tests is flakiness - tests are usually not deterministic. We believe the only way to tackle flakiness head on is by moving from blackbox testing to graybox testing and that's where detox comes into play.

### Development still in progress!

Please note that this library is still pre version 1.0.0 and under active development. The NPM version is higher because the name "detox" was transferred to us from a previous inactive package.
**Package can still break without respecting semver, though we try not to.**



## See it in Action

Open the [React Native demo project](examples/demo-react-native) and follow the instructions

Not using React Native? you now have a [pure native demo project](examples/demo-native-ios) too

## The Detox API
Check the [API Reference](API.md) or see detox's own [E2E test suite](detox/test/e2e) to learn the test API by example.

## Dealing With Flakiness

See the [Flakiness](FLAKINESS.md) handbook

## Contributing to Detox

If you're interested in working on detox core and contributing to detox itself, take a look [here](CONTRIBUTING.md).

## Some Implementation Details

* We let you write your e2e tests in JS (they can even be cross-platform)
* We use websockets to communicate (so it should be super fast and bi-directional)
* Both the app and the tester are clients, so we need the server to proxy between them
* We are relying on EarlGrey as our gray-box native library for iOS (espresso for Android later on)
* The JS tester controls EarlGrey by remote using a strange JSON protocol
* Instead of wrapping the zillion API calls EarlGrey supports, we implemented a reflection mechanism
* So the JS tester in low level actually invokes the native methods.. freaky
* We've abstracted this away in favor of a protractor-like api, see [`examples/demo-react-native/e2e/example.spec.js`](examples/demo-react-native/e2e/example.spec.js)
* See everything EarlGrey supports [here](https://github.com/google/EarlGrey/blob/master/docs/api.md) and in this [cheatsheet](https://github.com/google/EarlGrey/blob/master/docs/cheatsheet/cheatsheet.pdf)
* We use [fbsimctl](https://github.com/facebook/FBSimulatorControl) to control the simulator from the test, restart the app, etc

## License

* detox by itself and all original source code in this repo is MIT
* detox relies on some important dependencies, their respective licenses are:
  * [EarlGrey](https://github.com/google/EarlGrey/blob/master/LICENSE)
  * [FBSimulatorControl](https://github.com/facebook/FBSimulatorControl/blob/master/LICENSE)

