var detox = require('detox');
detox.ios.expect.exportGlobals();
global.simulator = detox.ios.simulator;
var config = require('../package.json').detox;

before(function (done) {
  detox.config(config.session);
  detox.connect(done);
});

// remark this section when debugging directly in Xcode
before(function (done) {
  this.timeout(40000);
  simulator.prepare(config, done);
});

afterEach(function (done) {
  detox.waitForTestResult(done);
});

after(function (done) {
  detox.cleanup(done);
});
