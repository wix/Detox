const DeviceCookie = require('detox/src/devices/cookies/DeviceCookie');

class StubCookie extends DeviceCookie {
  constructor(stubId) {
    super();
    this.id = stubId;
  }

  get platform() {
    return 'stub';
  }

  toString() {
    return this.id;
  }
}

module.exports = StubCookie;
