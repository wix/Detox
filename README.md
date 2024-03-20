<!-- markdownlint-configure-file { "first-line-heading": 0 } -->

[![SWUbanner](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/banner-direct.svg)](https://stand-with-ukraine.pp.ua)

<p align="center">
  <img alt="Detox" width=380 src="https://raw.githubusercontent.com/wix/Detox/master/docs/img/DetoxLogo.png"/>
</p>
<h1 align="center">
  Detox
</h1>
<p align="center">
<b>Gray box end-to-end testing and automation framework for mobile apps.</b>
</p>
<p align="center">
<img alt="Demo" src="docs/img/Detox.gif"/>
</p>
<h1></h1>

<img src="https://user-images.githubusercontent.com/1962469/89655670-1c235c80-d8d3-11ea-9320-0f865767ef5d.png" alt="" height=24 width=1> [![NPM Version](https://img.shields.io/npm/v/detox.svg?style=flat)](https://www.npmjs.com/package/detox) [![NPM Downloads](https://img.shields.io/npm/dm/detox.svg?style=flat)](https://www.npmjs.com/package/detox) [![Build status](https://badge.buildkite.com/39afde30a964a6763de9753762bc80264ba141e1c1f41fc878.svg)](https://buildkite.com/wix-mobile-oss/detox) [![Coverage Status](https://coveralls.io/repos/github/wix/Detox/badge.svg?branch=master)](https://coveralls.io/github/wix/Detox?branch=master) [![Detox is released under the MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![PR's welcome!](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://wix.github.io/Detox/docs/contributing) [![Discord](https://img.shields.io/discord/957617863550697482?color=%235865F2\&label=discord)](https://discord.gg/CkD5QKheF5) [![Twitter Follow](https://img.shields.io/twitter/follow/detoxe2e?label=Follow\&style=social)](https://twitter.com/detoxe2e)

## What Does a Detox Test Look Like?

This is a test for a login screen, it runs on a device/simulator like an actual user:

```js
describe('Login flow', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should login successfully', async () => {
    await element(by.id('email')).typeText('john@example.com');
    await element(by.id('password')).typeText('123456');

    const loginButton = element(by.text('Login'));
    await loginButton.tap();

    await expect(loginButton).not.toExist();
    await expect(element(by.label('Welcome'))).toBeVisible();
  });
});
```

[Get started with Detox now!](https://wix.github.io/Detox/docs/introduction/getting-started)

## About

High velocity native mobile development requires us to adopt continuous integration workflows, which means our reliance on manual QA has to drop significantly. Detox tests your mobile app while it’s running in a real device/simulator, interacting with it just like a real user.

The most difficult part of automated testing on mobile is the tip of the testing pyramid - E2E. The core problem with E2E tests is flakiness - tests are usually not deterministic. We believe the only way to tackle flakiness head on is by moving from black box testing to gray box testing. That’s where Detox comes into play.

- **Cross Platform:** Write end-to-end tests in JavaScript for React Native apps (Android & iOS).
- **Debuggable:** Modern async-await API allows breakpoints in asynchronous tests to work as expected.
- **Automatically Synchronized:** Stops flakiness at the core by monitoring asynchronous operations in your app.
- **Made For CI:** Execute your E2E tests on CI platforms like Travis CI, Circle CI or Jenkins without grief.
- **Runs on Devices:** Gain confidence to ship by testing your app on a device/simulator just like a real user (not yet supported on iOS).
- **Test Runner Agnostic:** Detox provides a set of APIs to use with any test runner without it. It comes with [Jest](https://jestjs.io) integration out of the box.

## Supported React Native Versions

Detox was built from the ground up to support React Native projects.

While Detox should work out of the box with almost any React Native version of the latest minor releases, official support is provided for React Native versions `0.71.x`, `0.72.x` and `0.73.x` without React Native's ["New Architecture"](https://reactnative.dev/docs/the-new-architecture/landing-page).

Newer versions, as well as React Native's "New Architecture", may work with Detox, but have not been tested out yet by the Detox team.

Although we do not officially support older React Native versions, we do our best to keep Detox compatible with them.

Also, in case of a problem with an unsupported version of React Native, please [submit an issue](https://github.com/wix/Detox/issues/new/choose) or write us in our [Discord server](https://discord.gg/CkD5QKheF5) and we will do our best to help out.

### Known Issues with React Native

- Visibility edge-case on Android: see this [RN issue](https://github.com/facebook/react-native/issues/23870).

## Get Started with Detox

Read the [Getting Started Guide](https://wix.github.io/Detox/docs/introduction/getting-started) to get Detox running on your app in less than 10 minutes.

## Documents Site

Explore further about using Detox from our new **[website](https://wix.github.io/Detox/)**.

## Core Principles

We believe that the only way to address the core difficulties with mobile end-to-end testing is by rethinking some of the principles of the entire approach. See what Detox [does differently](https://wix.github.io/Detox/docs/articles/design-principles).

## Contributing to Detox

Detox has been open-source from the first commit. If you’re interested in helping out with our roadmap, please see issues tagged with the [<img src="docs/img/github-label-contributors.png">](https://github.com/wix/Detox/labels/user%3A%20looking%20for%20contributors) label. If you have encountered a bug or would like to suggest a new feature, please open an issue.

Dive into Detox core by reading the [Detox Contribution Guide](https://wix.github.io/Detox/docs/contributing).

## License

- Detox is licensed under the [MIT License](LICENSE)

## Non-English Resources (Community)

- [Getting Started (Brazilian Portuguese)](https://medium.com/quia-digital/iniciando-com-detox-framework-1-4-ce31ad7ae812)
