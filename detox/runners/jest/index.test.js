describe('detox/runners/jest', () => {
  it('should lazily require the exported modules', () => {
    const index = jest.requireActual('./index');

    jest.mock('./testEnvironment', () => 0);
    jest.mock('./globalSetup', () => 1);
    jest.mock('./globalTeardown', () => 2);

    expect(index.DetoxCircusEnvironment).toBe(0);
    expect(index.globalSetup).toBe(1);
    expect(index.globalTeardown).toBe(2);
  });
});
