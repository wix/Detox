jest.retryTimes(3);

const {
  assertArtifactExists,
  waitUntilArtifactsManagerIsIdle,
} = require('./utils/artifactUtils');

describe('jest.retryTimes() support', () => {
  let counter = 3;

  beforeAll(async () => {
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
