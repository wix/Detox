describe('AppleSimUtils', () => {
  let AppleSimUtils;
  let appSimUtils;
  let exec;

  const simUdid = `9C9ABE4D-70C7-49DC-A396-3CB1D0E82846`;
  const bundleId = 'bundle.id';

  beforeEach(() => {
    jest.mock('npmlog');

    AppleSimUtils = require('./AppleSimUtils');
    appSimUtils = new AppleSimUtils();
  });


  it(`appleSimUtils setPermissions`, async () => {
      appSimUtils._execAppleSimUtilsCommand = jest.fn();
      appSimUtils.setPermissions(bundleId, simUdid, {permissions: {calendar: "YES"}})
      expect(appSimUtils._execAppleSimUtilsCommand).toHaveBeenCalledTimes(1);
    });
});

