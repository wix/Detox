const _ = require('lodash');
const path = require('path');
const ArtifactPathBuilder = require('./ArtifactPathBuilder');

describe(ArtifactPathBuilder, () => {
  let strategy;

  describe('happy paths', () => {
    beforeEach(() => {
      strategy = new ArtifactPathBuilder({
        artifactsRootDir: '/tmp'
      });
    });

    it('should give paths inside a timestamp-based subdirectory inside artifacts root', () => {
      expect(strategy.rootDir).toMatch(/^[\\/]tmp[\\/]detox_artifacts\.\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should provide path for unique (per test runner run) artifacts', () => {
      const artifactPath1 = strategy.buildPathForRunArtifact('before-tests-began.log');
      const expectedPath1 = path.join(strategy.rootDir, 'before-tests-began.log');

      expect(artifactPath1).toBe(expectedPath1);
    });

    it('should provide indexed and nested path for test artifact', () => {
      const test1 = {title: 'test 1', fullName: 'some test 1', status: 'running' };
      const artifactPath1 = strategy.buildPathForTestArtifact(test1, '1.log');
      const expectedPath1 = path.join(strategy.rootDir, '0. ' + test1.fullName, '1.log');

      expect(artifactPath1).toBe(expectedPath1);
    });

    it('should give different indices for different tests', () => {
      const createTestSummary = (i) => ({ title: `test ${i}`, fullName: `suite - test ${i}` });

      const path1 = strategy.buildPathForTestArtifact(createTestSummary(0), 'artifact');
      const path2 = strategy.buildPathForTestArtifact(createTestSummary(1), 'artifact');

      expect(path1).not.toBe(path2);
      expect(path1).toMatch(/0\. suite - test 0[/\\]artifact$/);
      expect(path2).toMatch(/1\. suite - test 1[/\\]artifact$/);
    });

    it('should give same indices for same test (even if refs are different)', () => {
      const testSummary1 = { title: 'test', fullName: 'suite - test' };
      const testSummary2 = { title: 'test', fullName: 'suite - test' };

      const path1 = strategy.buildPathForTestArtifact(testSummary1, 'artifact');
      const path2 = strategy.buildPathForTestArtifact(testSummary2, 'artifact');

      expect(path1).toBe(path2);
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      strategy = new ArtifactPathBuilder({
        artifactsRootDir: '/tmp',
        getUniqueSubdirectory: _.constant('subdir'),
      });
    });

    it('should defend against accidental resolving outside of root directory', () => {
      const maliciousName = 'some/../../../../../../home/build-server';

      expect(() => strategy.buildPathForTestArtifact({ title: '', fullName: maliciousName }, '.bashrc')).toThrowErrorMatchingSnapshot();
      expect(() => strategy.buildPathForTestArtifact({ title: '', fullName: 'test' }, maliciousName)).toThrowErrorMatchingSnapshot();
      expect(() => strategy.buildPathForTestArtifact({ title: '', fullName: maliciousName }, maliciousName)).toThrowErrorMatchingSnapshot();
    });

    it('should trim too long filenames', () => {
      const actualPath = strategy.buildPathForTestArtifact({ title: 'test', fullName: '1'.repeat(512) }, '2'.repeat(256));
      const expectedPath = path.join(strategy.rootDir, '0. ' + '1'.repeat(252), '2'.repeat(255));

      expect(actualPath).toBe(expectedPath);
    });
  });
});
