const _ = require('lodash');

const ipcClient = require('../ipc/client');

class IPCLogger {
  constructor(config) {
    this._config = config;
    this._config.level = 'info';
    ipcClient.getDetoxConfig().then(config => {
      if (config.cliConfig.loglevel) {
        this._config.level = config.cliConfig.loglevel;
      }
    });

  }

  child(context) {
    return new IPCLogger(_.merge({}, this._config, { context }));
  }

  error() {
    return this._send('error', [...arguments]);
  }

  warn() {
    return this._send('warn', [...arguments]);
  }

  info() {
    return this._send('info', [...arguments]);
  }

  debug() {
    return this._send('debug', [...arguments]);
  }

  trace() {
    return this._send('trace', [...arguments]);
  }

  _send(level, args) {
    const hasContext = _.isObject(arguments[0]);
    const meta = _.defaults({}, this._config.context, hasContext ? arguments[0] : undefined);
    ipcClient.log(level, meta, hasContext ? args.slice(1) : args);
  }

  get level() {
    return this._config.level; // ?
  }
}

module.exports = IPCLogger;
