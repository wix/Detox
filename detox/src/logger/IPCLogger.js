const _ = require('lodash');

class IPCLogger {
  constructor(config, context) {
    this._config = config;
    this._context = context;
  }

  child(context) {
    return new IPCLogger(this._config, { ...this._context, ...context });
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
    const { client, queue } = this._config;

    if (client) {
      while (queue.length) {
        const { level, meta, args } = queue.shift();
        client.log(level, meta, args);
      }
    }

    this._send(msg);
  }

  _send(msg) {
    const { client, queue } = this._config;

    const { level, args: msgArgs } = msg;
    const msgContext = _.isObject(msgArgs[0]) ? msgArgs[0] : undefined;
    const args = msgContext ? msgArgs.slice(1) : msgArgs;
    const meta = {
      pid: process.pid,
      time: new Date(),

      ...this._context,
      ...msgContext,
    };

    if (!client) {
      queue.push({ level, meta, args });
    } else {
      client.log(level, meta, args);
    }
  }

  get level() {
    return this._config.level;
  }
}

module.exports = IPCLogger;
