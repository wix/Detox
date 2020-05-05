const Deferred = require('../../utils/Deferred');
const FakeDevice = jest.genMockFromModule('../Device');

FakeDevice.setInfiniteMethod = (methodName) => {
  FakeDevice.mockImplementationOnce(() => {
    const device = new FakeDevice();
    device.deferred = new Deferred();
    device[methodName].mockReturnValue(device.deferred.promise);
    device._cleanup.mockImplementation(() => {
      device.deferred.reject(`Fake error: aborted device.${methodName}()`);
    });

    return device;
  });
};

module.exports = FakeDevice;
