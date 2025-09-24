// @ts-nocheck
const deviceId = 'mock-device-id';
const deviceDestinationDir = '/mock-tmp-dir';

describe('File-transfer util', () => {
  let adb;
  let uut;

  beforeEach(() => {
    const ADBMock = jest.createMockFromModule('../exec/ADB');
    adb = new ADBMock();

    const FileTransfer = require('./FileTransfer');
    uut = new FileTransfer(adb, deviceDestinationDir);
  });

  it('should create the destination directory on the device', async () => {
    await uut.prepareDestinationDir();

    expect(adb.shell).toHaveBeenCalledWith(`rm -fr ${deviceDestinationDir}`);
    expect(adb.shell).toHaveBeenCalledWith(`mkdir -p ${deviceDestinationDir}`);
  });

  it('should send a file by path', async () => {
    const sourcePath = '/source/path/source-file.src';
    const destFilename = 'dest-file.dst';

    await uut.send(sourcePath, destFilename);

    expect(adb.push).toHaveBeenCalledWith(sourcePath, '/mock-tmp-dir/dest-file.dst');
  });

  it('should return final destination path', async () => {
    const sourcePath = '/source/path/source-file.src';
    const destFilename = 'dest-file.dst';

    const destPath = await uut.send(sourcePath, destFilename);

    expect(destPath).toEqual(`${deviceDestinationDir}/${destFilename}`);
  });
});
