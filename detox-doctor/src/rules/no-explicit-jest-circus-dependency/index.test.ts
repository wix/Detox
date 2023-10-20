import { MockManifest } from '../../__utils__';
import { NoExplicitJestCircusDependencyRule } from './index';

describe('no-explicit-jest-circus-dependency', () => {
  let manifest: MockManifest;
  let rule: NoExplicitJestCircusDependencyRule;

  describe('#check', () => {
    beforeEach(() => {
      manifest = new MockManifest();
      rule = new NoExplicitJestCircusDependencyRule({ manifest });
    });

    test('no manifest', async () => {
      rule = new NoExplicitJestCircusDependencyRule({ manifest: null });
      await expect(rule.check()).resolves.toMatchSnapshot();
    });

    test('no jest', async () => {
      manifest.getDependencyVersion.mockReturnValue(void 0);
      manifest.findDependency.mockReturnValue([]);

      await expect(rule.check()).resolves.toMatchSnapshot();
    });

    test('non-semantic version', async () => {
      manifest.getDependencyVersion.mockReturnValue('latest');
      await expect(rule.check()).resolves.toMatchSnapshot();
    });

    test('old version', async () => {
      manifest.getDependencyVersion.mockReturnValue('^26.6.0');
      await expect(rule.check()).resolves.toMatchSnapshot();
    });

    test('has circus', async () => {
      manifest.getDependencyVersion.mockReturnValue('^27.2.5');
      manifest.findDependency.mockReturnValue(['devDependencies']);
      await expect(rule.check()).resolves.toMatchSnapshot();
    });

    test('has no circus', async () => {
      manifest.getDependencyVersion.mockReturnValue('^27.2.5');
      manifest.findDependency.mockReturnValue([]);

      await expect(rule.check()).resolves.toMatchSnapshot();
    });
  });

  describe('#fix', () => {
    beforeEach(() => {
      manifest = new MockManifest();
      rule = new NoExplicitJestCircusDependencyRule({ manifest });
    });

    test('happy path', async () => {
      manifest.getDependencyVersion.mockReturnValue('^27.2.5');
      manifest.deleteDependency.mockReturnValue(true);
      await expect(rule.fix()).resolves.toMatchSnapshot();
    });

    test('unhappy path', async () => {
      manifest.getDependencyVersion.mockReturnValue(void 0);
      manifest.deleteDependency.mockReturnValue(false);
      await expect(rule.fix()).resolves.toMatchSnapshot();
    });
  });
});
