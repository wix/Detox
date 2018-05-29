const _ = require('lodash');
const fs = require('fs-extra');
const log = require('npmlog');
const { Tail } = require('tail');
const Artifact = require('../../templates/artifact/Artifact');

class SimulatorLogRecording extends Artifact {
  constructor({
    logStderr,
    logStdout,
    readFromBeginning,
    temporaryLogPath,
  }) {
    super();

    this._readFromBeginning = readFromBeginning;
    this._logPath = temporaryLogPath;
    this._stdoutPath = logStdout;
    this._stderrPath = logStderr;

    this._logStream = null;
    this._stdoutTail = null;
    this._stderrTail = null;
  }

  async doStart() {
    log.verbose('SimulatorLogPlugin', 'starting to watch log');
    this._logStream = fs.createWriteStream(this._logPath, { flags: 'w' });
    this._stdoutTail = this._createTail(this._stdoutPath, 'stdout');
    this._stderrTail = this._createTail(this._stderrPath, 'stderr');
  }

  async doStop() {
    log.verbose('SimulatorLogPlugin', 'stopping to watch log');
    this._unwatch();
  }

  async doSave(artifactPath) {
    this._close();
    const tempLogPath = this._logPath;

    if (await fs.exists(tempLogPath)) {
      log.verbose('SimulatorLogRecording', 'moving %s to %s', tempLogPath, artifactPath);
      await fs.move(tempLogPath, artifactPath);
    } else {
      log.error('SimulatorLogRecording', 'did not find temporary log file: %s', tempLogPath, artifactPath);
    }
  }

  async doDiscard() {
    this._close();
    await fs.remove(this._logPath);
  }

  _unwatch() {
    if (this._stdoutTail) {
      this._stdoutTail.unwatch();
    }

    this._stdoutTail = null;

    if (this._stderrTail) {
      this._stderrTail.unwatch();
    }

    this._stderrTail = null;
  }

  _close() {
    if (this._logStream) {
      this._logStream.end();
    }

    this._logStream = null;
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
    if (this._logStream) {
      this._logStream.write(prefix);
      this._logStream.write(': ');
      this._logStream.write(line);
      this._logStream.write('\n');
    } else {
      log.warn('SimulatorLogRecording', 'failed to add line to log: %s', line);
    }
  }
}

module.exports = SimulatorLogRecording;

