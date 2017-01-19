const detox = require('../../src/index');
const config = require('../package.json').detox;

before((done) => {
  detox.config(config);
  detox.start(done);
});

afterEach((done) => {
  detox.waitForTestResult(done);
});

after((done) => {
  detox.cleanup(done);
});
