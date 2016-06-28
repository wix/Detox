var detox = require('detox');
detox.ios.expect.exportGlobals();

before(function (done) {
  detox.config({
    server: 'ws://localhost:8099',
    sessionId: 'example'
  });
  detox.connect(done);
});

afterEach(function (done) {
  detox.waitForTestResult(done);
});
