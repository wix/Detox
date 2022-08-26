const tel = require('trace-event-lib');

class DetoxTraceEventBuilder extends tel.AbstractEventBuilder {
  constructor({ logger, level }) {
    super();

    this._logger = logger;
    this._level = level;
  }

  send(event) {
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    const { pid, ts, name, args = {}, ...trace } = event;

    if (trace.ph === 'E') {
      this._logger[this._level]({ ...args, trace }, `end`);
    } else {
      this._logger[this._level]({ ...args, trace }, name);
    }
  }
}

module.exports = DetoxTraceEventBuilder;
