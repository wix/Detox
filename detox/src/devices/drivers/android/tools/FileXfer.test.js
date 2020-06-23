const deviceId = 'mock-device-id';
const deviceDestinationDir = '/mock-tmp-dir';

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
});
