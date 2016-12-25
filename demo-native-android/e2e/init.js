var detox = require('detox');
var config = require('../package.json').detox;

before(function (done) {
  this.timeout(40000);
  detox.config(config);
  detox.start(done);
});

afterEach(function (done) {
  detox.waitForTestResult(done);
});

after(function (done) {
  detox.cleanup(done);
});
