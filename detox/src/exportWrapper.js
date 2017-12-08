const platform = require('./platform');
const iosExports = require('./ios/expect');
const androidExports = require('./android/expect');

const exportMap = {
  expect: {
    ios: iosExports.expect,
    android: androidExports.expect,
  },
  element: {
    ios: iosExports.element,
    android: androidExports.element,
  },
  waitFor: {
    ios: iosExports.waitFor,
    android: androidExports.waitFor,
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
