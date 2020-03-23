const http = require('http');
const fs = require('fs');
const path = require('path');

const detox = require('detox');
const config = require('../package.json').detox;
const adapter = require('detox/runners/jest/adapter');
const specReporter = require('detox/runners/jest/specReporter');
const assignReporter = require('detox/runners/jest/assignReporter');

jasmine.getEnv().addReporter(adapter);

// This takes care of generating status logs on a per-spec basis. By default, jest only reports at file-level.
// This is strictly optional.
jasmine.getEnv().addReporter(specReporter);

// This will post which device has assigned to run a suite, which can be useful in a multiple-worker tests run.
// This is strictly optional.
jasmine.getEnv().addReporter(assignReporter);

// Set the default timeout
jest.setTimeout(90000);

const server = http.createServer(function (req, res) {
  fs.readFile(path.join(__dirname, 'app.html'), function (err,data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
    res.connection.destroy();
  });
})

beforeAll(async () => {
  await new Promise(resolve => server.listen(9191, resolve));
  await detox.init(config);
}, 300000);

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await new Promise(resolve => server.close(resolve));
  await adapter.afterAll();
  await detox.cleanup();
});
