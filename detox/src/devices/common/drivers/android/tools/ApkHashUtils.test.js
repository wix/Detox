jest.mock('../../../../../utils/generateHash');
const generateHash = require('../../../../../utils/generateHash');

const { isHashUpdated, saveHashToDevice } = require('./ApkHashUtils');

const mockDeviceId = '123';
const mockHash = 'abcdef';
const mockBundleId = 'com.android.test';
const mockBinaryPath = 'mock-bin-path';

let tempFileTransfer;

const ADBMock = jest.genMockFromModule('../exec/ADB');
const adb = new ADBMock();

describe('apkHashUtils', () => {
  beforeEach(() => {
    adb.readFile.mockImplementation(() => Promise.resolve(mockHash));

    const { TempFileTransfer } = jest.genMockFromModule('./TempFileTransfer');
    tempFileTransfer = new TempFileTransfer(adb);
    // @ts-ignore
    generateHash.mockImplementation(() => Promise.resolve(mockHash));
  });

  describe('isHashUpdated', () => {
    const params = {
      adb,
      deviceId: mockDeviceId,
      bundleId: mockBundleId,
      binaryPath: mockBinaryPath
    };

    it('should return true for revision updated', async () => {
      const actual = await isHashUpdated(params);
      expect(actual).toBe(true);
    });

    it('should return false for different hash', async () => {
      // @ts-ignore
      generateHash.mockImplementation(() => Promise.resolve('something else'));
      const actual = await isHashUpdated(params);
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
        bundleId: mockBundleId,
        binaryPath: mockBinaryPath
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
