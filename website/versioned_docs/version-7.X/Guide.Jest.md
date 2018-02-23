---
id: version-7.X-Guide.Jest
title: Jest
original_id: Guide.Jest
---

## Usage

### 0. Use the [Getting Started](Introduction.GettingStarted.md) Guide to set up detox

Except that you need to skip the install mocha step.

### 1. Install Jest

```sh
npm install --save-dev jest
```

### 2. Remove mocha specific files

You should remove `e2e/mocha.opts`, you no longer need it.

### 3. Replace generated detox setup file (e2e/init.js)

```js
const detox = require('detox');
const config = require('../package.json').detox;

// Set the default test timeout of 120s
jest.setTimeout(120000);

beforeAll(async () => {
  await detox.init(config);
});

afterAll(async () => {
  await detox.cleanup();
});
```

### 4. Configure Detox to run with Jest

Add a Jest config file `e2e/config.json`:

```json
{
  "setupTestFrameworkScriptFile" : "./init.js"
}
```


In `package.json`:

```json
"scripts": {
    "test:e2e": "detox test -c ios.sim.debug",
    "test:e2e:build": "detox build"
},
"detox": {
  "test-runner": "jest",
  "runner-config": "e2e/config.json"
  ...
}
```

### Writing Tests

There are some things you should notice:

- Don't worry about mocks being used, detox works on the compiled version of your app.
- Detox exposes it's primitives (`expect`, `device`, ...) globally, it will override Jest's global `expect` object.

## How to run unit test and E2E tests in the same project

- If you have a setup file for the unit tests pass `./jest/setup` implementation into your unit setup.
- Call your E2E tests using `detox-cli`: `detox test`
