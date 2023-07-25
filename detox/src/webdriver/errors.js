/* eslint-disable node/no-unsupported-features/es-syntax */
class HttpError extends Error {
    constructor(message, status) {
        super(message);
        this.message = message;
        this.status = status;
        this.name = 'HttpError';
    }
}

class WebDriverError extends HttpError {
    constructor(message, status, error, data = null) {
        super(message, status);
        this.error = error;
        this.name = 'WebDriverError';
        this.data = data;
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
    static cast(error) {
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
}

WebDriverError.elementClickIntercepted = (message) => new WebDriverError(message, 400, 'element click intercepted');
WebDriverError.elementNotInteractable = (message) => new WebDriverError(message, 400, 'element not interactable');
WebDriverError.insecureCertificate = (message) => new WebDriverError(message, 400, 'insecure certificate');
WebDriverError.invalidArgument = (message) => new WebDriverError(message, 400, 'invalid argument');
WebDriverError.invalidCookieDomain = (message) => new WebDriverError(message, 400, 'invalid cookie domain');
WebDriverError.invalidElementState = (message) => new WebDriverError(message, 400, 'invalid element state');
WebDriverError.invalidSelector = (message) => new WebDriverError(message, 400, 'invalid selector');
WebDriverError.invalidSessionId = (message) => new WebDriverError(message, 404, 'invalid session id');
WebDriverError.javascriptError = (message) => new WebDriverError(message, 500, 'javascript error');
WebDriverError.moveTargetOutOfBounds = (message) => new WebDriverError(message, 500, 'move target out of bounds');
WebDriverError.noSuchAlert = (message) => new WebDriverError(message, 404, 'no such alert');
WebDriverError.noSuchCookie = (message) => new WebDriverError(message, 404, 'no such cookie');
WebDriverError.noSuchElement = (message) => new WebDriverError(message, 404, 'no such element');
WebDriverError.noSuchFrame = (message) => new WebDriverError(message, 404, 'no such frame');
WebDriverError.noSuchWindow = (message) => new WebDriverError(message, 404, 'no such window');
WebDriverError.noSuchShadowRoot = (message) => new WebDriverError(message, 404, 'no such shadow root');
WebDriverError.scriptTimeoutError = (message) => new WebDriverError(message, 500, 'script timeout');
WebDriverError.sessionNotCreated = (message) => new WebDriverError(message, 500, 'session not created');
WebDriverError.staleElementReference = (message) => new WebDriverError(message, 404, 'stale element reference');
WebDriverError.detachedShadowRoot = (message) => new WebDriverError(message, 404, 'detached shadow root');
WebDriverError.timeout = (message) => new WebDriverError(message, 500, 'timeout');
WebDriverError.unableToSetCookie = (message) => new WebDriverError(message, 500, 'unable to set cookie');
WebDriverError.unableToCaptureScreen = (message) => new WebDriverError(message, 500, 'unable to capture screen');
WebDriverError.unexpectedAlertOpen = (message) => new WebDriverError(message, 500, 'unexpected alert open');
WebDriverError.unknownCommand = (message) => new WebDriverError(message, 404, 'unknown command');
WebDriverError.unknownError = (message) => new WebDriverError(message, 500, 'unknown error');
WebDriverError.unknownMethod = (message) => new WebDriverError(message, 405, 'unknown method');
WebDriverError.unsupportedOperation = (message) => new WebDriverError(message, 500, 'unsupported operation');

exports.HttpError = HttpError;
exports.WebDriverError = WebDriverError;
