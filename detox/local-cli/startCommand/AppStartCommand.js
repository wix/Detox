const execa = require('execa');

const detox = require('../../internals');
const { DetoxRuntimeError } = require('../../src/errors');
const Deferred = require('../../src/utils/Deferred');
const log = detox.log.child({ cat: ['lifecycle', 'cli'] });

class AppStartCommand {
  constructor({ cmd, passthrough = [], forceSpawn = false }) {
    this._id = Math.random();
    this._cmd = cmd;
    this._passthrough = passthrough;
    this._forceSpawn = forceSpawn;

    this._cpHandle = null;
    this._cpDeferred = new Deferred();
  }

  execute() {
    const cmd = [this._cmd, ...this._passthrough].join(' ');

    log.info.begin({ id: this._id }, cmd);

    const onEnd = (msg, code, signal) => {
      log.trace.end({ id: this._id, code, signal }, msg);
      this._cpDeferred.resolve();
    };

    const onError = (msg, code, signal) => {
      const logLevel = this._forceSpawn ? 'warn' : 'error';
      log[logLevel].end({ id: this._id, code, signal }, msg);
      if (this._forceSpawn) {
        this._cpDeferred.resolve();
      } else {
        this._cpDeferred.reject(new DetoxRuntimeError(msg));
      }
    };

    this._cpHandle = execa.command(cmd, {
      stdio: ['ignore', 'inherit', 'inherit'],
      shell: true
    });
    this._cpHandle.on('error', onError);
    this._cpHandle.on('exit', (code, signal) => {
      const reason = code == null ? `signal ${signal}` : `code ${code}`;
      const msg = `Command exited with ${reason}: ${cmd}`;
      if (signal || code === 0) {
        onEnd(msg, code, signal);
      } else {
        onError(msg, code, signal);
      }

      this._cpHandle = null;
    });

    return this._cpDeferred.promise;
  }

  async stop() {
    if (this._cpHandle) {
      this._cpHandle.kill();
    }

    return this._cpDeferred.promise;
  }
}

module.exports = AppStartCommand;
