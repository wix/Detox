class FakeWebSocket {
  constructor({ remotePort }) {
    this._remotePort = remotePort;
    this._events = {};

    this.send = jest.fn(this.send.bind(this));
    this.socket = new FakeNetworkSocket(this);
  }

  on(eventType, callback) {
    this._events[eventType] = this._events[eventType] || [];
    this._events[eventType].push(callback);
  }

  send() {}

  mockMessage(obj) {
    const arg = !(obj instanceof Buffer || typeof obj === 'string')
      ? JSON.stringify(obj) : obj;

    this._emit('message', arg);
  }

  mockError(err) {
    this._emit('error', err);
  }

  mockLogin({ role, messageId, sessionId = 'aSession' }) {
    return this.mockMessage({
      type: 'login',
      messageId,
      params: {
        role,
        sessionId,
      },
    });
  }

  mockClose() {
    this._emit('close');
  }

  _emit(eventType, ...args) {
    for (const callback of this._events[eventType]) {
      callback(...args);
    }
  }
}

class FakeNetworkSocket {
  constructor(owner) {
    this._owner = owner;
  }

  get remotePort() {
    return this._owner._remotePort;
  }
}

module.exports = FakeWebSocket;
