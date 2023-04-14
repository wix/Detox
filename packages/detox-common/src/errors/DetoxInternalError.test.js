const DetoxInternalError = require('./DetoxInternalError');

describe('DetoxInternalError', () => {
  it('should append a Report-Issue hint', () => {
    expect(() => { throw new DetoxInternalError('Should do better'); })
      .toThrowErrorMatchingSnapshot();
  });

  it('.from(message) should wrap the error message ', () => {
    expect(DetoxInternalError.from('Should do better')).toMatchSnapshot();
  });
});
