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
    appSimUtils.setPermissions(bundleId, simUdid, {permissions: {calendar: "YES"}});
    expect(exec.execWithRetriesAndLogs).toHaveBeenCalledTimes(1);
  });
});

