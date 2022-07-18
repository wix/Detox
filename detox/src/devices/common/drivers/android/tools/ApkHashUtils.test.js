jest.mock('../../../../../utils/generateHash');
const generateHash = require('../../../../../utils/generateHash');

const { getHashFilename, isRevisionUpdated, saveHashToDevice } = require('./ApkHashUtils');
let adb;
let tempFileTransfer;

describe('apkHashUtils', () => {
  const mockDeviceId = '123';
  const mockHash = 'abcdef';
  const mockBundleId = 'com.android.test';
  const mockFilename = 'abcd.hash';

  beforeEach(() => {
    const ADBMock = jest.genMockFromModule('../exec/ADB');
    adb = new ADBMock();
    adb.readFile.mockImplementation(() => Promise.resolve(mockHash));
    const { TempFileTransfer } = jest.genMockFromModule('./TempFileTransfer');
    tempFileTransfer = new TempFileTransfer(adb);
    // @ts-ignore
    generateHash.mockImplementation(() => Promise.resolve(mockHash));
  });

  it('should return hash filename for given bundleId', () => {
    expect(getHashFilename('abcd')).toBe(mockFilename);
  });

  describe('isRevisionUpdated', () => {
    it('should return true for revision updated', async () => {
      const actual = await isRevisionUpdated(adb, mockDeviceId, mockBundleId, mockFilename);
      expect(actual).toBe(true);
    });

    it('should return false for different hash', async () => {
      // @ts-ignore
      generateHash.mockImplementation(() => Promise.resolve('something else'));
      const actual = await isRevisionUpdated(adb, mockDeviceId, mockBundleId, mockFilename);
      expect(actual).toBe(false);
    });
  });

  describe('saveHashToDevice', () => {
    it('should save hash remotely and delete local hash file', async () => {
      const hashFilename = `${mockBundleId}.hash`;
      const fs = require('fs');
      const writeFileSpy = jest.spyOn(fs, 'writeFileSync');
      const deleteFileSpy = jest.spyOn(fs, 'unlinkSync');

      const params = {
        tempFileTransfer,
        deviceId: mockDeviceId,
        hashFilename
      };

      await saveHashToDevice(params);
      await expect(generateHash).toHaveBeenCalledTimes(1);
      await expect(writeFileSpy).toHaveBeenCalledTimes(1);
      await expect(writeFileSpy).toHaveBeenCalledWith(hashFilename, mockHash);
      await expect(tempFileTransfer.send).toHaveBeenCalledTimes(1);
      await expect(tempFileTransfer.send).toHaveBeenCalledWith(mockDeviceId, hashFilename, hashFilename);
      await expect(deleteFileSpy).toHaveBeenCalledTimes(1);
    });
  });
});
