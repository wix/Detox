const _ = require('lodash');

const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

class AsyncEmitter {
  constructor({ events, onError }) {
    this.emit = this.emit.bind(this);
    this.off = this.off.bind(this);
    this.on = this.on.bind(this);

    this._listeners = {};
    for (const eventName of events) {
      this._listeners[eventName] = [];
    }

    this._onError = onError;
  }

  async emit(eventName, eventObj) {
    const eventListeners = this._listeners[eventName];
    if (_.isEmpty(eventListeners)) {
      return;
    }

    const fire = async (fn) => fn(eventObj);
    const onError = (error) => this._onError({ error, eventName, eventObj });

    await Promise.all(eventListeners.map(fn => fire(fn).catch(onError)));
  }

  off(eventName, callback) {
    if (arguments.length === 0) {
      this._listeners = {};
      return;
    }

    if (this._listeners.hasOwnProperty(eventName)) {
      _.pull(this._listeners[eventName], callback);
    } else {
      throw new DetoxRuntimeError('AsyncEmitter.off() failed to unsubscribe from a non-existent event: ' + eventName);
    }
  }

  on(eventName, callback) {
    if (this._listeners.hasOwnProperty(eventName)) {
      this._listeners[eventName].push(callback);
    } else {
      throw new DetoxRuntimeError('AsyncEmitter.on() failed to subscribe to a non-existent event: ' + eventName);
    }
  }
}

module.exports = AsyncEmitter;
