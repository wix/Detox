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

module.exports = new Proxy(exportMap, {
  get(map, name) {
    return (name === 'device')
      ? platform.get('device')
      : map[name][platform.get('name')];
  }
});
