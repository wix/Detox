describe('Failing device method', () => {
  it('should fail with a correct stack trace', async () => {
    await device.selectApp('non-existing');
  });
});
