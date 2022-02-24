let uut;
let adb;
let hashxfer;

describe('HashHelper', () => {
  const mockDeviceId = '123';
  const mockHash = 'abcdef';
  const mockBundleId = 'com.android.test';
  const HashHelper = require('./HashHelper');

  beforeEach(() => {
    const ADBMock = jest.genMockFromModule('../exec/ADB');
    const HashXferMock = jest.genMockFromModule('./HashFileXfer');
    hashxfer = new HashXferMock();
    hashxfer.readHashFile.mockImplementation(() => mockHash);
    adb = new ADBMock();

    adb.createFileWithContent.mockImplementation( async () => jest.fn());

    uut = new HashHelper(adb, hashxfer);
  });

  it('should pass arguments to adb', async () => {
    const HASH_PATH = '/data/local/tmp/detox';
    await uut.saveHashToRemote(mockDeviceId, mockBundleId, mockHash);
    expect(adb.createFileWithContent).toHaveBeenCalledTimes(1);
    expect(adb.createFileWithContent).toHaveBeenLastCalledWith(mockDeviceId, HASH_PATH, `${mockBundleId}.hash`, mockHash);
  });

  it('should return true when remoteHash and localHash match', async () => {
    const actual = await uut.compareRemoteToLocal(mockDeviceId, mockBundleId, mockHash);

    expect(hashxfer.readHashFile).toHaveBeenCalledTimes(1);
    expect(hashxfer.readHashFile).toHaveBeenLastCalledWith(mockDeviceId, mockBundleId);
    expect(actual).toBe(true);
  });

  it('should return false when remoteHash and localHash dont match', async () => {
    hashxfer.readHashFile.mockImplementation(() => 'efghij');

    const actual = await uut.compareRemoteToLocal(mockDeviceId, mockBundleId, mockHash);

    expect(hashxfer.readHashFile).toHaveBeenCalledTimes(1);
    expect(hashxfer.readHashFile).toHaveBeenLastCalledWith(mockDeviceId, mockBundleId);
    expect(actual).toBe(false);
  });

  describe('generate hash', () => {
    it('should use md5 by default when no hash provided', () => {
      const actual = uut.generateHash('test');
      const expected = '098f6bcd4621d373cade4e832627b4f6';

      expect(actual).toEqual(expected);
    });

    it('should use md5 function for md5 hash', () => {
      const actual = uut.generateHash('test', 'md5');
      const expected = '098f6bcd4621d373cade4e832627b4f6';

      expect(actual).toEqual(expected);
    });

    it('should throw error for unsupported hashTypes', () => {
      expect(() => uut.generateHash('test', 'unsupportedHash')).toThrowError(/Hashtype is unsupported/);
    });

    it('should throw error for empty path', () => {
      expect(() => uut.generateHash(undefined)).toThrowError(/Path must be provided for hash generation/);
    });
  });
});
