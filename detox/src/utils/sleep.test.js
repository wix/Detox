describe('sleep', () => {
  let sleep;
  let setTimeoutMock;

  beforeEach(() => {
    setTimeoutMock = jest.spyOn(global, 'setTimeout')
      .mockImplementation((callback) => {
        callback();
        return ({ unref: jest.fn() });
      });

    sleep = require('./sleep');
  });

  it('should not call .unref() by default', async () => {
    await sleep(0);
    expect(setTimeoutMock.mock.results[0].value.unref).not.toHaveBeenCalled();
  });

  it('should call .unref() when given options = { shouldUnref: true }', async () => {
    await sleep(0, { shouldUnref: true });
    expect(setTimeoutMock.mock.results[0].value.unref).toHaveBeenCalled();
  });
});
