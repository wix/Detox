const path = require('path');

const bunyan = require('bunyan');
const bunyanDebugStream = require('bunyan-debug-stream');
const fs = require('fs-extra');
const _ = require('lodash');
const onExit = require('signal-exit');

const temporaryPath = require('../../src/artifacts/utils/temporaryPath');
const { shortFormat: shortDateFormat } = require('../../src/utils/dateUtils');

class BunyanLogger {
  constructor(config, context) {
    this._config = config;
    this._context = context;
  }

  init() {
    this._config.bunyanInstance = this._createBunyanLogger();
  }

  child(overrides) {
    return new BunyanLogger(this._config, {
      ...this._context,
      ...overrides,
    });
  }

  error(...args) {
    return this.send({ level: 'error', args });
  }

  warn(...args) {
    return this.send({ level: 'warn', args });
  }

  info(...args) {
    return this.send({ level: 'info', args });
  }

  debug(...args) {
    return this.send({ level: 'debug', args });
  }

  trace(...args) {
    return this.send({ level: 'trace', args });
  }

  send(msg) {
    const { bunyanInstance, queue } = this._config;

    if (bunyanInstance) {
      while (queue.length) {
        const { level, meta, args } = queue.shift();
        bunyanInstance[level](meta, ...args);
      }
    }

    this._send(msg);
  }

  dispose() {
    const { queue } = this._config;
    while (queue.length) {
      const { level, meta, args } = queue.shift();
      console[level](...args);
    }
  }

  _send(msg) {
    const { level, args: msgArgs } = msg;
    const msgContext = _.isObject(msgArgs[0]) ? msgArgs[0] : undefined;
    const args = msgContext ? msgArgs.slice(1) : msgArgs;
    const meta = {
      pid: process.pid,
      time: new Date(),

      ...this._context,
      ...msgContext,
    };

    const { bunyanInstance, queue } = this._config;
    if (!bunyanInstance) {
      queue.push({ level, meta, args });
    } else {
      bunyanInstance[level](meta, ...args);
    }
  }

  get level() {
    return this._config.level;
  }

  // TODO: do we need it at all???
  getDetoxLevel() {
    return this.level;
  }

  get jsonFileStreamPath() {
    return this._config.jsonFileStreamPath;
  }

  get plainFileStreamPath() {
    return this._config.plainFileStreamPath;
  }

  _createBunyanLogger() {
    const debugStream = this._createPlainBunyanStream({
      level: this.level,
      // @ts-ignore
      showDate: shortDateFormat
    });

    const bunyanStreams = [debugStream];

    const jsonFileStreamPath = temporaryPath.for.log();
    fs.ensureFileSync(jsonFileStreamPath);

    // @ts-ignore
    bunyanStreams.push({
      level: 'trace',
      path: jsonFileStreamPath,
    });

    const plainFileStreamPath = temporaryPath.for.log();
    fs.ensureFileSync(plainFileStreamPath);
    bunyanStreams.push(this._createPlainBunyanStream({
      level: 'trace',
      logPath: plainFileStreamPath,
    }));

    onExit(() => {
      try {
        fs.unlinkSync(jsonFileStreamPath);
      } catch (e) {}

      try {
        fs.unlinkSync(plainFileStreamPath);
      } catch (e) {}
    });

    const logger = bunyan.createLogger({
      name: 'detox',
      streams: bunyanStreams,
    });

    logger.jsonFileStreamPath = jsonFileStreamPath;
    logger.plainFileStreamPath = plainFileStreamPath;
    return logger;
  }

  _createPlainBunyanStream({ logPath, level, showDate = true }) {
    const options = {
      showDate: showDate,
      showLoggerName: true,
      showPid: true,
      showMetadata: false,
      basepath: __dirname,
      out: process.stderr,
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

    if (logPath) {
      options.colors = false;
      options.out = fs.createWriteStream(logPath, {
        flags: 'a',
      });
    }

    // TODO: check if we need it
    // if (argparse.getFlag('--no-color')) {
    //   options.colors = false;
    // }

    return {
      level,
      type: 'raw',
      stream: bunyanDebugStream(options),
      serializers: bunyanDebugStream.serializers,
    };
  }
}

module.exports = BunyanLogger;
