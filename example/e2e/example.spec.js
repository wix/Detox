var detox = require('detox');
var element = detox.ios.expect.element;
var expect = detox.ios.expect.expect;
var by = detox.ios.expect.by;

detox.config({
  server: 'ws://localhost:8099',
  sessionId: 'example'
});

detox.connect(function () {

  element(by.label('Click Me')).tap();

  expect(element(by.label('Yay'))).toBeVisible();

  expect(element(by.label('Mitzi'))).toBeVisible(); // change Mitzi to Yay to make the test pass

  detox.done();

});
