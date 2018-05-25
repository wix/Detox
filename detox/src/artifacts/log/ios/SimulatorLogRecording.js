const _ = require('lodash');
const fs = require('fs-extra');
const log = require('npmlog');
const { Tail } = require('tail');

class SimulatorLogRecording {
  constructor({
    logStderr,
    logStdout,
    readFromBeginning,
    temporaryLogPath,
  }) {
    this._readFromBeginning = readFromBeginning;
    this._logPath = temporaryLogPath;
    this._stdoutPath = logStdout;
    this._stderrPath = logStderr;

    this._logStream = null;
    this._stdoutTail = null;
    this._stderrTail = null;
  }

  async start() {
    this._logStream = fs.createWriteStream(this._logPath, { flags: 'w' });
    this._stdoutTail = this._createTail(this._stdoutPath, 'stdout');
    this._stderrTail = this._createTail(this._stderrPath, 'stderr');
  }

  async stop() {
    this._close();
  }

  async restart() {
    this._close();
    await this.start();
  }

  async save(artifactPath) {
    const tempLogPath = this._logPath;

    if (await fs.exists(tempLogPath)) {
      log.verbose('SimulatorLogRecording', 'moving %s to %s', tempLogPath, artifactPath);
      await fs.move(tempLogPath, artifactPath);
    } else {
      log.error('SimulatorLogRecording', 'did not find temporary log file: %s', tempLogPath, artifactPath);
    }
  }

  async discard() {
    await fs.remove(this._logPath);
  }

  _close() {
    if (this._stdoutTail) {
      this._stdoutTail.unwatch();
    }

    this._stdoutTail = null;

    if (this._stderrTail) {
      this._stderrTail.unwatch();
    }

    this._stderrTail = null;

    if (this._logStream) {
      this._logStream.end();
    }

    this._logStream = null;
  }

  kill() {
    this._close();
    fs.removeSync(this._logPath);
  }

  _createTail(file, prefix) {
    const tail = new Tail(file, {
      fromBeginning: this._readFromBeginning,
      logger: {
        info: (...args) => log.verbose(`simulator-log-info`, ...args),
        error: (...args) => log.error(`simulator-log-error`, ...args),
      },
    }).on('line', (line) => {
      this._appendLine(prefix, line);
    });

    if (this._readFromBeginning) {
      this._triggerTailReadUsingHack(tail);
    }

    return tail;
  }

  /***
   * @link https://github.com/lucagrulla/node-tail/issues/40
   */
  _triggerTailReadUsingHack(tail) {
    tail.watchEvent.call(tail, "change");
  }

  _appendLine(prefix, line) {
    this._logStream.write(prefix);
    this._logStream.write(': ');
    this._logStream.write(line);
    this._logStream.write('\n');
  }
}

module.exports = SimulatorLogRecording;

