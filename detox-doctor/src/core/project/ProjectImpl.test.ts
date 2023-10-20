import path from 'path';
import fse from 'fs-extra';
import { cloneFixtureDir } from '../../__utils__';
import { ProjectImpl } from './ProjectImpl';

describe('ProjectImpl', () => {
  let project: ProjectImpl;

  describe('non-destructive operations', () => {
    beforeAll(() => {
      project = new ProjectImpl({ rootDir: __dirname });
    });

    it('should locate existing files', async () => {
      await expect(project.hasFile(__filename)).resolves.toBe(true);
    });

    it('should not locate inexistent files', async () => {
      await expect(project.hasFile('supercalifragilisticexpialidocious')).resolves.toBe(false);
    });

    it('should locate existing directories', async () => {
      await expect(project.hasDirectory(__dirname)).resolves.toBe(true);
      await expect(project.hasDirectory('.')).resolves.toBe(true);
    });

    it('should not locate existing files as directories', async () => {
      await expect(project.hasDirectory(__filename)).resolves.toBe(false);
    });

    it('should not locate inexistent directories', async () => {
      await expect(project.hasDirectory('supercalifragilisticexpialidocious')).resolves.toBe(false);
    });

    it('should locate future (cached) directories', async () => {
      await project.writeFile(path.join('some-dir', 'some-file'), '');
      await expect(project.hasDirectory('some-dir')).resolves.toBe(true);
      await expect(fse.pathExists(path.join(project.rootDir, 'some-dir'))).resolves.toBe(false);
    });

    it('should read files', async () => {
      await expect(project.readFile(__filename)).resolves.toMatch(/import.*ProjectImpl.*from/);
    });

    it('should throw when reading inexistent files', async () => {
      await expect(project.readFile('supercalifragilisticexpialidocious')).rejects.toThrow(
        /File .* does not exist/,
      );
    });

    it('should exec commands', async () => {
      const result = await project.exec('node -p 2+2');
      expect(result.stdout).toMatch(/4/); // Terminal colors are not stripped
    });
  });

  describe('project manifest operations', () => {
    beforeAll(async () => {
      project = await initProject('npm-project');
    });

    it('should read project manifest', async () => {
      await expect(project.getManifest()).resolves.toMatchObject({
        name: 'project-fixture-npm-project',
        version: '1.0.0',
      });
    });

    it('should cache project manifest', async () => {
      const manifest1 = await project.getManifest();
      const manifest2 = await project.getManifest();

      expect(manifest1).toBe(manifest2);
    });

    it('should not write project manifest until commited', async () => {
      const manifest = await project.getManifest();
      manifest!.setDependency('new-dependency', '1.0.0', ['dependencies']);
      expect(await fse.readFile(path.join(project.rootDir, 'package.json'), 'utf8')).not.toMatch(
        /new-dependency/m,
      );
      await project.commitChanges();
      expect(await fse.readFile(path.join(project.rootDir, 'package.json'), 'utf8')).toMatch(
        /new-dependency/m,
      );
    });

    it('should add file', async () => {
      await project.writeFile('test.txt', 'Test Content');
      await expect(project.readFile('test.txt')).resolves.toBe('Test Content');
    });

    it('should delete file', async () => {
      await project.writeFile('test.txt', 'Test Content');
      await project.deleteFile('test.txt');
      await expect(project.hasFile('test.txt')).resolves.toBe(false);
    });

    it('should keep changes in memory until commited the changes', async () => {
      await project.writeFile('test.txt', 'Test Content');
      expect(await fse.pathExists(path.join(project.rootDir, 'test.txt'))).toBe(false);
      await project.commitChanges();
      expect(await fse.pathExists(path.join(project.rootDir, 'test.txt'))).toBe(true);
    });

    it('should check if modules are installed', async () => {
      await expect(project.isModuleInstalled('some-imaginary-module')).resolves.toBe(false);
    });
  });

  async function initProject(fixtureName: string) {
    const fixtureDirectory = path.join(__dirname, '__fixtures__', fixtureName);
    const clonedFixtureDirectory = await cloneFixtureDir(fixtureDirectory);
    return new ProjectImpl({ rootDir: clonedFixtureDirectory });
  }
});
