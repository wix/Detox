const path = require('path');

const bunyan = require('bunyan');
const bunyanDebugStream = require('bunyan-debug-stream');
const _ = require('lodash');

const { shortFormat } = require('./dateUtils');

/**
 * @typedef PrivateLoggerConfig
 * @property {string} [file]
 */

class DetoxLogger {
  /**
   * @param {Detox.DetoxLoggerConfig | PrivateLoggerConfig} [config]
   * @param {object} [context]
   * @param {bunyan} [bunyanLogger]
   */
  constructor(config, context, bunyanLogger) {
    /** @type {Detox.DetoxLoggerConfig & PrivateLoggerConfig} */
    this._config = {
      level: 'info',
      overrideConsole: false,
      options: {
        ...DetoxLogger.defaultOptions,
      },

      ...config,
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
  }

  /** @returns {Detox.DetoxLogLevel} */
  get level() {
    return this._config.level;
  }

  /**
   * @param config
   */
  async setConfig(config) {
    Object.assign(this._config, config);

    // @ts-ignore
    const [oldStream] = this._bunyan.streams.splice(1, 1);
    oldStream.stream.end();
    this._bunyan.addStream(this._createDebugStream());

    if (this._config.overrideConsole) {
      // TODO: restore the console override
    }
  }

  /**
   * @param {object} [overrides]
   * @returns {DetoxLogger}
   */
  child(overrides) {
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
    const mergedContext = {
      ...this._context,
      ...msgContext,
    };

    this._bunyan[level](mergedContext, ...msgArgs);
  }

  _initBunyanLogger() {
    /** @type {bunyan.Stream[]} */
    const streams = [this._createDebugStream({
      out: process.stdout,
    })];

    if (this._config.file) {
      streams.unshift({
        level: 'trace',
        path: this._config.file,
      });
    }

    return bunyan.createLogger({ name: 'detox', streams });
  }

  _createDebugStream(overrides) {
    return {
      type: 'raw',
      level: this._config.level,
      stream: bunyanDebugStream.default({
        ...this._config.options,
        ...overrides,
      }),
    };
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
          return `${path.basename(filename)}/${entry.event}`;
        }

        return entry.event ? entry.event : path.basename(filename);
      },
      'trackingId': id => ` #${id}`,
      'cpid': pid => ` cpid=${pid}`,
    },
  };
}

module.exports = DetoxLogger;
