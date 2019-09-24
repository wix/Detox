const _ = require('lodash');
const path = require('path');
const ArtifactPathBuilder = require('./ArtifactPathBuilder');

describe(ArtifactPathBuilder, () => {
  let pathBuilder;

  describe('precise tests', () => {
    beforeEach(() => {
      pathBuilder = new ArtifactPathBuilder({
        artifactsRootDir: '/tmp'
      });
    });

    it('should give paths inside a timestamp-based subdirectory inside artifacts root', () => {
      expect(pathBuilder.rootDir).toBe('/tmp')
    });

    it('should provide path for unique (per test runner run) artifacts', () => {
      const artifactPath1 = pathBuilder.buildPathForTestArtifact('before-tests-began.log');
      const expectedPath1 = path.join(pathBuilder.rootDir, 'before-tests-began.log');

      expect(artifactPath1).toBe(expectedPath1);
    });

    it('should provide nested path for test artifact', () => {
      const test1 = {title: 'test 1', fullName: 'some test 1', status: 'running' };
      const artifactPath1 = pathBuilder.buildPathForTestArtifact('1.log', test1);
      const expectedPath1 = path.join(pathBuilder.rootDir, test1.fullName, '1.log');

      expect(artifactPath1).toBe(expectedPath1);
    });
  });

  describe('snapshot tests', () => {
    beforeEach(() => {
      pathBuilder = new ArtifactPathBuilder({
        artifactsRootDir: '/tmp/subdir',
      });
    });

    it('should defend against accidental resolving outside of root directory', () => {
      const maliciousName = 'some/../../../../../../home/build-server';

      const [path1, path2, path3] = [
        pathBuilder.buildPathForTestArtifact('.bashrc', { title: '', fullName: maliciousName }),
        pathBuilder.buildPathForTestArtifact(maliciousName, { title: '', fullName: 'test' }),
        pathBuilder.buildPathForTestArtifact(maliciousName, { title: '', fullName: maliciousName }),
      ].map(asPosixPath);

      expect(path1).toBe('/tmp/subdir/some_.._.._.._.._.._.._home_build-server/.bashrc');
      expect(path2).toBe('/tmp/subdir/test/some_.._.._.._.._.._.._home_build-server');
      expect(path3).toBe('/tmp/subdir/some_.._.._.._.._.._.._home_build-server/some_.._.._.._.._.._.._home_build-server');
    });

    it('should trim too long filenames', () => {
      const actualPath = pathBuilder.buildPathForTestArtifact('2'.repeat(256), { title: 'test', fullName: '1'.repeat(512) });
      const expectedPath = path.join(pathBuilder.rootDir, '1'.repeat(255), '2'.repeat(255));

      expect(actualPath).toBe(expectedPath);
    });

    it('should prepend checkmark to an artifact of a passed test', () => {
      const testSummary = {title: '', fullName: 'test', status: 'passed' };
      const artifactPath = pathBuilder.buildPathForTestArtifact('1.log', testSummary);

      expect(asPosixPath(artifactPath)).toBe('/tmp/subdir/✓ test/1.log');
    });

    it('should prepend x sign to an artifact of a failed test', () => {
      const testSummary = {title: '', fullName: 'test', status: 'failed' };
      const artifactPath = pathBuilder.buildPathForTestArtifact('1.log', testSummary);

      expect(asPosixPath(artifactPath)).toBe('/tmp/subdir/✗ test/1.log');
    });
  });

  function asPosixPath(maybeWin32Path) {
    return maybeWin32Path.replace(asPosixPath.regexp, path.posix.sep);
  }

  asPosixPath.regexp = new RegExp('\\' + path.win32.sep, 'g');
});
