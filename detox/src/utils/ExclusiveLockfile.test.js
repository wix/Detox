jest.mock('proper-lockfile');

const plock = require('proper-lockfile');
const fs = require('fs-extra');
const tempfile = require('tempfile');
const ExclusiveLockFile = require('./ExclusiveLockfile');

describe('ExclusiveLockFile', () => {
  let filePath;

  beforeEach(() => {
    filePath = tempfile('.test');
  });

  afterEach(async () => {
    await fs.remove(filePath);
  });

  it('should execute an arbitrary function inside an exclusive lock', async () => {
    const lockfile = new ExclusiveLockFile(filePath, {
      getInitialState: () => 42,
    });

    expect(plock.lockSync).not.toHaveBeenCalled();
    const result = await lockfile.exclusively(async () => {
      expect(plock.lockSync).toHaveBeenCalled();

      expect(lockfile.read()).toBe(42);
      lockfile.write(84);
      expect(lockfile.read()).toBe(84);

      expect(plock.unlockSync).not.toHaveBeenCalled();
      return "result";
    });

    expect(plock.unlockSync).toHaveBeenCalled();
    expect(result).toBe('result');
  });

  it('should unlock after an exception inside the function', async () => {
    const lockfile = new ExclusiveLockFile(filePath);

    await expect(lockfile.exclusively(async () => {
      throw new Error('synthetic error');
    })).rejects.toThrow(/synthetic error/);

    expect(plock.unlockSync).toHaveBeenCalled();
  });

  it('should forbid reading and writting outside of exclusive access', async () => {
    const lockfile = new ExclusiveLockFile(filePath);

    expect(() => lockfile.read()).toThrowError(/Forbidden.*to read/);
    expect(() => lockfile.write(0)).toThrowError(/Forbidden.*to write/);
  });

  it('should create a lockfile if it does not exist', async () => {
    const lockfile = new ExclusiveLockFile(filePath, {
      getInitialState: () => 1000,
    });

    expect(fs.existsSync(filePath)).toBe(false);
    await lockfile.exclusively(() => {});
    expect(fs.readFileSync(filePath, 'utf8')).toBe('1000');
  });

  it('should not overwrite a lockfile if it exists', async () => {
    const lockfile = new ExclusiveLockFile(filePath);

    await lockfile.exclusively(() => lockfile.write('DETOX'));
    await lockfile.exclusively(() => {});

    expect(fs.readFileSync(filePath, 'utf8')).toBe('"DETOX"');
  });

  it('should support nested locking by free-running the nested callbacks', async () => {
    const lockfile = new ExclusiveLockFile(filePath, {
      getInitialState: () => 42,
    });

    expect(plock.lockSync).not.toHaveBeenCalled();
    const result = await lockfile.exclusively(async () => {
      return await lockfile.exclusively(async () => {
        expect(plock.lockSync).toHaveBeenCalledTimes(1);

        expect(lockfile.read()).toBe(42);
        lockfile.write(84);
        expect(lockfile.read()).toBe(84);

        expect(plock.unlockSync).not.toHaveBeenCalled();
        return 'result';
      });
    });

    expect(plock.unlockSync).toHaveBeenCalledTimes(1);
    expect(result).toBe('result');
  });

  describe('constructor', () => {
    it('should have 1 required arg', () => {
      expect(() => new ExclusiveLockFile()).toThrowError(/non-empty string/);
    });

    it('should have default options', () => {
      const lockfile = new ExclusiveLockFile(filePath);

      expect(lockfile.options).toEqual({
        retry: expect.objectContaining({}),
        read: { encoding: 'utf8' },
        getInitialState: expect.any(Function),
      });
    });

    it('should have allow customizing options', () => {
      const getInitialState = () => {};
      const lockfile = new ExclusiveLockFile(filePath, {
        getInitialState,
      });

      expect(lockfile.options).toEqual({
        retry: expect.objectContaining({}),
        read: { encoding: 'utf8' },
        getInitialState,
      });
    });
  });
});
