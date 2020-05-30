class CircusTestEventListeners {
  constructor() {
    this._listeners = [];
  }

  addListener(listener) {
    this._listeners.push(listener);
  }

  async notifyAll(event, state) {
    for (const listener of this._listeners) {
      await listener.handleTestEvent(event, state);
    }
  }
}

module.exports = CircusTestEventListeners;
