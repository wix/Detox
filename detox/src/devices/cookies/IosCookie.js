const DeviceCookie = require('./DeviceCookie');

class IosCookie extends DeviceCookie {
  get platform() {
    return 'ios';
  }
}

module.exports = IosCookie;
