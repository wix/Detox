import { MockManifest, MockProject } from '../../__utils__';
import { UnsupportedJestVersionRule } from './index';

describe('unsupported-jest-version', () => {
  let project: MockProject;
  let manifest: MockManifest;
  let rule: UnsupportedJestVersionRule;

  beforeEach(() => {
    project = new MockProject();
    manifest = new MockManifest('some-project', '1.0.0');
  });

  describe('in a non-project', () => {
    beforeEach(async () => {
      rule = new UnsupportedJestVersionRule({
        context: { bare: false },
        manifest: null,
        project,
      });
    });

    it('should skip checks', async () => {
      await expect(rule.check()).resolves.toMatchInlineSnapshot(`
        {
          "message": "Couldn't find package.json in your project.",
          "status": "skipped",
        }
      `);
    });
  });

  describe('in a bare context', () => {
    beforeEach(async () => {
      rule = new UnsupportedJestVersionRule({
        context: { bare: true },
        manifest,
        project,
      });
    });

    it('should skip checks', async () => {
      await expect(rule.check()).resolves.toMatchInlineSnapshot(`
        {
          "message": "Cannot run without node_modules installed.",
          "status": "skipped",
        }
      `);
    });
  });

  describe('in a full context', () => {
    let peerJestVersion: string | undefined;

    beforeEach(() => {
      rule = new UnsupportedJestVersionRule({
        context: { bare: false },
        manifest,
        project,
      });

      const detoxManifest = new MockManifest('detox', '20.0.0');
      detoxManifest.getDependencyVersion.mockImplementation((name) => {
        return name === 'jest' ? peerJestVersion : undefined;
      });

      const jestManifest = new MockManifest('jest', '29.0.0');
      project.manifests['detox'] = detoxManifest;
      project.manifests['jest'] = jestManifest;
    });

    it('should skip checks if detox is not installed', async () => {
      delete project.manifests['detox'];
      await expect(rule.check()).resolves.toMatchInlineSnapshot(`
        {
          "message": "Detox is not installed in node_modules, skipping.",
          "status": "skipped",
        }
      `);
    });

    it('should skip checks if detox has no jest in peerDependencies', async () => {
      peerJestVersion = undefined;
      await expect(rule.check()).resolves.toMatchInlineSnapshot(`
        {
          "message": "Your Detox version doesn't impose any restrictions on Jest, skipping.",
          "status": "skipped",
        }
      `);
    });

    it('should fail if jest is not installed', async () => {
      peerJestVersion = '29.x.x || 28.x.x';
      delete project.manifests['jest'];
      await expect(rule.check()).resolves.toMatchInlineSnapshot(`
        {
          "message": "Jest is not installed in node_modules, cannot verify compatibility.",
          "status": "failure",
        }
      `);
    });

    it('should suggest to upgrade jest if it is too old', async () => {
      peerJestVersion = '29.x.x || 28.x.x';
      project.manifests['jest'].version = '27.2.5';
      await expect(rule.check()).resolves.toMatchInlineSnapshot(`
        {
          "message": [
            "jest@27.2.5 is not compatible with detox@20.0.0",
            "Please upgrade jest to range: 29.x.x || 28.x.x",
          ],
          "status": "failure",
        }
      `);
    });

    it('should suggest to downgrade jest if it is too new', async () => {
      peerJestVersion = '29.x.x || 28.x.x';
      project.manifests['jest'].version = '30.0.0';
      await expect(rule.check()).resolves.toMatchInlineSnapshot(`
        {
          "message": [
            "jest@30.0.0 is not compatible with detox@20.0.0",
            "Please downgrade jest to range: 29.x.x || 28.x.x",
          ],
          "status": "failure",
        }
      `);
    });

    it('should suggest to switch jest if it is unclear about direction', async () => {
      peerJestVersion = 'alpha';
      project.manifests['jest'].version = '30.0.0';
      await expect(rule.check()).resolves.toMatchInlineSnapshot(`
        {
          "message": [
            "jest@30.0.0 is not compatible with detox@20.0.0",
            "Please switch jest to range: alpha",
          ],
          "status": "failure",
        }
      `);
    });
  });
});
