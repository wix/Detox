# Detox

Gray box end-to-end testing and automation library for mobile apps.

[![NPM Version](https://img.shields.io/npm/v/detox.svg?style=flat)](https://www.npmjs.com/package/detox)
[![Build Status](https://travis-ci.org/wix/detox.svg?branch=master)](https://travis-ci.org/wix/detox)
[![NPM Downloads](https://img.shields.io/npm/dm/detox.svg?style=flat)](https://www.npmjs.com/package/detox)


- [About](#about)
- [Getting Started](/docs/Introduction.GettingStarted.md)
- [Documentation](/docs/README.md)

<img src="http://i.imgur.com/eoaDEYp.gif">

## What does a Detox test look like?

This is a test for a login screen, it runs on a device/simulator like an actual user:

```js
describe('Login flow', () => {
    
  it('should login successfully', async () => {
    await device.reloadReactNative();
    await expect(element(by.id('email'))).toBeVisible();
      
    await element(by.id('email')).typeText('john@example.com');
    await element(by.id('password')).typeText('123456');
    await element(by.label('Login')).tap();
      
    await expect(element(by.text('Welcome'))).toBeVisible();
    await expect(element(by.id('email'))).toNotExist();
  });
  
});
```

## About

High velocity native mobile development requires us to adopt continuous integration workflows, which means our reliance on manual QA has to drop significantly. Detox tests your mobile app while it's running in a real device/simulator, interacting with it just like a real user.

The most difficult part of automated testing on mobile is the tip of the testing pyramid - E2E. The core problem with E2E tests is flakiness - tests are usually not deterministic. We believe the only way to tackle flakiness head on is by moving from black box testing to gray box testing. That's where Detox comes into play.

* **Cross Platform:** Write cross-platform tests in JavaScript. Currently supports iOS, Android following soon.
* **Runs on Devices:** Gain confidence to ship by testing your app on a device/simulator just like a real user.
* **Automatically Synchronized:** Stops flakiness at the core by monitoring asynchronous operations in your app.
* **React Native Support:** Built from the ground up to support React Native projects as well as pure native ones.
* **Made For CI:** Execute your E2E tests on CI platforms like Travis without grief. 
* **Test Runner Independent:** Use Mocha, AVA, or any other JavaScript test runner you like.
* **Debuggable:** Modern async-await API allows breakpoints in asynchronous tests to work as expected.

## Getting Started

Read the [Getting Started Guide](/docs/Introduction.GettingStarted.md) to get Detox running on your app in less than 10 minutes.

## Documentation

Learn everything about using Detox from the [documentation](/docs/README.md).

## See it in Action

Open the [React Native demo project](/examples/demo-react-native) and follow the instructions.

Not using React Native? we have a [pure native demo project](/examples/demo-native-ios) too.

## Rethinking Core Principles

We believe that the only way to address the core difficulties with mobile end-to-end testing is by rethinking some of the  principles of the entire approach. See what Detox [does differently](/docs/More.DesignPrinciples.md).

## Contributing to Detox

Open source from the first commit. If you're interested in helping out with our roadmap or you have a new feature to suggest, contact us and we'd love to get you on board.

Dive into Detox core by reading the [Detox Contribution Guide](/docs/Guide.Contributing.md).

## License

* Detox by itself and all original source code in this repo is MIT
* Detox relies on some important dependencies, their respective licenses are:
  * [EarlGrey](https://github.com/google/EarlGrey/blob/master/LICENSE)
