const _ = require('lodash');
const path = require('path');
const NoConflictPathStrategy = require('./NoConflictPathStrategy');

describe(NoConflictPathStrategy, () => {
  let strategy;

  describe('happy paths', () => {
    beforeEach(() => {
      strategy = new NoConflictPathStrategy({
        artifactsRootDir: '/tmp'
      });
    });

    it('should give paths inside a timestamp-based subdirectory inside artifacts root', () => {
      expect(strategy.rootDir).toMatch(/^[\\/]tmp[\\/]detox_artifacts\.\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should provide indexed and nested path for test artifact', () => {
      const test1 = {title: 'test 1', fullName: 'some test 1', status: 'running' };
      const artifactPath1 = strategy.constructPathForTestArtifact(test1, '1.log');
      const expectedPath1 = path.join(strategy.rootDir, '0. ' + test1.fullName, '1.log');

      expect(artifactPath1).toBe(expectedPath1);
    });

    it('should give different indices for different test objects', () => {
      const createTestSummary = () => ({ title: 'test', fullName: 'suite - test' });

      const path1 = strategy.constructPathForTestArtifact(createTestSummary(), 'artifact');
      const path2 = strategy.constructPathForTestArtifact(createTestSummary(), 'artifact');

      expect(path1).not.toBe(path2);
      expect(path1).toMatch(/0\. suite - test[/\\]artifact$/);
      expect(path2).toMatch(/1\. suite - test[/\\]artifact$/);
    });

    it('should give same indices for same tests', () => {
      const testSummary = { title: 'test', fullName: 'suite - test' };

      const path1 = strategy.constructPathForTestArtifact(testSummary, 'artifact');
      const path2 = strategy.constructPathForTestArtifact(testSummary, 'artifact');

      expect(path1).toBe(path2);
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      strategy = new NoConflictPathStrategy({
        artifactsRootDir: '/tmp',
        getUniqueSubdirectory: _.constant('subdir'),
      });
    });

    it('should defend against accidental resolving outside of root directory', () => {
      const maliciousName = 'some/../../../../../../home/build-server';

      expect(() => strategy.constructPathForTestArtifact({ title: '', fullName: maliciousName }, '.bashrc')).toThrowErrorMatchingSnapshot();
      expect(() => strategy.constructPathForTestArtifact({ title: '', fullName: 'test' }, maliciousName)).toThrowErrorMatchingSnapshot();
      expect(() => strategy.constructPathForTestArtifact({ title: '', fullName: maliciousName }, maliciousName)).toThrowErrorMatchingSnapshot();
    });

    it('should trim too long filenames', () => {
      const actualPath = strategy.constructPathForTestArtifact({ title: 'test', fullName: '1'.repeat(512) }, '2'.repeat(256));
      const expectedPath = path.join(strategy.rootDir, '0. ' + '1'.repeat(252), '2'.repeat(255));

      expect(actualPath).toBe(expectedPath);
    });
  });
});
