describe('AppleSimUtils', () => {
  let AppleSimUtils;
  let appSimUtils;
  let exec;

  const simUdid = `9C9ABE4D-70C7-49DC-A396-3CB1D0E82846`;
  const bundleId = 'bundle.id';

  beforeEach(() => {
    jest.mock('npmlog');
    jest.mock('../utils/exec');
    exec = require('../utils/exec');

    AppleSimUtils = require('./AppleSimUtils');
    appSimUtils = new AppleSimUtils();
  });

  it(`appleSimUtils setPermissions`, async () => {
    appSimUtils.setPermissions(bundleId, simUdid, { permissions: { calendar: "YES" } });
    expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
  });

  it('list devices', async () => {
    expect(exec.execWithRetriesAndLogs).not.toHaveBeenCalled();
    appSimUtils.list('iPhone 6');
    expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
    expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith('applesimutils', {
      args: `--list "iPhone 6" --maxResults=1`
    }, expect.anything(), 1, undefined);
  });

  it('list devices with os version adapted to new api', async () => {
    expect(exec.execWithRetriesAndLogs).not.toHaveBeenCalled();
    appSimUtils.list('iPhone 6 , iOS 10.3');
    expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
    expect(exec.execWithRetriesAndLogs).toHaveBeenCalledWith('applesimutils', {
      args: `--list "iPhone 6, OS=iOS 10.3" --maxResults=1`
    }, expect.anything(), 1, undefined);
  });
});

