const platform = require('./platform');
const IosExpect = require('./ios/expect');
const AndroidExpect = require('./android/expect');

const iosExports = new IosExpect();
const androidExports = new AndroidExpect();

const exportMap = {
  expect: {
    ios: iosExports.expect.bind(iosExports),
    android: androidExports.expect.bind(androidExports),
  },
  element: {
    ios: iosExports.element.bind(iosExports),
    android: androidExports.element.bind(androidExports),
  },
  waitFor: {
    ios: iosExports.waitFor.bind(iosExports),
    android: androidExports.waitFor.bind(androidExports),
  },
  by: {
    ios: iosExports.by,
    android: androidExports.by,
  }
};

function applyToPlatformSpecific(name, args) {
  return exportMap[name][platform.get('name')].apply(null, args);
}

module.exports = {
  element() {
    return applyToPlatformSpecific('element', arguments);
  },

  expect() {
    return applyToPlatformSpecific('expect', arguments);
  },

  waitFor() {
    return applyToPlatformSpecific('waitFor', arguments);
  },

  by: new Proxy({}, {
    get(target, name) {
      return exportMap.by[platform.get('name')][name];
    }
  }),

  device: new Proxy({}, {
    get(target, name) {
      return platform.get('device')[name];
    }
  }),
};
