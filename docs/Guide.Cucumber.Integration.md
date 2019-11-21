# Cucumber Integration

This guide shows how to use [Cucumber](https://github.com/cucumber/cucumber-js) as test runner to run your E2E tests.

## Setup

### 0. Setup Detox 

Before starting out with Cucumber, please be sure to go over the fundamentals of the [Getting Started](Introduction.GettingStarted.md) guide and setup detox for your project.

### 1. Install Cucumber

```sh
npm install --save-dev cucumber
```
### 2. Setting up support files

If you had seen the default `mocha` setup that comes via `detox init -r mocha`, you would have noticed a `init.js` file where the actual Detox initialisation and cleanup happens via the hooks that mocha provides. Same needs to be done for Cucumber also via the hooks provided by Cucumber.

```js
const detox = require('detox');
const { BeforeAll, AfterAll } = require('cucumber');
const config = require('path-to-pacjage.json').detox;

BeforeAll(async () => {
  await detox.init(config);
})

AfterAll(async () => {
  await detox.cleanup();
});
```

Now we are done with the setup of Detox-Cucumber integration and we can start writing our test scenarios and execute them. To know about how to write a test scenario and execute them, refer to the [react-native-detox-cucumber] repository where a working example is given.
