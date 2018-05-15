const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');

function resolveByDeviceClass(mapping, createErrorMessage) {
  const supportedDeviceClasses = Object.keys(mapping).join(', ');

  return (detoxApi) => {
    const deviceClass = detoxApi.getDeviceClass();

    if (!mapping.hasOwnProperty(deviceClass)) {
      throw new DetoxRuntimeError({
        message: createErrorMessage(deviceClass),
        hint: `Only the following device classes are supported: ${supportedDeviceClasses.join(', ')}`,
      });
    }

    const resolver = mapping[deviceClass];
    return resolver(detoxApi);
  };
}
