class Trace {
  constructor({
    getTimeStampFn = Date.now,
    stringifyFn = JSON.stringify} = {}
  ) {
    this._getTimeStampFn = getTimeStampFn;
    this._stringifyFn = stringifyFn;
    this._process = {id: undefined, name: undefined};
    this._thread = {id: undefined, name: undefined};
    this._events = [];
  }

  startProcess({id, name}) {
    this._process = {id, name};

    return this;
  }

  startThread({id, name}) {
    this._thread = {id, name};

    this._events.push(
      this._event('process_name', 'M', {name: this._process.name}),
      this._event('thread_name', 'M', {name}),
    );

    return this;
  }

  beginEvent(name, args = {}) {
    this._events.push(this._event(name, 'B', args));

    return this;
  }

  finishEvent(name, args = {}) {
    this._events.push(this._event(name, 'E', args));

    return this;
  }

  json() {
    return this._stringifyFn(this._events);
  }

  traces({prefix = '', suffix = ''} = {prefix: '', suffix: ''}) {
    return `${prefix}${this.json().slice(1, -1)}${suffix}`;
  }

  _event(name, phase, args) {
    return {
      name,
      pid: this._process.id,
      tid: this._thread.id,
      ts: this._getTimeStampFn(),
      ph: phase,
      args: {...args},
    }
  }
}

module.exports = Trace;
