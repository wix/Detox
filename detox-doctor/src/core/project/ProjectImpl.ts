import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';

import type { Project } from '../../types';
import { isFSError, resolveFrom, resolveManifestFrom } from '../../utils';

import { PackageManifestImpl } from './PackageManifestImpl';
import { VirtualFile } from './VirtualFile';

export type ProjectConfig = {
  rootDir: string;
};

export class ProjectImpl implements Project {
  private _cachedFiles: Record<string, VirtualFile> = {};
  private _cachedManifests: Record<string, PackageManifestImpl> = {};

  constructor(protected readonly config: ProjectConfig) {}

  get rootDir() {
    return this.config.rootDir;
  }

  async hasFile(filePath: string): Promise<boolean> {
    const file = await this._getFile(filePath);
    return file.content !== undefined;
  }

  async hasDirectory(directoryPath: string): Promise<boolean> {
    const absoluteFilePath = path.isAbsolute(directoryPath)
      ? path.normalize(directoryPath)
      : path.resolve(path.join(this.config.rootDir, directoryPath));

    if (
      Object.keys(this._cachedFiles).some((filePath) =>
        filePath.startsWith(absoluteFilePath + path.sep),
      )
    ) {
      return true;
    }

    const stat = await fse.stat(absoluteFilePath).catch(() => null);
    return stat ? stat.isDirectory() : false;
  }

  async deleteFile(filePath: string): Promise<void> {
    const file = await this._getFile(filePath);
    delete file.content;
  }

  async readFile(filePath: string): Promise<string> {
    const file = await this._getFile(filePath);
    if (!file.content) {
      throw new Error(`File ${filePath} does not exist`);
    }

    return file.content;
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const file = await this._getFile(filePath);
    file.content = content;
  }

  async isModuleInstalled(packageName: string): Promise<boolean> {
    try {
      resolveFrom(this.config.rootDir, `${packageName}/package.json`);
      return true;
    } catch (error: unknown) {
      if (isFSError(error)) {
        switch (error.code) {
          case 'MODULE_NOT_FOUND': {
            return false;
          }
          case 'ERR_PACKAGE_PATH_NOT_EXPORTED': {
            return true;
          }
        }
      }

      throw error;
    }
  }

  async getManifest(packageName = '.'): Promise<PackageManifestImpl | null> {
    const rootDir = this.config.rootDir;
    const packageJsonPath = resolveManifestFrom(rootDir, packageName);
    if (!packageJsonPath) {
      return null;
    }

    const absolutePackageJsonPath = path.resolve(packageJsonPath);
    if (this._cachedManifests[absolutePackageJsonPath]) {
      return this._cachedManifests[absolutePackageJsonPath];
    }

    const packageJsonContent = await fse.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    const manifest = new PackageManifestImpl(packageJson);
    this._cachedManifests[absolutePackageJsonPath] = manifest;

    return manifest;
  }

  async commitChanges(): Promise<void> {
    const saveFilePromises = Object.values(this._cachedFiles)
      .filter((file) => file.modified)
      .map((file) => {
        return file.content === undefined
          ? fse.remove(file.path)
          : fse.ensureFile(file.path).then(() => {
              return fse.writeFile(file.path, file.content, 'utf8');
            });
      });

    const saveManifestPromises = Object.entries(this._cachedManifests)
      .filter((entry) => entry[1].isDirty())
      .map(([filePath, manifest]) => {
        const json = JSON.stringify(manifest, null, 2);
        return fse.writeFile(filePath, json + '\n');
      });

    await Promise.all([...saveFilePromises, ...saveManifestPromises]);
    this._cachedFiles = {};
    this._cachedManifests = {};
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exec: any = async (command: any, options: any) => {
    return execa.command(command, {
      cwd: this.config.rootDir,
      ...options,
    });
  };

  private async _getFile(filePath: string): Promise<VirtualFile> {
    const absoluteFilePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(path.join(this.config.rootDir, filePath));

    if (this._cachedFiles[absoluteFilePath]) {
      return this._cachedFiles[absoluteFilePath];
    }

    let file: VirtualFile;
    if (await fse.pathExists(absoluteFilePath)) {
      const content = await fse.readFile(absoluteFilePath, 'utf8');
      file = new VirtualFile(absoluteFilePath, content);
    } else {
      file = new VirtualFile(absoluteFilePath);
    }

    this._cachedFiles[absoluteFilePath] = file;
    return file;
  }
}
