import { memoize } from 'lodash';
import type { Project } from '../types';
import { MockManifest } from './MockManifest';

export class MockProject implements Project {
  rootDir = '';
  deleteFile = jest.fn();
  exec = jest.fn();
  hasDirectory = jest.fn();
  hasFile = jest.fn();
  readFile = jest.fn();
  writeFile = jest.fn();
  getManifest = jest.fn(memoize(async (name = '') => new MockManifest(name)));
  installPackages = jest.fn();
  isModuleInstalled = jest.fn();
}
