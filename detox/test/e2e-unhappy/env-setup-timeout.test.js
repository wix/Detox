it('should fail with timeout', () => {
  throw new Error('You should not see this error! The environment setup should have failed with timeout');
});
