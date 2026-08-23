/**
 * Project-relative module resolution (spec 010's runner contract): the
 * published tarball bundles neither jest nor any of its packages — jest is
 * the project's own dependency, and `jest-environment-node` /
 * `@jest/reporters` must be the very copies the project's jest run uses
 * (v20's `resolve-from` pattern, `testEnvironment/index.js:5`). The anchor is
 * `process.cwd()`: the `detox test` spawn contract fixes the runner's cwd to
 * the project, and jest workers inherit it.
 */
import { createRequire } from 'node:module';
import path from 'node:path';

export function requireFromProject<T>(specifier: string, hint: string): T {
  // createRequire wants a file anchor; the name never exists and never needs to.
  const projectRequire = createRequire(path.join(process.cwd(), '__detox-resolve__.js'));
  try {
    return projectRequire(specifier) as T;
  } catch {
    // Second leg: resolve from where the detox package itself is installed
    // (this module lives in the project's node_modules/detox/dist/…, so the
    // walk-up lands in the project's own tree). Covers a monorepo whose
    // `detox test` runs above the app directory that holds jest — cwd is the
    // spawn contract's anchor, but it is a process property, not a package
    // graph.
    try {
      const moduleRequire = createRequire(__filename);
      return moduleRequire(specifier) as T;
    } catch (cause) {
      throw new Error(
        `detox could not resolve "${specifier}" from ${process.cwd()} or from its own install — ${hint}`,
        { cause },
      );
    }
  }
}
