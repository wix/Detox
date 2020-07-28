const resolveModuleFromPath = require('./utils/resolveModuleFromPath');

function resolve(device, opts) {
  let MatcherClass;
  switch (device.getPlatform()) {
    case 'android': MatcherClass = require('./android/expect'); break;
    case 'ios': MatcherClass = require('./ios/expectTwo'); break;
    default: MatcherClass = resolveModuleFromPath(device.type).ExpectClass; break;
  }
  return new MatcherClass(opts);
}

module.exports = {
  resolve,
};
