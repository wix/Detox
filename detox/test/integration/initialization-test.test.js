
const path = require('path');
const fs = require('fs-extra');
const { promisify } = require('util');
const { execCommand } = require('./utils/exec');

describe('Initialization (context) tests', () => {
  test.each([
    `DETOX_CONFIGURATION=stub node integration/utils/simplistic-runner.js`,

    `detox test -c stub --config integration/e2e/config.js --runInBand --retries 1 stub1 stub2`,
    `DETOX_CONFIGURATION=stub jest --config integration/e2e/config.js --runInBand stub2 stub3`,

    `detox test -c stub --config integration/e2e/config.js --maxWorkers 2 --retries 1`,
    `DETOX_CONFIGURATION=stub jest --config integration/e2e/config.js --maxWorkers 2`,
  ])('should run: %s', async (cmd) => {
    await execCommand(cmd);
  });
});
