if (process.env.TIMEOUT_E2E_TEST === '1') {
  it('timeout test', () => {});
} else {
  it('empty test', () => {});
}
