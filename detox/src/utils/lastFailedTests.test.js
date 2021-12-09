// @ts-nocheck
jest.mock('./environment');

const fs = require('fs-extra');
const tempfile = require('tempfile');

describe('lastFailedTests', () => {
  let lastFailedTestsPath;

  beforeEach(() => {
    lastFailedTestsPath = tempfile('.txt');
    require('./environment').getLastFailedTestsPath.mockReturnValue(lastFailedTestsPath);
  });

  afterEach(async () => {
    await fs.remove(lastFailedTestsPath);
  });

  describe('loadLastFailedTests', () => {
    let loadLastFailedTests;

    beforeEach(() => {
      loadLastFailedTests = require('./lastFailedTests').loadLastFailedTests;
    });

    it('should return an empty array if the file does not exist', async () => {
      expect(await loadLastFailedTests()).toEqual([]);
    });

    it('should return an empty array if the file is empty', async () => {
      await fs.writeFile(lastFailedTestsPath, '');
      expect(await loadLastFailedTests()).toEqual([]);
    });

    it('should split file contents by newline and return as a string array', async () => {
      await fs.writeFile(lastFailedTestsPath, '1\n2\n3');
      expect(await loadLastFailedTests()).toEqual(['1', '2', '3']);
    });
  });

  describe('saveLastFailedTests', () => {
    let saveLastFailedTests;

    beforeEach(() => {
      saveLastFailedTests = require('./lastFailedTests').saveLastFailedTests;
    });

    it('should save empty string to the file when given an empty array', async () => {
      await saveLastFailedTests([]);
      expect(await fs.readFile(lastFailedTestsPath, 'utf8')).toBe('');
    });

    it('should save a given array of strings to the file, separating them by newline', async () => {
      await saveLastFailedTests(['1', '2', '3']);
      expect(await fs.readFile(lastFailedTestsPath, 'utf8')).toBe('1\n2\n3');
    });
  });

  describe('resetLastFailedTests', () => {
    let resetLastFailedTests;

    beforeEach(() => {
      resetLastFailedTests = require('./lastFailedTests').resetLastFailedTests;
    });

    it('should delete the file', async () => {
      await resetLastFailedTests();
      expect(await fs.exists(lastFailedTestsPath)).toBe(false);
    });

    it('should not fail if the file does not exist', async () => {
      await resetLastFailedTests();
      await expect(resetLastFailedTests()).resolves.not.toThrow();
    });
  });
});
