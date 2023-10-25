import { memoize } from 'lodash';
import type { Project } from '../types';
import type { MockManifest } from './MockManifest';

export class MockProject implements Project {
  rootDir = '';
  manifests: Record<string, MockManifest> = {};

  deleteFile = jest.fn();
  exec = jest.fn();
  hasDirectory = jest.fn();
  hasFile = jest.fn();
  readFile = jest.fn();
  writeFile = jest.fn();
  getManifest = jest.fn(memoize(async (name = '') => this.manifests[name] ?? null));
  installPackages = jest.fn();
  isModuleInstalled = jest.fn();
}
