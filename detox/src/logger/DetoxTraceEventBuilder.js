const { AbstractEventBuilder } = require('trace-event-lib');

class DetoxTraceEventBuilder extends AbstractEventBuilder {
  constructor(forward) {
    super();

    this._forward = forward;
  }

  send(event) {
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    const { pid, ts, name, args = {}, ...trace } = event;
    if (trace.ph === 'E') {
      this._forward({ ...args, trace }, `end`);
    } else {
      this._forward({ ...args, trace }, name);
    }
  }
}

module.exports = DetoxTraceEventBuilder;
