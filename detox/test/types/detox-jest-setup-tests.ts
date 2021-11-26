declare var beforeAll: (callback: () => void) => void;
declare var beforeEach: (callback: () => void) => void;
declare var afterAll: (callback: () => void) => void;

import * as detox from 'detox';
import * as adapter from 'detox/runners/jest/adapter';
import * as specReporter from 'detox/runners/jest/specReporter';

// Normally the Detox configuration from the project's package.json like so:
// const config = require("./package.json").detox;
declare const config: any;

declare const jasmine: any;
jasmine.getEnv().addReporter(adapter);
jasmine.getEnv().addReporter(specReporter);

beforeAll(async () => {
  await detox.init(config);

  const initOptions: Detox.DetoxInitOptions = {
    initGlobals: false,
    reuse: false,
  };
  await detox.init(config, initOptions);
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});
