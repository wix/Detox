import type { PackageManifest } from '../types';

export class MockManifest implements PackageManifest {
  deleteDependency = jest.fn();
  findDependency = jest.fn();
  getDependencyVersion = jest.fn();
  listDependencies = jest.fn();
  moveDependency = jest.fn();
  setDependency = jest.fn();
  updateDependency = jest.fn();
  getPackageManager = jest.fn();
  getRepositoryDirectory = jest.fn();
  hasWorkspaces = jest.fn();
  isDirty = jest.fn();
  get = jest.fn();

  constructor(public name = '', public version = '') {}
}
