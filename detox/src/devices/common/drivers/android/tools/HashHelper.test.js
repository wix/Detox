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
    const HASH_PATH = `/data/local/tmp/detox/${mockBundleId}.hash`;
    await uut.saveHashToRemote(mockDeviceId, mockBundleId, mockHash);
    expect(adb.createFileWithContent).toHaveBeenCalledTimes(1);
    expect(adb.createFileWithContent).toHaveBeenLastCalledWith(mockDeviceId, HASH_PATH, mockHash);
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
    it('should throw EISDIR error for unknown file', async () => {
       await expect(uut.generateHash(__dirname)).rejects.toThrow(/EISDIR/)
    });

    it('should generate hash for file', async () => {
      const path = require('path');
      const expected = 'd41d8cd98f00b204e9800998ecf8427e';
      const filePath = path.join(__dirname, `__mocks__/empty_hashtest.txt`);
      await expect(uut.generateHash(filePath)).resolves.toBe(expected);
    });

    it('should throw error for empty path', async () => {
      await expect(uut.generateHash(undefined)).rejects.toThrow(/Path must be provided for hash generation/);
    });
  });
});
