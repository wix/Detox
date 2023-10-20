import path from 'path';
import { isFSError } from './isFSError';

declare const __REQUIRE__: typeof require | undefined;

export function resolveFrom(fromDir: string, module: string): string {
  // Bypassing jest require subsystem
  const requireFn = typeof __REQUIRE__ === 'function' ? __REQUIRE__ : require;
  return requireFn.resolve(module, { paths: [fromDir] });
}

export function resolveFromSilent(fromDir: string, module: string): string | undefined {
  try {
    return resolveFrom(fromDir, module);
  } catch (error) {
    if (isFSError(error)) {
      switch (error.code) {
        case 'MODULE_NOT_FOUND':
        case 'ERR_PACKAGE_PATH_NOT_EXPORTED': {
          return undefined;
        }
      }
    }

    throw error;
  }
}

export function resolveManifestFrom(fromDir: string, module: string): string | undefined {
  const attempt1 = resolveFromSilent(fromDir, module + '/package.json');
  if (attempt1) {
    return attempt1;
  }

  const mainPath = resolveFromSilent(fromDir, module);
  if (!mainPath) {
    return;
  }

  const nodeModulesIndex = mainPath.lastIndexOf('node_modules');
  if (nodeModulesIndex === -1) {
    return;
  }

  return path.join(mainPath.slice(0, nodeModulesIndex), 'node_modules', module, 'package.json');
}
