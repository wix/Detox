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

    it('should provide nested path for test artifact', () => {
      const test1 = {title: 'test 1', fullName: 'some test 1', status: 'running' };
      const artifactPath1 = strategy.buildPathForTestArtifact(test1, '1.log');
      const expectedPath1 = path.join(strategy.rootDir, test1.fullName, '1.log');

      expect(artifactPath1).toBe(expectedPath1);
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
      const expectedPath = path.join(strategy.rootDir, '1'.repeat(255), '2'.repeat(255));

      expect(actualPath).toBe(expectedPath);
    });
  });
});
