/* abstract */ class DeviceIdentifier {
  get id() {
    throw new Error('No implementation: property should be overridden by inheriting classes.');
  }

  toString() {
    throw new Error('No implementation: toString() should be overridden by inheriting classes.');
  }
}

module.exports = DeviceIdentifier;
