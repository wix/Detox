describe('CustomError', () => {
  let CustomError;
  beforeEach(() => {
    CustomError = require('./CustomError');
  });

  it(`new CustomError should be defined`, () => {
    expect(new CustomError()).toBeDefined();
  });
});
