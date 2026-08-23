/**
 * A minimal on-disk `.app` bundle DIRECTORY for client-side upload tests.
 * Nothing here is installable — `archiveAppBundle` only needs a real
 * directory whose name ends in `.app`, because that is the whole client-side
 * validation contract (spec 007: what `simctl install` takes); the zip it
 * produces is judged server-side.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

export interface AppBundleFixture {
  /** Path of the `.app` directory. */
  readonly appPath: string;
  dispose(): Promise<void>;
}

export async function makeAppBundleFixture(
  name = 'Fixture',
  content = 'binary-bytes',
): Promise<AppBundleFixture> {
  const dir = await mkdtemp(path.join(tmpdir(), 'detox-app-fixture-'));
  const appPath = path.join(dir, `${name}.app`);
  await mkdir(appPath);
  await writeFile(path.join(appPath, 'Info.plist'), '<plist/>');
  await writeFile(path.join(appPath, name), content);
  return {
    appPath,
    dispose: () => rm(dir, { recursive: true, force: true }),
  };
}
