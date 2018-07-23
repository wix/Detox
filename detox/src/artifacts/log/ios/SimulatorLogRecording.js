const _ = require('lodash');
const fs = require('fs-extra');
const log = require('../../../utils/logger').child({ __filename });
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
    this._createWriteableStream();
    this._stdoutTail = this._createTail(this._stdoutPath, 'stdout');
    this._stderrTail = this._createTail(this._stderrPath, 'stderr');
  }

  _createWriteableStream() {
    log.trace({ event: 'CREATE_STREAM '}, `creating append-only stream to: ${this._logPath}`);
    this._logStream = fs.createWriteStream(this._logPath, { flags: 'a' });
  }

  async doStop() {
    this._unwatch();
  }

  async doSave(artifactPath) {
    this._close();
    const tempLogPath = this._logPath;

    if (await fs.exists(tempLogPath)) {
      log.debug({ event: 'MOVE_FILE' }, `moving "${tempLogPath}" to ${artifactPath}`);
      await fs.move(tempLogPath, artifactPath);
    } else {
      log.error({ event: 'MOVE_FILE_ERROR'} , `did not find temporary log file: ${tempLogPath}`);
    }
  }

  async doDiscard() {
    this._close();
    await fs.remove(this._logPath);
  }

  _unwatch() {
    if (this._stdoutTail) {
      log.trace({ event: 'TAIL_UNWATCH' }, `unwatching stdout log`);
      this._stdoutTail.unwatch();
    }

    this._stdoutTail = null;

    if (this._stderrTail) {
      log.trace({ event: 'TAIL_UNWATCH' }, `unwatching stderr log`);
      this._stderrTail.unwatch();
    }

    this._stderrTail = null;
  }

  _close() {
    if (this._logStream) {
      log.trace({ event: 'CLOSING_STREAM '}, `closing stream to: ${this._logPath}`);
      this._logStream.end();
    }

    this._logStream = null;
  }

  _createTail(file, prefix) {
    log.trace({ event: 'TAIL_CREATE' }, `starting to watch ${prefix} log: ${file}`);

    const tail = new Tail(file, {
      fromBeginning: this._readFromBeginning,
      logger: {
        info: _.noop,
        error: (...args) => log.error({ event: 'TAIL_ERROR' }, ...args),
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
      log.warn({ event: 'LOG_WRITE_ERROR' }, 'failed to add line to log:\n' + line);
    }
  }
}

module.exports = SimulatorLogRecording;

