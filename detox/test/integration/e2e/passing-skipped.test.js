describe('Suite with skipped tests', () => {
  it.skip('Skipped test', async () => {
    // Checking that skipped tests are also traced
  });

  it('Regular test', async () => {
    // should be traced as usual
  });

  it.todo('Check that todo tests are also traced');
});
