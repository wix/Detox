---
id: mocha
slug: guide/mocha
title: Mocha Setup Guide
sidebar_label: Mocha Setup Guide
---

## Mocha Setup Guide

This guide describes how to install [Mocha](https://mochajs.org) as a test runner to be used by Detox for running the E2E tests.

Note that while Mocha is lightweight and easy to set up, we nevertheless encourage usage of [Jest](Guide.Jest.md) instead, for 2 main reasons:

1. Mocha does not support parallel-test execution (i.e. splitting the test suites between concurrently running test devices/emulators).
1. Advanced integration features such as taking device screenshots on failures will not be as timely accurate as with working with Jest.

### Installation

**Disclaimer:** Here we focus on installing Detox on _new projects_. If you’re migrating a project with an existing Detox installation, please apply some common sense while using this guide.

#### 1. Install Mocha

Before starting with Mocha setup, be sure to complete the preliminary sections of the [Getting Started](introduction/getting-started.md) guide.

```bash npm2yarn
npm install mocha --save-dev --no-package-lock
```

#### 2. Set up Test-code Scaffolds

```sh
detox init -r mocha
```

> **Note:** errors occurring in the process may appear in red.

If things go well, you should to have this set up:

- An `e2e/` folder in your project root
- An `e2e/.mocharc.json` file; [example](https://github.com/wix/Detox/tree/master/examples/demo-react-native/e2e/.mocharc.json)
- An `e2e/init.js` file; [example](https://github.com/wix/Detox/tree/master/examples/demo-react-native/e2e/init.js)
- An `e2e/firstTest.spec.js` file with content similar to [this](https://github.com/wix/Detox/tree/master/examples/demo-react-native/e2e/example.spec.js).
