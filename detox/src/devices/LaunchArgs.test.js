describe('Device launch-args', () => {
  const initArgs = {
    argX: 'valX',
    argY: { value: 'Y' },
  };

  let LaunchArgs;
  beforeEach(() => {
    LaunchArgs = require('./LaunchArgs');
  });

  it('should initialize as an empty object', () => {
    const launchArgs = new LaunchArgs();
    expect(launchArgs.get()).toEqual({});
  });

  it('should allow for a custom initial set of args', () => {
    const launchArgs = new LaunchArgs(initArgs);
    expect(launchArgs.get()).toEqual(initArgs);
  });

  it('should allow for arguments setting', () => {
    const someArgs = {
      argZ: 'valZ',
    };

    const launchArgs = new LaunchArgs();
    launchArgs.modify(someArgs);
    expect(launchArgs.get()).toEqual(someArgs);
  });

  it('should return a non-reflecting representation of the launch-arguments via get()', () => {
    const launchArgs = new LaunchArgs();
    launchArgs.modify({
      aLaunchArg: { value: 'aValue?' },
    });

    launchArgs.get().aLaunchArg.value = 'aValue!';
    expect(launchArgs.get().aLaunchArg.value).toEqual('aValue?');
  });

  describe('with custom initial args', () => {
    it('should merge set arguments into the initial ones', () => {
      const someArgs = {
        argZ: 'valZ',
      };
      const expectedArgs = {
        ...initArgs,
        argZ: 'valZ',
      };

      const launchArgs = new LaunchArgs(initArgs);
      launchArgs.modify(someArgs);
      expect(launchArgs.get()).toEqual(expectedArgs);
    });

    it('should allow for implicit arguments clearing using undefined as values', () => {
      const argsModifier = {
        argX: undefined,
        argY: null,
        argZ: 'valZ',
      };
      const expectedArgs = {
        argZ: 'valZ',
      }

      const launchArgs = new LaunchArgs(initArgs);
      launchArgs.modify(argsModifier);
      expect(launchArgs.get()).toStrictEqual(expectedArgs);
   });

    it('should allow for a complete arguments reset', () => {
      const someArgs = {
        argZ: 'valZ',
      };

      const launchArgs = new LaunchArgs(initArgs);
      launchArgs.modify(someArgs);
      launchArgs.reset();
      expect(launchArgs.get()).toStrictEqual({});
    });
  });
});
