import path from 'node:path';
import { resolveFrom, resolveManifestFrom } from './resolveFrom';

describe('resolveFrom', () => {
  it('should resolve a module from a directory', () => {
    const fileName = path.basename(__filename);
    const resolved = resolveFrom(__dirname, `./${fileName}`);
    expect(resolved).toBe(__filename);
  });
});

describe('resolveManifestFrom', () => {
  it("should resolve current module's package.json from a directory", () => {
    const resolved = resolveManifestFrom(process.cwd(), '.');
    expect(resolved).toMatch(/.*package\.json$/);
  });

  it("should resolve third party module's package.json from a directory", () => {
    const resolved = resolveManifestFrom(__dirname, 'jest');
    expect(resolved).toMatch(/node_modules[/\\]jest[/\\]package\.json$/);
  });
});
