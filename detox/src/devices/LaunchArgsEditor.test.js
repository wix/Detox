describe('Device launch-args editor', () => {

  let launchArgs;
  let LaunchArgsEditor;
  beforeEach(() => {
    launchArgs = {
      argX: 'valX',
      argY: { value: 'Y' },
    };
    LaunchArgsEditor = require('./LaunchArgsEditor');
  });

  it('should require a reference plain-object', () => {
      expect(() => new LaunchArgsEditor(undefined)).toThrow();
  });

  it('should allow for getting the referenced args-object', () => {
    const launchArgsEditor = new LaunchArgsEditor(launchArgs);
    expect(launchArgsEditor.get()).toEqual(launchArgs);
  });

  it('should allow for arguments setting', () => {
    const someArgs = {
      argZ: 'valZ',
    };

    const launchArgsEditor = new LaunchArgsEditor({});
    launchArgsEditor.modify(someArgs);
    expect(launchArgsEditor.get()).toEqual(someArgs);
  });

  it('should return a non-reflecting representation of the launch-arguments via get()', () => {
    const launchArgsEditor = new LaunchArgsEditor(launchArgs);
    launchArgsEditor.modify({
      aLaunchArg: { value: 'aValue?' },
    });

    launchArgsEditor.get().aLaunchArg.value = 'aValue!';
    expect(launchArgsEditor.get().aLaunchArg.value).toEqual('aValue?');
  });

  describe('with custom initial args', () => {
    it('should merge set arguments into the initial ones', () => {
      const someArgs = {
        argZ: 'valZ',
      };
      const expectedArgs = {
        ...launchArgs,
        argZ: 'valZ',
      };

      const launchArgsEditor = new LaunchArgsEditor(launchArgs);
      launchArgsEditor.modify(someArgs);
      expect(launchArgsEditor.get()).toEqual(expectedArgs);
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

      const launchArgsEditor = new LaunchArgsEditor(launchArgs);
      launchArgsEditor.modify(argsModifier);
      expect(launchArgsEditor.get()).toStrictEqual(expectedArgs);
   });

    it('should allow for a complete arguments reset', () => {
      const someArgs = {
        argZ: 'valZ',
      };

      const launchArgsEditor = new LaunchArgsEditor(launchArgs);
      launchArgsEditor.modify(someArgs);
      launchArgsEditor.reset();
      expect(launchArgsEditor.get()).toStrictEqual({});
    });
  });
});
