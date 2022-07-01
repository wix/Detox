const { AbstractEventBuilder } = require('trace-event-lib');

class DetoxTraceEventBuilder extends AbstractEventBuilder {
  constructor(forward) {
    super();

    this._forward = forward;
  }

  send(event) {
    const { name, args = {}, ...trace } = event;
    const { level = 'trace', ...otherArgs } = args;
    this._forward(level, { ...otherArgs, trace }, name);
  }
}

module.exports = DetoxTraceEventBuilder;
