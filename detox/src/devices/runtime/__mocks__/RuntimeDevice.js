const Deferred = require('../../../utils/Deferred');
const RuntimeDevice = jest.genMockFromModule('../RuntimeDevice');

RuntimeDevice.setInfinitePrepare = () => {
  RuntimeDevice.mockImplementationOnce(() => {
    const device = new RuntimeDevice();
    device.deferred = new Deferred();
    device._prepare.mockReturnValue(device.deferred.promise);
    device._cleanup.mockImplementation(() => {
      device.deferred.reject('Fake error: aborted connection');
    });

    return device;
  });
};

module.exports = RuntimeDevice;
