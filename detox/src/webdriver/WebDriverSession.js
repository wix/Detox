const WebDriverSessionContext = require('./WebDriverSessionContext');

class WebDriverSession {
  #config;
  #context;

  constructor(config) {
    this.#config = config;
    this.#context = new WebDriverSessionContext(this.capabilities);
  }

  get sessionId() {
    return this.#config.sessionId;
  }

  get capabilities() {
    return this.#config.capabilities;
  }

  async start() {
    await this.#context.init();
  }

  async stop() {
    await this.#context.cleanup();
  }

  get element() {
    // @ts-ignore
    return this.#context.element;
  }

  get by() {
    // @ts-ignore
    return this.#context.by;
  }

  get expect() {
    // @ts-ignore
    return this.#context.expect;
  }

  get waitFor() {
    // @ts-ignore
    return this.#context.waitFor;
  }

  get client() {
    return this.#context.client;
  }

  get device() {
    return this.#context.device;
  }

  toJSON() {
    return {
      sessionId: this.sessionId,
      capabilities: this.capabilities,
      // TODO: check what this means and how we can implement it
      pageLoadStrategy: 'normal',
      strictFileInteractability: false,
      proxy: {},
      timeouts: {},
    };
  }
}

module.exports = WebDriverSession;
