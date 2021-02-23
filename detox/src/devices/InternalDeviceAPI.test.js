describe('InternalDeviceAPI', () => {
  let deviceDriver;
  let getDeviceId;
  let api;

  beforeEach(async () => {
    getDeviceId = jest.fn();

    jest.mock('./drivers/DeviceDriverBase');
    const DeviceDriverMock = require('./drivers/DeviceDriverBase');
    deviceDriver = new DeviceDriverMock();

    const InternalDeviceAPI = require('./InternalDeviceAPI');
    api = new InternalDeviceAPI({
      deviceDriver,
      getDeviceId,
    });
  });

  it(`typeText() should pass to device driver`, async () => {
    getDeviceId.mockReturnValue('fakeId');
    await api.typeText('Text');

    expect(deviceDriver.typeText).toHaveBeenCalledWith('fakeId', 'Text');
  });
});
