const HashHelper = require('./HashHelper');
let uut;
let adb;
let hashxfer;

describe('HashHelper', () => {
  const mockDeviceId = '123';
  const mockHash = 'abcdef';
  const mockBundleId = 'com.android.test';

  beforeEach(() => {
    const ADBMock = jest.genMockFromModule('../exec/ADB');
    const HashXferMock = jest.genMockFromModule('./HashFileXfer');
    hashxfer = new HashXferMock();
    adb = new ADBMock();

    adb.createFileWithContent.mockImplementation( async () => jest.fn());

    uut = new HashHelper(adb, hashxfer);
  });

  it('should pass arguments to adb for recordHash', async () => {
    const HASH_PATH = '/data/local/tmp/detox';
    await uut.recordHash(mockDeviceId, mockBundleId, mockHash);
    expect(adb.createFileWithContent).toHaveBeenCalledTimes(1);
    expect(adb.createFileWithContent).toHaveBeenLastCalledWith(mockDeviceId, HASH_PATH, `${mockBundleId}.hash`, mockHash);
  });

  it('should return true for checkHash when remoteHash and localHash match', async () => {
    const HashXferMock = jest.genMockFromModule('./HashFileXfer');
    hashxfer = new HashXferMock();
    hashxfer.readHashFile.mockImplementation(() => mockHash);
    uut = new HashHelper(adb, hashxfer);

    const actual = await uut.checkHash(mockDeviceId, mockBundleId, mockHash);

    expect(hashxfer.readHashFile).toHaveBeenCalledTimes(1);
    expect(hashxfer.readHashFile).toHaveBeenLastCalledWith(mockDeviceId, mockBundleId);
    expect(actual).toBe(true);
  });

  it('should return false for checkHash when remoteHash and localHash dont match', async () => {
    const HashXferMock = jest.genMockFromModule('./HashFileXfer');
    hashxfer = new HashXferMock();
    hashxfer.readHashFile.mockImplementation(() => 'efghij');
    uut = new HashHelper(adb, hashxfer);

    const actual = await uut.checkHash(mockDeviceId, mockBundleId, mockHash);

    expect(hashxfer.readHashFile).toHaveBeenCalledTimes(1);
    expect(hashxfer.readHashFile).toHaveBeenLastCalledWith(mockDeviceId, mockBundleId);
    expect(actual).toBe(false);
  });

  describe('generate hash', () => {
    it('should call md5 function when no hash provided', () => {
      const actual = uut.generateHash('test');
      const expected = '098f6bcd4621d373cade4e832627b4f6';
      expect(actual).toEqual(expected);
    });

    it('should call md5 function when random hash provided', () => {
      const actual = uut.generateHash('test', 'unsupportedHash');
      const expected = '098f6bcd4621d373cade4e832627b4f6';
      expect(actual).toEqual(expected);
    });

    it('should call md5 function when md5 hash given', () => {
      const actual = uut.generateHash('test', 'md5');
      const expected = '098f6bcd4621d373cade4e832627b4f6';
      expect(actual).toEqual(expected);
    });
  });
});
