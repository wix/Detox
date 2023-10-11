const path = require('path');

const _ = require('lodash');

const { DetoxInternalError, DetoxError } = require('../errors');
const { shortFormat } = require('../utils/dateUtils');
const { isPromiseLike } = require('../utils/isPromise');

const BunyanLogger = require('./utils/BunyanLogger');
const CategoryThreadDispatcher = require('./utils/CategoryThreadDispatcher');
const MessageStack = require('./utils/MessageStack');
const customConsoleLogger = require('./utils/customConsoleLogger');
const sanitizeBunyanContext = require('./utils/sanitizeBunyanContext');

/**
 * @typedef SharedLoggerConfig
 * @property {string} file
 * @property {Detox.DetoxLoggerConfig} [userConfig]
 * @property {CategoryThreadDispatcher} [dispatcher]
 * @property {BunyanLogger} [bunyan]
 * @property {MessageStack} [messageStack]
 * @property {boolean} [unsafeMode] Disables sanitization of user input, used for integration tests.
 */

class DetoxLogger {
  /**
   * @param {SharedLoggerConfig} sharedConfig
   * @param {object} [context]
   */
  constructor(sharedConfig, context) {
    /**
     * @type {SharedLoggerConfig}
     * IMPORTANT: all instances of {@link DetoxLogger} must share the same object instance of this._sharedConfig.
     */
    this._sharedConfig = sharedConfig;

    /** @type {object | undefined} */
    this._context = context;

    /** @public */
    this.fatal = this._setupLogMethod('fatal');
    /** @public */
    this.error = this._setupLogMethod('error');
    /** @public */
    this.warn = this._setupLogMethod('warn');
    /** @public */
    this.info = this._setupLogMethod('info');
    /** @public */
    this.debug = this._setupLogMethod('debug');
    /** @public */
    this.trace = this._setupLogMethod('trace');

    if (!context) {
      // In this branch, `this` refers to the first (root) logger instance.

      this._sharedConfig.userConfig = this._sharedConfig.userConfig || {
        level: 'info',
        overrideConsole: false,
        options: {
          showDate: false,
          showLoggerName: false,
          showProcess: false,
          showPid: false,
          showLevel: false,
          showPrefixes: false,
          showMetadata: false,
        },
      };

      this._sharedConfig.bunyan = new BunyanLogger()
        .installFileStream(this.file)
        .installDebugStream(this.config);

      this._sharedConfig.dispatcher = new CategoryThreadDispatcher();
      this._sharedConfig.messageStack = new MessageStack();

      this.overrideConsole();
    }
  }

  /**
   * @public
   * @returns {Detox.DetoxLogLevel}
   */
  get level() {
    return this.config.level;
  }

  /**
   * @public
   * @param {object} [overrides]
   * @returns {DetoxLogger}
   */
  child(overrides) {
    const merged = this._mergeContexts(this._context, this._sanitizeContext(overrides));
    return new DetoxLogger(this._sharedConfig, merged);
  }

  /** @internal */
  get config() {
    return this._sharedConfig.userConfig;
  }

  /** @internal */
  get file() {
    return this._sharedConfig.file;
  }

  /**
   * @internal
   * @param config
   */
  async setConfig(config) {
    if (this._context) {
      throw new DetoxInternalError('Trying to set a config in a non-root logger');
    }

    _.merge(this.config, config);
    this._sharedConfig.bunyan.installDebugStream(this.config);
    this.overrideConsole();
  }

  /**
   * Closes the file descriptors to make sure that the temporary
   * JSONL files are flushed and contain the last error messages.
   * This safety measure is especially important for Windows OS.
   *
   * @async
   * @internal
   */
  async close() {
    if (this._context) {
      throw new DetoxInternalError(
        'Trying to close file streams from a non-root logger.\n' +
        'If you are not fiddling with Detox internals on purpose, yet you see this error, then...'
      );
    }

    await this._sharedConfig.bunyan.closeFileStreams();
  }

  /**
   * @internal
   */
  overrideConsole(sandbox) {
    const enabled = this.config.overrideConsole;
    if (!enabled) {
      return;
    }

    customConsoleLogger.overrideConsoleMethods((sandbox || global).console, this);
  }

  /**
   * @private
   */
  _mergeContexts(...contexts) {
    const context = Object.assign({}, ...contexts);
    const categories = _(contexts).flatMap((c) => {
      if (c && c.cat) {
        return _.isArray(c.cat) ? c.cat : c.cat.split(',');
      }

      return [];
    }).uniq().join(',');

    if (context.error || context.err) {
      context.error = DetoxError.format(context.error || context.err);
      delete context.err;
    }

    if (categories) {
      context.cat = categories;
    } else {
      delete context.cat;
    }

    if (context.__filename) {
      context.__filename = path.basename(context.__filename);
    }

    context.ph = context.ph || 'i';
    context.tid = this._sharedConfig.dispatcher.resolve(
      context.ph,
      context.cat,
      context.id || 0
    );

    return context;
  }

  /**
   * @private
   * @param {Detox.DetoxLogLevel} level
   * @returns {Detox._LogMethod}
   */
  _setupLogMethod(level) {
    const logMethod = this[level] = this._instant.bind(this, level);

    return Object.assign(logMethod, {
      begin: this._begin.bind(this, level),
      complete: this._complete.bind(this, level),
      end: this._end.bind(this, level),
    });
  }

  /** @private */
  _begin(level, ...args) {
    const { context, msg } = this._parseArgs({ ph: 'B' }, args);
    this._beginInternal(level, context, msg);
  }

  /** @private */
  _beginInternal(level, context, msg) {
    this._sharedConfig.messageStack.push(context, msg);
    this._sharedConfig.bunyan.logger[level](context, ...msg);
  }

  /** @private */
  _end(level, ...args) {
    let { context, msg } = this._parseArgs({ ph: 'E' }, args);
    this._endInternal(level, context, msg);
  }

  /** @private */
  _endInternal(level, context, msg) {
    const beginMsg = this._sharedConfig.messageStack.pop(context);
    if (msg.length === 0) {
      msg = beginMsg;
    }

    this._sharedConfig.bunyan.logger[level](context, ...msg);
  }

  /**
   * @private
   * @param {import('bunyan').LogLevel} level
   * @param {any[]} args
   */
  _instant(level, ...args) {
    const { context, msg } = this._parseArgs(null, args);
    this._sharedConfig.bunyan.logger[level](context, ...msg);
  }

  /**
   * @param {import('bunyan').LogLevel} level
   * @private
   */
  _complete(level, maybeContext, maybeMessage, maybeAction) {
    const action = typeof maybeContext !== 'string' ? maybeAction : maybeMessage;
    const args = maybeAction === action ? [maybeContext, maybeMessage] : [maybeContext];
    const { context, msg } = this._parseArgs({ ph: 'B' }, args);
    const end = (ctx) => this[level].end({
      id: context.id,
      cat: context.cat,
      ...ctx,
    });

    let result;
    this._beginInternal(level, context, msg);
    try {
      result = typeof action === 'function'
        ? action()
        : action;

      if (!isPromiseLike(result)) {
        end({ success: true });
      } else {
        result.then(
          () => end({ success: true }),
          (err) => end({ success: false, err }),
        );
      }

      return result;
    } catch (err) {
      end({ success: false, err });
      throw err;
    }
  }

  /** @private */
  _parseArgs(boundContext, args) {
    const userContext = _.isError(args[0])
      ? { err: args[0] }
      : _.isObject(args[0])
        ? args[0]
        : undefined;

    const msg = userContext !== undefined ? args.slice(1) : args;

    const context = this._mergeContexts(
      this._context,
      boundContext,
      this._sanitizeContext(userContext),
    );

    return { context, msg };
  }

  /** @private */
  _sanitizeContext(context) {
    if (this._sharedConfig.unsafeMode) {
      return context;
    }

    return sanitizeBunyanContext(context);
  }

  /** @internal */
  static defaultOptions({ level }) {
    const ph = level === 'trace' || level === 'debug'
      ? value => require('chalk').grey(value) + ' '
      : value => require('chalk').grey(value);

    const id = level === 'trace'
      ? value => require('chalk').yellow(`@${value}`)
      : undefined;

    const cat = level === 'trace' || level === 'debug'
      ? (value) => require('chalk').yellow(`${value}`.split(',', 1)[0])
      : undefined;

    const event = level === 'trace' || level === 'debug'
      ? (value) => require('chalk').grey(`:${value}`)
      : undefined;

    const identity = x => x;

    return ({
      showDate: shortFormat,
      showLoggerName: true,
      showPid: true,
      showLevel: false,
      showMetadata: false,
      showPrefixes: (p) => p.join(''),
      basepath: path.join(__dirname, '..'),
      prefixers: _.omitBy({
        ph,
        cat,
        event,
        id,
      }, _.isUndefined),
      stringifiers: _.omitBy({
        // eslint-disable-next-line unicorn/no-array-method-this-argument
        'args': args => `(${require('lodash').map(args, a => JSON.stringify(a)).join(', ')})`,
        'error': identity,
        'data': json => typeof json === 'string' ? json : JSON.stringify(json, null, 2),
        'stack': level === 'trace' || level === 'debug' ? identity : undefined,
        'origin': level === 'trace' || level === 'debug' ? identity : undefined,
      }, _.isUndefined),
    });
  }

  /**
   * @internal
   * @param {string} level
   * @returns {Detox.DetoxLogLevel}
   */
  static castLevel(level) {
    switch (level) {
      case 'fatal':
      case 'error':
      case 'warn':
      case 'info':
      case 'debug':
      case 'trace':
        return level;
      case 'verbose':
        return 'debug';
      default:
        return 'info';
    }
  }
}

module.exports = DetoxLogger;
