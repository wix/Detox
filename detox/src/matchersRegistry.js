const resolveModuleFromPath = require('./utils/resolveModuleFromPath');

function resolve(device, opts) {
  let MatcherClass;
  let WebViewMatcherClass;
  switch (device.getPlatform()) {
    case 'android':
      MatcherClass = require('./android/expect');
      WebViewMatcherClass = require('./android/webExpect');
      break;
    case 'ios': MatcherClass = require('./ios/expectTwo'); break;
    default:
      MatcherClass = resolveModuleFromPath(device.type).ExpectClass;
      break;
  }

  if (WebViewMatcherClass !== undefined) {
    return {
      matchers: new MatcherClass(opts),
      webMatchers: new WebViewMatcherClass(opts)
    }
  }
  return {
    matchers: new MatcherClass(opts)
  };
}

module.exports = {
  resolve,
};
