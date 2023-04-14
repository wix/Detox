const path = require('path');

const resolveModuleFromPath = require('./resolveModuleFromPath');

const RELATIVE_PATH_TO_PACKAGE_JSON = '../../package.json';

describe('resolveModuleFromPath', () => {
  let packageJson;

  beforeEach(() => {
    packageJson = require(RELATIVE_PATH_TO_PACKAGE_JSON);
  });

  it('should resolve absolute paths', async () => {
    const absolutePath = require.resolve(RELATIVE_PATH_TO_PACKAGE_JSON);
    expect(path.isAbsolute(absolutePath)).toBe(true); // an assertion to be on the safe side
    expect(resolveModuleFromPath(absolutePath)).toBe(packageJson);
  });

  it('should resolve relative paths', async () => {
    expect(resolveModuleFromPath(`./package.json`)).toBe(packageJson);
  });

  it('should resolve node modules', async () => {
    expect(resolveModuleFromPath('lodash/map')).toBe(require('lodash/map'));
  });
});
