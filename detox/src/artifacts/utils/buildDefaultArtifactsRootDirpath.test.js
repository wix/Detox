const buildDefaultArtifactsRootDirpath = require('./buildDefaultArtifactsRootDirpath');

describe(buildDefaultArtifactsRootDirpath.name, () => {
  let subject;

  beforeEach(() => {
    jest.mock('./getTimeStampString', () => () => 'Today 1:23:45PM');
    subject = require('./buildDefaultArtifactsRootDirpath');
  });

  it('should not append subdir if dir ends with /', () => {
    expect(subject('iphone8', 'artifacts/')).toBe('artifacts/');
  });

  it('should append subdir if dir does not end with /', () => {
    expect(subject('iphone8', '/a/dir')).toBe('/a/dir/iphone8.Today 1:23:45PM');
  });

  it('should return artifacts/subdir by default', () => {
    expect(subject('iphone8')).toBe('artifacts/iphone8.Today 1:23:45PM');
  });
});
