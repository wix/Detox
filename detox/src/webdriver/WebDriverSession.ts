import { randomUUID } from 'crypto';
import WebDriverSessionContext from './WebDriverSessionContext';

export type WebDriverSessionConfig = {
  sessionId: string;
  capabilities: {
    'detox:apps': Record<any, any>;
    'detox:behavior': Record<any, any>;
    'detox:device': Record<any, any>;
    'detox:session': Record<any, any>;
    'webSocketUrl'?: string;
  };
};

export class WebDriverSession {
  readonly #config: WebDriverSessionConfig;
  readonly #context: WebDriverSessionContext;

  constructor(config?: WebDriverSessionConfig) {
    const sessionId = randomUUID();
    this.#config = {
      ...config,
      sessionId,
    };

    this.#context = new WebDriverSessionContext(this.capabilities);
    this.capabilities.webSocketUrl = `ws://localhost:4723/session/${sessionId}/ws`;
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
