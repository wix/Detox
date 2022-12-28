describe('Skipped', () => {
  it.skip('Skipped test', async () => {
    // Checking that skipped tests are also traced
  });

  it.todo('Check that todo tests are also traced');
});
