jest.mock('../../../../../utils/generateHash');
const generateHash = require('../../../../../utils/generateHash');

const ApkHashUtils = require('./ApkHashUtils');

const mockDeviceId = '123';
const mockHash = 'abcdef';
const mockBundleId = 'com.android.test';
const mockBinaryPath = 'mock-bin-path';

let uut;
let adb;

let fileTransfer;

describe('apkHashUtils', () => {
  beforeEach(() => {
    const ADBMock = jest.genMockFromModule('../exec/ADB');
    adb = new ADBMock();

    const { TempFileTransfer } = jest.genMockFromModule('./TempFileTransfer');
    fileTransfer = new TempFileTransfer(adb);

    adb.readFile.mockImplementation(() => Promise.resolve(mockHash));
    // @ts-ignore
    generateHash.mockImplementation(() => Promise.resolve(mockHash));

    uut = new ApkHashUtils({ adb });
  });

  describe('isHashUpToDate', () => {
    const params = {
      adb,
      deviceId: mockDeviceId,
      bundleId: mockBundleId,
      binaryPath: mockBinaryPath,
    };

    it('should return true for revision updated', async () => {
      const actual = await uut.isHashUpToDate(params);
      expect(actual).toBe(true);
    });

    it('should return false for different hash', async () => {
      // @ts-ignore
      generateHash.mockImplementation(() => Promise.resolve('something else'));
      const actual = await uut.isHashUpToDate(params);
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
        fileTransfer,
        deviceId: mockDeviceId,
        bundleId: mockBundleId,
        binaryPath: mockBinaryPath,
      };

      await uut.saveHashToDevice(params);
      await expect(generateHash).toHaveBeenCalledTimes(1);
      await expect(writeFileSpy).toHaveBeenCalledTimes(1);
      await expect(writeFileSpy).toHaveBeenCalledWith(hashFilename, mockHash);
      await expect(fileTransfer.send).toHaveBeenCalledTimes(1);
      await expect(fileTransfer.send).toHaveBeenCalledWith(mockDeviceId, hashFilename, hashFilename);
      await expect(deleteFileSpy).toHaveBeenCalledTimes(1);
    });
  });
});
