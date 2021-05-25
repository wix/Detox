const path = require('path');

const buildDefaultArtifactsRootDirpath = require('./buildDefaultArtifactsRootDirpath');

describe('buildDefaultArtifactsRootDirpath', () => {
  beforeEach(() => {
    process.env.DETOX_START_TIMESTAMP = '1572951641499';
  });

  afterAll(() => {
    delete process.env.DETOX_START_TIMESTAMP;
  });

  it('should append subdir if dir does not end with /', () => {
    expect(buildDefaultArtifactsRootDirpath('iphone8', 'artifacts')).toBe(path.join('artifacts', 'iphone8.2019-11-05 11-00-41Z'));
  });

  it('should fall back to Date.now if environment variable DETOX_START_TIMESTAMP is unset', () => {
    delete process.env.DETOX_START_TIMESTAMP;
    expect(buildDefaultArtifactsRootDirpath('iphone8', 'artifacts')).toMatch(/^artifacts[\\/]iphone8\.\d{4}-\d{2}-\d{2} \d{2}-\d{2}-\d{2}Z$/);
    expect(buildDefaultArtifactsRootDirpath('iphone8', 'artifacts')).not.toBe(path.join('artifacts', 'iphone8.2019-11-05 11-00-41Z'));
  });

  it('should not append subdir if dir ends with /', () => {
    expect(buildDefaultArtifactsRootDirpath('iphone8', 'artifacts/')).toBe('artifacts/');
  });
});
