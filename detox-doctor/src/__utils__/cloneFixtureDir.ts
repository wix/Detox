import path from 'path';
import fse from 'fs-extra';
import tempfile from 'tempfile';

declare const __TEMPORARY_FILES__: string[] | undefined;

export async function cloneFixtureDir(fixtureDirectory?: string): Promise<string> {
  const temporaryDirectory = tempfile('');
  await fse.ensureDir(path.dirname(temporaryDirectory));
  if (fixtureDirectory) {
    await fse.copy(fixtureDirectory, temporaryDirectory);
  }

  if (__TEMPORARY_FILES__ !== undefined) {
    __TEMPORARY_FILES__.push(temporaryDirectory);
  }

  return temporaryDirectory;
}
