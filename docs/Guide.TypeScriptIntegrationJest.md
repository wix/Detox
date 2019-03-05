---
id: Guide.TypeScriptJest
title: Integrating TypeScript with Detox + Jest
---

## Usage

This guide assumes you've got a project using Detox with Jest, and you want to write your Detox tests in [TypeScript](https://www.typescriptlang.org).

- Refer to [this guide](./Guide.Jest.md) if you need to set up such a project.

### 1. Add TypeScript + `ts-jest` to `package.json`

We'll be using [ts-jest](https://kulshekhar.github.io/ts-jest/) to run Jest tests with TypeScript.

```sh
npm install --save-dev typescript ts-jest
```

### 2. Configure Jest to use `ts-jest`

Modify your Jest configuration (`e2e/config.json` by default) to include the following properties

```json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "setupTestFrameworkScriptFile": "./init.ts"
}
```

NB: this is mostly the same output of running `ts-jest config:init`, with `setupTestFrameworkScriptFile` being the only added property.

### 3. `.js` -> `.ts`

Convert all files in the `e2e` directory ending in `.js` to `.ts`

### 4. Add typings for Detox, Jest, and Jasmine

Add typings for Detox, Jest, and Jasmine (the latter two are used in `init.ts`), as well as for other modules that you use in your Detox tests.

```sh
npm install --save-dev @types/detox @types/jest @types/jasmine
```

### 5. Writing tests

It's recommended that you import the Detox methods instead of their globally defined counterparts, to avoid a typing issue between Detox and Jest. This can be enforced by calling `detox.init` with `{ initGlobals: false }`

Your `init.ts` would look simliar to this:

```ts
import { cleanup, init } from 'detox';
import * as adapter from 'detox/runners/jest/adapter';

const config = require('../package.json').detox;

jest.setTimeout(120000);
jasmine.getEnv().addReporter(adapter);

beforeAll(async () => {
  await init(config, { initGlobals: false });
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await cleanup();
});
```

Note: the global constants are still defined in the typings, so using the globals will not result in a `tsc` error.

Your tests would then import the Detox methods from the `detox` module like so:

```ts
import { by, device, expect, element, waitFor } from 'detox';
```

Note: [`@types/detox`](https://www.npmjs.com/package/@types/detox) is maintained by the community and not by Wix.

You should now be able to run your Detox tests, written in TypeScript!
