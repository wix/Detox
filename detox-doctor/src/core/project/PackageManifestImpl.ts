import { cloneDeep, isEqual } from 'lodash';
import * as semver from 'semver';
import type { DependencyCategory, PackageManifest } from '../../types';

const ALL_DEPENDENCY_CATEGORIES: DependencyCategory[] = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PackageJson = Record<string, any>;

export class PackageManifestImpl implements PackageManifest {
  readonly name: string;
  readonly version: string;
  private readonly backup: PackageJson;
  private readonly data: PackageJson;

  constructor(data: PackageJson) {
    this.backup = cloneDeep(data);
    this.data = data;
    this.name = data.name;
    this.version = data.version;
  }

  get(): PackageJson {
    return this.data;
  }

  isDirty(): boolean {
    return !isEqual(this.backup, this.data);
  }

  listDependencies(categories = ALL_DEPENDENCY_CATEGORIES): [string, string][] {
    const dependencies: [string, string][] = [];
    for (const category of categories) {
      if (this.data[category]) {
        for (const [packageName, version] of Object.entries(this.data[category])) {
          dependencies.push([packageName, version as string]);
        }
      }
    }
    return dependencies;
  }

  deleteDependency(packageName: string, categories = ALL_DEPENDENCY_CATEGORIES): boolean {
    let deleted = false;

    for (const category of categories) {
      if (this.data[category]?.[packageName]) {
        delete this.data[category][packageName];
        deleted = true;
      }
    }

    return deleted;
  }

  findDependency(
    packageName: string,
    categories = ALL_DEPENDENCY_CATEGORIES,
  ): DependencyCategory[] {
    const foundCategories: DependencyCategory[] = [];

    for (const category of categories) {
      if (this.data[category]?.[packageName]) {
        foundCategories.push(category);
      }
    }

    return foundCategories;
  }

  getDependencyVersion(
    packageName: string,
    categories = ALL_DEPENDENCY_CATEGORIES,
  ): string | undefined {
    for (const category of categories) {
      if (this.data[category]?.[packageName]) {
        return this.data[category][packageName];
      }
    }

    return;
  }

  moveDependency(packageName: string, from: DependencyCategory, to: DependencyCategory): boolean {
    if (!this.data[from]?.[packageName]) {
      return false;
    }

    if (!this.data[to]) {
      this.data[to] = {};
    }

    this.data[to][packageName] = this.data[from][packageName];
    delete this.data[from][packageName];
    return true;
  }

  updateDependency(
    packageName: string,
    range: string,
    categories = ALL_DEPENDENCY_CATEGORIES,
  ): boolean {
    let updated = false;

    for (const category of categories) {
      if (
        this.data[category]?.[packageName] &&
        !semver.subset(range, this.data[category][packageName])
      ) {
        this.data[category][packageName] = range;
        updated = true;
      }
    }

    return updated;
  }

  setDependency(packageName: string, range: string, categories = ALL_DEPENDENCY_CATEGORIES): void {
    for (const category of categories) {
      this.data[category] = this.data[category] ?? {};
      this.data[category][packageName] = range;
    }
  }

  getPackageManager(): string {
    return this.data.packageManager ?? 'npm';
  }

  getRepositoryDirectory(): string | undefined {
    return this.data.repository?.directory;
  }

  hasWorkspaces(): boolean {
    return this.data.workspaces !== undefined;
  }

  toJSON(): PackageJson {
    return this.data;
  }
}
