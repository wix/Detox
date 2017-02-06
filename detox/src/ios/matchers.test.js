describe('matchers', () => {
  let matchers;
  beforeEach(() => {
    matchers = require('./matchers');
  });

  it(``, () => {
    const matcher = new matchers.Matcher();
    console.log(matcher)
  });

  it(``, () => {
    const matcher = new matchers.LabelMatcher('string');
    console.log(matcher)
  });
});
