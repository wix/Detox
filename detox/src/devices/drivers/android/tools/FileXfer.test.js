const adbName = 'mock-ADB-name';
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
    await uut.prepareDestinationDir(adbName);

    expect(adb.shell).toHaveBeenCalledWith(adbName, `rm -fr ${deviceDestinationDir}`);
    expect(adb.shell).toHaveBeenCalledWith(adbName, `mkdir -p ${deviceDestinationDir}`);
  });

  it('should send a file by path', async () => {
    const sourcePath = '/source/path/source-file.src';
    const destFilename = 'dest-file.dst';

    await uut.send(adbName, sourcePath, destFilename);

    expect(adb.push).toHaveBeenCalledWith(adbName, sourcePath, '/mock-tmp-dir/dest-file.dst');
  });

  it('should return final destination path', async () => {
    const sourcePath = '/source/path/source-file.src';
    const destFilename = 'dest-file.dst';

    const destPath = await uut.send(adbName, sourcePath, destFilename);

    expect(destPath).toEqual(`${deviceDestinationDir}/${destFilename}`);
  });
});
