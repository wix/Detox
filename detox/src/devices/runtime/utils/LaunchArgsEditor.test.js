// @ts-nocheck
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

  it('should merge values', () => {
    expect(launchArgsEditor
      .modify({ a: 1 })
      .modify({ b: 2 })
      .get()).toEqual({ a: 1, b: 2 });
  });

  it('should merge both local and shared values', () => {
    launchArgsEditor
      .modify({ a: 1 })
      .shared.modify({ b: 2 });

    expect(launchArgsEditor.get()).toEqual({ a: 1, b: 2 });
  });

  it('should not return transient values if permanent values were requested', () =>
    expect(launchArgsEditor
      .modify({ a: 1 })
      .shared.modify({ b: 2 })
      .get()).toEqual({ b: 2 }));

  it('should reset only transient values by default', () => {
    launchArgsEditor.shared.modify({ b: 2 });

    expect(launchArgsEditor
      .modify({ a: 1 })
      .reset()
      .get()).toEqual({ b: 2 });
  });

  it('should reset both permanent and transient values if requested', () => {
    launchArgsEditor.modify({ a: 1 }).shared.modify({ b: 2 });
    launchArgsEditor.reset().shared.reset();
    expect(launchArgsEditor.get()).toEqual({});
  });

  it('should return every time a copy of values', () => {
    expect(launchArgsEditor.get()).not.toBe(launchArgsEditor.get());
    expect(launchArgsEditor.shared.get()).not.toBe(launchArgsEditor.shared.get());
  });

  it('should return every time a deep copy of values', () => {
    launchArgsEditor.modify({ a: { b: 'c' } });
    launchArgsEditor.get().a.b = 'd';
    expect(launchArgsEditor.get()).toEqual({ a: { b: 'c' } });

    launchArgsEditor.shared.modify({ a: { b: 'c' } });
    launchArgsEditor.shared.get().a.b = 'd';
    expect(launchArgsEditor.shared.get()).toEqual({ a: { b: 'c' } });
  });
});
