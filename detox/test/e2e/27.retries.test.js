jest.retryTimes(3);

const { session } = require('detox');
const jestExpect = require('expect').default;

const {
  assertArtifactExists,
  waitUntilArtifactsManagerIsIdle,
} = require('./utils/artifactUtils');

describe('jest.retryTimes() support', () => {
  let counter = 3;

  beforeAll(async () => {
    // This test won't work if you retry it via -R, --retries.
    // Here we also assert that the session object is accessible from the sandbox.
    // v21 has no testSessionIndex; the run's own id is what proves the
    // session is reachable in here.
    jestExpect(typeof session.runId).toBe('string');

    await device.launchApp({ newInstance: true });
  });

  it('should fail twice and pass once', async () => {
    const matcher = --counter > 0
      ? by.text('Not existing')
      : by.text('Sanity');

    await element(matcher).tap();
  });

  afterAll(async () => {
    await waitUntilArtifactsManagerIsIdle();

    assertArtifactExists('✗ jest.retryTimes() support should fail twice and pass once');
    assertArtifactExists('✗ jest.retryTimes() support should fail twice and pass once (2)');
    assertArtifactExists('✓ jest.retryTimes() support should fail twice and pass once (3)');
  });
});
