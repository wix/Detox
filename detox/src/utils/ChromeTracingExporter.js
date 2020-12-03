const _ = require('lodash');

class ChromeTracingExporter {
  constructor({
    process,
    thread,
  }) {
    this._process = {
      id: process.id,
      name: process.name,
    };
    this._thread = {
      id: thread.id,
      name: thread.name,
    };
  }

  export(traceEvents, append) {
    const _events = _.flatMap(traceEvents, this._parseEvent.bind(this));
    const json = JSON.stringify(_events);
    const prefix = (append ? ',' : '[');
    return `${prefix}${json.slice(1, -1)}`;
  }

  _parseEvent(event) {
    const { name, ts, args, type } = event;
    switch (type) {
      case 'start': return this._event(name, 'B', ts, args);
      case 'end': return this._event(name, 'E', ts, args);
      case 'init': return [
          this._event('process_name', 'M', ts, { name: this._process.name }),
          this._event('thread_name', 'M', ts, { name: this._thread.name }),
        ];
      default:
        throw new Error(`Invalid type '${type}' in event: ${event}`);
    }
  }

  _event(name, phase, ts, args) {
    return {
      name,
      pid: this._process.id,
      tid: this._thread.id,
      ts,
      ph: phase,
      args: {...args},
    }
  }
}

module.exports = ChromeTracingExporter;
