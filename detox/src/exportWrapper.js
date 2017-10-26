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

const exports = new Proxy(exportMap, {
  get(map, funcName) {
    return (...args) => map[funcName][platform.get('name')](...args);
  }
});

module.exports = {
  ...exports,
  get device() {
    return platform.get('device');
  }
};
