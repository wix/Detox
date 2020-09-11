describe('Error stack mangling', () => {
  it('should fail with a correct stack trace', async () => {
    await element(by.text('supercalifragilisticexpialidocious')).tap();
  });
});
