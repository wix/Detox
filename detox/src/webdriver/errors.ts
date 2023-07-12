/* eslint-disable node/no-unsupported-features/es-syntax */

export class HttpError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class WebDriverError extends HttpError {
  public data?: unknown;

  constructor(
    message: string,
    status: number,
    public readonly error: string,
  ) {
    super(message, status);
    this.name = 'WebDriverError';
  }

  toJSON() {
    const value = {
      error: this.error,
      message: this.message,
      stacktrace: this.stack,
    };

    if (this.data != null) {
      value['data'] = this.data;
    }

    return value;
  }

  static cast(error: unknown) {
    if (!(error instanceof Error)) {
      return WebDriverError.unknownError(String(error));
    }

    if (error instanceof WebDriverError) {
      return error;
    }

    const wrapped = WebDriverError.unknownError(error.message);
    wrapped.stack = error.stack;
    return wrapped;
  }

  static elementClickIntercepted = (message: string) => new WebDriverError(message, 400, 'element click intercepted');

  static elementNotInteractable = (message: string) => new WebDriverError(message, 400, 'element not interactable');

  static insecureCertificate = (message: string) => new WebDriverError(message, 400, 'insecure certificate');

  static invalidArgument = (message: string) => new WebDriverError(message, 400, 'invalid argument');

  static invalidCookieDomain = (message: string) => new WebDriverError(message, 400, 'invalid cookie domain');

  static invalidElementState = (message: string) => new WebDriverError(message, 400, 'invalid element state');

  static invalidSelector = (message: string) => new WebDriverError(message, 400, 'invalid selector');

  static invalidSessionId = (message: string) => new WebDriverError(message, 404, 'invalid session id');

  static javascriptError = (message: string) => new WebDriverError(message, 500, 'javascript error');

  static moveTargetOutOfBounds = (message: string) => new WebDriverError(message, 500, 'move target out of bounds');

  static noSuchAlert = (message: string) => new WebDriverError(message, 404, 'no such alert');

  static noSuchCookie = (message: string) => new WebDriverError(message, 404, 'no such cookie');

  static noSuchElement = (message: string) => new WebDriverError(message, 404, 'no such element');

  static noSuchFrame = (message: string) => new WebDriverError(message, 404, 'no such frame');

  static noSuchWindow = (message: string) => new WebDriverError(message, 404, 'no such window');

  static noSuchShadowRoot = (message: string) => new WebDriverError(message, 404, 'no such shadow root');

  static scriptTimeoutError = (message: string) => new WebDriverError(message, 500, 'script timeout');

  static sessionNotCreated = (message: string) => new WebDriverError(message, 500, 'session not created');

  static staleElementReference = (message: string) => new WebDriverError(message, 404, 'stale element reference');

  static detachedShadowRoot = (message: string) => new WebDriverError(message, 404, 'detached shadow root');

  static timeout = (message: string) => new WebDriverError(message, 500, 'timeout');

  static unableToSetCookie = (message: string) => new WebDriverError(message, 500, 'unable to set cookie');

  static unableToCaptureScreen = (message: string) => new WebDriverError(message, 500, 'unable to capture screen');

  static unexpectedAlertOpen = (message: string) => new WebDriverError(message, 500, 'unexpected alert open');

  static unknownCommand = (message: string) => new WebDriverError(message, 404, 'unknown command');

  static unknownError = (message: string) => new WebDriverError(message, 500, 'unknown error');

  static unknownMethod = (message: string) => new WebDriverError(message, 405, 'unknown method');

  static unsupportedOperation = (message: string) => new WebDriverError(message, 500, 'unsupported operation');
}

