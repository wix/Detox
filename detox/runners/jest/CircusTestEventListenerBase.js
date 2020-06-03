const _ = require('lodash');

class CircusTestEventListenerBase {
  run_describe_start(event, state) {}
  run_describe_finish(event, state) {}
  test_start(event, state) {}
  test_done(event, state) {}
  test_skip(event, state) {}
  error(event, state) {}
}

module.exports = CircusTestEventListenerBase;
module.exports.stubEventsListener = stubEventsListener;
