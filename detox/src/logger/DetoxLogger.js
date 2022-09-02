const path = require('path');

const _ = require('lodash');

const temporaryPath = require('../artifacts/utils/temporaryPath');
const { DetoxInternalError, DetoxError } = require('../errors');
const { shortFormat } = require('../utils/dateUtils');
const isPromise = require('../utils/isPromise');

const BunyanLogger = require('./BunyanLogger');
const MessageStack = require('./MessageStack');
const customConsoleLogger = require('./customConsoleLogger');
const CategoryThreadDispatcher = require('./tracing/CategoryThreadDispatcher');

/**
 * @typedef PrivateLoggerConfig
 * @property {string} [file]
 * @property {CategoryThreadDispatcher} [dispatcher]
 * @property {BunyanLogger} [bunyan]
 * @property {MessageStack} [messageStack]
 */

class DetoxLogger {
  /**
   * @param {Partial<Detox.DetoxLoggerConfig & PrivateLoggerConfig>} [config]
   * @param {object} [context]
   */
  constructor(config, context) {
    /**
     * @type {Detox.DetoxLoggerConfig & PrivateLoggerConfig}
     *
     * IMPORTANT: all instances of {@link DetoxLogger} must share the same object instance of this._config.
     */
    this._config = {
      file: temporaryPath.for.jsonl(),
      level: 'info',
      overrideConsole: 'none',
      options: {
        showDate: true,
        showLoggerName: true,
        showPid: true,
        showPrefixes: false,
        showMetadata: false,
      },

      ...config,
    };

    if (!context) {
      // In this branch, `this` refers to the first (root) logger instance.
      this._config.bunyan = new BunyanLogger(this._config);
      this._config.dispatcher = new CategoryThreadDispatcher({
        logger: this,
        categories: {
          'lifecycle': [0],
          'cli': [1],
          'logger': [2],
          'ipc': [29],
          'ws-server': [50, 99],
          'ws-client': [100, 149],
          'device': [150, 159],
          'artifacts-manager': [300],
          'artifacts-plugin': [310, 349],
          'artifact': [350, 399],
          'child-process': [400, 499],
          'default': [999],
          'user': [10000, 10999]
        },
      });
      this._config.messageStack = new MessageStack();

      this.overrideConsole();
    }

    /** @type {object | undefined} */
    this._context = context;

    this.fatal = this._setupLogMethod('fatal');
    this.error = this._setupLogMethod('error');
    this.warn = this._setupLogMethod('warn');
    this.info = this._setupLogMethod('info');
    this.debug = this._setupLogMethod('debug');
    this.trace = this._setupLogMethod('trace');
  }

  /**
   * @internal
   */
  get config() {
    return this._config;
  }

  /** @returns {Detox.DetoxLogLevel} */
  get level() {
    return this._config.level;
  }

  /**
   * @internal
   */
  get file() {
    return this._config.file;
  }

  /**
   * @param config
   */
  async setConfig(config) {
    if (this._context !== undefined) {
      throw new DetoxInternalError('Trying to set a config for a non-root logger');
    }

    if (this.file) {
      throw new DetoxInternalError('Trying to set a config for a fully initialized logger');
    }

    _.merge(this._config, config);
    this._config.file = temporaryPath.for.jsonl();
    this._config.bunyan.installDebugStream(this._config);
    this._config.bunyan.installFileStream(this._config);
    this.overrideConsole();
  }

  /**
   * @param {object} [overrides]
   * @returns {DetoxLogger}
   */
  child(overrides) {
    const merged = this._mergeContexts(this._context, overrides);
    return new DetoxLogger(this._config, merged);
  }

  /**
   * @internal
   */
  overrideConsole(sandbox) {
    const option = this._config.overrideConsole;
    if (option === 'none') {
      return;
    }

    if ((option === 'sandbox' && sandbox) || option === 'all') {
      customConsoleLogger.overrideConsoleMethods((sandbox || global).console, this);
    }
  }

  _mergeContexts(...contexts) {
    const context = Object.assign({}, ...contexts);

    if (context.error || context.err) {
      context.error = DetoxError.format(context.error || context.err);
      delete context.err;
    }

    if (Array.isArray(context.cat)) {
      context.cat = context.cat.join(',');
    }

    if (context.__filename) {
      context.__filename = path.basename(context.__filename);
    }

    context.ph = context.ph || 'i';
    context.cat = context.cat || '';

    context.tid = this._config.dispatcher.resolve(
      context.ph,
      context.cat,
      context.id || 0
    );

    return sanitizeBunyanContext(context);
  }
  /**
   * @param {Detox.DetoxLogLevel} level
   * @returns {Detox._LogMethod}
   * @private
   */
  _setupLogMethod(level) {
    const logMethod = this[level] = this._instant.bind(this, level);

    return Object.assign(logMethod, {
      begin: this._begin.bind(this, level),
      complete: this._complete.bind(this, level),
      end: this._end.bind(this, level),
    });
  }

  _begin(level, ...args) {
    const { context, msg } = this._parseArgs({ ph: 'B' }, args);
    this._config.messageStack.push(context.tid, msg);
    this._config.bunyan.logger[level](context, ...msg);
  }

  _end(level, ...args) {
    let { context, msg } = this._parseArgs({ ph: 'E' }, args);
    if (msg.length === 0) {
      msg = this._config.messageStack.pop(context.tid);
    }

    this._config.bunyan.logger[level](context, ...msg);
  }

  /**
   * @param {import('bunyan').LogLevel} level
   * @param {any[]} args
   * @private
   */
  _instant(level, ...args) {
    const { context, msg } = this._parseArgs(null, args);
    this._config.bunyan.logger[level](context, ...msg);
  }

  /**
   * @param {import('bunyan').LogLevel} level
   * @private
   */
  _complete(level, maybeContext, maybeMessage, maybeAction) {
    const action = typeof maybeContext !== 'string' ? maybeAction : maybeMessage;
    const args = maybeAction === action ? [maybeContext, maybeMessage] : [maybeContext];
    const { context, msg } = this._parseArgs(null, args);
    const end = (ctx) => this[level].end(ctx);

    let result;
    this[level].begin(context, ...msg);
    try {
      result = typeof action === 'function'
        ? action()
        : action;

      if (!isPromise(result)) {
        end(context);
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

  _parseArgs(boundContext, args) {
    const userContext = _.isError(args[0])
      ? { err: args[0] }
      : _.isObject(args[0])
        ? args[0]
        : undefined;
    const msg = userContext !== undefined ? args.slice(1) : args;

    if (userContext) {
      delete userContext.pid;
      delete userContext.tid;
      delete userContext.ts;
      delete userContext.time;
      delete userContext.ph;
    }

    const context = this._mergeContexts(
      this._context,
      boundContext,
      userContext,
    );

    return { context, msg };
  }

  static defaultOptions({ level }) {
    const ph = level === 'trace' || level === 'debug'
      ? value => require('chalk').grey(value) + ' '
      : value => require('chalk').grey(value);

    const id = level === 'trace'
      ? value => require('chalk').yellow(`@${value}`)
      : undefined;

    const cat = level === 'trace' || level === 'debug'
      ? (value) => require('chalk').yellow((value || '').split(',', 1)[0])
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

const RESERVED_PROPERTIES = [
  'hostname',
  'level',
  'msg',
  'name',
  'pid',
  'time',
];

function hasProperty(p) {
  return _.has(this, p);
}

function hasReservedProperties(o) {
  return RESERVED_PROPERTIES.some(hasProperty, o); // eslint-disable-line unicorn/no-array-method-this-argument
}

function escapeCallback(value, key) {
  return RESERVED_PROPERTIES.includes(key) ? `${key}$` : key;
}

function sanitizeBunyanContext(context) {
  return hasReservedProperties(context) ? _.mapKeys(context, escapeCallback) : context;
}


module.exports = DetoxLogger;
