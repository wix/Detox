import { indent } from './indent';

describe('indent', () => {
  it('should indent a string', () => {
    expect(indent('hello world', '  ')).toBe('  hello world');
  });

  it('should indent a multiline string', () => {
    expect(indent('hello\nworld', '  ')).toBe('  hello\n  world');
  });
});
