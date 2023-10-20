import type execa from 'execa';

/**
 * Project interface streamlines interactions with package manifests and filesystem operations,
 * improving efficiency and maintainability. By utilizing dependency injection, it allows for
 * simpler unit testing and optimizes package.json mutations with fewer I/O operations.
 */
export interface Project {
  /**
   * The root directory of the project.
   * Acts as a current working directory for all filesystem operations.
   */
  readonly rootDir: string;
  /**
   * Executes a command within the project context.
   *
   * @param command - The command to execute.
   * @returns A promise that resolves when the command execution is completed.
   */
  readonly exec: typeof execa.command;
  /**
   * Checks if a directory exists at the specified path.
   *
   * @param directoryPath - The path to the directory.
   * @returns A promise that resolves to a boolean indicating the directory's existence.
   */
  hasDirectory: (directoryPath: string) => Promise<boolean>;
  /**
   * Checks if a file exists at the specified path.
   *
   * @param filePath - The path to the file.
   * @returns A promise that resolves to a boolean indicating the file's existence.
   */
  hasFile: (filePath: string) => Promise<boolean>;
  /**
   * Reads the content of a file at the specified path.
   *
   * @param filePath - The path to the file.
   * @returns A promise that resolves to the file content as a string.
   */
  readFile: (filePath: string) => Promise<string>;
  /**
   * Writes content to a file at the specified path.
   *
   * @param filePath - The path to the file.
   * @param content - The content to write to the file.
   * @returns A promise that resolves when the write operation is completed.
   */
  writeFile: (filePath: string, content: string) => Promise<void>;
  /**
   * Deletes a file at the specified path.
   *
   * @param filePath - The path to the file.
   * @returns A promise that resolves when the delete operation is completed.
   */
  deleteFile: (filePath: string) => Promise<void>;
  /**
   * Retrieves the package manifest for the specified package.
   *
   * @param [packageName] - The name of the package.
   * If not specified, the package manifest at current working directory will be returned.
   * @returns A promise that resolves to the {@link PackageManifest} instance or null,
   * if the package manifest does not exist.
   */
  getManifest(packageName?: string): Promise<PackageManifest | null>;
  /**
   * Checks if a module is installed.
   *
   * @param packageName - The name of the package to check.
   * @returns A promise that resolves to a boolean indicating if the module is installed.
   */
  isModuleInstalled(packageName: string): Promise<boolean>;
}

export type ExecOptions = {
  stdio?: 'inherit' | 'pipe';
};

export type ExecResult = {
  stdout?: string;
  stderr?: string;
  code: number;
};

export interface PackageManifest {
  readonly name: string;
  readonly version: string;

  listDependencies: (categories?: DependencyCategory[]) => [string, string][];
  findDependency: (packageName: string, categories?: DependencyCategory[]) => DependencyCategory[];
  getDependencyVersion: (
    packageName: string,
    categories?: DependencyCategory[],
  ) => string | undefined;
  moveDependency: (
    packageName: string,
    from: DependencyCategory,
    to: DependencyCategory,
  ) => boolean;
  updateDependency: (
    packageName: string,
    range: string,
    categories?: DependencyCategory[],
  ) => boolean;
  setDependency: (packageName: string, range: string, categories: DependencyCategory[]) => void;
  deleteDependency: (packageName: string, categories?: DependencyCategory[]) => boolean;

  isDirty(): boolean;
  hasWorkspaces(): boolean;
  getPackageManager(): string;
  getRepositoryDirectory(): string | undefined;
  get(): Record<string, unknown>;
}

export type DependencyCategory =
  | 'dependencies'
  | 'devDependencies'
  | 'peerDependencies'
  | 'optionalDependencies';
