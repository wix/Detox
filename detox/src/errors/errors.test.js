describe('invoke', () => {
  let errors;
  beforeEach(() => {
    errors = require('./errors');
  });

  it(`new CustomError should be defined`, () => {
    expect(new errors.CustomError()).toBeDefined();
  });
});
