# Setting up the Development Environment

This document guides you through setting up your development environment to start contributing to our codebase.

:::important Prerequisites

Please complete our [Introductory environment setup](introduction/environment-setup.md) guide before proceeding. This ensures you have the necessary tools and dependencies installed in order to _run_ Detox tests, which is a fundamental step before being able to contribute to the project itself.

:::

## Node.js

We recommend using [`nvm`](https://github.com/nvm-sh/nvm) or [`nvm-windows`](https://github.com/coreybutler/nvm-windows) to manage your Node.js versions. However, you can find our required Node.js version in the [`.nvmrc`](https://github.com/wix/Detox/blob/master/.nvmrc) file and install it using your preferred method or from the [official download page](https://nodejs.org/en/download/).

Currently, we require `lts/iron` (Node.js 20.x) for our development environment.

:::tip

The exhaustive list of LTS codenames (e.g. `lts/iron`) can be found at [CODENAMES.md](https://github.com/nodejs/Release/blob/main/CODENAMES.md) in the Node.js repository.

:::

## Setting Up The Monorepo

Our repository is a monorepo managed with Yarn workspaces. [Read more about our repository structure](../code/overview.md#repository-structure).

To set up the monorepo locally, follow these steps:

### 1. Enable Corepack

Corepack is Node.js's built-in package manager manager. Enable it to use the correct Yarn version:

```bash
corepack enable
```

### 2. Clone the Repository

```bash
git clone git@github.com:wix/Detox.git
cd Detox
git submodule update --init --recursive
```

### 3. Install Dependencies

```bash
yarn install
```

:::note For Wix Internal Contributors

Set the internal registry before installing:

```bash
export YARN_NPM_REGISTRY_SERVER="<company's private npm registry>"
yarn install
```

You can add this export to your shell profile (`~/.zshrc` or `~/.bashrc`) to make it permanent.

:::

## Installing Common Dependencies

### React-Native CLI

[react-native-cli] is a command line interface for React Native.

```bash
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

## Switching React Native Versions

To test against different React Native versions:

```bash
REACT_NATIVE_VERSION=0.77.0 ./scripts/change_all_react_native_versions.sh
```

This updates the relevant `package.json` files and regenerates the lock file.

## Common Commands

| Command | Description |
|---------|-------------|
| `yarn install` | Install all dependencies |
| `yarn workspaces foreach -A run build` | Build all packages |
| `yarn workspace detox test` | Run detox tests |
| `yarn workspace detox lint` | Run linting |

[react-native-cli]: https://www.npmjs.com/package/react-native-cli
[Watchman]: https://facebook.github.io/watchman/
[xcpretty]: https://github.com/xcpretty/xcpretty
