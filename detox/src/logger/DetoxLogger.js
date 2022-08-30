const path = require('path');

const _ = require('lodash');

const temporaryPath = require('../artifacts/utils/temporaryPath');
const { DetoxInternalError } = require('../errors');
const { shortFormat } = require('../utils/dateUtils');
const isPromise = require('../utils/isPromise');

const BunyanLogger = require('./BunyanLogger');
const customConsoleLogger = require('./customConsoleLogger');
const CategoryThreadDispatcher = require('./tracing/CategoryThreadDispatcher');

/**
 * @typedef PrivateLoggerConfig
 * @property {string} [file]
 * @property {CategoryThreadDispatcher} [dispatcher]
 * @property {BunyanLogger} [bunyan]
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
          'logger': [2],
          'ipc': [29],
          'ws-server': [50, 99],
          'ws-client': [100, 149],
          'device': [150, 159],
          'artifacts-manager': [300],
          'artifact-plugin': [310, 349],
          'artifact': [350, 399],
          'child-process': [400, 499],
          'default': [500],
          'user': [10000, 10999]
        },
      });

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
    const merged = mergeContexts(this._context, overrides);
    return new DetoxLogger(this._config, merged);
  }

  /**
   * @param {Detox.DetoxLogLevel} level
   * @returns {Detox._LogMethod}
   * @private
   */
  _setupLogMethod(level) {
    const logMethod = this[level] = this._forward.bind(this, level, null);

    return Object.assign(logMethod, {
      begin: this._forward.bind(this, level, { ph: 'B' }),
      complete: this._complete.bind(this, level),
      end: this._forward.bind(this, level, { ph: 'E' }),
    });
  }

  /**
   * @param {import('bunyan').LogLevel} level
   * @param {any[]} args
   * @private
   */
  _forward(level, boundContext, ...args) {
    const { context, msg } = this._parseArgs(boundContext, args);
    const { ph = 'i', cat, id } = context;

    if (Array.isArray(cat)) {
      context.cat = context.cat.join(',');
    }

    if (id != null) {
      context.tid = this._config.dispatcher.resolve(ph, cat, id);
      delete context.id;
    }

    this._config.bunyan.logger[level](context, ...msg);
  }

  /**
   * @param {import('bunyan').LogLevel} level
   * @private
   */
  _complete(level, arg1, arg2, arg3) {
    const end = (ctx) => this[level].end(ctx, 'end');
    const action = typeof arg1 === 'string' ? arg2 : arg3;
    const args = arg3 === action ? [arg1, arg2] : [arg1];
    const { context, msg } = this._parseArgs(null, args);

    let result;
    this[level].begin(context, msg);
    try {
      result = typeof action === 'function'
        ? action()
        : action;

      if (!isPromise(result)) {
        end(context);
      } else {
        result.then(
          () => end({ ...context, success: true }),
          (err) => end({ ...context, success: false, err }),
        );
      }
    } catch (err) {
      end({ ...context, success: false, err });
      throw err;
    }
  }

  _parseArgs(boundContext, args) {
    const userContext = _.isError(args[0]) ? { err: args[0] } : _.isObject(args[0]) ? args[0] : undefined;
    const msg = userContext !== undefined ? args.slice(1) : args;

    if (userContext) {
      delete userContext.pid;
      delete userContext.tid;
      delete userContext.ts;
      delete userContext.time;
      delete userContext.ph;
    }

    const context = sanitizeBunyanContext({
      ...this._context,
      ...boundContext,
      ...userContext,
    });

    return { context, msg };
  }

  overrideConsole(sandbox) {
    const option = this._config.overrideConsole;
    if (option === 'none') {
      return;
    }

    if ((option === 'sandbox' && sandbox) || option === 'all') {
      customConsoleLogger.overrideConsoleMethods((sandbox || global).console, this);
    }
  }

  /** @type {import('bunyan-debug-stream').BunyanDebugStreamOptions} */
  static defaultOptions = {
    showDate: shortFormat,
    showLoggerName: true,
    showPid: true,
    showMetadata: false,
    basepath: path.join(__dirname, '..'),
    prefixers: {
      '__filename': (filename, { entry }) => {
        if (entry.event === 'USER_LOG') {
          return '';
        }

        if (entry.event === 'ERROR') {
          return `${filename}/${entry.event}`;
        }

        return entry.event ? entry.event : filename;
      },
      'trackingId': id => ` #${id}`,
      'cpid': pid => ` cpid=${pid}`,
    },
  };

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

function mergeContexts(...contexts) {
  // alias err and error
  // TODO: transform errors via Detox.error

  // if (overrides.__filename) {
  //   overrides.__filename = path.basename(overrides.__filename, '.js');
  // }
  // TODO: merge cats
  // if (overrides.cat && !Array.isArray(overrides.cat)) {
  //   overrides.cat = overrides.cat.split(',');
  // }

  return Object.assign({}, ...contexts);
}

module.exports = DetoxLogger;
