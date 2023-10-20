import debug from 'debug';
import type { Logger } from '../../types';

export type LoggerImplOptions = {
  name: string;
};

export class LoggerImpl implements Logger {
  public readonly log = console.log;
  public readonly debug = console.debug;

  constructor(private readonly options: LoggerImplOptions) {
    this.debug = debug(this.options.name);
  }

  public child(name: string) {
    return new LoggerImpl({ ...this.options, name: `${this.options.name}:${name}` });
  }
}
