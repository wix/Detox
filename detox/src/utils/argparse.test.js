jest.unmock('process');

describe('argparse', () => {
  let argparse;

  beforeEach(() => {
    process.env.test = 'a value';
    argparse = require('./argparse');
  });

  it(`nonexistent key should return undefined result`, () => {
    expect(argparse.getArgValue('blah')).not.toBeDefined();
  });

  it(`existing key should return a result`, () => {
    expect(argparse.getArgValue('test')).toBe('a value');
  });
});
