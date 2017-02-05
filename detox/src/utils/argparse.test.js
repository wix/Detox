const _ = require('lodash');

describe('argparse', () => {
  let argparse;

  beforeEach(() => {
    jest.mock('minimist');
    const minimist = require('minimist');
    minimist.mockReturnValue({test: 'a value'});
    argparse = require('./argparse');
  });

  it(`nonexistent key should return undefined result`, () => {
    expect(argparse.getArgValue('blah')).not.toBeDefined();
  });

  it(`existing key should return a result`, () => {
    expect(argparse.getArgValue('test')).toBe('a value');
  });
});
