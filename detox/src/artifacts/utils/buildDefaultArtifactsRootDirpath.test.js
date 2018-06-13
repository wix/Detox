describe('buildDefaultArtifactsRootDirpath', () => {
  let buildDefaultArtifactsRootDirpath;

  beforeEach(() => {
    jest.mock('./getTimeStampString', () => () => 'Today 1:23:45PM');
    buildDefaultArtifactsRootDirpath = require('./buildDefaultArtifactsRootDirpath');
  });

  it('should append subdir if dir does not end with /', () => {
    expect(buildDefaultArtifactsRootDirpath('iphone8', 'artifacts')).toBe('artifacts/iphone8.Today 1:23:45PM');
  });

  it('should not append subdir if dir ends with /', () => {
    expect(buildDefaultArtifactsRootDirpath('iphone8', 'artifacts/')).toBe('artifacts/');
  });
});
