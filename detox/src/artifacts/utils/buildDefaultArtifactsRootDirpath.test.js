jest.useFakeTimers();

const path = require('path');

const getTimeStampString = require('./getTimeStampString');

describe('buildDefaultArtifactsRootDirpath', () => {
  let buildDefaultArtifactsRootDirpath;

  beforeEach(() => {
    buildDefaultArtifactsRootDirpath = require('./buildDefaultArtifactsRootDirpath');
  });

  it('should append "<configurationName>.YYYY-MM-DD HH-MM-SSZ" subdir if dir does not end with /', () => {
    expect(buildDefaultArtifactsRootDirpath('iphone8', 'artifacts')).toBe(path.join('artifacts', `iphone8.${getTimeStampString()}`));
  });

  it('should not append subdir if dir ends with /', () => {
    expect(buildDefaultArtifactsRootDirpath('iphone8', 'artifacts/')).toBe('artifacts');
  });

  it('should not append subdir if dir ends with \\', () => {
    expect(buildDefaultArtifactsRootDirpath('iphone8', 'artifacts\\')).toBe('artifacts');
  });
});
