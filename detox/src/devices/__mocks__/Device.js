const Deferred = require('../../utils/Deferred');
const Device = jest.requireActual('../Device');
const FakeDevice = jest.genMockFromModule('../Device');

FakeDevice.useRealConstructor = () => {
  FakeDevice.mockImplementationOnce((...args) => {
    const device = new FakeDevice();
    Object.assign(device, new Device(...args));
    return device;
  });
};

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
