const resolveModuleFromPath = require('./utils/resolveModuleFromPath');

function resolve(device, opts) {
  let MatcherClass;
  let WebViewMatcherClass;
  switch (device.getPlatform()) {
    case 'android':
      MatcherClass = require('./android/expect');
      WebViewMatcherClass = require('./android/webExpect');
      break;

    case 'ios':
      MatcherClass = require('./ios/expectTwo');
      break;

    default:
      MatcherClass = resolveModuleFromPath(device.type).ExpectClass;
      break;
  }

  return {
    matchers: new MatcherClass(opts),
    webMatchers: WebViewMatcherClass && new WebViewMatcherClass(opts),
  };
}

module.exports = {
  resolve,
};
