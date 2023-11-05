# Setting up the Development Environment

This document guides you through setting up your development environment to start contributing to our codebase.

:::important Prerequisites

Please complete our [Introduction](introduction/getting-started.mdx) guides before proceeding. This ensures you have the necessary tools and dependencies installed.

:::

## Setting Up The Monorepo Management

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

#### React-Native CLI

```bash npm2yarn
npm install react-native-cli --global
```

#### Watchman

```bash
brew install watchman
```

#### xcpretty

```bash
gem install xcpretty
```

## Building and Testing

Refer to the scripts `scripts/ci.ios.sh` and `scripts/ci.android.sh` to understand the build and test process. Ensure these scripts pass before submitting a pull request.
