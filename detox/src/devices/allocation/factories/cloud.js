// @ts-nocheck
const DeviceAllocatorFactory = require('./base');
const CloudAndroidAllocDriver = require('../drivers/android/cloud/CloudAndroidAllocDriver');

class Noop extends DeviceAllocatorFactory {
    _createDriver() {
      // Error 1 thrown from here
      // previously this was a base class but now this is changed into typescript interface and cannot be initiated.
      // similar to what we created for artifacts, a dummy class we need to create a dummy class for cloud Allocation Driver parallel to android, ios drivers
      return new CloudAndroidAllocDriver();
    }
}
  
module.exports = {
  Noop
};