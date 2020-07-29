jest.retryTimes(3);

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
});
