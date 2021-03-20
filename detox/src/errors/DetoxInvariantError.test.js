const DetoxInvariantError = require('./DetoxInvariantError');

describe('DetoxInvariantError', () => {
  it('should append a Report-Issue hint', () => {
    expect(() => { throw new DetoxInvariantError('Should do better') })
      .toThrowErrorMatchingSnapshot();
  });

  it('.from(message) should wrap the error message ', () => {
    expect(DetoxInvariantError.from('Should do better')).toMatchSnapshot();
  });
});
