const execa = require('execa');

describe('Initialization (context) tests', () => {
  test.each([
    `cross-env DETOX_CONFIGURATION=stub node integration/utils/simplistic-runner.js`,

    `detox test -c stub --config integration/e2e/config.js --runInBand --retries 1 flaky passing-simple`,
    `cross-env DETOX_CONFIGURATION=stub jest --config integration/e2e/config.js --runInBand passing-simple`,

    `detox test -c stub --config integration/e2e/config.js --maxWorkers 2 --retries 1 flaky passing-simple`,
    `cross-env DETOX_CONFIGURATION=stub jest --config integration/e2e/config.js --maxWorkers 2 passing-simple`,
  ])('should run: %s', async (cmd) => {
    const handle = execa.commandSync(cmd, { stdio: 'inherit', shell: true });
    expect(handle.exitCode).toBe(0);
  });
});
