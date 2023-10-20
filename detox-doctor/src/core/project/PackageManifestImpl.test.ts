import { PackageManifestImpl } from './PackageManifestImpl';

describe('PackageManifestImpl', () => {
  let packageManifest: PackageManifestImpl;

  beforeEach(() => {
    packageManifest = new PackageManifestImpl({
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        'test-dependency-1': '^1.0.0',
        'test-dependency-2': '~2.0.0',
      },
      devDependencies: {
        'test-dev-dependency-1': '2.x',
      },
      peerDependencies: {
        'test-dev-dependency-1': '1.x || 2.x',
      },
      repository: {
        type: 'git',
        url: 'https://github.com/test/test-package.git',
        directory: 'packages/test-package',
      },
    });
  });

  describe('listDependencies', () => {
    it('should list all dependencies by default', () => {
      const dependencies = packageManifest.listDependencies();
      expect(dependencies).toEqual([
        ['test-dependency-1', '^1.0.0'],
        ['test-dependency-2', '~2.0.0'],
        ['test-dev-dependency-1', '2.x'],
        ['test-dev-dependency-1', '1.x || 2.x'],
      ]);
    });

    it('should list dependencies from specified categories', () => {
      const dependencies = packageManifest.listDependencies([
        'devDependencies',
        'peerDependencies',
      ]);
      expect(dependencies).toEqual([
        ['test-dev-dependency-1', '2.x'],
        ['test-dev-dependency-1', '1.x || 2.x'],
      ]);
    });
  });

  describe('deleteDependency', () => {
    it('should delete a dependency', () => {
      expect(packageManifest.deleteDependency('test-dev-dependency-1')).toBe(true);
      expect(packageManifest.listDependencies(['devDependencies', 'peerDependencies'])).toEqual([]);
    });

    it('should delete a dependency from specified categories', () => {
      expect(packageManifest.deleteDependency('test-dev-dependency-1', ['devDependencies'])).toBe(
        true,
      );
      expect(packageManifest.listDependencies(['devDependencies'])).toEqual([]);
      expect(packageManifest.listDependencies(['peerDependencies'])[0][0]).toBe(
        'test-dev-dependency-1',
      );
    });

    it('should return false if dependency not found', () => {
      expect(packageManifest.deleteDependency('non-existent-dependency')).toBe(false);
      expect(packageManifest.listDependencies().length).toBe(4);
    });
  });

  describe('findDependency', () => {
    it('should find a dependency', () => {
      const categories = packageManifest.findDependency('test-dev-dependency-1');
      expect(categories).toEqual(['devDependencies', 'peerDependencies']);
    });

    it('should find a dependency among specified categories', () => {
      const categories = packageManifest.findDependency('test-dev-dependency-1', [
        'peerDependencies',
      ]);
      expect(categories).toEqual(['peerDependencies']);
    });

    it('should return empty array if dependency not found', () => {
      const categories = packageManifest.findDependency('non-existent-dependency');
      expect(categories).toEqual([]);
    });
  });

  describe('getDependencyVersion', () => {
    it('should get the version of a dependency', () => {
      const version = packageManifest.getDependencyVersion('test-dependency-1');
      expect(version).toBe('^1.0.0');
    });

    it('should consider the order of categories', () => {
      const devFirst = packageManifest.getDependencyVersion('test-dev-dependency-1', [
        'devDependencies',
        'peerDependencies',
      ]);
      const peerFirst = packageManifest.getDependencyVersion('test-dev-dependency-1', [
        'peerDependencies',
        'devDependencies',
      ]);

      expect(devFirst).toBe('2.x');
      expect(peerFirst).toBe('1.x || 2.x');
    });

    it('should return undefined if dependency not found', () => {
      const version = packageManifest.getDependencyVersion('non-existent-dependency');
      expect(version).toBeUndefined();
    });
  });

  describe('moveDependency', () => {
    it('should move a dependency', () => {
      expect(
        packageManifest.moveDependency('test-dependency-1', 'dependencies', 'devDependencies'),
      ).toBe(true);
      expect(packageManifest.listDependencies(['devDependencies'])).toEqual([
        ['test-dev-dependency-1', '2.x'],
        ['test-dependency-1', '^1.0.0'],
      ]);
    });

    it('should return false if dependency not found', () => {
      const before = packageManifest.listDependencies().map((x) => [...x]);
      expect(
        packageManifest.moveDependency(
          'non-existent-dependency',
          'dependencies',
          'peerDependencies',
        ),
      ).toBe(false);
      expect(packageManifest.listDependencies()).toEqual(before);
    });

    it('should return false if dependency not found in source category', () => {
      const before = packageManifest.listDependencies().map((x) => [...x]);
      expect(
        packageManifest.moveDependency(
          'test-dependency-1',
          'peerDependencies',
          'optionalDependencies',
        ),
      ).toBe(false);
      expect(packageManifest.listDependencies()).toEqual(before);
    });

    it('should create a new category in the manifest if it does not exist', () => {
      packageManifest = new PackageManifestImpl({
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          'test-dependency-1': '^1.0.0',
        },
      });

      packageManifest.moveDependency('test-dependency-1', 'dependencies', 'devDependencies');
      expect(packageManifest.findDependency('test-dependency-1')).toEqual(['devDependencies']);
    });
  });

  describe('setDependency', () => {
    it('should set a dependency', () => {
      packageManifest.setDependency('test-dependency-1', '~0.1.0', ['dependencies']);
      packageManifest.setDependency('test-dependency-3', '^2.0.0', ['dependencies']);

      expect(packageManifest.listDependencies(['dependencies'])).toEqual([
        ['test-dependency-1', '~0.1.0'],
        ['test-dependency-2', '~2.0.0'],
        ['test-dependency-3', '^2.0.0'],
      ]);
    });
  });

  describe('updateDependency', () => {
    it('should update a dependency', () => {
      expect(packageManifest.updateDependency('test-dependency-1', '^2.0.0')).toBe(true);
      expect(packageManifest.listDependencies(['dependencies'])).toEqual([
        ['test-dependency-1', '^2.0.0'],
        ['test-dependency-2', '~2.0.0'],
      ]);
    });

    it('should not update a dependency if range already intersects', () => {
      expect(packageManifest.updateDependency('test-dependency-2', '~2.0.1')).toBe(false);
      expect(packageManifest.listDependencies(['dependencies'])).toEqual([
        ['test-dependency-1', '^1.0.0'],
        ['test-dependency-2', '~2.0.0'],
      ]);
    });

    it('should return false if dependency not found', () => {
      const before = packageManifest.listDependencies().map((x) => [...x]);
      expect(packageManifest.updateDependency('non-existent-dependency', '~1.0.0')).toBe(false);
      expect(packageManifest.listDependencies()).toEqual(before);
    });
  });

  describe('getPackageManager', () => {
    it('should return the package manager specified in package.json', () => {
      const packageManifestWithoutPackageManager = new PackageManifestImpl({
        name: 'test-package',
        version: '1.0.0',
        dependencies: {},
        packageManager: 'yarn@2.0.0',
      });

      expect(packageManifestWithoutPackageManager.getPackageManager()).toBe('yarn@2.0.0');
    });

    it('should return "npm" if package.json does not specify a package manager', () => {
      expect(packageManifest.getPackageManager()).toBe('npm');
    });
  });

  describe('getRepositoryDirectory', () => {
    it('should return the repository directory specified in package.json', () => {
      expect(packageManifest.getRepositoryDirectory()).toBe('packages/test-package');
    });

    it('should return undefined if repository directory is not specified in package.json', () => {
      const packageManifestWithoutRepositoryDirectory = new PackageManifestImpl({
        name: 'test-package',
        version: '1.0.0',
        dependencies: {},
      });
      expect(packageManifestWithoutRepositoryDirectory.getRepositoryDirectory()).toBeUndefined();
    });
  });

  describe('hasWorkspaces', () => {
    it('should return true if workspaces are specified in package.json', () => {
      const packageManifest = new PackageManifestImpl({
        name: 'test-package',
        version: '1.0.0',
        workspaces: ['packages/*'],
      });
      expect(packageManifest.hasWorkspaces()).toBe(true);
    });

    it('should return false if workspaces are not specified in package.json', () => {
      const packageManifest = new PackageManifestImpl({
        name: 'test-package',
        version: '1.0.0',
        dependencies: {},
      });

      expect(packageManifest.hasWorkspaces()).toBe(false);
    });
  });

  describe('isDirty', () => {
    it('should return false on a clean package.json', () => {
      expect(packageManifest.isDirty()).toBe(false);
    });

    it('should return ture on a modified package.json', () => {
      packageManifest.setDependency('test-dependency-1', '~0.1.0', ['dependencies']);
      expect(packageManifest.isDirty()).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should serialize the modified package.json', () => {
      packageManifest.setDependency('test-optional-dependency-1', '1.x', ['optionalDependencies']);
      expect(JSON.stringify(packageManifest, null, 2)).toMatchInlineSnapshot(`
        "{
          "name": "test-package",
          "version": "1.0.0",
          "dependencies": {
            "test-dependency-1": "^1.0.0",
            "test-dependency-2": "~2.0.0"
          },
          "devDependencies": {
            "test-dev-dependency-1": "2.x"
          },
          "peerDependencies": {
            "test-dev-dependency-1": "1.x || 2.x"
          },
          "repository": {
            "type": "git",
            "url": "https://github.com/test/test-package.git",
            "directory": "packages/test-package"
          },
          "optionalDependencies": {
            "test-optional-dependency-1": "1.x"
          }
        }"
      `);
    });
  });
});
