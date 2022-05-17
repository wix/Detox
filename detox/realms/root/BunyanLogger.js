const path = require('path');

const bunyan = require('bunyan');
const bunyanDebugStream = require('bunyan-debug-stream');
const fs = require('fs-extra');
const onExit = require('signal-exit');

const temporaryPath = require('../../src/artifacts/utils/temporaryPath');
const { shortFormat: shortDateFormat } = require('../../src/utils/dateUtils');

class BunyanLogger {
  constructor(config, meta, bunyan) {
    this._config = { ...config };
    this._meta = { ...meta };
    this._bunyan = bunyan || this._createBunyanLogger();
  }

  child(overrides) {
    const childMeta = { ...this._meta, ...overrides };
    if (overrides.__filename) {
      childMeta.__filename = path.basename(overrides.__filename);
    }

    return new BunyanLogger(
      this._config,
      childMeta,
      this._bunyan,
    );
  }

  error() {
    this._bunyan.error(...arguments);
  }

  warn() {
    this._bunyan.warn(...arguments);
  }

  info() {
    this._bunyan.info(...arguments);
  }

  debug() {
    this._bunyan.debug(...arguments);
  }

  trace() {
    this._bunyan.trace(...arguments);
  }

  get level() {
    return this._config.loglevel;
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
    let jsonFileStreamPath, plainFileStreamPath;
    // @ts-ignore
    if (!global.DETOX_CLI && !global.IS_RUNNING_DETOX_UNIT_TESTS) {
      {
        jsonFileStreamPath = temporaryPath.for.log();
        fs.ensureFileSync(jsonFileStreamPath);

        // @ts-ignore
        bunyanStreams.push({
          level: 'trace',
          path: jsonFileStreamPath,
        });
      }

      {
        plainFileStreamPath = temporaryPath.for.log();
        fs.ensureFileSync(plainFileStreamPath);
        bunyanStreams.push(this._createPlainBunyanStream({
          level: 'trace',
          logPath: plainFileStreamPath,
        }));
      }

      onExit(() => {
        try { fs.unlinkSync(jsonFileStreamPath); } catch (e) {}
        try { fs.unlinkSync(plainFileStreamPath); } catch (e) {}
      });
    }

    const logger = bunyan.createLogger({
      name: 'detox',
      streams: bunyanStreams,
    });

    if (jsonFileStreamPath) {
      logger.jsonFileStreamPath = jsonFileStreamPath;
    }

    if (plainFileStreamPath) {
      logger.plainFileStreamPath = plainFileStreamPath;
    }

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
            return `${filename}/${entry.event}`;
          }

          return entry.event ? entry.event : filename;
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
