const _ = require('lodash');
const execa = require('execa');

describe('jest --bail tests', () => {
  test.each([
    `detox test -c stub --config integration/e2e/config.js --bail --maxWorkers 2 --retries 1 flaky passing-simple`,
    `cross-env DETOX_CONFIGURATION=stub jest --config integration/e2e/config.js --bail --runInBand passing-simple`,
  ])('should pass: %s', async (cmd) => {
    console.log(`Running: ${cmd}`);
    const handle = execa.commandSync(cmd, { stdio: 'inherit', shell: true });
    expect(handle.exitCode).toBe(0);
  });

  test.each([
    `detox test -c stub --config integration/e2e/config.js --bail --runInBand --retries 0 flaky passing-simple`,
    `cross-env DETOX_CONFIGURATION=stub jest --config integration/e2e/config.js --maxWorkers 4 flaky passing`,
  ])('should fail: %s', async (cmd) => {
    console.log(`Running: ${cmd}`);
    const handle = _.attempt(() => execa.commandSync(cmd, { stdio: 'inherit', shell: true }));
    expect(handle.exitCode).not.toBe(0);
  });
});
