<p align="center">
	<img alt="Detox" width=380 src="https://raw.githubusercontent.com/wix/Detox/master/docs/img/DetoxLogo.png"/>
</p>
<h1 align="center">
  Detox
</h1>
<p align="center">
<b>Gray box end-to-end testing and automation library for mobile apps.</b>
</p>
<p align="center">
<img alt="Demo" src="http://i.imgur.com/eoaDEYp.gif"/>
</p>


---

<img src="https://user-images.githubusercontent.com/1962469/89655670-1c235c80-d8d3-11ea-9320-0f865767ef5d.png" alt="" height=24 width=1> [![NPM Version](https://img.shields.io/npm/v/detox.svg?style=flat)](https://www.npmjs.com/package/detox) [![NPM Downloads](https://img.shields.io/npm/dm/detox.svg?style=flat)](https://www.npmjs.com/package/detox) [![Build Status](https://img.shields.io/jenkins/s/http/jenkins-oss.wixpress.com:8080/job/multi-detox-master.svg)](https://jenkins-oss.wixpress.com/job/multi-detox-master/) [![Coverage Status](https://coveralls.io/repos/github/wix/Detox/badge.svg?branch=master)](https://coveralls.io/github/wix/Detox?branch=master) [![Detox is released under the MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![PR's welcome!](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](docs/Guide.Contributing.md) [![Twitter Follow](https://img.shields.io/twitter/follow/detoxe2e?label=Follow&style=social)](https://twitter.com/detoxe2e)

## What Does a Detox Test Look Like?

This is a test for a login screen, it runs on a device/simulator like an actual user:

```js
describe('Login flow', () => {
    
  it('should login successfully', async () => {
    await device.reloadReactNative();
    
    await element(by.id('email')).typeText('john@example.com');
    await element(by.id('password')).typeText('123456');
    await element(by.text('Login')).tap();
      
    await expect(element(by.text('Welcome'))).toBeVisible();
    await expect(element(by.id('email'))).toNotExist();
  });
  
});
```

 [Get started with Detox now!](docs/Introduction.GettingStarted.md)

## About

High velocity native mobile development requires us to adopt continuous integration workflows, which means our reliance on manual QA has to drop significantly. Detox tests your mobile app while it's running in a real device/simulator, interacting with it just like a real user.

The most difficult part of automated testing on mobile is the tip of the testing pyramid - E2E. The core problem with E2E tests is flakiness - tests are usually not deterministic. We believe the only way to tackle flakiness head on is by moving from black box testing to gray box testing. That's where Detox comes into play.

* **Cross Platform:** Write cross-platform tests in JavaScript. Currently supports iOS and Android.
* **Runs on Devices** (not yet supported on iOS): Gain confidence to ship by testing your app on a device/simulator just like a real user.
* **Automatically Synchronized:** Stops flakiness at the core by monitoring asynchronous operations in your app.
* **Made For CI:** Execute your E2E tests on CI platforms like Travis without grief. 
* **Test Runner Independent:** Use Jest, Mocha, AVA, or any other JavaScript test runner you like (spoiler: we have our favourite).
* **Debuggable:** Modern async-await API allows breakpoints in asynchronous tests to work as expected.

## Supported Versions

### Environment

* **OS**: macOS 10.15 (Catalina) or higher
* **Xcode**: 11.0 or higher
  * **iOS Simulator Runtime**: iOS 13.0 or higher

### React Native

Detox is built from the ground up to support React Native projects as well as pure native ones.

The following React Native versions have been tested:

| iOS      | Android                                                      |
| -------- | ------------------------------------------------------------ |
| <=0.63.x | <=0.56 - Full support                                        |
|          | >=0.57 <=0.63 - Visibility edge-case: see this [RN issue](https://github.com/facebook/react-native/issues/23870)* |

Future versions are most likely supported, but have not been tested yet. Please open issues if you find specific issues with newer React Native versions.

## Get Started with Detox!

Read the [Getting Started Guide](docs/Introduction.GettingStarted.md) to get Detox running on your app in less than 10 minutes.

## Documents Directory

Explore further about using Detox from the [documents directory](https://github.com/wix/Detox/tree/master/docs).

## Core Principles

We believe that the only way to address the core difficulties with mobile end-to-end testing is by rethinking some of the  principles of the entire approach. See what Detox [does differently](docs/Introduction.DesignPrinciples.md).

## Contributing to Detox

Detox has been open-source from the first commit. If you're interested in helping out with our roadmap, please see issues tagged with the [![ ](https://placehold.it/15/c4532d/000000?text=+) looking for contributors](https://github.com/wix/detox/labels/user%3A%20looking%20for%20contributors) label. If you have encountered a bug or would like to suggest a new feature, please open an issue.

Dive into Detox core by reading the [Detox Contribution Guide](docs/Guide.Contributing.md).

## License

* Detox is licensed under the [MIT License](LICENSE)

## Non-English Resources (Community)

- [Getting Started (Brazilian Portuguese)](https://medium.com/quia-digital/iniciando-com-detox-framework-1-4-ce31ad7ae812)

