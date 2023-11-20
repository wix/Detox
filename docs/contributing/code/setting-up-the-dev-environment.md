# Setting up the Development Environment

This document guides you through setting up your development environment to start contributing to our codebase.

:::important Prerequisites

Please complete our [Introductory environment setup](introduction/environment-setup.md) guide before proceeding. This ensures you have the necessary tools and dependencies installed in order to _run_ Detox tests, which is a fundamental step before being able to contribute to the project itself.

:::

## Setting Up The Monorepo Management

Our repository is a monorepo, which means it contains multiple Detox-related projects and packages. [Read more about our repository structure](../code/overview.md#repository-structure).

To set up the monorepo locally, follow these steps:

Install the monorepo management tool, `lerna`:

```bash npm2yarn
npm install lerna@3.x.x --global
```

Clone the repository and navigate to the project directory:

```bash
git clone git@github.com:wix/Detox.git
cd detox
git submodule update --init --recursive
```

From the project's root directory, install and link the internal projects:

```bash
lerna bootstrap
```

## Installing Common Dependencies

### React-Native CLI

[react-native-cli] is a command line interface for React Native.

```bash npm2yarn
npm install react-native-cli --global
```

### Watchman

[Watchman] is a tool by Facebook for watching changes in the filesystem.

```bash
brew install watchman
```

### xcpretty

[xcpretty] is a fast and flexible formatter for xcodebuild.

```bash
gem install xcpretty
```

## Building and Testing

Our JavaScript code is thoroughly verified with comprehensive unit tests, complemented by integration tests.
Additionally, our native code undergoes rigorous testing through both unit and integration tests.
To ensure complete functionality, we conduct end-to-end tests on a fully-featured React Native application, designed to encompass all our public APIs (refer to our [test app] for details).

:::note Important

Before submitting a pull request, please ensure at a minimum that your code adheres to our linting standards and that all unit tests run successfully without any errors.

:::

The following sections describe how to build and test our code, with a general instruction.
However, we recommend you to refer to our `package.json` files for a complete list of available scripts:

- Detox Framework: [`detox/package.json`]
- Detox Test App: [`detox/test/package.json`]

### Unit Tests (Javascript)

We use [Jest] for running our unit tests.

Under the `detox/` directory, run the following command to run the unit tests with coverage:

```bash
cd detox
npm run unit
```
The unit tests reside alongside the JavaScript code. Typically, they can also be easily run directly from within an IDE such as [WebStorm](https://www.jetbrains.com/webstorm/) or [vscode](https://code.visualstudio.com/), even in debug (i.e step-by-step execution) mode.

### Unit Tests - Android Native

We also have unit tests for our native code (Android only). They reside alongside Detox's native Android code, under a dedicated subdirectory called `testFull`. You can run them using the following commands:

```bash
cd detox
npm run unit:android-release
```
The native unit tests can also be run in [Android Studio](https://developer.android.com/studio) (i.e. the IDE for Android apps development). Most tests can be run seamlessly using Android Studio's build-in support for unit-tests, but some require a plugin called [Spek](https://plugins.jetbrains.com/plugin/10915-spek-framework), which can be installed from within Android Studio itself - under the Plugins marketplace.

### iOS: Rebuilding the Framework

After changing the native code of Detox iOS, you need to rebuild the Detox framework. This is done when running:

```bash
detox build-framework-cache
```

Note that it is only required when you change the native code of Detox, or one of its dependencies (e.g. [DetoxSync]).
If you are only changing the JavaScript code, you don't need to rebuild the framework.

### Building the Detox Test App

The Detox self-test app is a full-feature React Native app for testing Detox end-to-end.

Before running the tests, you must first build the Detox test app. To do so, under `detox/test`, use the `build` command of the Detox CLI.
List of available configurations can be found under [`detox/test/e2e/detox.config.js`].

For example, to build the Detox test app for iOS in release mode, run:

```bash
cd detox/test
detox build --configuration ios.sim.release

### End-to-End Tests

To run the end-to-end tests (after building the app), use the `test` command of the Detox CLI.

For example, to run the end-to-end tests for iOS in release mode, run:

```bash
detox test --configuration ios.sim.release
```

### Integration Tests

Besides unit tests and end-to-end tests, we have some middle ground integration tests, which typically run Detox in a custom headless-like mode (i.e. stubs replace devices). Those tests typically execute Detox from a command line in that mode, and then do some post-processing of the results. We use [Jest] for running our integration tests.

The integration reside under a dedicated directory alongside Detox's the self-test app's code.

Run the following command to run the integration tests:

```bash
cd detox/test
npm run integration

### Linting

We use [ESLint] for linting our JavaScript code.

You can run the linter locally using the following command (under `detox/test`):

```bash
npm run lint
```

We also test our types using the following command:

```bash
npm run test:types
```

### Running the CI Scripts Locally

On our CI, we test our changes on both iOS and Android, and we lint-check our code.
You can run the same scripts we run on our CI locally, to ensure your changes are passing the tests (under the project's root directory):

```bash
npm run ci.ios
npm run ci.android
```

Refer to the scripts `scripts/ci.ios.sh` and `scripts/ci.android.sh` to see how we run the tests on our CI.

[react-native-cli]: https://www.npmjs.com/package/react-native-cli
[Watchman]: https://facebook.github.io/watchman/
[xcpretty]: https://github.com/xcpretty/xcpretty
[test app]: https://github.com/wix/Detox/tree/master/detox/test
[DetoxSync]: https://github.com/wix/DetoxSync
[`detox/test/e2e/detox.config.js`]: https://github.com/wix/Detox/blob/6e87dc13826341dba21ed0a732e5b57efa08e7b5/detox/test/e2e/detox.config.js#L137
[ESLint]: https://eslint.org/
[Jest]: https://jestjs.io/
[`detox/package.json`]: https://github.com/wix/Detox/blob/master/detox/package.json
[`detox/test/package.json`]: https://github.com/wix/Detox/blob/master/detox/test/package.json
