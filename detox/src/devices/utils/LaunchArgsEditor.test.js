describe('Device launch-args editor', () => {
  /** @type {typeof import('./LaunchArgsEditor')} */
  let LaunchArgsEditor;
  /** @type {LaunchArgsEditor} */
  let launchArgsEditor;

  beforeEach(() => {
    LaunchArgsEditor = require('./LaunchArgsEditor');
    launchArgsEditor = new LaunchArgsEditor();
  });

  it('should have empty value at first', () => {
    expect(launchArgsEditor.get()).toEqual({});
  });

  it('should not throw if modify() is called with undefined', () => {
    expect(launchArgsEditor.modify().get()).toEqual({});
  });

  test.each([
    ['transient', false],
    ['permanent', true],
  ])('should merge %s values', (_name, permanent) => {
    expect(launchArgsEditor
      .modify({ a: 1 }, { permanent })
      .modify({ b: 2 }, { permanent })
      .get()).toEqual({ a: 1, b: 2 });
  });

  it('should merge both transient and permanent values', () =>
    expect(launchArgsEditor
      .modify({ a: 1 }, { permanent: false })
      .modify({ b: 2 }, { permanent: true })
      .get()).toEqual({ a: 1, b: 2 }));

  it('should merge transient values by default', () =>
    expect(launchArgsEditor
      .modify({ a: 1 })
      .modify({ b: 2 }, { permanent: true })
      .get({ permanent: true })).toEqual({ b: 2 }));

  it('should not return transient values if permanent values were requested', () =>
    expect(launchArgsEditor
      .modify({ a: 1 }, { permanent: false })
      .modify({ b: 2 }, { permanent: true })
      .get({ permanent: true })).toEqual({ b: 2 }));

  it('should not return permanent values if transient values were requested', () =>
    expect(launchArgsEditor
      .modify({ a: 1 }, { permanent: false })
      .modify({ b: 2 }, { permanent: true })
      .get({ permanent: false })).toEqual({ a: 1 }));

  it('should reset only transient values by default', () =>
    expect(launchArgsEditor
      .modify({ a: 1 }, { permanent: false })
      .modify({ b: 2 }, { permanent: true })
      .reset()
      .get()).toEqual({ b: 2 }));

  it('should reset both permanent and transient values if requested', () =>
    expect(launchArgsEditor
      .modify({ a: 1 }, { permanent: false })
      .modify({ b: 2 }, { permanent: true })
      .reset({ permanent: true })
      .get()).toEqual({}));

  describe.each([[false], [true]])('for options.permanent=%j', (permanent) => {
    it.each([[null], [undefined]])('should delete property if the new value is %j', (value) =>
      expect(launchArgsEditor
        .modify({ value: 1 }, { permanent })
        .modify({ value }, { permanent })
        .get()).toEqual({}));
  });

  it('should return every time a copy of values', () => {
    expect(launchArgsEditor.get()).not.toBe(launchArgsEditor.get());
  });

  it('should return every time a deep copy of values', () => {
    launchArgsEditor.modify({ a: { b: 'c' } });
    launchArgsEditor.get().a.b = 'd';
    expect(launchArgsEditor.get()).toEqual({ a: { b: 'c' } });
  });
});
