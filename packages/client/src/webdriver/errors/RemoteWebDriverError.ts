export class RemoteWebDriverError extends Error {
  readonly error: string;

  constructor({ message, error, stacktrace }) {
    super(message);
    this.name = 'RemoteWebDriverError';
    this.stack = stacktrace;
    this.error = error;
  }
}
