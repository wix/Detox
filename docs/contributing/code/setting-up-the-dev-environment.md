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

[react-native-cli]: https://www.npmjs.com/package/react-native-cli
[Watchman]: https://facebook.github.io/watchman/
[xcpretty]: https://github.com/xcpretty/xcpretty
