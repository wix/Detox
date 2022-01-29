const deviceId = 'mock-device-id';
const deviceDestinationDir = '/mock-tmp-dir';

const mockMd5 = jest.fn();
jest.mock('./CryptoUtils', () => ({
  getMd5: () => mockMd5(),
}))

describe('File-transfer util', () => {
  let adb;
  let uut;

  beforeEach(() => {
    const ADBMock = jest.genMockFromModule('../exec/ADB');
    adb = new ADBMock();

    const FileXfer = require('./FileXfer');
    uut = new FileXfer(adb, deviceDestinationDir);
  });

  it('should create the destination directory on the device', async () => {
    await uut.prepareDestinationDir(deviceId);

    expect(adb.shell).toHaveBeenCalledWith(deviceId, `rm -fr ${deviceDestinationDir}`);
    expect(adb.shell).toHaveBeenCalledWith(deviceId, `mkdir -p ${deviceDestinationDir}`);
  });

  it('should send a file by path', async () => {
    const sourcePath = '/source/path/source-file.src';
    const destFilename = 'dest-file.dst';

    await uut.send(deviceId, sourcePath, destFilename);

    expect(adb.push).toHaveBeenCalledWith(deviceId, sourcePath, '/mock-tmp-dir/dest-file.dst');
  });

  it('should return final destination path', async () => {
    const sourcePath = '/source/path/source-file.src';
    const destFilename = 'dest-file.dst';

    const destPath = await uut.send(deviceId, sourcePath, destFilename);

    expect(destPath).toEqual(`${deviceDestinationDir}/${destFilename}`);
  });

  it('should check that file exists', async () => {
    await uut.checkFileExists(deviceId, 'someFilename');
    expect(adb.checkFileExists).toHaveBeenCalledTimes(1);
    expect(adb.checkFileExists).toHaveBeenCalledWith(deviceId, deviceDestinationDir, 'someFilename');
  });

  it('should delete by extension', async () => {
    await uut.deleteByExtension(deviceId, 'hash');
    expect(adb.deleteByExtension).toHaveBeenCalledTimes(1);
    expect(adb.deleteByExtension).toHaveBeenCalledWith(deviceId, deviceDestinationDir, 'hash');
  });

  it('should create empty file', async () => {
    await uut.createEmptyFile(deviceId, 'someFilename');
    expect(adb.createEmptyFile).toHaveBeenCalledTimes(1);
    expect(adb.createEmptyFile).toHaveBeenCalledWith(deviceId, deviceDestinationDir, 'someFilename');
  });

  it('should get file hash', async () => {
    await uut.getFileHash('/tmp');
    expect(mockMd5).toHaveBeenCalledTimes(1);
  });
});
