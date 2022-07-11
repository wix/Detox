const path = require('path');
const { PassThrough } = require('stream');

const bunyan = require('bunyan');
const bunyanDebugStream = require('bunyan-debug-stream');
const _ = require('lodash');

const temporaryPath = require('../artifacts/utils/temporaryPath');
const { shortFormat } = require('../utils/dateUtils');

const customConsoleLogger = require('./customConsoleLogger');

/**
 * @typedef PrivateLoggerConfig
 * @property {string} [file]
 */

class DetoxLogger {
  /**
   * @param {Detox.DetoxLoggerConfig & PrivateLoggerConfig} [config]
   * @param {object} [context]
   * @param {bunyan} [bunyanLogger]
   */
  constructor(config, context, bunyanLogger) {
    // IMPORTANT: all the loggers should share the same object instance of this._config
    this._config = config || {
      file: undefined,
      level: 'info',
      overrideConsole: 'none',
      options: {
        showDate: true,
        showLoggerName: true,
        showPid: true,
        showMetadata: false,
      },
    };

    /** @type {object | undefined} */
    this._context = context;
    /** @type {bunyan} */
    this._bunyan = bunyanLogger || this._initBunyanLogger();

    this.fatal = this._forward.bind(this, 'fatal');
    this.error = this._forward.bind(this, 'error');
    this.warn = this._forward.bind(this, 'warn');
    this.info = this._forward.bind(this, 'info');
    this.debug = this._forward.bind(this, 'debug');
    this.trace = this._forward.bind(this, 'trace');

    this.overrideConsole();
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
    _.merge(this._config, config);

    // @ts-ignore
    const [oldStream] = this._bunyan.streams.splice(0, 1);
    oldStream.stream.end();
    this._bunyan.addStream(this._createDebugStream());

    if (!this._config.file) {
      this._config.file = temporaryPath.for.jsonl();
      this._bunyan.addStream({
        level: 'trace',
        path: this._config.file,
      });
    }

    this.overrideConsole();
  }

  /**
   * @param {object} [overrides]
   * @returns {DetoxLogger}
   */
  child(overrides) {
    if (overrides && overrides.__filename) {
      overrides.__filename = path.basename(overrides.__filename, '.js');
    }

    return new DetoxLogger(this._config, {
      ...this._context,
      ...overrides,
    }, this._bunyan);
  }

  /**
   * @param {bunyan.LogLevel} level
   * @param {any[]} args
   * @private
   */
  _forward(level, ...args) {
    const msgContext = _.isError(args[0]) ? { err: args[0] } : _.isObject(args[0]) ? args[0] : undefined;
    const msgArgs = msgContext !== undefined ? args.slice(1) : args;
    const mergedContext = sanitizeBunyanContext({
      ...this._context,
      ...msgContext,
    });

    this._bunyan[level](mergedContext, ...msgArgs);
  }

  _initBunyanLogger() {
    /** @type {bunyan.Stream[]} */
    const streams = [this._createDebugStream()];

    if (this._config.file) {
      streams.push({
        level: 'trace',
        path: this._config.file,
      });
    }

    return bunyan.createLogger({ name: 'detox', streams });
  }

  _createDebugStream() {
    const { out = process.stderr, ...streamOptions } = this._config.options;
    const passthrough = new PassThrough().pipe(out);

    return {
      type: 'raw',
      level: this._config.level,
      stream: bunyanDebugStream.default({
        ...streamOptions,
        out: passthrough,
      }),
    };
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

  /** @type {bunyanDebugStream.BunyanDebugStreamOptions} */
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

module.exports = DetoxLogger;
