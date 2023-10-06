/* eslint-disable node/no-unsupported-features/es-syntax */

export class BackdoorEmitter {
  constructor(emitter) {
    this._emitter = emitter;
    this._handlers = {};
    this._listeners = {};
    this._subscription = this._emitter.addListener('detoxBackdoor', (event) => {
      const listener = this._handlers[event.action] || this.onUnhandledAction;
      listener(event);
    });
  }

  /**
   * Strict mode prevents interference errors when action handlers are not properly removed
   * or overwritten one by another. It is enabled by default.
   */
  strict = true;

  /**
   * Sets a handler for a backdoor action.
   * Note that there can only be one handler per action to avoid confusion,
   * because in future versions the handlers will be able to return a promise or a value.
   *
   * @param {string} actionName
   * @param {function} handler
   * @throws {Error} if a handler for this action has already been set
   * @throws {Error} if handler is not a function
   * @example
   * detoxBackdoor.setActionHandler('displayText', ({ text }) => {
   *  setText(text);
   * });
   */
  setActionHandler(actionName, handler) {
    if (typeof actionName !== 'string') {
      throw new Error('Detox backdoor action name must be a string');
    }

    if (typeof handler !== 'function') {
      throw new Error(`Detox backdoor handler for action "${actionName}" must be a function`);
    }

    if (this.strict && this._handlers[actionName]) {
      throw new Error(`Detox backdoor handler for action "${actionName}" has already been set`);
    }

    this._handlers[actionName] = handler;
  }

  /**
   * Removes a handler for a backdoor action.
   * By default, unremoved handlers will prevent new handlers from being set.
   */
  removeActionHandler(actionName) {
    delete this._handlers[actionName];
  }

  /**
   * This fallback handler is called when no handler is set for a backdoor action.
   * By default, it throws an error in strict mode and logs a warning otherwise.
   * You can override it to provide a custom behavior.
   * @param {object} event
   * @param {string} event.action
   *
   * @example
   * detoxBackdoor.onUnhandledAction = ({ action, ...args }) => { /* noop *\/ };
   */
  onUnhandledAction = ({ action }) => {
    const message = `Failed to find Detox backdoor handler for action "${action}"`;

    if (this.strict) {
      throw new Error(message);
    } else {
      console.warn(message);
    }
  };
}
