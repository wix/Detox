# Mocha setup guide

This guide describes how to install [Mocha](mochajs.org) as a test runner to be used by Detox for running the E2E tests.

**Disclaimer:**

* Here we focus on installing Detox on _new projects_. If you're migrating a project with an existing Detox installation, please apply some common sense while using this guide.



## Installation

### 1. Install Mocha :coffee:

Before starting with Mocha setup, be sure to complete the preliminary sections of the [Getting Started](Introduction.GettingStarted.md) guide.

```sh
npm install mocha --save-dev --no-package-lock
```

### 2. Set up test-code scaffolds :building_construction:

```sh
detox init -r mocha
```

> **Note:** errors occurring in the process may appear in red.

If things go well, you should to have this set up:

- An `e2e/` folder in your project root
- An `e2e/.mocharc.json` file; [example](/examples/demo-react-native/e2e/.mocharc.json)
- An `e2e/init.js` file; [example](/examples/demo-react-native/e2e/init.js)
- An `e2e/firstTest.spec.js` file with content similar to [this](/examples/demo-react-native/e2e/example.spec.js).

