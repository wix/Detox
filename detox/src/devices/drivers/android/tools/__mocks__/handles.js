const mockAvdName = 'mockAvdName';

const aDeviceHandle = (adbName, status = 'device') => ({
  adbName,
  status,
  type: 'device',
});

const anEmulatorHandle = (adbName, status) => ({
  ...aDeviceHandle(adbName, status),
  type: 'emulator',
  queryName: () => Promise.resolve(mockAvdName),
});

module.exports = {
  mockAvdName,
  emulator5556: anEmulatorHandle('emulator-5556'),
  localhost5555: aDeviceHandle('localhost:5555'),
  ip5557: aDeviceHandle('192.168.4.19:5557'),
  deviceOffline: aDeviceHandle('192.168.4.19:5559', 'offline'),
};
