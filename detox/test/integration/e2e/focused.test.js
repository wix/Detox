describe('Focused', () => {
  afterAll(async () => {
    // Reproducing when hook_start is called after test_start
  });

  // eslint-disable-next-line jest/no-focused-tests
  it.only('Only test', async () => {
    // Checking that skipped tests are also traced
  });

  it('Skipped test', async () => {
    // Causes issue in the previous implementation
  });
});
