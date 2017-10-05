# Jest as Test Runner

## Usage

### 0. Use the [Getting Started](Introduction.GettingStarted.md) Guide to set up detox

Except that you need to skip the install mocha step.

### 1. Install Jest

```sh
npm install --save-dev jest
```

### 2. Remove mocha specific files

You should remove `e2e/mocha.opts`, you no longer need it.

### 3. Write a detox setup file

```js
const detox = require('detox');
const config = require('../package.json').detox;

// Set the default timeout
jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;

beforeAll(async () => {
  await detox.init(config);
});

afterAll(async () => {
  await detox.cleanup();
});

// optional, you may remove this part
beforeEach(async () => {
  await device.reloadReactNative();
});
```

### 4. Run jest

Add this part to your `package.json`:
```json
"scripts": {
    "test:e2e": "jest e2e --setupTestFrameworkScriptFile=./jest/setup-e2e-tests.js --runInBand"
}
```

We need the `--runInBand` as detox doesn't support parallelism yet.

### Writing Tests

There are some things you should notice:

- Don't worry about mocks being used, detox works on the compiled version of your app.
- Detox exposes it's primitives (`expect`, `device`, ...) globally, it will override Jest's global `expect` object.

## How to run unit test and E2E tests in the same project

- If you have a setup file for the unit tests pass it into jest by passing `--setupTestFrameworkScriptFile=./path/to/setup-unit-tests.js` to your jest unit test call. You need to remove this option from your `jest` configuration in the package.json.
- Call your E2E tests like mentioned above