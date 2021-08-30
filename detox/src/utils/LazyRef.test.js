describe('Lazy-ref util', () => {

  let instance;
  let genFunc;
  let uut;
  beforeEach(() => {
    instance = {
      mock: 'instance'
    };
    genFunc = jest.fn().mockReturnValue(instance);

    const LazyRef = require('./LazyRef');
    uut = new LazyRef(genFunc);
  });

  it('should generate ref based on generator func', () => {
    expect(uut.ref).toEqual(instance);
    expect(genFunc).toHaveBeenCalled();
  });

  it('should not regenerate ref', () => {
    uut.ref;
    expect(uut.ref).toEqual(instance);
    expect(genFunc).toHaveBeenCalledTimes(1);
  });

  it('should not pre-instantiate', () => {
    expect(genFunc).not.toHaveBeenCalled();
  });
});
