class ChromeTracingParser {
  constructor({
    process,
    thread,
    stringifyFn = JSON.stringify
  } = {}) {
    this._process = {
      id: process.id,
      name: process.name,
    };
    this._thread = {
      id: thread.id,
      name: thread.name,
    };
    this._stringifyFn = stringifyFn;
  }

  parse(events, append) {
    const _events = events.flatMap(this._parseEvent.bind(this));
    const json = this._stringifyFn(_events);
    const prefix = (append ? ',' : '[');
    return `${prefix}${json.slice(1, -1)}`;
  }

  _parseEvent(event) {
    const { name, ts, args, type } = event;
    if (type === 'start') {
      return this._event(name, 'B', ts, args);
    }

    if (type === 'end') {
      return this._event(name, 'E', ts, args);
    }

    if (type === 'init') {
      return [
        this._event('process_name', 'M', {name: this._process.name}),
        this._event('thread_name', 'M', {name: this._thread.name}),
      ];
    }

    throw new Error(`Invalid event type '${type}' in event: ${event}`);
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

module.exports = ChromeTracingParser;
