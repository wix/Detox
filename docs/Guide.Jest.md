---
id: Guide.Jest
title: Jest
---

## Usage

### 0. Use the [Getting Started](Introduction.GettingStarted.md) Guide to set up Detox

### 1. Install Jest

```sh
npm install --save-dev jest
```

### 2. Run detox init

```sh
detox init -r jest
```

### 3. Modify package.json

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

- Don't worry about mocks being used, Detox works on the compiled version of your app.
- Detox exposes it's primitives (`expect`, `device`, ...) globally, it will override Jest's global `expect` object.

## How to run unit test and E2E tests in the same project

- If you have a setup file for the unit tests pass `./jest/setup` implementation into your unit setup.
- Call your E2E tests using `detox-cli`: `detox test`
